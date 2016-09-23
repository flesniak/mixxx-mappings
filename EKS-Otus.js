//
// EKS Otus HID controller script v1.0
// Copyright (C) 2012, Sean M. Pappalardo, Ilkka Tuohela
// but feel free to tweak this to your heart's content!
// For Mixxx version 1.11.x
//

// EKS Otus HID interface specification
function EKSOtusController() {
    this.controller = new HIDController();

    // Initialized to firmware version by version response packet
    this.version_major = undefined;
    this.version_minor = undefined;

    // i like to control decks 2+4 with my otus
    // this maps otus decks 1 (left) and 2 (right) to mixxx decks
    // the starting deck is 1 (left)
    // the mapping is also used by the eq knobs
    this.deckMapping = { 1: 2, 2: 4};
    this.controller.activeDeck = this.deckMapping[1];
    this.controller.deckSwitchMap = new Array();
    this.controller.deckSwitchMap[this.deckMapping[1]] = this.deckMapping[2];
    this.controller.deckSwitchMap[this.deckMapping[2]] = this.deckMapping[1];
    this.controller.deckSwitchMap[undefined] = this.deckMapping[1]; // back-and-forth switching between selected decks

    this.controller.LEDColors = { off: 0x0, red: 0x0f, green: 0xf0, amber: 0xff };
    this.controller.deckOutputColors = { 1: "red", 2: "green", 3: "red", 4: "green"};
    this.controller.beatloopScaler = { 1: "0.125", 2: "0.25", 4: "0.5", 8: "1" };

    // Static variables for HID specs
    this.wheelLEDCount = 60;
    this.buttonLEDCount = 22;
    this.sliderLEDCount = 20;

    this.registerInputPackets = function() {
        var packet = undefined;
        var name = undefined;
        var offset = 0;

        packet = new HIDPacket("control",[0x0,0x35],64);
        packet.addControl("hid","wheel_position",2,"H");
        packet.addControl("hid","wheel_speed",4,"h");
        packet.addControl("hid","timestamp",6,"I");
        packet.addControl("hid","slider_value",10,"H");
        packet.addControl("hid","slider_position",12,"H");
        packet.addControl("hid","encoder_ne",14,"B",undefined,true);
        packet.addControl("hid","encoder_se",15,"B",undefined,true);
        packet.addControl("hid","encoder_sw",16,"B",undefined,true);
        packet.addControl("hid","encoder_nw",17,"B",undefined,true);
        packet.addControl("hid","gain_1",18,"H");
        packet.addControl("hid","gain_2",20,"H");
        packet.addControl("hid","eq_high_1",22,"H");
        packet.addControl("hid","eq_high_2",24,"H");
        packet.addControl("hid","eq_mid_1",26,"H");
        packet.addControl("hid","eq_mid_2",28,"H");
        packet.addControl("hid","eq_low_1",30,"H");
        packet.addControl("hid","eq_low_2",32,"H");
        packet.addControl("hid","crossfader",34,"H");
        packet.addControl("hid","headphones",36,"H");
        packet.addControl("hid","trackpad_x",38,"H");
        packet.addControl("hid","trackpad_y",40,"H");
        packet.addControl("hid","slider_pos_2",42,"H");
        packet.addControl("hid","slider_pos_1",44,"H");
        packet.addControl("hid","encoder_ne_button",46,"I",0x1);
        packet.addControl("hid","loop_1",46,"I",0x2);
        packet.addControl("hid","loop_2",46,"I",0x4);
        packet.addControl("hid","loop_4",46,"I",0x8);
        packet.addControl("hid","loop_8",46,"I",0x10);
        packet.addControl("hid","loop_in",46,"I",0x20);
        packet.addControl("hid","loop_out",46,"I",0x40);
        packet.addControl("hid","reloop_exit",46,"I",0x80);
        packet.addControl("hid","slider_scale",46,"I",0x100);
        packet.addControl("hid","encoder_se_button",46,"I",0x200);
        packet.addControl("hid","eject_right",46,"I",0x400);
        packet.addControl("hid","deck_switch",46,"I",0x800);
        packet.addControl("hid","eject_left",46,"I",0x1000);
        packet.addControl("hid","encoder_sw_button",46,"I",0x2000);
        packet.addControl("hid","stop",46,"I",0x4000);
        packet.addControl("hid","play",46,"I",0x8000);
        packet.addControl("hid","cue",46,"I",0x10000);
        packet.addControl("hid","reverse",46,"I",0x20000);
        packet.addControl("hid","brake",46,"I",0x40000);
        packet.addControl("hid","fastforward",46,"I",0x80000);
        packet.addControl("hid","encoder_nw_button",46,"I",0x100000);
        packet.addControl("hid","jog_touch",46,"I",0x200000);
        packet.addControl("hid","trackpad_left",46,"I",0x400000);
        packet.addControl("hid","trackpad_right",46,"I",0x800000);
        packet.addControl("hid","hotcue_1",46,"I",0x1000000);
        packet.addControl("hid","hotcue_2",46,"I",0x2000000);
        packet.addControl("hid","hotcue_3",46,"I",0x4000000);
        packet.addControl("hid","hotcue_4",46,"I",0x8000000);
        packet.addControl("hid","hotcue_5",46,"I",0x10000000);
        packet.addControl("hid","hotcue_6",46,"I",0x20000000);
        packet.addControl("hid","touch_slider",46,"I",0x40000000)
        packet.addControl("hid","touch_trackpad",46,"I",0x80000000);
        packet.addControl("hid","packet_number",51,"B");
        packet.addControl("hid","deck_status",52,"B",0x1);
        this.controller.registerInputPacket(packet);

        packet = new HIDPacket("firmware_version",[0xa,0x4],64);
        packet.addControl("hid","major",2,"B");
        packet.addControl("hid","minor",3,"B");
        this.controller.registerInputPacket(packet);

        packet = new HIDPacket("trackpad_mode",[0x5,0x3],64);
        packet.addControl("hid","status",2,"B");
        this.controller.registerInputPacket(packet);

    }

    this.registerOutputPackets = function() {
        var packet = undefined;
        var name = undefined;
        var offset = 0;

        packet = new HIDPacket("button_leds",[0x16,0x18],32);
        offset = 2;
        packet.addOutput("hid","jog_nw",offset++,"B");
        packet.addOutput("hid","jog_ne",offset++,"B");
        packet.addOutput("hid","jog_se",offset++,"B");
        packet.addOutput("hid","jog_sw",offset++,"B");
        packet.addOutput("hid","loop_8",offset++,"B");
        packet.addOutput("hid","loop_4",offset++,"B");
        packet.addOutput("hid","loop_2",offset++,"B");
        packet.addOutput("hid","loop_1",offset++,"B");
        packet.addOutput("hid","loop_in",offset++,"B");
        packet.addOutput("hid","loop_out",offset++,"B");
        packet.addOutput("hid","reloop_exit",offset++,"B");
        packet.addOutput("hid","eject_right",offset++,"B");
        packet.addOutput("hid","deck_switch",offset++,"B");
        packet.addOutput("hid","trackpad_right",offset++,"B");
        packet.addOutput("hid","trackpad_left",offset++,"B");
        packet.addOutput("hid","eject_left",offset++,"B");
        packet.addOutput("hid","stop",offset++,"B");
        packet.addOutput("hid","play",offset++,"B");
        packet.addOutput("hid","reverse",offset++,"B");
        packet.addOutput("hid","cue",offset++,"B");
        packet.addOutput("hid","brake",offset++,"B");
        packet.addOutput("hid","fastforward",offset++,"B");
        this.controller.registerOutputPacket(packet);

        packet = new HIDPacket("slider_leds",[0x17,0x16],32);
        offset = 2;
        packet.addOutput("pitch","slider_1",offset++,"B");
        packet.addOutput("pitch","slider_2",offset++,"B");
        packet.addOutput("pitch","slider_3",offset++,"B");
        packet.addOutput("pitch","slider_4",offset++,"B");
        packet.addOutput("pitch","slider_5",offset++,"B");
        packet.addOutput("pitch","slider_6",offset++,"B");
        packet.addOutput("pitch","slider_7",offset++,"B");
        packet.addOutput("pitch","slider_8",offset++,"B");
        packet.addOutput("pitch","slider_9",offset++,"B");
        packet.addOutput("pitch","slider_10",offset++,"B");
        packet.addOutput("pitch","slider_11",offset++,"B");
        packet.addOutput("pitch","slider_12",offset++,"B");
        packet.addOutput("pitch","slider_13",offset++,"B");
        packet.addOutput("pitch","slider_14",offset++,"B");
        packet.addOutput("pitch","slider_15",offset++,"B");
        packet.addOutput("pitch","slider_16",offset++,"B");
        packet.addOutput("pitch","slider_17",offset++,"B");
        packet.addOutput("pitch","slider_scale_1",offset++,"B");
        packet.addOutput("pitch","slider_scale_2",offset++,"B");
        packet.addOutput("pitch","slider_scale_3",offset++,"B");
        this.controller.registerOutputPacket(packet);

        packet = new HIDPacket("led_wheel_left",[0x14,0x20],32);
        offset = 2;
        for (var led_index=1;led_index<=this.wheelLEDCount/2;led_index++)
            packet.addOutput("hid","wheel_" + led_index,offset++,"B");
        this.controller.registerOutputPacket(packet);

        packet = new HIDPacket("led_wheel_right",[0x15,0x20],32);
        offset = 2;
        for (var led_index=this.wheelLEDCount/2+1;led_index<=this.wheelLEDCount;led_index++)
            packet.addOutput("hid","wheel_" + led_index,offset++,"B");
        this.controller.registerOutputPacket(packet);

        packet = new HIDPacket("request_firmware_version",[0xa,0x2],32);
        this.controller.registerOutputPacket(packet);

        packet = new HIDPacket("set_trackpad_mode",[0x5,0x3],32);
        packet.addControl("hid","mode",2,"B");
        this.controller.registerOutputPacket(packet);

        packet = new HIDPacket("set_ledcontrol_mode",[0x1d,0x3],32);
        packet.addControl("hid","mode",2,"B");
        this.controller.registerOutputPacket(packet);
    }

    // Otus specific output packet to request device firmware version
    this.requestFirmwareVersion = function() {
        var packet = this.controller.getOutputPacket("request_firmware_version");
        if (packet==undefined)
            return;
        HIDDebug("Requesting firmware version " + packet.name);
        packet.send();
    }

    // Set LED Control Mode on Otus firmware versions > 1.6. Major and minor must
    // contain the version numbers for firmware as received from response.
    // Valid modes are:
    //      0   disable all LEDs
    //      1   Re-enable LEDs
    //      2   Revert to built-in light functionality
    this.setLEDControlMode = function(mode) {
        var controller = this.controller;
        if (this.version_major<=1 && this.version_minor<6) {
            // Firmware version does not support LED Control Mode Setting
            return;
        }
        if (mode!=0 && mode!=1 && mode!=2) {
            HIDDebug("Unknown value for LED Control Mode Setting: " + mode);
            return;
        }
        var packet = controller.getOutputPacket("set_ledcontrol_mode");
        var field = packet.getField("hid","mode");
        if (field==undefined) {
            HIDDebug("EksOtus.setLEDControlMode error fetching field mode");
            return;
        }
        field.value = mode;
        packet.send();
    }

    // Firmware version response. Required to finish device INIT
    this.FirmwareVersionResponse = function(packet,delta) {
        var controller = this.controller;
        var field_major = packet.getField("hid","major");
        var field_minor = packet.getField("hid","minor");
        if (field_major==undefined || field_minor==undefined) {
            HIDDebug("Error parsing response version packet");
            return;
        }
        this.version_major = field_major.value;
        this.version_minor = field_minor.value;
        controller.initialized = true;

        //this.setLEDControlMode(2);
        /*if (controller.activeDeck!=undefined) {
            controller.setOutput("hid","deck_switch", controller.LEDColors[controller.deckOutputColors[controller.activeDeck]]);
            controller.switchDeck(controller.activeDeck);
        } else {
            var value = controller.LEDColors["amber"];
            this.controller.setOutputToggle("hid","deck_switch",value);
        }*/
        EksOtus.outputCallback(engine.getValue(controller.resolveDeckGroup(controller.activeDeck), "play"),"deck","play");
        this.updateLEDs();
        HIDDebug("EKS " + EksOtus.id +
            " v"+EksOtus.version_major+"."+EksOtus.version_minor+
            " initialized"
        );
    }

    // Otus specific output packet to set the trackpad control mode
    this.setTrackpadMode = function(mode) {
        if (mode!=0 && mode!=1) {
            HIDDebug("Unsupported trackpad mode value: " + mode);
            return;
        }
        var packet = this.controller.getOutputPacket("set_trackpad_mode");
        if (packet==undefined) {
            HIDDebug("Output not registered: set_trackpad_mode");
            return;
        }
        var field = packet.getField("hid","mode");
        if (field==undefined) {
            HIDDebug("EksOtus.setTrackpadMode error fetching field mode");
            return;
        }
        field.value = mode;
        packet.send();
    }

    // Response to above trackpad mode packet
    this.TrackpadModeResponse = function(packet,delta) {
        field = packet.getField("hid","status");
        if (field==undefined) {
            HIDDebug("Error parsing field status from packet");
            return;
        }
        if (field.value==1) {
            HIDDebug("Trackpad mode successfully set");
        } else {
            HIDDebug("Trackpad mode change failed");
        }
    }

    // Generic unsigned short to -1..0..1 range scaling
    this.plusMinus1Scaler = function(group,name,value) {
        if (value<32768)
            return value/32768-1;
        else
            return (value-32768)/32768;
    }

    // Volume slider scaling for 0..1..5 scaling
    this.volumeScaler = function(group,name,value) {
        return script.absoluteNonLin(value, 0, 1, 5, 0, 65536);
    }

    // EQ scaling function for 0..1..4 scaling
    this.eqScaler = function(group,name,value) {
        return script.absoluteNonLin(value, 0, 1, 4, 0, 65536);
    }

    // Mandatory call from init() to initialize hardware
    this.initializeHIDController = function() {
        this.registerInputPackets();
        this.registerOutputPackets();
    }

    this.shutdownHardware = function() {
        this.setLEDControlMode(2);
        this.setTrackpadMode(1);
    }

}

