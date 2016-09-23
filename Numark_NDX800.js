NDX800 = new Controller();
NDX800.init = function() {
  // some functions need to know which group this unit operates on
  this.deckGroup = "[Channel1]";
  this.searchModeFactor = 16; // search mode sensitivity factor

  // scratch parameters, tune to your favor
  this.scratchintervalsPerRev = 512;
  this.scratchAlpha = 1.0/8;
  this.scratchBeta = this.scratchAlpha/32;
  this.rampedScratch = false;

  // internal variables for misc functionality
  this.pitchButtonTimer = 0;
  this.pitchButtonTimerElapsed = false;
  this.pitchAdjustEnabled = false;
  this.shift = false;
  this.hotcueBank = 0;
  this.hotcueBase = 0x33;
  this.trackDuration = 0; // seconds
  this.displayRemaining = false; // false = elapsed, true = remaining
  this.scratchEnabled = false; // enable scratch touch using the scratch button
  this.searchModeEnabled = false; // search mode -> increase jog sensitivity
  this.beatloopSize = 1;

  // cached values to reduce midi traffic
  this.lastMinutes = NaN;
  this.lastSeconds = NaN;
  this.lastProgressMeter = NaN;

  engine.softTakeover(this.deckGroup, "rate", true);
  engine.softTakeover(this.deckGroup, "pitch_adjust", true);

  // connect mixxx controls
  this.connectControls();

  // update controller leds to match mixxx state
  this.setHotcueBankLed();
  this.setElapsedLed();
  this.setBeatloopLed();
  this.setPitchAdjustLed();
  this.setScratchLed();
  this.setSearchLed();
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_time_colon"], 3); // enable time colons and m/s/f letters
  midi.sendShortMsg(0x90, this.leds_note["dsp_bpm"], 1); // enable the key word
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_bpm_dot"], 1); // enable bpm dot
  midi.sendShortMsg(0x90, this.leds_note["dsp_pitch"], 1); // enable the key word
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_pitch_dot"], 1); // enable pitch dot
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_pitch_plus_enable"], 1); // enable the plus symbol on positive pitch values (minus is always shown)
  midi.sendShortMsg(0x90, this.leds_note["dsp_key"], 1); // enable the key word
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_track_msb"], 0); // display deck group index in track field
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_track_lsb"], parseInt(this.deckGroup.substr(8,1))); // display deck group index in track field

  //engine.beginTimer(250, "NDX800.test", false);
  print("NDX800 ready");
}

NDX800.shutdown = function() {
  for (var i=30; i<83; i++) {
    midi.sendShortMsg(0xB0, i, 0);
    midi.sendShortMsg(0xB0, i, 0);
  }
}

NDX800.connectControls = function() {
  for (var i in this.connectedControls) {
    var connection = this.connectedControls[i];
    engine.connectControl(this.deckGroup, connection["control"], connection["callback"]);
    engine.trigger(this.deckGroup, connection["control"]);
  }
}

NDX800.shiftButton = function(channel, control, value, command, group) {
  this.shift = value ? true : false;
}

NDX800.hotcue = function(channel, control, value, command, group) {
  ctrl = "hotcue_"
    +(control-this.hotcueBase+this.hotcueBank*3+1)
    +(this.shift?"_clear":"_activate");
  engine.setValue(group, ctrl, value);
}

NDX800.hotcueBankButton = function(channel, control, value, command, group) {
  this.hotcueBank = this.hotcueBank ? 0 : 1;
  this.setHotcueBankLed();
  this.triggerHotcueLeds();
}

NDX800.hotcueLed = function(value, group, control) {
  var hotcue = parseInt(control.substr(7,1));
  if (Math.floor(hotcue/4) == this.hotcueBank) {
    midi.sendShortMsg(0x90, this.leds_note["hotcue_"+((hotcue-1)%3+1)], value);
  }
}

// trigger update of all hotcue leds
NDX800.triggerHotcueLeds = function() {
  for (var i=1; i<7; i++)
    engine.trigger(this.deckGroup, "hotcue_"+i+"_enabled");
}

NDX800.setHotcueBankLed = function() {
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_hotcue_1"], this.hotcueBank == 0);
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_hotcue_2"], this.hotcueBank == 1);
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_hotcue_wheel_1"], this.hotcueBank == 0);
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_hotcue_wheel_2"], this.hotcueBank == 1);
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_loop_1"], (this.hotcueBank == 0)*5);
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_loop_2"], (this.hotcueBank == 1)*5);
}

