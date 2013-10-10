var Messages = function() {
	var self = this;
	self.new_messages = ko.observable(0);
	self.latest = ko.observableArray([]);
	self.last = ko.observable();
	self.ids = [];
	self.loading_more = false;

	//functions
	self.add = function(message) {
		if($.inArray(message.Message.id,self.ids)) {
			localStorage.setItem('latest_message',message.Message.created);
			self.latest.unshift(message);
			self.ids.unshift(message.Message.id);
			if(!self.loading_more) {
				if(self.latest().length > 10) {
					self.latest.pop();
					self.ids.pop();
				}
			}
			localStorage.setItem('messages',ko.toJSON(self.latest()));
		}
	};

	self.update = function() {	
		var starting = '';
		//Check for stored messages
		
		if(localStorage.getItem('messages') !== null) {
			//get last stored message
			if(self.latest().length == 0) {
				var recalled_latest = ko.utils.parseJson(localStorage.getItem('messages'));
				if(recalled_latest != null) {
					for(i = (recalled_latest.length - 1); i >= 0; i--) {
						self.add(recalled_latest[i]);
					}
					myScroll.refresh();
				}
			}
			starting = '/start:'+localStorage.getItem('latest_message');
		}
		
		request('ajax/messages/latest/user:'+viewModel.user().user().id+starting,self.processUpdate,null,null,false);
	};
	
	self.processUpdate = function(data) {
		self.new_messages(self.new_messages()+data.length);
		
		for(i = (data.length - 1); i >= 0; i--) {
			self.add(data[i]);
		}
		myScroll.refresh();
	}
	
	self.compose = function(formElement) {
		if($('#newmessage_subgroup>option:selected').text() == 'All Followers') {
			sendreply = false;
			navigator.notification.confirm('Are you sure you want to all followers?',function(response) {
				if(response === 1) {	
					self.sendMessage(formElement);
				}
			}, 'GroupPost');
		} else {
			self.sendMessage(formElement);
		}
	}
	
	self.sendMessage = function(formElement) {
		request('ajax/messages/send',self.processCompose,$(formElement).serialize(),false,true,true);
	}
	
	self.processCompose = function(data) {
		//navigator.notification.alert('Message sent successfully',null,'GroupPost');
		//self.update();
		viewModel.messages().update();
		loadPage('messages/latest');
	}
	
	self.reply = function(formElement) {
		request('ajax/replies/reply',self.processReply,$(formElement).serialize());
	}
	
	self.processReply = function(data) {
		navigator.notification.alert('Reply sent successfully',null,'GroupPost');
		viewModel.user().update();
		self.update();
		loadPage('messages/latest');
	}
	
	self.loadMore = function() {
		self.loading_more = true;
		var last_message = self.latest()[self.latest().length - 1];
		var last_message_obj = '#latest_message_'+last_message.Message.id;
		var scrollTo = 0 - $(last_message_obj).offset().top;
		request('ajax/messages/latest/user:'+viewModel.user().user().id+'/stop:'+last_message.Message.created,function(messages) {
			$.each(messages, function(index,item) {
				self.latest.push(item);
			});
			myScroll.refresh();
			myScroll.scrollTo(0,scrollTo);
			myScroll.scrollToElement(last_message_obj);
		});
	}
};