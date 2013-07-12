/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var myScroll;
var pushNotification;
var iosToken = null;
var isMobile = true;
var DOMAIN = 'http://www.grouppost.com/';

var devtest = /localhost/.test(window.location.hostname);		
if(devtest) {
	DOMAIN = 'http://localhost/mcl/';
}

//var DOMAIN = 'http://office.threeleaf.tv:8080/mcl/';
//var DOMAIN = 'http://localhost/mcl/';
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        
        //This line removes the browser feel
        document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
        document.addEventListener('click', function(e) {
			if (e.srcElement.target === "_blank" && e.srcElement.href.indexOf("#phonegap=external") === -1) {
				e.srcElement.href = e.srcElement.href + "#phonegap=external";
			}
		}, true);
		document.addEventListener('resume', this.resume, false);
        if (!navigator.userAgent.match(/(iPad|iPhone|Android)/)) {
        	alert('catch');
        	isMobile = false;
			navigator.notification = {
				alert:function (message) {
					alert(message);
				},
				confirm:function (message, callback) {
					var response = confirm(message);
					var converted = 2;
					if(response) {
						converted = 1;
					} else {
						converted = 2;
					}
					callback(converted);
				}
			}; 
			this.onDeviceReady();
        } else {
	        alert('miss');
        }
    },
    onDeviceReady: function() {
    	setTimeout(function() {
			if(typeof window.plugins !== 'undefined') {
				alert('setup push');
				pushNotification = window.plugins.pushNotification;
				if (device.platform == 'android' || device.platform == 'Android') {
					alert('android');
					pushNotification.register(androidSuccess, pushError,{"senderID":"254118503049","ecb":"onNotificationGCM"});
				} else {
					pushNotification.register(iosSuccess, pushError, {"badge":"true","sound":"true","alert":"true","ecb":"onNotificationAPN"});
				}
			} else {
				alert('noplugin');
			}
    	}, 0)
	    myScroll = new iScroll('content_wrap',{
		    bounce: false,
		    onScrollMove: function() {
			    $('input').toggleClass('force_redraw');
		    },
		    onBeforeScrollStart: function (e) {
				var target = e.target;
				
				while (target.nodeType != 1) target = target.parentNode;
				
				if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA') {
					e.preventDefault();
				}
			}
	    });
    },
    loaded: function() {
	    
    },
    resume: function() {
    	viewModel.messages().update();
	    loadPage('messages/latest');
    }
};

function androidSuccess(result) {
	navigator.notification.alert('Android Success: '+result,null,'GroupPost');
}

function iosSuccess(result) {
	viewModel.iosToken(result);
}

function pushError(error) {
	navigator.notification.alert('There was a problem setting up puch notifications: '+error,null,'GroupPost');
}

function onNotificationAPN(event) {
    if (event.alert) {
		//navigator.notification.alert(event.alert,null,'GroupPost');
		
		// Already called by resume
		//viewModel.messages().update();
    }

    if (event.sound) {

    }

    if (event.badge) {
        pushNotification.setApplicationIconBadgeNumber(function() {}, event.badge);
    }
}

function onNotificationGCM(e) {
   /*
 switch(e.event) {
	    case 'registered':
	    	if ( e.regID.length > 0 ) {
				viewModel.registrationId(e.regID);
			}
			break;
		case 'message':
			if(e.foreground) {
				
			} else {
				
			}
			break;
    }
*/
}

