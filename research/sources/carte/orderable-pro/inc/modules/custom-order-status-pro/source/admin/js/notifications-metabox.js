(function($){
	
	if ( 0 === $( '#orderable-cos-notifications' ).length ) {
		return;
	}

	var OrderableNotifications = new Vue( {
		el: '#orderable-cos-notifications',
		data: {
			notifications: [],
			locations: $("#orderable-cos-notifications").data("locations"),
			wa_templates: [],
			wa_templates_loading: false,
			i18n: {
				are_your_sure: orderable_pro_custom_order_status.i18n.are_your_sure,
				email_title: orderable_pro_custom_order_status.i18n.email_title,
				email_subject: orderable_pro_custom_order_status.i18n.email_subject,
				enter_recipient_email: orderable_pro_custom_order_status.i18n.enter_recipient_email,
				enter_valid_email: orderable_pro_custom_order_status.i18n.enter_valid_email,
			}
		},
		mounted: function () {
			var notifications = $( "#orderable-cos-notifications" ).data( 'notifications' );
			
			if ( $( "#orderable-cos-wa-templates-json" ).length ) {
				this.wa_templates = $( "#orderable-cos-wa-templates-json" ).data( 'templates' );
			}

			if ( 'object' === typeof notifications ) {
				notifications.forEach( notification => {
					notification.is_open = false;

					if ( 'undefined' === typeof notification.enabled ) {
						notification.enabled = true;
					}

					if ( 'undefined' === typeof notification.location ) {
						notification.location = '';
					}
				} );

				this.notifications = notifications;
			}


			$( '#publish' ).on( 'click', this.validate_notifications );
			wp.hooks.addFilter( 'orderable_cos_error_message', 'orderable_cos', this.validate_notifications );
		},
		methods: {
			/**
			 * Add a new notification.
			 */
			add_notification: function () {
				this.notifications.push( {
					id: this.generate_random_number(),
					enabled: "1",
					type: 'email',
					recipient: 'customer',
					recipient_custom_email: '',
					recipient_custom_number: '',
					title: this.i18n.email_title,
					subject: this.i18n.email_subject,
					location: '',
					message: '',
					from_name: '',
					include_order_table: true,
					include_customer_info: true,
					is_open: false,
					wa_template_id: false,
					wa_variables: [],
				} );
			},

			/**
			 * Delete notification.
			 * 
			 * @param {object} notification 
			 */
			remove_notification: function ( notification ) {
				if ( confirm( this.i18n.are_your_sure ) ) {
					this.notifications.splice( this.notifications.indexOf( notification ), 1 );
				}
			},

			handle_wa_template_change: function ( notification ) {
				var template = this.wa_templates.find( template => template.id === notification.wa_template_id );

				if ( !template ) {
					return;
				}

				var body = template.components.find( component => 'BODY' === component.type );

				if ( !body ) {
					return;
				}

				notification.message = body.text;
				
				Vue.set( notification, 'wa_variables', [] );

				var variables = body.text.match( /{{\d*}}/g );

				if ( variables && variables.length ) {
					variables.forEach( variable => {
						Vue.set( notification.wa_variables, notification.wa_variables.length, '' );
					} );
				}
			},

			on_type_change: function ( notification ) {
				if ( 'whatsapp' === notification.type ) {
					notification.message = '';
				}
			},

			refresh_templates: function ( ) {
				var self = this;
				self.wa_templates_loading = true;
				$.post( ajaxurl, {
					action: 'orderable_wa_refresh_templates'
				} )
				.success( function ( result ) {
					self.wa_templates = result.data.data;
				} )
				.always( function () {
					self.wa_templates_loading = false;
				} );
			},

			/**
			 * Validate notifications.
			 */
			validate_notifications: function ( ) {
				var errors = [];

				this.notifications.forEach( notification => {
					if ( 'email' === notification.type && 'custom' === notification.recipient ) {
						if ( !notification.recipient_custom_email ) {
							notification.is_open = true;
							errors.push( this.i18n.enter_recipient_email );
							return errors;
						}

						// validate email
						var email = notification.recipient_custom_email;
						var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
						if ( !re.test( email ) ) {
							errors.push( this.i18n.enter_valid_email );
							notification.is_open = true;
							return errors;
						}
					}

					if ( !notification.subject || !notification.title ) {
						notification.is_open = true;
						return errors;
					}
				} );

				return errors;
			},		

			/**
			 * Notifications Title.
			 *
			 * @param {object} notification - Notification object.
			 *
			 * @returns {string}
			 */
			notification_title: function ( notification ) {
				var types = {
					email: orderable_pro_custom_order_status.i18n.email,
					sms: orderable_pro_custom_order_status.i18n.sms,
					whatsapp: orderable_pro_custom_order_status.i18n.whatsapp,
				};

				var recipient = ( 'custom' === notification.recipient ) ? ( 'email' === notification.type ? notification.recipient_custom_email : notification.recipient_custom_number ) : window.orderable_pro_custom_order_status.i18n[notification.recipient];
				
				return `${types[ notification.type ]} ${orderable_pro_custom_order_status.i18n.to} ${recipient}`;
			},

			/**
			 * Icon Class for notification.
			 * 
			 * @param {object} notification Notification.
			 * @returns string
			 */
			notification_icon_class: function ( notification ) {
				var icons = {
					email: 'dashicons dashicons-email-alt',
					sms: 'fa fa-commenting-o',
					whatsapp: 'fa fa-whatsapp',
				};

				return icons[ notification.type ];
			},

			/**
			 * Capitalize.
			 *
			 * @param {string} string
			 * @returns {string}
			 */
			capitalize: function ( string ) {
				if ( 'string' !== typeof string ) {
					return '';
				}

				return string.charAt( 0 ).toUpperCase() + string.slice( 1 );
			},

			/**
			 * Generate random number.
			 *
			 *
			 * @returns 
			 */
			generate_random_number: function() {
				return Math.floor( ( Math.random() ) * ( 1000000000000-1000+1 ) ) + 1000;
			}
		},
		computed: {
			notifications_json: function() {
				return JSON.stringify( this.notifications );
			}
		}
	} );
	
})(jQuery);