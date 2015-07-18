/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is mozilla.org code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Scott MacGregor <mscott@netscape.com>
 *   Jens Bannmann <jens.b@web.de>
 *   Byungwook Kang <tobwithu@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
 
const NS_ALERT_HORIZONTAL = 1;
const NS_ALERT_LEFT = 2;
const NS_ALERT_TOP = 4;

var gFinalSize;
var gCurrentSize = 1;

var gSlideIncrement = 1;
var gSlideTime = 10;
var gOpenTime = 4000; // total time the alert should stay up once we are done animating.
var gOrigin = 0; // Default value: alert from bottom right, sliding in vertically.

var gAlertListener = null;
var gAlertTextClickable = false;
var gAlertCookie = "";

var wmn=null;
var timer;
var timerFunc;
const dout = Components.utils.reportError;

function setTimer(func,time) {
	var o={
    	notify:function(aTimer) {
      		func();
    	}
  	};
	timer.initWithCallback(o,time,Components.interfaces.nsITimer.TYPE_ONE_SHOT);
}

function prefillAlertInfo() {
  	var prefs = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.worldclientwebmail.");
	prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  	
  	var em = document.createElement("label");
    em.setAttribute("value", prefs.getCharPref("msg"));
    em.setAttribute("class","alertText plain");
    em.setAttribute('clickable', true);
    em.addEventListener("click", function(e) { WorldClientWMNMailChrome.openMail(); window.close(); }, false);

	var obj=document.getElementById("alertTextBox");
    obj.appendChild(em);
}

function onAlertLoad() {
    timer = Components.classes["@mozilla.org/timer;1"]
                .createInstance(Components.interfaces.nsITimer);      
  
  	// Make sure that the contents are fixed at the window edge facing the
  	// screen's center so that the window looks like "sliding in" and not
  	// like "unfolding". The default packing of "start" only works for
 	 // vertical-bottom and horizontal-right positions, so we change it here.
  	if (gOrigin & NS_ALERT_HORIZONTAL) {
    	if (gOrigin & NS_ALERT_LEFT) {
      		document.documentElement.pack = "end";
      	}

		// Additionally, change the orientation so the packing works as intended
    	document.documentElement.orient = "horizontal";
  	} else {
    	if (gOrigin & NS_ALERT_TOP) {
      		document.documentElement.pack = "end";
      	}
  	}

  	var alertBox = document.getElementById("alertBox");

  	sizeToContent();

  	// Work around a bug where sizeToContent() leaves a border outside of the content
  	var contentDim = document.getElementById("alertBox").boxObject;
  	if (window.innerWidth == contentDim.width + 1) {
    	--window.innerWidth;
    }

  	// Start with a 1px width/height, because 0 causes trouble with gtk1/2
  	gCurrentSize = 1;

  	// Determine final size
  	if (gOrigin & NS_ALERT_HORIZONTAL) {
    	gFinalSize = window.outerWidth;
    	window.outerWidth = gCurrentSize;
  	} else {
    	gFinalSize = window.outerHeight;
    	window.outerHeight = gCurrentSize;
  	}

  	// Determine position
  	var x = gOrigin & NS_ALERT_LEFT ? screen.availLeft :
          screen.availLeft + screen.availWidth - window.outerWidth;
  	var y = gOrigin & NS_ALERT_TOP ? screen.availTop :
          screen.availTop + screen.availHeight - window.outerHeight;

  	// Offset the alert by 10 pixels from the edge of the screen
  	if (gOrigin & NS_ALERT_HORIZONTAL) {
    	y += gOrigin & NS_ALERT_TOP ? 10 : -10;
  	} else {
    	x += gOrigin & NS_ALERT_LEFT ? 10 : -10;
    }
  
  	window.moveTo(x, y);

  	setTimer(animateAlert, gSlideTime);
  	
  	playSound();
}

function animate(step) {
  	gCurrentSize += step;
	if (gOrigin & NS_ALERT_HORIZONTAL) {
		if (!(gOrigin & NS_ALERT_LEFT)) {
    		window.screenX -= step;
		}
    	window.outerWidth = gCurrentSize;
	} else {
		if (!(gOrigin & NS_ALERT_TOP)) {
      		window.screenY -= step;
      	}
    	window.outerHeight = gCurrentSize;
  	}
}

function animateAlert() {
	if (gCurrentSize < gFinalSize) {
    	animate(gSlideIncrement);
    	setTimer(animateAlert, gSlideTime);
  	} else if(gOpenTime>0) {
    	setTimer(animateCloseAlert, gOpenTime);
    }
}

function animateCloseAlert() {
	if (gCurrentSize > 1) {
    	animate(-gSlideIncrement);
    	setTimer(animateCloseAlert, gSlideTime);
  	} else {
    	if (closeAlert) closeAlert();
    }
}

function closeAlert() {
    if (gAlertListener) {
    	gAlertListener.observe(null, "alertfinished", gAlertCookie);
	}
    window.close();
}

function onAlertClick() {
	if (gAlertListener && gAlertTextClickable) {
    	gAlertListener.observe(null, "alertclickcallback", gAlertCookie);
	}
}

function playSound() {
  	var prefs = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.worldclientwebmail.");
	prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);

  	if (prefs.getCharPref("beepChoice") != "0") {
	  	var sound = Components.classes["@mozilla.org/sound;1"]
	    		.createInstance(Components.interfaces.nsISound);

		var soundLocation;		
		if (prefs.getCharPref("beepChoice") == "1") {
			soundLocation = "chrome://worldclientwebmail/content/gotpost.wav";
		} else {
			soundLocation = "chrome://worldclientwebmail/content/gotmail.wav";
		}
		
  		var ioService = Components.classes["@mozilla.org/network/io-service;1"]
  				.getService(Components.interfaces.nsIIOService);
		sound.play(ioService.newURI(soundLocation, null, null));
		// sound.beep();
  	}
}