EksOtus = new EKSOtusController();

// Initialize device state, send request for firmware. Otus is not
// usable before we receive a valid firmware version response.
EksOtus.init = function (id) {
    EksOtus.id = id;

    EksOtus.LEDUpdateInterval = 250;
    //EksOtus.LEDUpdateInterval = 1000;
    //EksOtus.LEDUpdateInterval = undefined;
    // Valid values: 1 for mouse mode, 0 for xy-pad mode
    EksOtus.trackpadMode = 1;

    //EksOtus.deckSwitchClicked = false;

    // Wheel absolute position value
    EksOtus.wheelPosition = undefined;

    // Call the HID packet parser initializers
    EksOtus.initializeHIDController();
    var controller = EksOtus.controller;
    // Set callbacks for packets here to avoid issues in callback handling
    controller.setPacketCallback("firmware_version",EksOtus.FirmwareVersionWrapper);
    controller.setPacketCallback("trackpad_mode",EksOtus.TrackpadModeWrapper);

    controller.ignoredControlChanges = [
        "mask", "timestamp", "packet_number", "hid.deck_switch", "wheel_speed",
        "slider_pos_1", "slider_pos_2", "slider_position", "trackpad_x", "trackpad_y", "hid.touch_trackpad", "hid.trackpad_left", "hid.trackpad_right"
    ];

    // Scratch parameters
    controller.scratchintervalsPerRev = 65536;
    controller.scratchAlpha = 1.0/8;
    controller.scratchBeta = controller.scratchAlpha/32;
    controller.rampedScratch = true;

    EksOtus.setTrackpadMode(this.trackpadMode);
    // Note: Otus is not considered initialized before we get
    // response to this packet
    EksOtus.requestFirmwareVersion();
    // Link controls and register callbacks
    EksOtus.registerCallbacks();

    engine.softTakeover("[Master]","headVolume",true);
    engine.softTakeover("[Master]","headMix",true);
    for (var deck in controller.deckOutputColors) {
        engine.softTakeover("[Channel"+deck+"]","pregain",true);
        engine.softTakeover("[Channel"+deck+"]","volume",true);
    }

    var fields = controller.getOutputPacket("button_leds").getGroup("hid", false);
    if (fields == undefined)
        return;
    for (var id in fields) {
      fields[id].value = controller.LEDColors[controller.deckOutputColors[controller.activeDeck]];
      fields[id].toggle = 0;
    }

    if (EksOtus.LEDUpdateInterval != undefined) {
      controller.timers["led_update"] = engine.beginTimer(
          EksOtus.LEDUpdateInterval,
          "EksOtus.updateLEDs(true)"
      );
    }
}

