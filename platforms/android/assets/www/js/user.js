var User = function() {
	var self = this;
	self.id = ko.observable();
	self.user = null;
	self.groups = ko.observableArray([]);
	self.admin = ko.observableArray([]);
	self.messages = ko.observableArray([]);
	self.compose = ko.observable(true);
	self.new_followers = ko.observable(0);
	
	self.login = function() {
		request('ajax/users/login',self.processLogin,$('#login_form').serialize(),self.invalidLogin);
	}
	
	self.invalidLogin = function(errors) {
		if(typeof errors !== 'undefined') {
			$.each(errors, function(index,value) {
				$('#login_'+index).after('<label class="error" generated="true" for="reg_email">'+value[0]+'</label>');
			});
		}
	}
	
	self.processLogin = function(data) {
		self.user = ko.observable(data.User);
		self.update();
		viewModel.messages().update();
		loadPage('messages/latest');
	};
	
	self.logout = function() {
		request('ajax/users/logout/'+viewModel.iosToken(),self.processLogout);
	};
	
	self.processLogout = function(data) {
		viewModel.messages(new Messages());
		viewModel.user().compose(false);
		viewModel.messages().latest([]);
		localStorage.removeItem('user');
		localStorage.removeItem('messages');
		localStorage.removeItem('latest_message');
		loadPage('user/login');
		navigator.notification.alert('You have been successfully logged out.',null,'GroupPost');
	}
	
	self.update = function() {
		//use locally stored info if available
		if((localStorage.getItem('user') !== null)&&(self.user === null)) {
			self.user = ko.observable(ko.utils.parseJson(localStorage.getItem('user')));
		}
		
		request('ajax/users/sysupdate/user:'+self.user().id,self.processUpdate,null,null,false);
	};
	
	self.processUpdate = function(data) {
		self.user(data.User);
		self.groups(data.GroupFollow);
		self.admin(data.GroupAdmin);
		viewModel.new_replies(data.User.replies);
		if(data.GroupAdmin.length > 0) {
			self.compose(true);
		}
		localStorage.setItem('user',ko.toJSON(data.User));
		viewModel.requests(self.user().requests);
	};
	
	self.register = function(formElement) {
		request('ajax/users/register',self.processRegister,$(formElement).serialize(),self.validateRegister);
	}
	
	self.validateRegister = function(errors) {
		$.each(errors, function(index,value) {
			switch(index) {
				case 'email':
					$('#reg_email').after('<label class="error" generated="true" for="reg_email">'+value[0]+'</label>');
					break;
			}
		});
	}
	
	self.processRegister = function(data) {
		loadPage('user/register_thanks');
	}
}