var WorldClientWMNMailChrome = {
	openMail: function() {
		var prefs = Components.classes["@mozilla.org/preferences-service;1"]
					.getService(Components.interfaces.nsIPrefService)
					.getBranch("extensions.worldclientwebmail.");
		prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		
		var browserForTab = WorldClientWMNUtilChrome.getBrowserForTab(true);
		
	  	if (browserForTab == null) {
	  		browserForTab = WorldClientWMNUtilChrome.getNewBrowserForTab();
	  	}      
	 		
	 	var p_site = prefs.getCharPref("site");
	 	var p_username = prefs.getCharPref("username");
	 	
	 	var webmailService = Components.classes["@mozilla.org/WorldClientWebmailService;1"]
				.getService().wrappedJSObject;
		var p_password = webmailService.getPassword(p_username);

		var p_language = prefs.getCharPref("language");
		var p_theme = prefs.getCharPref("theme");
	
		var contentBody = 'User=' + encodeURIComponent(p_username)
				+ '&Password=' + encodeURIComponent(p_password) 
	  			+ '&Lang=' + p_language
	  			+ '&Theme=' + p_theme;
	
		var content = 'Content-Type: application/x-www-form-urlencoded\n'
				+ 'Content-Length: ' + contentBody.length + '\n\n'
				+ contentBody;
				
		var postData = Components.classes['@mozilla.org/io/string-input-stream;1']
	           				.createInstance(Components.interfaces.nsIStringInputStream);
	       postData.setData(content, content.length);
	
		var p_uri = p_site + "/WorldClient.dll?View=Main";
	
		browserForTab.loadURIWithFlags(p_uri, 
				Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
				null, null, postData);
	}
}