NDX800.scratch = function(channel, control, value, command, group) {
  if (value < 0x40) {
    var delta = value;
  } else {
    var delta = value - 0x80;
  }
  var deck = group.substr(8,1);
  if (engine.isScratching(deck))
    engine.scratchTick(deck, delta);
  else {
    var play = engine.getValue(group, "play") ? 1 : 0;
    var scratch2 = engine.getValue(group, "scratch2");
    if (play && Math.abs(scratch2)-1 < 0.01) { // reset scratch value close to 0 after scratching
      engine.setValue(group, "scratch2", 0.001);
      scratch2 = 0.001;
    }
    if (Math.abs(scratch2)-play > 0.01) { // still rotating after scratching
      engine.scratchTick(deck, delta);
    } else {
      if (this.searchModeEnabled) {
        delta *= this.searchModeFactor;
      }
      engine.setValue(group, "jog", delta/4);
    }
  }
}

NDX800.scratchTouch = function(channel, control, value, command, group) {
  var deck = group.substr(8,1);
  if (value && this.scratchEnabled) {
    engine.scratchEnable(deck,
      this.scratchintervalsPerRev, 33+1/3,
      this.scratchAlpha, this.scratchBeta, this.rampedScratch);
  } else {
    engine.scratchDisable(deck);
  }
  var scratch2 = engine.getValue(group, "scratch2");
  print("scratch2 touch "+scratch2);
}

NDX800.scratchEnable = function(channel, control, value, command, group) {
  if (value) {
    this.scratchEnabled = !this.scratchEnabled;
    this.setScratchLed();
  }
}

NDX800.setScratchLed = function() {
  midi.sendShortMsg(0x90, this.leds_note["scratch"], this.scratchEnabled);
}

NDX800.rate = function(channel, control, value, status, group) {
  var rateDir = engine.getValue(group, "rate_dir");
  var rate = rateDir*script.midiPitch(control, value, status);
  print("rate "+rate);
  engine.setValue(group, "rate", rate);
}

NDX800.setPitchDisplay = function(value, group, control) {
  print("ratedisplay "+value);
  var rateRange = engine.getValue(group, "rateRange")*100;
  var rateDir = engine.getValue(group, "rate_dir");
  var out = Math.round(rateDir*rateRange*value*10);
  if (out < 0) {
    out = ~(-1*out)+1;
  }
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_pitch_msb"], (out >>> 7) & 0x7F);
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_pitch_lsb"], out & 0x7F);
}

NDX800.playPosition = function(value, group, control) {
  //print("playPosition "+value);
  var newProgressMeter = 60*value+1;
  if (newProgressMeter !== this.lastProgressMeter) {
    midi.sendShortMsg(0xB0, this.leds_cc["dsp_progress"], newProgressMeter);
    this.lastProgressMeter = newProgressMeter;
  }
  this.setTimeDisplay(value);
}

// set current time in display. value = [0..1]
NDX800.setTimeDisplay = function(value) {
  if (this.displayRemaining)
    value = 1-value;

  if (this.trackDuration == NaN)
    var currentDuration = 0;
  else
    var currentDuration = Math.abs(this.trackDuration*value);

  var minutes = Math.floor(currentDuration/60);
  currentDuration -= minutes*60;
  if (minutes != this.lastMinutes) {
    midi.sendShortMsg(0xB0, this.leds_cc["dsp_time_minutes"], minutes);
    this.lastMinutes = minutes;
  }

  var seconds = Math.floor(currentDuration);
  currentDuration -= seconds;
  if (seconds != this.lastSeconds) {
    midi.sendShortMsg(0xB0, this.leds_cc["dsp_time_seconds"], seconds);
    this.lastSeconds = seconds;
  }

  var microseconds = Math.floor(100*currentDuration);
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_time_microseconds"], microseconds);
}

NDX800.updateTrackDuration = function(value, group) {
  var samples = engine.getValue(group, "track_samples");
  var sampleRate = engine.getValue(group, "track_samplerate");
  this.trackDuration = samples/sampleRate/2;
}

NDX800.timeButton = function(channel, control, value, status, group) {
  this.displayRemaining = !this.displayRemaining;
  this.setElapsedLed();
  this.setTimeDisplay(engine.getValue(group, control));
}

