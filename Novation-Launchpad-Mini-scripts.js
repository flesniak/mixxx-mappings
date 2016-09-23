// TODO:
// play button leds second page bug
// pitch temp up down?
// load track/select track on side buttons

var color = {
  off:          12,
  red_lo:       13,
  red_mi:       14,
  red_hi:       15,
  red_flash:    11,
  green_lo:     28,
  green_mi:     44,
  green_hi:     60,
  green_flash:  56,
  amber_lo:     29,
  amber_mi:     46,
  amber_hi:     63,
  amber_flash:  59,
  yellow:       62,
  yellow_flash: 58
};

var persistentRows = 2;

// buttons for decks
// these buttons will be duplicated for every deck and located at a page-offset and x-offset
// x is column, y is row
// if shiftcontrol is not empty, this action will be taken instead when shift is pressed
// if ledcontrol is not empty, this control engine control will be connected to control the led state instead
deckButtons = [
// Track Decks
  { control:"play",                   hold:0, page:0, x:0, y:0, colorOff:color["green_lo"],   colorOn:color["amber_hi"],     shiftcontrol:"cue_set",                       shifthold:1, ledcontrol:"beat_active"         },
  { control:"cue_default",            hold:1, page:0, x:1, y:0, colorOff:color["green_lo"],   colorOn:color["amber_hi"],     shiftcontrol:"cue_gotoandstop",               shifthold:1, ledcontrol:""                    },
  { control:"cue_gotoandplay",        hold:1, page:0, x:2, y:0, colorOff:color["green_lo"],   colorOn:color["amber_hi"],     shiftcontrol:"cue_gotoandstop",               shifthold:1, ledcontrol:""                    },
  { control:"quantize",               hold:0, page:0, x:3, y:0, colorOff:color["red_lo"],     colorOn:color["red_hi"],       shiftcontrol:"sync_enabled",                  shifthold:1, ledcontrol:""                    },
  { control:"loop_in",                hold:1, page:0, x:0, y:1, colorOff:color["red_lo"],     colorOn:color["amber_flash"],  shiftcontrol:"beats_adjust_slower",           shifthold:1, ledcontrol:"loop_enabled"        },
  { control:"loop_out",               hold:1, page:0, x:1, y:1, colorOff:color["red_lo"],     colorOn:color["amber_flash"],  shiftcontrol:"beats_adjust_faster",           shifthold:1, ledcontrol:"loop_enabled"        },
  { control:"reloop_exit",            hold:1, page:0, x:2, y:1, colorOff:color["amber_lo"],   colorOn:color["amber_hi"],     shiftcontrol:"beats_translate_curpos",        shifthold:1, ledcontrol:"loop_enabled"        },
  { control:"mod:loop_backward",      hold:1, page:0, x:3, y:1, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"",                              shifthold:0, ledcontrol:""                    },
  { control:"beatloop_1_toggle",      hold:1, page:0, x:0, y:2, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"beatlooproll_0.125_activate",   shifthold:1, ledcontrol:"beatloop_1_enabled"  },
  { control:"beatloop_2_toggle",      hold:1, page:0, x:1, y:2, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"beatlooproll_0.25_activate",    shifthold:1, ledcontrol:"beatloop_2_enabled"  },
  { control:"beatloop_4_toggle",      hold:1, page:0, x:2, y:2, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"beatlooproll_0.5_activate",     shifthold:1, ledcontrol:"beatloop_4_enabled"  },
  { control:"beatloop_8_toggle",      hold:1, page:0, x:3, y:2, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"beatlooproll_1_activate",       shifthold:1, ledcontrol:"beatloop_8_enabled"  },
  { control:"beatloop_16_toggle",     hold:1, page:0, x:0, y:3, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"beatlooproll_2_activate",       shifthold:1, ledcontrol:"beatloop_16_enabled" },
  { control:"beatloop_32_toggle",     hold:1, page:0, x:1, y:3, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"beatlooproll_4_activate",       shifthold:1, ledcontrol:"beatloop_32_enabled" },
  { control:"loop_halve",             hold:1, page:0, x:2, y:3, colorOff:color["green_mi"],   colorOn:color["green_hi"],     shiftcontrol:"beatjump_0.03125_backward",     shifthold:1, ledcontrol:""                    },
  { control:"loop_double",            hold:1, page:0, x:3, y:3, colorOff:color["green_mi"],   colorOn:color["green_hi"],     shiftcontrol:"beatjump_0.03125_forward",      shifthold:1, ledcontrol:""                    },
  { control:"beatjump_1_backward",    hold:1, page:0, x:3, y:4, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"loop_move_1_backward",          shifthold:1, ledcontrol:""                    },
  { control:"beatjump_8_backward",    hold:1, page:0, x:2, y:4, colorOff:color["red_mi"],     colorOn:color["green_hi"],     shiftcontrol:"loop_move_2_backward",          shifthold:1, ledcontrol:""                    },
  { control:"beatjump_16_backward",   hold:1, page:0, x:1, y:4, colorOff:color["green_lo"],   colorOn:color["green_hi"],     shiftcontrol:"loop_move_4_backward",          shifthold:1, ledcontrol:""                    },
  { control:"beatjump_64_backward",   hold:1, page:0, x:0, y:4, colorOff:color["yellow"],     colorOn:color["green_hi"],     shiftcontrol:"loop_move_8_backward",          shifthold:1, ledcontrol:""                    },
  { control:"beatjump_1_forward",     hold:1, page:0, x:0, y:5, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"loop_move_1_forward",           shifthold:1, ledcontrol:""                    },
  { control:"beatjump_8_forward",     hold:1, page:0, x:1, y:5, colorOff:color["red_mi"],     colorOn:color["green_hi"],     shiftcontrol:"loop_move_2_forward",           shifthold:1, ledcontrol:""                    },
  { control:"beatjump_16_forward",    hold:1, page:0, x:2, y:5, colorOff:color["green_lo"],   colorOn:color["green_hi"],     shiftcontrol:"loop_move_4_forward",           shifthold:1, ledcontrol:""                    },
  { control:"beatjump_64_forward",    hold:1, page:0, x:3, y:5, colorOff:color["yellow"],     colorOn:color["green_hi"],     shiftcontrol:"loop_move_8_forward",           shifthold:1, ledcontrol:""                    },
  { control:"hotcue_1_activate",      hold:1, page:0, x:0, y:6, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"hotcue_1_clear",                shifthold:1, ledcontrol:"hotcue_1_enabled"    },
  { control:"hotcue_2_activate",      hold:1, page:0, x:1, y:6, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"hotcue_2_clear",                shifthold:1, ledcontrol:"hotcue_2_enabled"    },
  { control:"hotcue_3_activate",      hold:1, page:0, x:2, y:6, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"hotcue_3_clear",                shifthold:1, ledcontrol:"hotcue_3_enabled"    },
  { control:"hotcue_4_activate",      hold:1, page:0, x:3, y:6, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"hotcue_4_clear",                shifthold:1, ledcontrol:"hotcue_4_enabled"    },
  { control:"hotcue_5_activate",      hold:1, page:0, x:0, y:7, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"hotcue_5_clear",                shifthold:1, ledcontrol:"hotcue_5_enabled"    },
  { control:"hotcue_6_activate",      hold:1, page:0, x:1, y:7, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"hotcue_6_clear",                shifthold:1, ledcontrol:"hotcue_6_enabled"    },
  { control:"hotcue_7_activate",      hold:1, page:0, x:2, y:7, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"hotcue_7_clear",                shifthold:1, ledcontrol:"hotcue_7_enabled"    },
  { control:"hotcue_8_activate",      hold:1, page:0, x:3, y:7, colorOff:color["red_lo"],     colorOn:color["green_hi"],     shiftcontrol:"hotcue_8_clear",                shifthold:1, ledcontrol:"hotcue_8_enabled"    },
// Effect Rack
  { control:"mod:dummy",              hold:0, page:2, x:0, y:2, colorOff:color["off"],        colorOn:color["off"],          shiftcontrol:"",                              shifthold:0, ledcontrol:""                    },
  { control:"mod:dummy",              hold:0, page:2, x:1, y:2, colorOff:color["off"],        colorOn:color["off"],          shiftcontrol:"",                              shifthold:0, ledcontrol:""                    },
  { control:"mod:dummy",              hold:0, page:2, x:2, y:2, colorOff:color["off"],        colorOn:color["off"],          shiftcontrol:"",                              shifthold:0, ledcontrol:""                    },
  { control:"mod:dummy",              hold:0, page:2, x:3, y:2, colorOff:color["off"],        colorOn:color["off"],          shiftcontrol:"",                              shifthold:0, ledcontrol:""                    },
  { control:"[EffectRack1_EffectUnit1].group_[Channel1]_enable", hold:0, page:2, x:0, y:3, colorOff:color["green_lo"], colorOn:color["amber_hi"], shiftcontrol:"",         shifthold:0, ledcontrol:""                    },
  /*{ control:"cue_default",            hold:1, page:2, x:1, y:3, colorOff:color["green_lo"],   colorOn:color["amber_hi"],     shiftcontrol:"cue_gotoandstop",               shifthold:1, ledcontrol:""                    },
  { control:"cue_gotoandplay",        hold:1, page:2, x:2, y:3, colorOff:color["green_lo"],   colorOn:color["amber_hi"],     shiftcontrol:"cue_gotoandstop",               shifthold:1, ledcontrol:""                    },
  { control:"quantize",               hold:0, page:2, x:3, y:3, colorOff:color["red_lo"],     colorOn:color["red_hi"],       shiftcontrol:"sync_enabled",                  shifthold:1, ledcontrol:""                    }*/
];