// changing controls just sets or unsets the "toggle" flag
// the output value itself is set by flashLEDs() periodically
EksOtus.outputCallback = function(value,group,key) {
    var controller = EksOtus.controller;
    if (group=="deck") {
        if (controller.activeDeck==undefined)
            return;
        group = controller.resolveGroup("deck");
    }
    HIDDebug("outputCallback "+value+" "+group+" "+key);
    if (key == "play") {
      var field = controller.getOutputField("deck", "cue_default");
      field.toggle = !value;
    }
    if (key == "cue_default") //&& !engine.getValue(group, "play"))
      return;
    var field = controller.getOutputField("deck", key);
    if (value==1)
        field.toggle = 1; // enable flashing
    else
        field.toggle = 0; // disable flashing (static lighting)
}

//toggle "active" leds (flashing) or light them up only ("inactive")
EksOtus.flashLEDs = function() {
  var controller = EksOtus.controller;
  var fields = controller.getOutputPacket("button_leds").getGroup("hid", false);
  if (fields == undefined)
    return;
  for (var id in fields) {
    if (fields[id].toggle) {
      if (fields[id].value == controller.LEDColors["off"])
        fields[id].value = controller.LEDColors[controller.deckOutputColors[controller.activeDeck]];
      else
        fields[id].value = controller.LEDColors["off"];
    } else
      fields[id].value = controller.LEDColors[controller.deckOutputColors[controller.activeDeck]];
  }
}

