var History = ko.observableArray([]);
var Current = '';

function AppViewModel() {
	//Variables
		var self = this;
		
		self.iosToken = ko.observable();
		self.registrationId = ko.observable();
		self.messages = ko.observable(new Messages());
		self.sentMessages = ko.observableArray();
		self.selectedMessage = ko.observable();
		self.user = ko.observable(new User());
		self.selectedMessageGroup = ko.observable();
		self.segments = ko.observableArray();
		self.selectedAdmin = ko.observable();
		self.selectedSubGroup = ko.observable();
		self.selectedGroup = ko.observable();
		self.selectedGroupMessages = ko.observableArray([]);
		self.searchResults = ko.observableArray([]);
		self.selectedSearchGroup = ko.observable();
		self.selectedReply = ko.observable();
		self.new_replies = ko.observable(0);
		self.unread = ko.computed(function(){
			return self.messages().new_messages() + self.new_replies();
		});
		self.requests = ko.observable(0);
		self.subgroupcount = ko.observable(0);


	//CRON JOBS / SYSTEM FUNCTIONS
		//3 MINUTE CRON JOB
		setInterval(function(){
			//console.log('3Minutes');
			self.messages().update();
		},(3*60*1000));
		
		var intCount = 0;
		
		//20 MINUTE CRON JOB
		setInterval(function(){
			//console.log('20Minutes');
			self.user().update();
		},(20*60*1000));
		
		//INITIAL DATA PULL
		setTimeout(function() {
			if(typeof myScroll ==! 'undefined') {
				scroll_refresh();
			} else {
				app.onDeviceReady();
			}
			self.initialize();
		}, 0);
		
		self.initialize = function() {
			if(localStorage.getItem('user') !== null) {
				self.user().update();
				self.messages().update();
				//self.update_user();
			} else {
				
			}
			$('#loading').fadeOut();
		}
		
		//UPDATE AFTER BEING IN THE BACKGROUND
		self.resume = function() {
			
		}


	//NAVIGATION
		self.back = function() {
			var href = History.pop();
			loadPage(href, true);
		}
		self.viewMessage = function(message) {
			if(typeof message.Message === 'undefined') {
				message.Message = {
					message:message.message,
					created:message.created
				};
			}
			self.selectedMessage(message);
			messagetext = self.selectedMessage().Message.message;
			messagetext = messagetext.replace(/(\r\n|\n|\r)/igm, "<br/>");
			messagetext = messagetext.replace(/([^\w\/])(www\.[a-z0-9\-]+\.[a-z0-9\-]+)/igm, "$1http://$2");
			messagetext = messagetext.replace(/([\w]+:\/\/[\w-?&;#~=\.\/\@]+[\w\/])/igm, "<a target=\"_blank\" href=\"$1\">$1</a>");//preg_replace("/([\w]+:\/\/[\w-?&;#~=\.\/\@]+[\w\/])/i","<a target=\"_blank\" href=\"$1\">$1</a>",messagetext);
			self.selectedMessage().Message.htmlmessage = ko.observable(messagetext);
			loadPage('messages/details');
		}
		self.loadGroupX = function(group) {
			self.selectedGroup(group);
			self.selectedSearchGroup(group.Group);
			loadPage('groups/page/home');
		}
		
		self.loadGroup = function(group) {
			request('ajax/groups/view/group:'+group.group_id,self.processGroup);
		}
		
		self.processGroup = function(group) {
			self.selectedGroup(group);
			self.selectedSearchGroup(group);
			loadPage('groups/page/home');
		}
		
		self.loadGroupMessages = function() {
			request('ajax/messages/latest/user:'+ self.user().user().id +'/group:'+self.selectedGroup().Group.id,function(data) {
				var groupMessages = [];
				$.each(data, function(index,item) {
					groupMessages.push(item);
				});
				self.selectedGroupMessages(groupMessages);
				loadPage('groups/page/messages');
			});
		}
		self.loadMessages = function() {
			self.messages().new_messages(0);
			loadPage('messages/latest');
		}
		
		self.loadChooseGroup = function() {
			if(self.user().admin().length > 0) {
				loadPage('messages/choose_group');
			} else {
				loadPage('groups/list/admin');	
			}
		}
		self.loadSelectedAdmin = function() { loadPage('groups/admin/home'); }
		self.loadAdminFollowers = function() { loadPage('groups/admin/followers'); }
		self.loadAdminAdmins = function() { loadPage('groups/admin/admins'); }
		self.loadAdminSent = function() { loadPage('groups/admin/sent'); }
		self.loadSelectedGroup = function() { loadPage('groups/page/home'); }
		self.loadGroupList = function() { loadPage('groups/list/follow'); }
		self.loadAdminList = function() { loadPage('groups/list/admin'); }
		self.loadUserAgreement = function() { loadPage('user/agreement'); }
		self.loadPrivacy = function() { loadPage('user/privacy'); }

		self.refresh = function() {
			self.messages().update();
			self.user().update();
		}

	//Login
		self.loadLogin = function() {
			loadPage('user/login',null,self.validateLogin);
		}
		
		self.validateLogin = function(data) {
			$('#login_form').validate({
				submitHandler: self.user().login
			});
		}


	//Register
		self.loadRegister = function() {
			loadPage('user/register',null,self.validateRegister);
		}
		
		self.validateRegister = function(data) {
			$('#register_form').validate({
				submitHandler: self.user().register,
				rules: {
					"data[User][email]": {
						email: true
					},
					"data[User][zipcode]": {
						minlength: 5,
						digits: true
					},
				}
			});
		}
	
	//Compose
		self.loadAdminCompose = function() {
			var group = {
				group_id:self.selectedAdmin().Group.id,
				Group:self.selectedAdmin().Group
			};
			self.loadCompose(group);
		}

		self.loadCompose = function(group) {
			self.selectedMessageGroup(group);
			request('ajax/group_segments/list/'+group.group_id,function(data){
				self.segments(data);
				loadPage('messages/compose',null,self.validateCompose);
			});
		}
		
		self.validateCompose = function() {
			$('#compose_form').validate({
				submitHandler: self.messages().compose
			});
		}
	
	
	//Load More Messages
		self.loadMoreMessages = function() {
			//console.log('me');
		}
	
	
	//Reply
		self.loadReply = function() {
			loadPage('messages/reply',null,self.validateReply);
		}
		
		self.validateReply = function() {
			$('#reply_form').validate({
				submitHandler: self.messages().reply
			});
		}

	//Compose
		self.loadReport = function() { 
			loadPage('groups/page/report', null, self.validateReport); 
		};
		
		self.validateReport = function() {
			$('#report_form').validate({
				submitHandler: self.postReport
			});
		}
		
		self.postReport = function(formElement) {
			request('ajax/groups/report/',self.processReport,$(formElement).serialize(),self.invalidReport);
		}
		
		
		self.invalidReport = function(errors) {
			if(typeof errors !== 'undefined') {
				$.each(errors, function(index,value) {
					$('#report_'+index).after('<label class="error" generated="true" for="reg_email">'+value[0]+'</label>');
				});
			}
		}
				
		self.processReport = function() {
			navigator.notification.alert('The group has been reported.',null,'GroupPost');
			loadPage('messages/latest');
		}


	//Group Admin Edit
		self.loadGroupEdit = function() {
			loadPage('groups/admin/edit', null, self.validateGroupEdit);
		}
		
		self.validateGroupEdit = function() {
			$('#group_edit_form').validate({
				submitHandler: self.postGroupEdit
			});
		}
		
		self.postGroupEdit = function(formElement) {
			request('ajax/groups/edit/group:'+self.selectedAdmin().Group.id+'/user:'+self.user().user().id,self.processGroupEdit,$(formElement).serialize(),self.invalidGroupEdit);
		}
		
		self.invalidGroupEdit = function(errors) {
			if(typeof errors !== 'undefined') {
				$.each(errors, function(index,value) {
					$('#edit_group_'+index).after('<label class="error" generated="true" for="reg_email">'+value[0]+'</label>');
				});
			}
		}
		
		self.processGroupEdit = function(group) {
			navigator.notification.alert('Your group has been successfully updated.',null,'GroupPost');
			request('ajax/groups/admin/group:'+group.Group.id+'/user:'+self.user().user().id,self.processAdmin);
		}


	//Group Follower Admin
		self.checkRequest = function(person) {
			var value = $('#follow-'+person.GroupFollow.id+' i');
			var isChecked = value.attr('class');
			
			if(isChecked === 'icon-check-empty') {
				value.attr('class','icon-check');
				$('#follow-'+person.GroupFollow.id).addClass('allowed');
			} else {
				value.attr('class','icon-check-empty');
				$('#follow-'+person.GroupFollow.id).removeClass('allowed');
			}
		}
		
		self.markallRequests = function(group) {
			$.each(group.Approval, function(index,person) {
				$('#follow-'+person.GroupFollow.id+' i').attr('class','icon-check');
				$('#follow-'+person.GroupFollow.id).addClass('allowed');
			});
		}
		
		self.approveRequests = function(person) {
			var formData = [];
			$('.allowed input').each(function(index,element) {
				formData.push({
					name:'data[GroupFollow]['+index+'][id]',
					value: $(element).val()
				});
			});
			if(formData.length) {
				formData.push(
					{
						name: 'data[Group][id]',
						value: self.selectedAdmin().Group.id
					}
				);
				request('ajax/group_follows/approve/user:'+self.user().user().id,function(data) {
					request('ajax/groups/admin/group:'+self.selectedAdmin().Group.id+'/user:'+self.user().user().id,self.processAdmin);
				},formData);
			}
		}
		
		self.removeRequests = function(person) {
			var formData = [];
			$('.allowed input').each(function(index,element) {
				formData.push({
					name:'data[GroupFollow]['+index+'][id]',
					value: $(element).val()
				});
			});
			if(formData.length) {
				navigator.notification.confirm('Are you sure you want to remove these users?',function(response) {
					if(response === 1) {	
						formData.push(
							{
								name: 'data[Group][id]',
								value: self.selectedAdmin().Group.id
							}
						);
						request('ajax/group_follows/remove/user:'+self.user().user().id,function(data) {
							request('ajax/groups/admin/group:'+self.selectedAdmin().Group.id+'/user:'+self.user().user().id,self.processAdmin);
						},formData);
					}
				}, 'GroupPost');
			}
		}
		
		self.loadAdmin = function(group) {
			request('ajax/groups/admin/group:'+group.group_id+'/user:'+self.user().user().id,self.processAdmin);
		}
		
		self.processAdmin = function(group) {
			self.selectedAdmin(group);
			self.user().update();
			loadPage('groups/admin/home');
		}
		
		self.removeFollower = function(person) {
			navigator.notification.confirm('Are you sure you want to remove this user from this group?',function(response) {
				if(response === 1) {	
					request('ajax/groups/unfollow/user:'+person.id+'/group:'+self.selectedAdmin().Group.id,function(data) {
						navigator.notification.alert(data,null,'GroupPost');
						self.loadAdmin({group_id:ko.observable(self.selectedAdmin().Group.id)});
					});
				}
			}, 'GroupPost');
		}


	//Group Admin Admin
		self.checkAdmin = function(person) {
			if(person.id === self.user().user().id) {
				navigator.notification.alert('You cannot remove yourself from being an admin to this group.',null,'GroupPost');
			} else {
				var value = $('#admin-'+person.id+' i');
				var isChecked = value.attr('class');
				
				if(isChecked === 'icon-check-empty') {
				//ADD TO ADMIN
					navigator.notification.confirm('Are you sure you want to make this user an Admin?',function(response) {
						if(response === 1) {	
							request('ajax/group_admins/add/user:'+person.id+'/group:'+self.selectedAdmin().Group.id,function(data) {
								value.attr('class','icon-check');
								$('#admin-'+person.id).addClass('admin');
							});
						}
					}, 'GroupPost');
				} else {
				//REMOVE FROM ADMIN
					navigator.notification.confirm('Are you sure you want to remove '+person.first_name+' '+person.last_name+' from being an Admin?',function(response) {
						if(response === 1) {	
							request('ajax/group_admins/remove/user:'+person.id+'/group:'+self.selectedAdmin().Group.id,function(data) {
								value.attr('class','icon-check-empty');
								$('#admin-'+person.id).removeClass('admin');
							});
						}
					}, 'GroupPost');
				}	
			}
		}
	
	
	//SubGroups Admin
		self.loadSubGroups = function() { loadPage('groups/admin/subgroups'); }
		
		self.loadSubGroup = function(subgroup) {
			self.subgroupcount(subgroup.GroupFollow.length);
			request('ajax/group_segments/edit/subgroup:'+subgroup.id,self.processSubGroup);
		}
		
		self.processSubGroup = function(subgroup) {
			self.selectedSubGroup(subgroup);
			loadPage('groups/admin/subgroup');
		}
		
		self.checkSubGroupMember = function(person) {
			var value = $('#subgroup-'+person.id+' i');
			var isChecked = value.attr('class');

			if(isChecked === 'icon-check-empty') {
			//ADD TO SUBGROUP
				self.subgroupcount(self.subgroupcount()+1);
				request('ajax/group_segments/add/user:'+person.id+'/group:'+self.selectedAdmin().Group.id+'/subgroup:'+self.selectedSubGroup().GroupSegment.id,function(data) {
					value.attr('class','icon-check');
					$('#subgroup-'+person.id).addClass('admin');
				});
			} else {
			//REMOVE FROM SUBGROUP
				self.subgroupcount(self.subgroupcount()-1);
				request('ajax/group_segments/remove/user:'+person.id+'/group:'+self.selectedAdmin().Group.id+'/subgroup:'+self.selectedSubGroup().GroupSegment.id,function(data) {
					value.attr('class','icon-check-empty');
					$('#subgroup-'+person.id).removeClass('admin');
				});
			}	
		}
		
		
	//Add SubGroup
		self.addSubGroup = function() {
			loadPage('groups/admin/add_subgroup', null, self.validateAddSubGroup);
		}
		
		self.validateAddSubGroup = function() {
			$('#add_sub_group').validate({
				submitHandler: self.postAddSubGroup
			});
		}
		
		self.postAddSubGroup = function(formElement) {
			request('ajax/group_segments/new/group:'+self.selectedAdmin().Group.id,self.processAddSubGroup,$(formElement).serialize());
		}
		
		self.processAddSubGroup = function(data) {
			request('ajax/groups/admin/group:'+self.selectedAdmin().Group.id+'/user:'+self.user().user().id,function(group) {
				self.selectedAdmin(group);
				self.loadSubGroups();
			});
		}
	
	
	//Delete Subgroup
		self.deleteSubGroup = function() {
			navigator.notification.confirm('Are you sure you want to delete this sub-group?',function(response) {
				if(response === 1) {	
					request('ajax/group_segments/delete/subgroup:'+self.selectedSubGroup().GroupSegment.id,function(data) {
						navigator.notification.alert(data,null,'GroupPost');
						$.each(self.selectedAdmin().GroupSegment, function(index,item) {
							if(item.id === self.selectedSubGroup().GroupSegment.id) {
								self.selectedAdmin().GroupSegment.splice(index, 1);
								return false;
							}
						});
						request('ajax/groups/admin/group:'+self.selectedAdmin().Group.id+'/user:'+self.user().user().id,function(group) {
							self.selectedAdmin(group);
							self.loadSubGroups();
						});
					});
				}
			}, 'GroupPost');
		}
	
	//Search
		self.loadSearch  = function() {
			loadPage('groups/search',null,self.validateSearch);
		}
		
		self.validateSearch = function() {
			$('#group_search_form').validate({
				submitHandler: self.search
			});
		}
		
		self.search = function(formElement) {
			request('ajax/groups/search',self.processSearch,$(formElement).serialize());	
		}
		
		self.processSearch = function(data) {
			self.searchResults(data);
			scroll_refresh();
		}
		
		self.loadSearchGroup = function(group) {
			var group_id = group.Group.id;
			var following = false;
			self.selectedSearchGroup(group);
			$.each(self.user().groups(),function(index,item) {
				if(item.group_id === group_id) {
					following = true;
					self.selectedGroup(item);
				}
			});
			
			if(following) {
				loadPage('groups/page/home');
			} else {
				loadPage('groups/follow');	
			}
		}
	
	
	//Group Follow
		self.followGroup = function(group) {
			request('ajax/groups/follow/group:'+ group.Group.id +'/user:'+ self.user().user().id,self.processFollow);
		}
		
		self.processFollow = function(data) {
			navigator.notification.alert(data,null,'GroupPost');
			self.loadMessages();
		}
		
		self.unfollowGroup = function(group) {
			navigator.notification.confirm('Are you sure you want to unfollow this group?',function(response) {
				if(response === 1) {	
					request('ajax/groups/unfollow/group:'+ group.Group.id +'/user:'+ self.user().user().id,self.processFollow);
				}
			}, 'GroupPost');
			
		}
		
		self.processUnfollow - function(data) {
			navigator.notification.alert(data,null,'GroupPost');
			self.loadMessages();
		}
	
	
	//Invite
		self.inviteGroup = function(group) {
			request('ajax/groups/link/group:'+group.Group.id+'/admin:1',function(data) {
				//navigator.notification.alert('Invites are currently disabled. The share link: '+data,null,'GroupPost');
				window.location.href = "mailto:?body="+data;
				try {
					//window.plugins.smsComposer.showSMSComposer('',data);
				} catch(e) {
					//console.log(e);
				}
			});
		}
	
	
	//Admin Invite
		self.inviteAdmin = function(group) {
			request('ajax/groups/link/group:'+self.selectedAdmin().Group.id+'/admin:1',function(data) {
				//navigator.notification.alert('Invites are currently disabled. The share link: '+data,null,'GroupPost');
				window.location.href = "mailto:?body="+data;
				try {
					//window.plugins.smsComposer.showSMSComposer('',data);
				} catch(e) {
					//console.log(e);
				}
			});
		}
	
	
	//Add Group
		self.loadAddGroup = function() {
			loadPage('groups/add', null, self.validateGroupAdd);
		}
		
		self.validateGroupAdd = function() {
			$('#group_add_form').validate({
				submitHandler: self.postGroupAdd
			});
		}
		
		self.postGroupAdd = function(formElement) {
			request('ajax/groups/add/user:'+self.user().user().id,self.processGroupAdd,$(formElement).serialize(),self.invalidGroupAdd);
		}
		
		self.invalidGroupAdd = function(errors) {
			if(typeof errors !== 'undefined') {
				$.each(errors, function(index,value) {
					$('#edit_group_'+index).after('<label class="error" generated="true" for="reg_email">'+value[0]+'</label>');
				});
			}
		}
		
		self.processGroupAdd = function(group) {
			navigator.notification.alert('Your group has been successfully added.',null,'GroupPost');
			self.user().update();
			self.loadMessages();
		}
	
	//Edit User
		self.loadProfile = function() {
			loadPage('user/edit', null, self.validateProfile);
		}
	
		self.validateProfile = function() {
			$('#user_profile').validate({
				submitHandler: self.postProfile
			});
		}
		
		self.postProfile = function(formElement) {
			request('ajax/users/edit',self.processProfile,$(formElement).serialize(),self.invalidProfile);
		}
		
		self.invalidProfile = function(errors) {
			if(typeof errors !== 'undefined') {
				$.each(errors, function(index,value) {
					$('#user_profile_'+index).after('<label class="error" generated="true" for="reg_email">'+value[0]+'</label>');
				});
			}

		}
		
		self.processProfile = function(user) {
			navigator.notification.alert('You have successfully updated your profile.',null,'GroupPost');
			self.user().update();
			self.loadMessages();
		}
	
	//Change Password
		self.loadPassword = function() {
			loadPage('user/password', null, self.validatePassword);
		}
	
		self.validatePassword = function() {
			$('#user_password').validate({
				submitHandler: self.postPassword
			});
		}
		
		self.postPassword = function(formElement) {
			request('ajax/users/password',self.processPassword,$(formElement).serialize(),self.invalidPassword);
		}
		
		self.invalidPassword = function(errors) {
			if(typeof errors !== 'undefined') {
				$.each(errors, function(index,value) {
					$('#user_password_'+index).after('<label class="error" generated="true" for="reg_email">'+value[0]+'</label>');
				});
			}

		}
		
		self.processPassword = function(user) {
			navigator.notification.alert('You have successfully updated your password.',null,'GroupPost');
			self.user().update();
			self.loadMessages();
		}


	//Sent Messages
		self.loadSent = function() {
			//CHECKADMIN
			if(self.user().admin().length > 0) {
				request('ajax/users/sent/user:'+self.user().user().id,self.processSent);
			} else {
				loadPage('groups/list/admin');	
			}
		}
		
		self.processSent = function(messages) {
			self.sentMessages(messages);
			loadPage('messages/sent'); 
		}
		
	
	//Replies
		self.viewReply = function(reply) {
			reply.Message.unread = 0;
			self.selectedReply(reply);
			request('ajax/messages/read/message:'+reply.Message.id,self.processReadReply);
		}
		
		self.processReadReply = function(data) {
			self.user().update();
			loadPage('replies/view');
		}
}

var viewModel = new AppViewModel();


//Custom bindingHandlers
ko.bindingHandlers.dateString = {
	update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
		try {
			var value = valueAccessor();
			var valueUnwrapped = ko.utils.unwrapObservable(value);
			var dateParts = valueUnwrapped.match(/^(\d{4})-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/);
			var ampm = 'am';
			if(dateParts[4] > 12) {
				dateParts[4] = dateParts[4] - 12;
				ampm = 'pm';
			}
			$(element).text(parseInt(dateParts[2])+'/'+dateParts[3]+' - '+dateParts[4]+':'+dateParts[5]+ampm);
		} catch(e) {
			console.log(e)
		}
	}
}


ko.bindingHandlers.fastClick = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
		new FastButton(element, function() {
			valueAccessor()(viewModel, event);
		});
	}
};