Button = function(page, x, y, control, channel, hold, colorOff, colorOn, shiftcontrol, shifthold, modfunction)
{
  //print("button constructor");
  this.x = x;
  this.y = y;
  this.page = page;
  this.colorOff = colorOff;
  this.colorOn = colorOn;
  this.channel = channel;
  if( channel == 0 )
    this.channelStr = "[Master]";
  else
    this.channelStr = "[Channel"+channel+"]";
  this.control = control;
  this.hold = hold;
  this.lastvalue = 0;
  this.shiftcontrol = shiftcontrol;
  this.shifthold = shifthold;
  this.modfunction = typeof modfunction !== 'undefined' ? modfunction : null;

  this.draw = function(value)
  {
    if( value == -1 )
      value = this.lastvalue;
    else
      this.lastvalue = value;
    //print("DRAW btn ch "+this.channelStr+" ctr "+this.control+" x "+this.x+" draw callback"+" value "+value);
    var color = value ? this.colorOn : this.colorOff;
    if( (this.page != NLM.page && y >= persistentRows) && this.page != 8 ) return; //skip if we are not displayed
    if( this.y == 8 )
      midi.sendShortMsg(0xB0, this.x + 0x68, color);
    else
      midi.sendShortMsg(0x90, this.x+this.y*16, color);
  }

  this.callback = function(pressed)
  {
    if( this.x<0 || this.y<0 || this.page<0 ) {
      print("unmapped button action suppressed");
      return;
    }
    //if a modfunction is set, execute it instead of the normal push/release functions
    if( this.modfunction !== null )
      this.modfunction(pressed);
    else {
      if( pressed )
        this.onPush();
      else
        this.onRelease();
    }
  }

  this.onPush = function()
  {
    var ctrl = NLM.shift ? this.shiftcontrol : this.control;
    var hold = NLM.shift ? this.shifthold : this.hold;
    print("CB button onPush ch "+this.channelStr+" ctr "+ctrl+" hold "+hold);
    if( hold )
      engine.setValue(this.channelStr, ctrl, 1);
    else
      engine.setValue(this.channelStr, ctrl, !engine.getValue(this.channelStr, ctrl));
  }

  this.onRelease = function()
  {
    var ctrl = NLM.shift ? this.shiftcontrol : this.control;
    var hold = NLM.shift ? this.shifthold : this.hold;
    print("CB button onRelease ch "+this.channelStr+" ctr "+ctrl+" hold "+hold);
    if( hold )
      engine.setValue(this.channelStr, ctrl, 0);
  }
  //print("button constructor done");
}