EksOtus.updateLEDs = function(from_timer) {
    EksOtus.flashLEDs();
    var controller = EksOtus.controller;
    controller.getOutputPacket("button_leds").send();
    //controller.getOutputPacket("slider_leds").send();
    //controller.getOutputPacket("led_wheel_left").send();
    //controller.getOutputPacket("led_wheel_right").send();
}

// Device cleanup function
EksOtus.shutdown = function() {
    engine.softTakeover("[Master]","headVolume",false);
    engine.softTakeover("[Master]","headMix",false);
    for (var deck in controller.deckOutputColors) {
        engine.softTakeover("[Channel"+deck+"]","pregain",false);
        engine.softTakeover("[Channel"+deck+"]","volume",false);
    }
    EksOtus.shutdownHardware(2);
    HIDDebug("EKS "+EksOtus.id+" shut down");
}

// Mandatory default handler for incoming packets
EksOtus.incomingData = function(data,length) {
    EksOtus.controller.parsePacket(data,length);
}

EksOtus.FirmwareVersionWrapper = function(packet,data) {
    return EksOtus.FirmwareVersionResponse(packet,data);
}

EksOtus.TrackpadModeWrapper = function(packet,data) {
    return EksOtus.TrackpadModeResponse(packet,data);
}

// Link virtual HID naming of input and LED controls to mixxx
// Note: HID specification has more fields than we map here.
EksOtus.registerCallbacks = function() {
    var controller = EksOtus.controller;

    controller.linkModifier("hid","eject_right","shift");
    controller.linkModifier("hid","touch_slider","pitch");

    controller.linkControl("hid","play","deck","play");
    controller.linkControl("hid","cue","deck","cue_default");
    controller.linkControl("hid","reverse","deck","reverse");
    controller.linkControl("hid","fastforward","deck","beatjump_8_forward");
    controller.linkControl("hid","brake","deck","beatjump_8_backward");
    controller.linkControl("hid","stop","deck","pfl");
    controller.linkControl("hid","eject_left","deck","cue_gotoandplay");
    controller.setCallback("control","hid","jog_touch",EksOtus.scratchEnable);
    controller.setCallback("control","hid","wheel_position",EksOtus.scratch);

    controller.setCallback("control","hid","encoder_sw_button",EksOtus.selectTrackButton);
    controller.setCallback("control","hid","encoder_sw",EksOtus.selectTrack);

    controller.setCallback("control","hid","encoder_nw_button",EksOtus.pitchEncoder);
    controller.setCallback("control","hid","encoder_nw",EksOtus.pitchEncoder);
    controller.setCallback("control","hid","encoder_ne_button",EksOtus.pitchEncoder);
    controller.setCallback("control","hid","encoder_ne",EksOtus.pitchEncoder);

    controller.linkControl("hid","crossfader","[Master]","crossfader");
    controller.setCallback("control","hid","gain_1",EksOtus.eq);
    controller.setCallback("control","hid","gain_2",EksOtus.eq);
    controller.setCallback("control","hid","eq_high_1",EksOtus.eq);
    controller.setCallback("control","hid","eq_high_2",EksOtus.eq);
    controller.setCallback("control","hid","eq_mid_1",EksOtus.eq);
    controller.setCallback("control","hid","eq_mid_2",EksOtus.eq);
    controller.setCallback("control","hid","eq_low_1",EksOtus.eq);
    controller.setCallback("control","hid","eq_low_2",EksOtus.eq);

    controller.setScaler("jog",EksOtus.jogScaler);
    controller.setScaler("jog_scratch",EksOtus.scratchScaler);
    controller.setScaler("crossfader",EksOtus.plusMinus1Scaler);

    controller.setCallback("control","hid","hotcue_1",EksOtus.hotcue);
    controller.setCallback("control","hid","hotcue_2",EksOtus.hotcue);
    controller.setCallback("control","hid","hotcue_3",EksOtus.hotcue);
    controller.setCallback("control","hid","hotcue_4",EksOtus.hotcue);
    controller.setCallback("control","hid","hotcue_5",EksOtus.hotcue);
    controller.setCallback("control","hid","hotcue_6",EksOtus.hotcue);

    controller.setCallback("control","hid","loop_1",EksOtus.beatloop);
    controller.setCallback("control","hid","loop_2",EksOtus.beatloop);
    controller.setCallback("control","hid","loop_4",EksOtus.beatloop);
    controller.setCallback("control","hid","loop_8",EksOtus.beatloop);
    controller.setCallback("control","hid","loop_in",EksOtus.loopAdjust);
    controller.setCallback("control","hid","loop_out",EksOtus.loopAdjust);
    controller.linkControl("hid","reloop_exit","deck","reloop_exit");

    controller.setCallback("control","hid","deck_status",EksOtus.deckSwitch);

    //controller.linkControl("hid","headphones","[Master]","headphones");
    controller.setCallback("control","hid","headphones",EksOtus.headphones);

    controller.setCallback("control","hid","slider_scale",EksOtus.scaleButton);
    controller.setCallback("control","hid","slider_value",EksOtus.pitchSlider);
    //controller.setCallback("control","hid","slider_position",EksOtus.pitchSlider);
    //controller.setCallback("control","hid","slider_pos_1",EksOtus.pitchSlider);
    //controller.setCallback("control","hid","slider_pos_2",EksOtus.pitchSlider);

    controller.linkOutput("hid","loop_8","deck","beatloop_1_enabled",EksOtus.outputCallback);
    controller.linkOutput("hid","loop_4","deck","beatloop_2_enabled",EksOtus.outputCallback);
    controller.linkOutput("hid","loop_2","deck","beatloop_4_enabled",EksOtus.outputCallback);
    controller.linkOutput("hid","loop_1","deck","beatloop_8_enabled",EksOtus.outputCallback);
    controller.linkOutput("hid","loop_in","deck","loop_in",EksOtus.outputCallback);
    controller.linkOutput("hid","loop_out","deck","loop_out",EksOtus.outputCallback);
    controller.linkOutput("hid","reloop_exit","deck","loop_enabled",EksOtus.outputCallback);
    controller.linkOutput("hid","stop","deck","pfl",EksOtus.outputCallback);
    controller.linkOutput("hid","play","deck","play",EksOtus.outputCallback);
    controller.linkOutput("hid","reverse","deck","reverse",EksOtus.outputCallback);
    controller.linkOutput("hid","fastforward","deck","fwd",EksOtus.outputCallback);
    controller.linkOutput("hid","cue","deck","cue_default",EksOtus.outputCallback);
}

