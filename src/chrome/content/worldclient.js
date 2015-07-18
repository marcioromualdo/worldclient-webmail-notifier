var WorldClientWMNChrome = {
	prefs: null,
	p_debug: false,
	p_site: "",
	p_username: "",
	p_interval: "",
	p_language: "",
	p_initial_hour: "",
	p_final_hour: "",
	p_timer: null,
	p_onlyInbox: false,
	p_enabled: true,
	p_showNotification: true,
	p_theme: null,

	// Initialize the extension
	startup: function() {
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
				.getService(Components.interfaces.nsIPrefService)
				.getBranch("extensions.worldclientwebmail.");
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		
		this.prefs.addObserver("", this, false);
	
		this.p_debug = this.prefs.getBoolPref("debug");
		this.p_site = this.prefs.getCharPref("site");
		this.p_username = this.prefs.getCharPref("username");

		this.p_interval = this.prefs.getCharPref("interval");
		this.p_language = this.prefs.getCharPref("language");
		this.p_initial_hour = this.prefs.getCharPref("initial_hour");
		this.p_final_hour = this.prefs.getCharPref("final_hour");
		this.p_onlyInbox = this.prefs.getBoolPref("onlyInbox");
		this.p_enabled = this.prefs.getBoolPref("enabled");
		this.p_showNotification = this.prefs.getBoolPref("showNotification");
		this.p_theme = this.prefs.getCharPref("theme");
		this.prefs.setCharPref("msg", ""); // clean message

		WorldClientWMNUtilChrome.debug("startup: \nthis.p_enabled [" + this.p_enabled 
				+ "] \nthis.p_site [" + this.p_site 
				+ "] \nthis.p_username [" + this.p_username 
				+ "] \nthis.initial_hour [" + this.p_initial_hour 
				+ "] \nthis.final_hour [" + this.p_final_hour
				+ "] \nthis.p_theme [" + this.p_theme 
				+ "] \ncookie.WorldClientWMNChrome [" + WorldClientWMNUtilChrome.getCookie("WorldClientWMNChrome") + "]");
		
		var samplePanel = document.getElementById('worldclientwebmail-statusbar');
   		samplePanel.setAttribute("enabled", this.p_enabled);
   		var menuitemenable = document.getElementById('worldclientwebmail-menuitem-enable');
   		menuitemenable.setAttribute("checked", this.p_enabled);

		if (this.p_enabled
				&& WorldClientWMNUtilChrome.getCookie("WorldClientWMNChrome") != "working" 
				&& WorldClientWMNUtilChrome.intervalOk(this.p_initial_hour, this.p_final_hour)) {

			WorldClientWMNUtilChrome.setCookie("WorldClientWMNChrome","working");
			
	 		WorldClientWMNChrome.refreshInformation();

			this.p_timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
			this.p_timer.initWithCallback(WorldClientWMNChrome, parseInt(this.p_interval)*60*1000, 
					Components.interfaces.nsITimer.TYPE_REPEATING_SLACK); // call the notify method
		}
	},
	
	notify: function() {
		this.refreshInformation();
	},

	// Clean up after ourselves and save the prefs
	shutdown: function() {
		if (this.prefs) this.prefs.removeObserver("", this);
		if (this.p_timer) this.p_timer.cancel();
	},
	
	// Called when events occur on the preferences	
	observe: function(subject, topic, data)	{
		if (topic != "nsPref:changed") {
			return;
		}
		
		var mustReload = false;
		switch(data) {
			case "debug":
				mustReload = true; break;
			case "site":
				mustReload = true; break;
			case "username":
				mustReload = true; break;
			case "interval":
				mustReload = true; break;
			case "language":
				mustReload = true; break;
			case "initial_hour":
				mustReload = true; break;
			case "final_hour":
				mustReload = true; break;
			case "showNotification":
				mustReload = true; break;
			case "onlyInbox":
				mustReload = true; break;
			case "beepChoice":
				mustReload = true; break;
			case "reloadWMN":
				mustReload = true; break;
			case "theme":
				mustReload = true;
		}

		WorldClientWMNUtilChrome.debug("observe: mustReload [" + mustReload + "]");

		if (!mustReload) {
			return;
		}

		// we need a nsITimerCallback compatible...  
 		// ... interface for the callbacks.  
 		var eventObserve = {
 			notify: function(timer) {
 				WorldClientWMNChrome.shutdown();
				WorldClientWMNChrome.startup();  
			}
		}  

		var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);  
		timer.initWithCallback(eventObserve,3000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
		WorldClientWMNUtilChrome.setCookie("WorldClientWMNChrome","shutdown");  		
	},
	
	// Refresh the stock information
	refreshInformation: function() {
		// Because we may be called as a callback, we can't rely on
		// "this" referring to the right object, so we need to reference
		// it by its full name here.		
		var p_debug = this.p_debug;
		var p_site = this.p_site;
		var p_username = this.p_username;
		
		var webmailService = Components.classes["@mozilla.org/WorldClientWebmailService;1"]
				.getService().wrappedJSObject;		
		var p_password = webmailService.getPassword(p_username);
		
		var p_interval = this.p_interval;
		var p_initial_hour = this.p_initial_hour;
		var p_final_hour = this.p_final_hour;
		var p_theme = this.p_theme;

		WorldClientWMNUtilChrome.debug("refreshInformation: \np_site [" + p_site + "] \np_username [" + p_username + "]");

		if (p_site == "" || p_username == "" || p_password == "") {
			var samplePanel = document.getElementById('worldclientwebmail-statusbar');
			samplePanel.setAttribute("label", " " + WorldClientWMNUtilChrome.getString('configEmail'));
			samplePanel.tooltipText = samplePanel.getAttribute("label");
			return;
		}

		var browserForTab = WorldClientWMNUtilChrome.getBrowserForTab(false);
		var httpRequest1 = new XMLHttpRequest();

		WorldClientWMNUtilChrome.debug("refreshInformation: browserForTab!=null? [" + (browserForTab!=null) + "]");

		if (browserForTab != null) {
 			var tContent = browserForTab.contentDocument.documentElement.textContent;
			
 			var wcLink = "";
			var sUser = "";

			if (tContent.indexOf("/WorldClient.dll?Session=") != -1) {
				wcLink = tContent.substring(tContent.indexOf("/WorldClient.dll?Session="), 
						tContent.indexOf("/WorldClient.dll?Session=") + 38);

				WorldClientWMNUtilChrome.debug("refreshInformation: wcLink [" + wcLink + "]");

				function processCheckMails3() {
					var output = httpRequest3.responseText;

					var sessionOK = WorldClientWMNChrome.isSessionOk(output);

					WorldClientWMNUtilChrome.debug("refreshInformation.processCheckMails3: sessionOK [" + sessionOK + "]");
					
					if (sessionOK) {
						WorldClientWMNChrome.processReturnJavascript(output, 8);	
					} else {
						var params = "ReturnJavaScript=1&User=" + encodeURIComponent(p_username) 
								+ "&Password=" + encodeURIComponent(p_password)
								+ "&Theme=" + encodeURIComponent(p_theme)
								+ "&Logon=Sign+In";
						
						var url1 = p_site + "/WorldClient.dll?View=Main";
						WorldClientWMNUtilChrome.debug("refreshInformation: url1 [" + url1 + "?" + params);
						
						httpRequest1.open("POST", url1, true);		
						httpRequest1.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
						httpRequest1.setRequestHeader("Content-length", params.length);
						httpRequest1.setRequestHeader("Connection", "close");		
						httpRequest1.onload = processLogin;
						httpRequest1.send(params);
					}
				}

				var url3 = p_site + wcLink + "&View=List&RefreshFolderCounts=1&ReturnJavaScript=1"
						+ "&Theme=" + encodeURIComponent(p_theme);
				WorldClientWMNUtilChrome.debug("refreshInformation: url3 [" + url3 + "]");

				var httpRequest3 = new XMLHttpRequest();
				httpRequest3.open("GET", url3, true);
				httpRequest3.onload = processCheckMails3;
				httpRequest3.send(null);
				return;	
            }
		}
	
		function processLogin() {
			var samplePanel = document.getElementById('worldclientwebmail-statusbar');
			var output = httpRequest1.responseText;

			if (output.length) {
				// Remove whitespace from the end of the string;
				// this gets rid of the end-of-line characters
				output.replace(/\W*$/, "");	

				var url = null;
				if (output.indexOf("/WorldClient.dll?Session=") != -1) {
					url = output.substring(output.indexOf("/WorldClient.dll?Session="), 
							output.indexOf("/WorldClient.dll?Session=") + 38);
				}

				WorldClientWMNUtilChrome.debug("processLogin: url [" + url + "]");
				
				if (url == null) {
					samplePanel.setAttribute("label", " " + WorldClientWMNUtilChrome.getString('connectionError'));
					samplePanel.tooltipText = samplePanel.getAttribute("label");
					return;
				} else {
					samplePanel.setAttribute("label", " " + WorldClientWMNUtilChrome.getString('loading'));
					samplePanel.tooltipText = samplePanel.getAttribute("label");
				}

				function processCheckMails2() {
					var samplePanel = document.getElementById('worldclientwebmail-statusbar');
					var output = httpRequest2.responseText;
					
					WorldClientWMNChrome.processReturnJavascript(output, 8);
				}
		
				var url2 = p_site + url + "&View=List&RefreshFolderCounts=1&ReturnJavaScript=1"
						+ "&Theme=" + encodeURIComponent(p_theme)
				WorldClientWMNUtilChrome.debug("processLogin: url2 [" + url2 + "]");

				var httpRequest2 = new XMLHttpRequest();
				httpRequest2.open("GET", url2, true);
				httpRequest2.onload = processCheckMails2;
				httpRequest2.send(null);
			}
		}

		var params = "ReturnJavaScript=1&User=" + encodeURIComponent(p_username) 
				+ "&Password=" + encodeURIComponent(p_password) 
				+ "&Theme=" + encodeURIComponent(p_theme)
				+ "&Logon=Sign+In";

		var url1 = p_site + "/WorldClient.dll?View=Main";
		WorldClientWMNUtilChrome.debug("refreshInformation: url1 [" + url1 + "?" + params);

		httpRequest1 = new XMLHttpRequest();
		httpRequest1.open("POST", url1, true);		
		httpRequest1.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		httpRequest1.setRequestHeader("Content-length", params.length);
		httpRequest1.setRequestHeader("Connection", "close");		
		httpRequest1.onload = processLogin;
		httpRequest1.send(params);
	},
   
	showAlertNotification: function(newMsg) {
		var p_debug = this.p_debug;
		var p_showNotification = this.p_showNotification;
		var p_msg = this.prefs.getCharPref("msg");
		var p_site = this.prefs.getCharPref("site");

	  	if (p_showNotification) {
	  		WorldClientWMNUtilChrome.debug("showAlertNotification: newMsg [" + newMsg 
						+ "] \np_msg [" + p_msg + "]");

	  		if (newMsg != p_msg) {
	  			this.prefs.setCharPref("msg", newMsg);

	  			window.openDialog('chrome://worldclientwebmail/content/alert.xul','Alert',
      				'chrome,dialog=yes,titlebar=no,popup=yes');
			}
	  	}
    },

    onEnabled: function() {
    	this.prefs.setBoolPref("enabled",!this.prefs.getBoolPref("enabled"));
    	
    	var samplePanel = document.getElementById('worldclientwebmail-statusbar');
   		samplePanel.setAttribute("enabled", this.prefs.getBoolPref("enabled"));
    	
    	this.shutdown();
		this.startup();
    },
    
    getTotalNewsMgs: function(output, trashFolderId) {
    	WorldClientWMNUtilChrome.debug("getTotalNewsMgs: output [" + output + "]");

    	var folder_list;
    	try {
    		folder_list = JSON.parse(output.substring(11, output.length - 5));
    	} catch (eException) {
    		WorldClientWMNUtilChrome.debug("getTotalNewsMgs: eException1 [" + eException + "]");

			// to stay compatible with old versions
			try {
    			folder_list = JSON.parse(output.substring(12, output.length - 2));
			    if (trashFolderId == 8) {
			    	trashFolderId = 7;
			    }
    		} catch (eException) {
    			WorldClientWMNUtilChrome.debug("getTotalNewsMgs: eException2 [" + eException + "]");
	    		return 0;
    		}
    	}

    	WorldClientWMNUtilChrome.debug("getTotalNewsMgs: folder_list[0].u [" + folder_list[0].u + "]");

    	if (this.p_onlyInbox) {
    		return parseInt(folder_list[0].u);
    	}

    	var draftFolderID;
    	var sentFolderID;
    	if (trashFolderId == 3) {
    		draftFolderID = 1;
    		sentFolderID = 2;
    	} else {
		    if (trashFolderId == 7) {
			    draftFolderID = 5;
    			sentFolderID = 6;
		    } else {
		    	draftFolderID = 6;
    			sentFolderID = 7;
		    }
    	}

    	var total = 0;
	    for (var i=0; i < folder_list.length; i++) {			
	    	if (folder_list[i] != null && parseInt(folder_list[i].id) != trashFolderId
	    			&& parseInt(folder_list[i].id) != draftFolderID
	    			&& parseInt(folder_list[i].id) != sentFolderID) {
	    		total += parseInt(folder_list[i].u);
	    	}
	    }

	    return total; 
    },
    
    processReturnJavascript: function(output, trashFolderId) {
		var samplePanel = document.getElementById('worldclientwebmail-statusbar');
		var p_debug = this.p_debug;
		
		if (output.length > 0) {
			// Remove whitespace from the end of the string;
			// this gets rid of the end-of-line characters
			output.replace(/\W*$/, "");
			
			WorldClientWMNUtilChrome.debug("processReturnJavascript: output [" + output + "] trashFolderId [" + trashFolderId  + "]");
	
			var totalNewsMgs = WorldClientWMNChrome.getTotalNewsMgs(output, trashFolderId);
			WorldClientWMNUtilChrome.debug("processReturnJavascript: totalNewsMgs [" + totalNewsMgs + "]");
	
			if (totalNewsMgs > 0) {
				var msg = null;
				
				if (totalNewsMgs == 1) {
				 	msg  = totalNewsMgs + " " + WorldClientWMNUtilChrome.getString('emailNotRead'); 
				} else {
					msg  = totalNewsMgs + " " + WorldClientWMNUtilChrome.getString('emailsNotRead');
				}
	
				samplePanel.tooltipText = msg;
				WorldClientWMNChrome.showAlertNotification(msg);
			} else {
				samplePanel.tooltipText = WorldClientWMNUtilChrome.getString('noMessages');
			}
	
			samplePanel.setAttribute("newMail", totalNewsMgs > 0);
			samplePanel.setAttribute("label", " " + totalNewsMgs);
		}    	
    },
    
    isSessionOk: function(output) {
		var p_debug = this.p_debug;
		
		if (output.length > 0) {
			// Remove whitespace from the end of the string;
			// this gets rid of the end-of-line characters
			output.replace(/\W*$/, "");
			
			WorldClientWMNUtilChrome.debug("isSessionOk: output [" + output + "] indexOf [" + output.indexOf('{"error"') + "]");
			
			if (output.length < 13 || output.indexOf('{"error"') == 0) {
	    		return false;
	    	}

			return true;
		}
		
		return false;
    }
}

// Install load and unload handlers
window.addEventListener("load", function(e) { WorldClientWMNChrome.startup(); }, false);
window.addEventListener("unload", function(e) { WorldClientWMNChrome.shutdown(); }, false);
