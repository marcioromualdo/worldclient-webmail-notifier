function onLoad() {
	if (!checkMasterPasswords()) {
    	window.close();
    	return;
  	}

	var prefs = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.worldclientwebmail.");
	prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);

	// initial_hour
	var initial_hour = document.getElementById("initial_hour");
	initial_hour.value = prefs.getCharPref("initial_hour");

	// load final_hour 
	var final_hour = document.getElementById("final_hour");
	final_hour.value = prefs.getCharPref("final_hour");
	
	// load password
	var webmailService = Components.classes["@mozilla.org/WorldClientWebmailService;1"]
			.getService().wrappedJSObject;
	var username = document.getElementById("username");
	var password = document.getElementById("password");
	password.value = webmailService.getPassword(username.value);
}

function checkMasterPasswords() {
	var tokendb = Components.classes["@mozilla.org/security/pk11tokendb;1"]
    		.createInstance(Components.interfaces.nsIPK11TokenDB);
	var token = tokendb.getInternalKeyToken();

	// There is no master password
	if (token.checkPassword(""))return true;

	// So there's a master password. But since checkPassword didn't succeed, we're logged out (per nsIPK11Token.idl).
	try {
    	// Relogin and ask for the master password.
    	token.login(true);  // 'true' means always prompt for token password. User will be prompted until
        				    // clicking 'Cancel' or entering the correct password.
	} catch (e) {
    	// An exception will be thrown if the user cancels the login prompt dialog.
    	// User is also logged out of Software Security Device.
  	}
	return token.isLoggedIn();
}

function onAccept() {
	var prefs = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.worldclientwebmail.");
	prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);

	var site = document.getElementById("site").value;
	if (site == "") {
		alert(WorldClientWMNUtilChrome.getString('informWebServer'));
		return false;
	} else if (site.substring(0,7) != "http://" && site.substring(0,8) != "https://") {
		alert(WorldClientWMNUtilChrome.getString('invalidWebServer'));
		return false;
	}

	if (site.substring(site.length-1) == "/") {
		var newValue = site.substring(0, site.length-1);
		document.getElementById("site").value = newValue;
		prefs.setCharPref("site", document.getElementById("site").value);
	}

	var username = document.getElementById("username").value;
	if (username == "") {
		alert(WorldClientWMNUtilChrome.getString('informUsername'));
		return false;
	}

	var password = document.getElementById("password").value;
	if (password == "") {
		alert(WorldClientWMNUtilChrome.getString('informPassword'));
		return false;
	}

	var webmailService = Components.classes["@mozilla.org/WorldClientWebmailService;1"]
			.getService().wrappedJSObject;

	if (webmailService.getPassword(username) != password) {
		prefs.setBoolPref("reloadWMN", !prefs.getBoolPref("reloadWMN"));		
	}

	webmailService.removeHostsPassword(); // remove old's username/password
	webmailService.setPassword(username, password);

	return true;
}