EksOtus.scratch = function(field) {
  var controller = EksOtus.controller;
  var active_group = controller.resolveDeckGroup(controller.activeDeck);
  var delta = field.delta;
  if (delta > 32768)
    delta -= 65536;
  else if (delta < -32768)
    delta += 65536;
  if (engine.isScratching(controller.activeDeck))
    engine.scratchTick(controller.activeDeck, delta);
  else {
    var play = engine.getValue(group, "play") ? 1 : 0;
    var scratch2 = engine.getValue(group, "scratch2");
    if (play && Math.abs(scratch2)-1 < 0.01) { // reset scratch value close to 0 after scratching
      engine.setValue(group, "scratch2", 0.001);
      scratch2 = 0.001;
    }
    if (Math.abs(scratch2)-play > 0.01) { // still rotating after scratching
      engine.scratchTick(controller.activeDeck, delta);
    } else {
      engine.setValue(active_group, "jog", delta/64);
    }
  }
}

EksOtus.scratchEnable = function(field) {
  var controller = EksOtus.controller;
  if (field.value)
    engine.scratchEnable(controller.activeDeck,
      controller.scratchintervalsPerRev, 33+1/3,
      controller.scratchAlpha, controller.scratchBeta, controller.rampedScratch);
  else
    engine.scratchDisable(controller.activeDeck);
}

