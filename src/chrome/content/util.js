var WorldClientWMNUtilChrome = {
	openConfig: function() {
		window.openDialog('chrome://worldclientwebmail/content/options.xul',
			'Configuration','chrome,centerscreen,modal');
	},

	getBrowserForTab: function(selectTab) {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
	             .getService(Components.interfaces.nsIWindowMediator);
	    var enm = wm.getEnumerator("navigator:browser");
		var tabbrowser = null;
		var tab = null;
		var browserForTab = null;
	
		while (enm.hasMoreElements()) {
			tabbrowser = enm.getNext().getBrowser();
			for (var i = 0;i< tabbrowser.mTabContainer.childNodes.length;i++) {
	        	tab = tabbrowser.mTabContainer.childNodes[i];
	        	
	        	if ((tab.hasAttribute("label") 
	        			&& tab.getAttribute("label").length >= 11
	        			&& tab.getAttribute("label").substring(0,11) == "WorldClient")) {
	          		browserForTab = tabbrowser.getBrowserForTab(tab);
	          		break;
	        	}
			}
		}
	
		if (selectTab && browserForTab != null) {
			tabbrowser.selectedTab = tab;
			tabbrowser.focus();
		}
	
		return browserForTab;
	},

	getNewBrowserForTab: function() {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			     .getService(Components.interfaces.nsIWindowMediator);
		var win = wm.getMostRecentWindow("navigator:browser");
	 	if (win==null) {
	   		win=Components.classes["@mozilla.org/appshell/appShellService;1"]
	    			.getService(Components.interfaces.nsIAppShellService).hiddenDOMWindow;
		}
	 	var tabbrowser = win.getBrowser();
	 	var tab = tabbrowser.selectedTab;
	 	if (tabbrowser.currentURI.spec != "about:blank") {
			tab = tabbrowser.addTab("about:blank");
	 	}
	 	var browserForTab = tabbrowser.getBrowserForTab(tab);    
		if (this.multiSession) {
			browserForTab.addProgressListener(this);
		}
	
		tabbrowser.selectedTab = tab;
		win.focus();
		return browserForTab;
	},

	intervalOk: function(initial_hour, final_hour) {
	  	var prefs = Components.classes["@mozilla.org/preferences-service;1"]
				.getService(Components.interfaces.nsIPrefService)
				.getBranch("extensions.worldclientwebmail.");
	  	
		prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		
		var p_debug = prefs.getBoolPref("debug");
	
		var v_initial_hour = initial_hour.split(":");
		var v_final_hour = final_hour.split(":");
	
		var dateNow = new Date();
		
		var dateInitial = new Date();
		dateInitial.setHours(v_initial_hour[0]);
		dateInitial.setMinutes(v_initial_hour[1]);
		dateInitial.setSeconds(0);
	
		var dateFinal = new Date();
		dateFinal.setHours(v_final_hour[0]);
		dateFinal.setMinutes(v_final_hour[1]);
		dateFinal.setSeconds(0);

		WorldClientWMNUtilChrome.debug("isValidDate: \ndateNow >= dateInitial [" + (dateNow >= dateInitial) 
					+ "] \ndateNow <= dateFinal [" + (dateNow <= dateFinal) + "]");

		if (dateFinal < dateInitial) {
			if (dateNow > dateInitial || dateNow < dateFinal) {
				return true;
			}
		} else {
			if (dateNow > dateInitial && dateNow < dateFinal) {
				return true;
			}
		}
		
		//return (dateNow >= dateInitial) && (dateNow <= dateFinal);
		return false;
	},
	
	getString: function(tag) {
		var bundle = document.getElementById("worldclientwebmail_bundle");
		try {
			return bundle.getString(tag);
		 } catch (e) {
		 	return tag;
		 }
	},
	
	setCookie: function (name, value) {
    	var url = "http://worldclientwebmailwmn.com/";  
		var cookieString = name + "=" + value + ";domain=worldclientwebmailwmn.com";  

		var cookieUri = Components.classes["@mozilla.org/network/io-service;1"]  
			.getService(Components.interfaces.nsIIOService)  
			.newURI(url, null, null);  

		Components.classes["@mozilla.org/cookieService;1"]  
			.getService(Components.interfaces.nsICookieService)  
			.setCookieString(cookieUri, null, cookieString, null); 
	},
	
	getCookie: function(name) {
	    var cookieMgr = Components.classes["@mozilla.org/cookiemanager;1"]  
				.getService(Components.interfaces.nsICookieManager);  

		for (var e = cookieMgr.enumerator; e.hasMoreElements();) {  
			var cookie = e.getNext().QueryInterface(Components.interfaces.nsICookie); 
			if (cookie.host == ".worldclientwebmailwmn.com" && cookie.name == name) {
				return cookie.value;
			}
		}
		return null;
	},

	cleanStatusBar: function() {
		var samplePanel = document.getElementById('worldclientwebmail-statusbar');
		samplePanel.tooltipText = WorldClientWMNUtilChrome.getString('addonName');
		samplePanel.setAttribute("newMail", false);
		samplePanel.setAttribute("label", " ");
		
		var prefs = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService)
            .getBranch("extensions.worldclientwebmail.");
        prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
        prefs.setCharPref("msg", "");
	},
	
	debug: function(msg) {
	  	var prefs = Components.classes["@mozilla.org/preferences-service;1"]
	  			.getService(Components.interfaces.nsIPrefService)
	  			.getBranch("extensions.worldclientwebmail.");
	
		prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		var p_debug = prefs.getBoolPref("debug");
		
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].
				getService(Components.interfaces.nsIConsoleService);

		if (p_debug) {
			aConsoleService.logStringMessage(msg);
		}
	}
}