NDX800.setElapsedLed = function() {
  midi.sendShortMsg(0x90, this.leds_note["dsp_elapsed"], this.displayRemaining == false);
  midi.sendShortMsg(0x90, this.leds_note["dsp_remain"], this.displayRemaining == true);
}

NDX800.setBpmDisplay = function(value) {
  var value = Math.round(value*10);
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_bpm_msb"], value >>> 7);
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_bpm_lsb"], value & 0x7F);
}

NDX800.test = function() {
  if (this.testValue == undefined)
    this.testValue = 0;
  else if (this.testValue == 127)
    this.testValue = 0;
  else if (this.testValue == 1)
    this.testValue = 2;
  else {
    this.testValue = this.testValue+1;
  }
  print("testing "+this.testValue);
  for (var i=0;i<30;i++)
    midi.sendShortMsg(0xB0, i, this.testValue);
}

NDX800.setKeyDisplay = function(value, group, control) {
  if (value < 0)
    value = ~Math.abs(value)+1; // twos complement
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_key"], value & 0x7F);
}

// WTF alert! pitch button and keylock handling:
// Pressing the pitch button for less than one second toggles pitch adjust.
// When pitch adjust is disabled, the "start time" knob does nothing (to prevent
// you from accidentally changing the pitch).
// When pressing the pitch button for more than one second, keylock is toggled.
// Shift+pitch button resets the pitch_adjust control to absolute 0.
NDX800.pitchButton = function(channel, control, value, status, group) {
  if (this.shift) {
    if (value) {
      engine.setValue(group, "pitch_adjust", 0);
    }
    return;
  }
  if (value) {
    this.pitchButtonTimerElapsed = false;
    this.pitchButtonTimer = engine.beginTimer(1000, "NDX800.pitchButtonTimerHandler(\""+group+"\")", true);
  } else {
    // if the timer handler was not executed, so stop the timer to prevent
    // that happening later and toggle keylock
    if (!this.pitchButtonTimerElapsed) {
      this.togglePitchAdjust();
      engine.stopTimer(this.pitchButtonTimer);
    }
    this.pitchButtonTimerElapsed = false;
  }
}

// called after a timeout of the pitch button timer
// that means that pitch was hold longer than 1 sec -> toggle keylock
NDX800.pitchButtonTimerHandler = function(group) {
  this.pitchButtonTimerElapsed = true;
  this.toggleKeylock(group);
}

NDX800.togglePitchAdjust = function() {
  this.pitchAdjustEnabled = !this.pitchAdjustEnabled;
  this.setPitchAdjustLed();
}

NDX800.setPitchAdjustLed = function() {
  midi.sendShortMsg(0x90, this.leds_note["dsp_key_frame"], this.pitchAdjustEnabled);
  midi.sendShortMsg(0x90, this.leds_note["pitch"], this.pitchAdjustEnabled);
}

NDX800.toggleKeylock = function(group) {
  var enabled = !engine.getValue(group, "keylock");
  engine.setValue(group, "keylock", enabled);
}

NDX800.pitchAdjust = function(channel, control, value, status, group) {
  if (this.pitchAdjustEnabled) {
    engine.setValue(group, "pitch_adjust", script.absoluteLin(value, -3, 3));
  }
}

NDX800.reloop = function(channel, control, value, status, group) {
  if (!value) {
    return;
  }
  if (this.shift) {
    engine.setValue(group, "beatloop", Math.pow(2, this.beatloopSize-1));
  } else {
    engine.setValue(group, "reloop_exit", 1);
  }
}

NDX800.setBeatloopLed = function() {
  midi.sendShortMsg(0xB0, this.leds_cc["shift_leds"], this.beatloopSize);
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_total_lsb"], Math.pow(2, this.beatloopSize-1));
  midi.sendShortMsg(0xB0, this.leds_cc["dsp_total_msb"], 0);
}

NDX800.beatloopSizeAdjust = function(channel, control, value, status, group) {
  if (!value) {
    return;
  }
  if (engine.getValue(group, "loop_enabled")) {
    if (control === 0x3F) {
      engine.setValue(group, "loop_double", 1);
    } else {
      engine.setValue(group, "loop_halve", 1);
    }
  }
  if (this.beatloopSize > 1 && control === 0x3E) {
    this.beatloopSize -= 1;
  } else if (this.beatloopSize < 5 && control == 0x3F) {
    this.beatloopSize += 1;
  }
  this.setBeatloopLed();
}