// Default scaler for jog values
EksOtus.scratchScaler = function(group,name,value) {
    if (EksOtus.wheelPosition==undefined) {
        EksOtus.wheelPosition = value;
        return 0;
    }
    var delta = EksOtus.wheelPosition - value;
    if (delta > 32768)
      delta -= 65536;
    else if (delta < -32768)
      delta += 65536;
    EksOtus.wheelPosition = value;
    if (delta>-32 && delta<32)
      return -delta/32;
    return -delta/32;
}

EksOtus.jogScaler = function(group,name,value) {
    if (EksOtus.wheelPosition==undefined) {
        EksOtus.wheelPosition = value;
        return 0;
    }
    var delta = EksOtus.wheelPosition - value;
    if (delta > 32768)
      delta -= 65536;
    if (delta < -32768)
      delta += 65536;
    EksOtus.wheelPosition = value;
    if (delta < 8 && delta > -8)
      return 0;
    return -delta/64;
}

// Hotcues activated with normal press, cleared with shift
EksOtus.hotcue = function (field) {
    var controller = EksOtus.controller;
    var command;
    if (controller.activeDeck==undefined ||
        field.value==controller.buttonStates.released)
        return;
    var active_group = controller.resolveDeckGroup(controller.activeDeck);
    if (controller.modifiers.get("shift"))
        command = field.name + "_clear";
    else
        command = field.name + "_activate";
    engine.setValue(active_group,command,true);
}

