/***********************************************************
constants
***********************************************************/
// UUID uniquely identifying our component
const CLASS_ID = Components.ID("{60bd72b0-fa6a-11df-8948-00237dbb124c}");

// description
const CLASS_NAME = "WorldClient WebMail Service";

// textual unique identifier
const CONTRACT_ID = "@mozilla.org/WorldClientWebmailService;1";
const ADDON_ID = "webmail@daemon.com";

const Ci=Components.interfaces;
 
const formSubmitURL = "user";
const hostname = "chrome://worldclientwebmail/notifier";

/***********************************************************
class definition
***********************************************************/

//class constructor
function WorldClientWebmailService() {
  this.wrappedJSObject = this;
  
  this.loginManager = Components.classes["@mozilla.org/login-manager;1"]
		.getService(Ci.nsILoginManager);  
}

// class definition
WorldClientWebmailService.prototype = {
  classDescription: CLASS_NAME,  
  classID: CLASS_ID,  
  contractID: CONTRACT_ID,  
  listeners : new Array(),
  timer : null,
  inited : false,
  initCalled : false,
  countTotal : 0,
  QueryInterface: function(aIID) {
		if (!aIID.equals(Ci.nsIWebProgressListener)
    			&& !aIID.equals(Ci.nsISupportsWeakReference) 
    			&& !aIID.equals(Ci.nsISupports)) {  
      		throw Components.results.NS_ERROR_NO_INTERFACE;
		}
		return this;
	}
}

/***********************************************************
password manager
***********************************************************/
WorldClientWebmailService.prototype.getPassword=function(user) {
   	var logins = this.loginManager.findLogins({},hostname,formSubmitURL, null);

   	for each (var o in logins) {
		if (o.username==user) {
      		return o.password;
     	}
	}
  	return null;  
}

WorldClientWebmailService.prototype.setPassword=function(user,passwd) {
	if (!passwd) return;

	var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
       	Ci.nsILoginInfo, "init");
   	
   	var loginInfo = new nsLoginInfo(hostname, formSubmitURL, null, user, passwd, "", "");

   	var logins = this.loginManager.findLogins({},hostname,formSubmitURL, null);

   	for each (var o in logins) {
		if (o.username==user) {
       		this.loginManager.modifyLogin(o,loginInfo);
       		return;
  		}
   	}
   	
   	this.loginManager.addLogin(loginInfo);
}

WorldClientWebmailService.prototype.removePassword=function(user) {
	var logins = this.loginManager.findLogins({},hostname,formSubmitURL, null);

   	for each (var o in logins) {
   		if (o.username==user) {
       		this.loginManager.removeLogin(o);
       		break;
   		}
	}
}

WorldClientWebmailService.prototype.removeHostsPassword=function() {
	var logins = this.loginManager.findLogins({},hostname,formSubmitURL, null);

   	for each (var o in logins) {
		this.loginManager.removeLogin(o);
	}
}

/***********************************************************
class factory

This object is a member of the global-scope Components.classes.
It is keyed off of the contract ID.
***********************************************************/
var WorldClientWebmailServiceFactory = {
	createInstance: function (aOuter, aIID) {
		if (aOuter != null)
      		throw Components.results.NS_ERROR_NO_AGGREGATION;
    	return (new WorldClientWebmailService()).QueryInterface(aIID);
  	}
};

/***********************************************************
module definition (xpcom registration)
***********************************************************/
var WorldClientWebmailServiceModule = {
	registerSelf: function(aCompMgr, aFileSpec, aLocation, aType) {
		aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
    
    	aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME,
        		CONTRACT_ID, aFileSpec, aLocation, aType);
	},

	unregisterSelf: function(aCompMgr, aLocation, aType) {
    	aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
    	aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);
  	},

  	getClassObject: function(aCompMgr, aCID, aIID) {
    	if (!aIID.equals(Ci.nsIFactory))
      		throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    	if (aCID.equals(CLASS_ID))
      		return WorldClientWebmailServiceFactory;

    	throw Components.results.NS_ERROR_NO_INTERFACE;
	},
  	
  	canUnload: function(aCompMgr) { 
  		return true; 
  	}
};

/***********************************************************
module initialization

When the application registers the component, this function is called.
***********************************************************/
try {
  	Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
  	if (XPCOMUtils.generateNSGetFactory)
    	var NSGetFactory = XPCOMUtils.generateNSGetFactory([WorldClientWebmailService]);
	} catch(e) {}
if (typeof NSGetFactory == "undefined") {
  	function NSGetModule(aCompMgr, aFileSpec) { return WorldClientWebmailServiceModule; }
}
