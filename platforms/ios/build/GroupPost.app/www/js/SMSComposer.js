/**
 * SMS Composer plugin for Cordova
 * window.plugins.SMSComposer
 * 
 * @constructor
 */
function SMSComposer()
{
	this.resultCallback = null;
}

SMSComposer.ComposeResultType =
{
Cancelled:0,
Sent:1,
Failed:2,
NotSent:3
}

SMSComposer.prototype.showSMSComposer = function(toRecipients, body)
{
	
	var args = {};
	
	if(toRecipients)
		args.toRecipients = toRecipients;
	
	if(body)
		args.body = body;
	
	window.cordova.exec("SMSComposer.showSMSComposer",args);
}

SMSComposer.prototype.showSMSComposerWithCB = function(cbFunction,toRecipients,body)
{
	this.resultCallback = cbFunction;
	this.showSMSComposer.apply(this,[toRecipients,body]);
}

SMSComposer.prototype._didFinishWithResult = function(res)
{
	this.resultCallback(res);
}

window.cordova.addConstructor(function() {
					   
					   if(!window.plugins)	{
					   window.plugins = {};
					   }
					   window.plugins.smsComposer = new SMSComposer();
					   });