EksOtus.eq = function(field) {
  var controller = EksOtus.controller;
  if (controller.activeDeck==undefined)
    return;
  var knob_deck = EksOtus.deckMapping[parseInt(field.name.slice(-1))];
  var active_group = "[EqualizerRack1_[Channel"+knob_deck+"]_Effect1]";
  switch (field.name.substring(0,5)) {
    case "gain_":
      var control = "pregain";
      active_group = controller.resolveDeckGroup(knob_deck);
      break;
    case "eq_hi": var control = "parameter3"; break;
    case "eq_mi": var control = "parameter2"; break;
    case "eq_lo": var control = "parameter1"; break;
    default: return;
  }
  var value = EksOtus.eqScaler(0, 0, field.value);
  engine.setValue(active_group, control, value);
}

// Beatloops activated with normal presses to beatloop_1 - beatloop_8
EksOtus.beatloop = function (field) {
    var controller = EksOtus.controller;
    var command;
    if( controller.activeDeck==undefined )
        return;
    var active_group = controller.resolveDeckGroup(controller.activeDeck);
    if( controller.modifiers.get("shift") ) {
        if( field.value == controller.buttonStates.released )
          return;
        command = "beatloop_" + field.name[5] + "_activate";
    } else
        command = "beatlooproll_" + controller.beatloopScaler[field.name[5]] + "_activate";
    engine.setValue(active_group,command,field.value);
}

EksOtus.beat_align = function (field) {
    var controller = EksOtus.controller;
    if (controller.activeDeck==undefined)
        return;
    var active_group = controller.resolveGroup(field.group);
    if (controller.modifiers.get("shift")) {
        // if (field.value==controller.buttonStates.released) return;
        engine.setValue(active_group,"beats_translate_curpos",field.value);
    } else {
        if (field.value==controller.buttonStates.released)
            return;
        if (!engine.getValue(active_group,"quantize"))
            engine.setValue(active_group,"quantize",true);
        else
            engine.setValue(active_group,"quantize",false);
    }
}

// Pitch slider modifies track speed directly
EksOtus.pitchSlider = function (field) {
    var controller = EksOtus.controller;
    if (controller.activeDeck==undefined)
        return;
    if (controller.modifiers.get("pitch")) {
        var active_group = controller.resolveDeckGroup(controller.activeDeck);
        if (field.name=="slider_value") {
            if (field.value==0)
                return;
            var value = EksOtus.plusMinus1Scaler(
                active_group,field.name,field.value
            );
            engine.setValue(active_group,"rate",value);
        }
    }
}

// Pitch slider modifies track speed directly
EksOtus.pitchSlider = function (field) {
    var controller = EksOtus.controller;
    if (controller.activeDeck==undefined)
        return;
    if (controller.modifiers.get("pitch")) {
        var active_group = controller.resolveDeckGroup(controller.activeDeck);
        if (field.name=="slider_value") {
            if (field.value==0)
                return;
            var value = EksOtus.plusMinus1Scaler(
                active_group,field.name,field.value
            );
            engine.setValue(active_group,"rate",value);
        }
    }
}