// Create Controller Object
NLM = new Controller();
NLM.init = function()
{
  print("init");
  NLM.page = 1;
  NLM.shift = false;
  NLM.numofdecks = engine.getValue("[Master]", "num_decks");

  //Init hw
  NLM.reset();
  NLM.setFlashing(1,1,0,0);

  NLM.pagebuttons = Array(8);
  NLM.createPageButtons();

  var dummybutton = new Button(-1,-1,-1,"dummy",0,0,0,0,"dummy");
  NLM.buttons = Array(8); //pages
  for( var page = 0 ; page < 8 ; page++ ) {
    NLM.buttons[page] = Array(8); //rows
    for( var y = 0 ; y < 8 ; y++ ) {
      NLM.buttons[page][y] = Array(9); //columns
      for( var x = 0 ; x < 9 ; x++ )
        NLM.buttons[page][y][x] = dummybutton;
    }
  }

  NLM.createDeck(0,0);
  NLM.createDeck(0,1);
  NLM.createDeck(1,0);
  NLM.createDeck(1,1);
  NLM.createSpecialButtons();
  NLM.selectPage(0);
  print("initialized");
}

NLM.shutdown = function()
{
}

// reset the launchpad
NLM.reset = function()
{
  midi.sendShortMsg(0xb0, 0x00, 0x00);
}

// control double buffering
// flash: continually flip buffers (def: 1)
// copy: copy displayed to updating buffer (def: 1)
// update: set buffer 0/1 as new update buffer (def: 0)
// display: set buffer 0/1 as new display buffer (def: 0)
NLM.setFlashing = function(flash, copy, update, display)
{
  var value = display + update*4 + flash*8 + copy*16 + 32;
  midi.sendShortMsg(0xb0, 0x00, value);
}