ko.bindingHandlers.tap = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
		var allBindings = allBindingsAccessor();
		if(isMobile) {
			$(element).bind('touchend', function() {
				if(myScroll.moved) {
					return false;
				}
				valueAccessor()(viewModel, event, element);
				return false;
			});
		} else {
			$(element).bind('click', function() {
				valueAccessor()(viewModel, event, element);
			});
		}
	}
}

ko.applyBindings(viewModel);

//JQUERY BINDINGS

//AJAX Frame Loader
var loadPage = function(href, isBack, callback) {
	if(viewModel.user().user === null) {
		if((href != 'user/register')&&(href != 'user/register_thanks')&&(href != 'user/privacy')&&(href != 'user/agreement')) {
			href = 'user/login';
		}
	}
	
	if(href === 'user/login') {
		callback = viewModel.validateLogin;
	}

	if(typeof isBack === 'undefined') {
		isBack = false;
	}
	var noBack = ['messages/latest','groups/list','groups/search','user/settings'];
	var noTemplate = ['user/login','user/register','user/register_thanks','groups/add','user/privacy','user/agreement'];

	if(noTemplate.indexOf(href) >= 0) {
		$('#content_wrap').css({top:0,bottom:0});
		$('#header, #footer').hide();
	} else {
		$('#content_wrap').css({top:'40px',bottom:'70px'});
		$('#header, #footer').show();
	}
	
	if(noBack.indexOf(href) >= 0) {
		History.removeAll();
		viewModel.selectedMessage = ko.observable();
		viewModel.selectedMessageGroup = ko.observable();
		viewModel.selectedAdmin = ko.observable();
		viewModel.selectedSubGroup = ko.observable();
		viewModel.selectedGroup = ko.observable();
		viewModel.selectedGroupMessages = ko.observableArray([]);
		viewModel.selectedSearchGroup = ko.observable();
		viewModel.selectedReply = ko.observable();
	} else {
		if(!isBack) {
			History.push(Current);
		}
	}
	
	var timestamp = new Date().getTime();
	
	$.get('views/'+href+'.html?'+timestamp,function(data) {
		$('#content').html(data);
		ko.applyBindings(viewModel, $('#content').get(0));
		scroll_refresh();
		myScroll.scrollTo(0,0);
		window.scrollTo(0,0);
		Current = href;
		if(typeof callback !== 'undefined') {
			callback();
		}
		if(href == 'messages/latest') {
			//possible pulldown/refresh
		}
	})
}