// Deck rate adjustment with top corner wheels, sync on button+shift, reset on button
EksOtus.pitchEncoder = function (field) {
    var controller = EksOtus.controller;
    switch(field.name.substring(0,10)) {
      case "encoder_nw": var deck = EksOtus.deckMapping[1]; break;
      case "encoder_ne": var deck = EksOtus.deckMapping[2]; break;
      default: return;
    }
    var active_group = controller.resolveDeckGroup(deck);
    if (field.name.slice(-6) == "button") {
      if (controller.modifiers.get("shift")) {
        var control = "beatsync_tempo";
        var value = 1;
      } else {
        var control = "rate";
        var value = 0;
      }
    } else {
      var control = "rate";
      var value = engine.getValue(active_group,"rate") + (field.delta<0 ? 0.003 : -0.003);
    }
    engine.setValue(active_group,control,value);
}

// Set pregain, if modifier shift is active, deck volume otherwise
EksOtus.volume_pregain = function (field) {
    var controller = EksOtus.controller;
    if (controller.activeDeck==undefined)
        return;
    var active_group = controller.resolveGroup(field.group);
    if (controller.modifiers.get("shift")) {
        value = script.absoluteNonLin(field.value, 0, 1, 5, 0, 65536);
        engine.setValue(active_group,"pregain",value);
    } else {
        value = field.value / 65536;
        engine.setValue(active_group,"volume",value);
    }
}

// Set headphones volume, if modifier shift is active, pre/main mix otherwise
EksOtus.headphones = function (field) {
    var controller = EksOtus.controller;
    if (controller.modifiers.get("shift")) {
        value = script.absoluteNonLin(field.value, 0, 1, 5, 0, 65536);
        engine.setValue("[Master]","headVolume",value);
    } else {
        value = EksOtus.plusMinus1Scaler(field.group,field.name,field.value);
        engine.setValue("[Master]","headMix",value);
    }
}

// Control effects or somethig with XY pad
EksOtus.xypad = function(field) {
    var controller = EksOtus.controller;
    if (controller.activeDeck==undefined)
        return;
    print ("XYPAD group " + field.group +
        " name " + field.name + " value " + field.value
    );
}

//my variant: use internal switching, just report current deck_status to the engine
EksOtus.deckSwitch = function(field) {
  var controller = EksOtus.controller;
  controller.switchDeck();
  EksOtus.outputCallback(engine.getValue(controller.resolveDeckGroup(controller.activeDeck), "play"),"deck","play");
  EksOtus.updateLEDs();
  //HIDDebug("deckSwitch "+field.value);
  //if( (controller.activeDeck != 2 && field.value == 1) || (controller.activeDeck != 1 && field.value == 0) ) {
  //}
}

//shift + scale button resets pitch to 0
//TODO send zero-pitch to controller? even possible?
EksOtus.scaleButton = function(field) {
  var controller = EksOtus.controller;
  if( controller.activeDeck == undefined )
    return;
  var active_group = controller.resolveDeckGroup(controller.activeDeck);
  if( controller.modifiers.get("shift") )
    engine.setValue(active_group, "rate", 0);
}

EksOtus.loopAdjust = function(field) {
  var controller = EksOtus.controller;
  if( controller.activeDeck == undefined )
    return;
  var active_group = controller.resolveDeckGroup(controller.activeDeck);
  if( controller.modifiers.get("shift") ) {
    /*if( field.value == 0 )
      return;*/
    var cmd = "loop_halve";
    /*if( field.name == "loop_in" )
      cmd = "loop_halve";*/
    if( field.name == "loop_out" )
      cmd = "loop_double";
    engine.setValue(active_group, cmd, field.value);
  } else
    engine.setValue(active_group, field.name, field.value);
}

EksOtus.selectTrack = function(field) {
  if (EksOtus.controller.modifiers.get("shift")) {
    if (field.delta == 1)
      engine.setValue("[Playlist]","SelectNextPlaylist", 1);
    else
      engine.setValue("[Playlist]","SelectPrevPlaylist", 1);
  } else
    engine.setValue("[Playlist]","SelectTrackKnob", field.delta);
}

EksOtus.selectTrackButton = function(field) {
  var controller = EksOtus.controller;
  var active_group = controller.resolveDeckGroup(controller.activeDeck);
  if (controller.modifiers.get("shift"))
    engine.setValue("[Playlist]","ToggleSelectedSidebarItem", field.value);
  else
    engine.setValue(active_group,"LoadSelectedTrack", field.value);
}