NDX800.fxButton = function(channel, control, value, status, group) {
  if (!value) {
    return;
  }
  if (this.shift) {
    script.toggleControl("[QuickEffectRack1_"+this.deckGroup+"_Effect1]", "enabled");
  } else {
    script.toggleControl(group, "enabled");
  }
}

NDX800.searchMode = function(channel, control, value, status, group) {
  if (!value) {
    return;
  }
  this.searchModeEnabled = !this.searchModeEnabled;
  this.setSearchLed();
}

NDX800.setSearchLed = function() {
  midi.sendShortMsg(0x90, this.leds_note["search"], this.searchModeEnabled);
}

NDX800.connectedControls = [
  { control: "hotcue_1_enabled", callback: "NDX800.hotcueLed" },
  { control: "hotcue_2_enabled", callback: "NDX800.hotcueLed" },
  { control: "hotcue_3_enabled", callback: "NDX800.hotcueLed" },
  { control: "hotcue_4_enabled", callback: "NDX800.hotcueLed" },
  { control: "hotcue_5_enabled", callback: "NDX800.hotcueLed" },
  { control: "hotcue_6_enabled", callback: "NDX800.hotcueLed" },
  { control: "playposition", callback: "NDX800.playPosition" },
  { control: "track_samples", callback: "NDX800.updateTrackDuration" },
  { control: "bpm", callback: "NDX800.setBpmDisplay" },
  { control: "rate", callback: "NDX800.setPitchDisplay" },
  { control: "pitch_adjust", callback: "NDX800.setKeyDisplay" }
]

NDX800.leds_note = {
  "cue": 49,
  "pause": 50,
  "play": 51,
  "loop_in": 52,
  "loop_out": 53,
  "reloop": 54,
  "hotcue_1": 55,
  "hotcue_2": 56,
  "hotcue_3": 57,
  "rec": 58,
  "keylock": 59,
  "pitch_center": 60,
  "pitch": 61,
  "fx": 62,
  "search": 63,
  "scratch": 64,
  "dsp_single": 65,
  "dsp_track": 66,
  "dsp_card": 67,
  "dsp_cd": 68,
  "dsp_hd": 69,
  "dsp_total": 70,
  "dsp_elapsed": 71,
  "dsp_mp3": 72,
  "dsp_total": 73,
  "dsp_remain": 74,
  "dsp_cue": 75,
  "dsp_pause": 76,
  "dsp_play": 77,
  "dsp_key": 78,
  "dsp_key_lock": 79,
  "dsp_key_frame": 80,
  "dsp_bpm": 81,
  "dsp_pitch": 82
};

NDX800.leds_cc = {
  "dsp_hotcue_1": 28,
  "dsp_hotcue_2": 29,
  "dsp_hotcue_wheel_1": 30,
  "dsp_hotcue_wheel_2": 31,
  "shift_leds": 32,
  "pitch_leds": 33,
  "dsp_loop_1": 34,
  "dsp_loop_2": 35,
  "dsp_time_colon": 36,
  "dsp_progress": 37,
  "dsp_progress_reverse": 38,
  "dsp_track_msb": 39, // upper 3 bits (max 999)
  "dsp_total_msb": 40, // upper 3 bits (max 999)
  "dsp_time_minutes": 41,
  "dsp_time_seconds": 42,
  "dsp_time_microseconds": 43,
  "dsp_bpm_msb": 44, //upper 4 bits of bpm/10, raw: 0..15
  "dsp_pitch_msb": 45, //upper 3 bits of pitch/10, raw: 0..7
  "dsp_key": 46, // -19..19 7bit twos complement
  "dsp_track_off": 47,
  "dsp_total_off": 48,
  "dsp_time_off": 49,
  "dsp_bpm_off": 50,
  "dsp_key_off": 51,
  "dsp_pitch_off": 52,
  "dsp_bpm_dot": 53,
  "dsp_pitch_dot": 55,
  "dsp_pitch_plus_enable": 56,
  "dsp_track_lsb": 71, // lower 7 bits
  "dsp_total_lsb": 72, // lower 7 bits
  "dsp_bpm_lsb": 76, // lower 7 bits of bpm
  "dsp_pitch_lsb": 77 // lower 7 bits of pitch
};