var request = function(url,callback,data,validation,loader,quiet) {
	if(typeof loader === 'undefined') {
		loader = true;
	}
	
	if(typeof quiet === 'undefined') {
		quiet = false;
	}
	
	if(loader) {
		$('#loading').show();
	} else {
		$('#refresh i').addClass('icon-spin');
	}
	
	var options = {
		url: DOMAIN+url,
		crossDomain: true,
		success: function (data) {
			if(data.status == 'SUCCESS') {
				callback(data.data);
			} else {
				switch(data.status) {
					case 'VALIDATION':
						validation(data.data);
						break;
					default:
						console.log(data);
						navigator.notification.alert('There was an error:' + data.message,null,'GroupPost');
						break;
				}
			}
		},
		complete: function(jqXHR, textStatus, errorThrown) {
			if((textStatus != 'success')&&(!quiet)) {
				//alert(errorThrown);
				//navigator.notification.alert('There was a problem communicating with the server.',null,'GroupPost');
			}
			$('#loading').fadeOut();
			$('#refresh i').removeClass('icon-spin');
		},
		dataType: 'json',
		async: true
	};
	
	if(typeof data === 'undefined') {
		options.type = 'GET';
	} else {
		options.type = 'POST';
		options.data = data;
	}
	try {
	$.ajax(options);
	} catch(e) {
		alert(e);
	}
}

var scroll_refresh = function() {
	setTimeout(function () {myScroll.refresh();}, 0);
}

//STARTUP	
$(function() {
	setTimeout(function() {
		loadPage('messages/latest');
	}, 0);
	
	setTimeout(function() {
		scroll_refresh();
	},1000);
	
	//LINKS
	$('#footer a:not(.noajax)').fastClick(function() {
		loadPage($(this).attr('href'));
		return false;
	});

	$('input, textarea').live('blur', function(e) {
		//window.scrollTo(0,0);
	});
});
	
	