NLM.incomingData = function(channel, control, value, status, group)
{
  //print("inc data ch " + channel + " con " + control + " val " + value + " sta " + status + " grp " + group);

  var pressed = (value == 127);
  var y = 0;
  var x = 0;
  if( status == 176 ) {
    y = 8;
    x -= 8;
  } else
    y = Math.floor(control / 16);
  x += control % 16;

  var page = NLM.page;
  if( y < persistentRows )
    page = NLM.page % 2; //for persistent buttons, select the corresponding first page

  //print("btn NLM.page " + NLM.page + " page " + page + " x " + x + " y " + y);
  if( y == 8 )
    NLM.pagebuttons[x].callback(value);
  else
    NLM.buttons[page][y][x].callback(value);
}

NLM.createButton = function(page, x, y, control, channel, hold, colorOff, colorOn, shiftcontrol, shifthold, ledcontrol)
{
  //print("creating button on page "+page+" at x "+x+" y "+y+": "+control+" (channel "+channel+")");
  var newbutton = new Button(page, x, y, control, channel, hold, colorOff, colorOn, shiftcontrol, shifthold);
  if( control.substring(0,4) == "mod:" ) {
    /*var name = "mod_"+control.substring(4);
    print("attaching modfunction "+name);
    newbutton.modfunction = NLM[name];*/
    var f = null;
    /* Insert special scripted functions here.
     * If a control is prefixed with "mod:", it
     * its functions will be created and attached
     * here.
     */
    switch( control.substring(4) ) {
      case "loop_backward":
        f = function(pressed) {
          if( !pressed )
            return;
          engine.setValue(this.channelStr, "beatloop", 8);
          engine.setValue(this.channelStr, "loop_move", -7);
        }
        break;
      case "dummy":
        f = function(pressed) {
          print("dummy button "+(pressed?"pressed":"released")+" (x "+this.x+" y "+this.y+")")
        }
        break;
    }
    newbutton.modfunction = f;
  }
  NLM.buttons[page][y][x] = newbutton;
  //when no ledcontrol is explicitly given, only use the control name as ledcontrol if
  //this is no mod function, as mod functions do normally not exist as a engine control
  if( ledcontrol.length == 0 && control.substring(0,4) != "mod:" )
    ledcontrol = control;
  if( ledcontrol.length > 0 ) {
    //connect control to anonymous function, this ensures "this" in Button.draw callback is the button itself (otherwise it would be the "NLM" object)
    engine.connectControl(newbutton.channelStr, ledcontrol, function(value) { newbutton.draw(value); } );
    engine.trigger(newbutton.channelStr, ledcontrol); //trigger once to set led state
  }
}

//a deck is a 4x8 vertical tile controlling one mixxx deck
NLM.createDeck = function(pageoffset, right)
{
  //print("createDeck pageoff "+pageoffset+" xoff "+right);
  var channel = 1+2*pageoffset+right;
  for( i in deckButtons ) {
    var template = deckButtons[i];
    NLM.createButton(template.page+pageoffset, template.x+4*right, template.y, template.control, channel, template.hold, template.colorOff, template.colorOn, template.shiftcontrol, template.shifthold, template.ledcontrol);
  }
}

NLM.forceDrawPage = function(page)
{
  for( var y = 0; y < 8; y++ )
    for( var x = 0; x < 9; x++ ) {
      var btn = NLM.buttons[page][y][x];
      if( typeof btn != 'undefined' )
        btn.draw(-1);
    }
}

NLM.selectPage = function(page)
{
  //print("select page "+page+", previous was "+NLM.page);
  NLM.pagebuttons[NLM.page].draw(0);
  NLM.page = page;
  NLM.pagebuttons[page].draw(1);
  NLM.forceDrawPage(page);
}

NLM.createPageButtons = function()
{
  for( var i = 0; i < 8; i++ ) {
    var newbtn = new Button(8, i, 8, "NLMPageSelect", 0, 0, color["off"], color["green_hi"]);
    newbtn.onRelease = function() { return; };
    newbtn.onPush = function() { NLM.selectPage(this.x); }; //override push callback to select page
    newbtn.draw(0);
    NLM.pagebuttons[i] = newbtn;
  }
}

NLM.createSpecialButtons = function()
{
  var shiftbutton = new Button(8, 8, 8, "NLMShift", 0, 1, color["green_lo"], color["green_hi"]);
  shiftbutton.callback = function(pressed) { NLM.shift = pressed; /*print("shift = "+pressed);*/ };
  for( var i = 0; i < 8; i++ )
    NLM.buttons[i][7][8] = shiftbutton; //assign shift button to every page
}
