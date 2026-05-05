<?php
/**
 * Notification metabox template.
 *
 * @package Orderable/Classes
 */

?>
<div id="orderable-cos-notifications" 
	v-cloak 
	data-notifications="<?php echo esc_attr( wp_json_encode( $settings['notifications'] ) ); ?>" 
	data-locations="<?php echo esc_attr( wp_json_encode( $location_json ) ); ?>">

	<div class="ocos-notifications--no-field" v-if="0 === notifications.length">
		<button @click.prevent='add_notification' class='button button-primary'><?php esc_html_e( 'Add Notification', 'orderable-pro' ); ?></button>
	</div>
	<div class="ocos-notifications-wrap" v-else>
		<div
			class="ocos-notifications__repeater orderable-fields-row"
			:class="{
				'orderable-fields-row--open': notification.is_open,
				'orderable-fields-row--disabled': ! notification.enabled
			}"
			v-for='( notification, idx ) in notifications'
			:key="idx"
			>

			<div class="orderable-fields-row__header">
				<div>
					<span class="orderable-fields-row__notification-type orderable-dashicons" :class="notification_icon_class(notification)"></span>
				</div>	
				<div class="orderable-fields-row__header-title" @click="notification.is_open = !notification.is_open">
					<h3>{{notification_title(notification)}}</h3>
				</div>

				<div class="orderable-fields-row__header-action">
					<!-- <span class="dashicons dashicons-admin-page orderable-dashicons orderable-dashicons--admin-page"></span> -->
					<span @click="remove_notification(notification, false)" class="dashicons dashicons-trash orderable-dashicons orderable-dashicons--trash"></span>
				</div>
			</div>
			<div class="orderable-fields-row__body">
				<!-- Enabled -->
				<div class="orderable-fields-row__body-row orderable-cos-field-row--type">
					<div class="orderable-fields-row__body-row-left">
						<h3><?php echo esc_html_x( 'Enabled', 'custom order status', 'orderable-pro' ); ?></h3>
						<p><?php echo esc_html_x( 'Is this notification enabled?', 'custom order status', 'orderable-pro' ); ?></p>
					</div>
					<div class="orderable-fields-row__body-row-right">
						<input type="checkbox" value="1" v-model="notification.enabled"> 
					</div>
				</div>

				<!-- Type field -->
				<div class="orderable-fields-row__body-row orderable-cos-field-row--type">
					<div class="orderable-fields-row__body-row-left">
						<h3><?php echo esc_html_x( 'Type', 'custom order status', 'orderable-pro' ); ?></h3>
						<p v-if="'whatsapp' === notification.type">
							<a target="_blank" href="https://orderable.com/docs/whatsapp-order-notifications/"><?php esc_html_e( 'WhatsApp Integration Guide', 'orderable-pro' ); ?></a>
						</p>
						<p v-if="'sms' === notification.type">
							<a target="_blank" href="https://orderable.com/docs/send-sms-order-notifications-via-twilio/"><?php esc_html_e( 'Twilio Integration Guide', 'orderable-pro' ); ?></a>
						</p>
					</div>
					<div class="orderable-fields-row__body-row-right">
						<select
							class='orderable-cos-field--type'
							v-model='notification.type'
							@change='on_type_change(notification)'
							>
							<option value="email"><?php echo esc_html_x( 'Email', 'custom order status', 'orderable-pro' ); ?></option>
							<option <?php echo $twilio_setup ? '' : 'disabled'; ?> value="sms"><?php echo esc_html_x( 'SMS', 'custom order status', 'orderable-pro' ); ?></option>
							<option <?php echo $whatsapp_setup ? '' : 'disabled'; ?> value="whatsapp"><?php echo esc_html_x( 'Whatsapp', 'custom order status', 'orderable-pro' ); ?></option>
						</select>
					</div>
				</div>

				<!-- Recipient -->
				<div class="orderable-fields-row__body-row orderable-cos-field-row--recipient">
					<div class="orderable-fields-row__body-row-left">
						<h3><?php echo esc_html_x( 'Recipient', 'custom order status', 'orderable-pro' ); ?></h3>
					</div>
					<div class="orderable-fields-row__body-row-right">
						<select
							v-model='notification.recipient'
							class='orderable-cos-field--recipient'
							>
							<option value="customer"><?php echo esc_html_x( 'Customer', 'custom order status', 'orderable-pro' ); ?></option>
							<option value="admin"><?php echo esc_html_x( 'Admin', 'custom order status', 'orderable-pro' ); ?></option>
							<option value="custom"><?php echo esc_html_x( 'Custom', 'custom order status', 'orderable-pro' ); ?></option>
						</select>
					</div>
				</div>

				<!-- Recipient Custom email -->
				<div class="orderable-fields-row__body-row orderable-cos-field-row--email" v-if="notification.recipient == 'custom' && notification.type == 'email'">
					<div class="orderable-fields-row__body-row-left">
						<h3><?php echo esc_html_x( 'Recipient email', 'custom order status', 'orderable-pro' ); ?></h3>
					</div>
					<div class="orderable-fields-row__body-row-right">
						<input
							type="email"
							required
							v-model='notification.recipient_custom_email'
							class='orderable-cos-field--custom-email'
							>
					</div>
				</div>

				<!-- Recipient custom number -->
				<div class="orderable-fields-row__body-row orderable-cos-field-row--custom-number" v-if="notification.recipient == 'custom' && notification.type != 'email'">
					<div class="orderable-fields-row__body-row-left">
						<h3><?php echo esc_html_x( 'Recipient number', 'custom order status', 'orderable-pro' ); ?></h3>
					</div>
					<div class="orderable-fields-row__body-row-right">
						<input
							type="text"
							v-model='notification.recipient_custom_number'
							class='orderable-cos-field--custom-number'
							placeholder='+<?php echo esc_attr( Orderable_Notifications_Pro_Countries::get_phone_code_for_country( WC()->countries->get_base_country() ) ); ?> 1234567890'
							>
					</div>
				</div>

				<!-- From email -->
				<div class="orderable-fields-row__body-row orderable-cos-field-row--from-email" v-if='notification.type == "email"'>
					<div class="orderable-fields-row__body-row-left">
						<h3><?php echo esc_html_x( 'From email', 'custom order status', 'orderable-pro' ); ?></h3>
					</div>
					<div class="orderable-fields-row__body-row-right">
						<input
							type="email"
							v-model='notification.from_email'
							class='orderable-cos-field--from-email'
							placeholder='<?php echo esc_html( get_option( 'admin_email' ) ); ?>'
							>
					</div>
				</div>

				<!-- From name -->
				<div class="orderable-fields-row__body-row orderable-cos-field-row--from-name" v-if='notification.type == "email"'>
					<div class="orderable-fields-row__body-row-left">
						<h3><?php echo esc_html_x( 'From name', 'custom order status', 'orderable-pro' ); ?></h3>
					</div>
					<div class="orderable-fields-row__body-row-right">
						<input
							type="text"
							v-model='notification.from_name'
							class='orderable-cos-field--from-name'
							placeholder='<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>'
							>
					</div>
				</div>

				<!-- Email subject -->
				<div class="orderable-fields-row__body-row orderable-cos-field-row--email-subject" v-if='notification.type == "email"'>
					<div class="orderable-fields-row__body-row-left">
						<h3><?php echo esc_html_x( 'Email subject', 'custom order status', 'orderable-pro' ); ?></h3>
					</div>
					<div class="orderable-fields-row__body-row-right">
						<input
							type="text"
							required
							v-model='notification.subject'
							class='orderable-cos-field--subject'
							>
					</div>
				</div>


				<!-- Email Title -->
				<div class="orderable-fields-row__body-row orderable-cos-field-row--email-subject" v-if='notification.type == "email"'>
					<div class="orderable-fields-row__body-row-left">
						<h3><?php echo esc_html_x( 'Email Title', 'custom order status', 'orderable-pro' ); ?></h3>
						<p><?php esc_html_x( 'Title showed in the email body.', 'custom order status', 'orderable-pro' ); ?></p>
					</div>
					<div class="orderable-fields-row__body-row-right">
						<input
							type="text"
							required
							v-model='notification.title'
							class='orderable-cos-field--subject'
							>
					</div>
				</div>				

				<!-- Location -->
				<div class="orderable-fields-row__body-row orderable-cos-field-row--location">
					<div class="orderable-fields-row__body-row-left">
						<h3><?php echo esc_html_x( 'Location', 'custom order status', 'orderable-pro' ); ?></h3>
						<p><?php echo esc_html_x( 'Trigger this notification for orders associated with this location.', 'custom order status', 'orderable-pro' ); ?></p>
					</div>
					<div class="orderable-fields-row__body-row-right">
						<div class="orderable-cos-vselect">
							<select v-model="notification.location">
								<option value=""><?php echo esc_html_x( 'All Locations', 'custom order status', 'orderable-pro' ); ?></option>
								<option v-for="location in locations" :key="location.id" :value="location.id">
									{{location.label}}
								</option>
							</select>
						</div>
					</div>
				</div>				

				<!-- Message -->
				<div class="orderable-fields-row__body-row orderable-cos-field-row--message">
					<div class="orderable-fields-row__body-row-left">
						<h3><?php echo esc_html_x( 'Message', 'custom order status', 'orderable-pro' ); ?></h3>
						<p v-if='"whatsapp" === notification.type'>
							<?php
							echo wp_kses_post(
								sprintf(
									// Translators: URL to the facebook business maanger templates page.
									_x( 'You can create and manage WhatsApp templates from <a href="%s" target=_blank>Meta Business Manager</a>', 'custom order status', 'orderable-pro' ),
									'https://business.facebook.com/wa/manage/message-templates/'
								)
							);
							?>
						</p>
						<p v-else>
							<?php echo esc_html_x( 'Available Shortcodes:', 'custom order status', 'orderable-pro' ); ?> {customer_fname}, {customer_lname}, {order_id}, {order_date}, {order_status}, {billing_address}, {shipping_address}, {service_date} and {service_time}.
						</p>
					</div>
					<div class="orderable-fields-row__body-row-right">
						<div v-if='"whatsapp" === notification.type' class='orderable-wa-template-selector' >
							<select 
								v-model="notification.wa_template_id" 
								class="orderable-wa-template-selector__select"
								@change="handle_wa_template_change( notification )"
								>
								<option v-for="template in wa_templates" :value="template.id" :disabled="'APPROVED' !== template.status" >
									{{template.name}} - {{template.language}}
								</option>
							</select>

							<button class='button orderable-wa-refresh-btn' :class="{ 'orderable-wa-refresh-btn--loading': wa_templates_loading }" @click.prevent="refresh_templates"><span class="dashicons dashicons-image-rotate"></span></button>
						</div>
						<textarea
							v-model='notification.message'
							class='orderable-cos-field--message'
							:readonly='"whatsapp" === notification.type'
							>
						</textarea>

						<div v-if='"whatsapp" === notification.type && notification.wa_variables' class='orderable-wa-variables' >
							<div 
								v-for="(variable, variable_key) in notification.wa_variables"
								class="orderable-wa-variables__variable"
								:key="variable_key"
								>
								<label :for="'orderable-wa-variables-' + idx + '-' + variable_key" class="orderable-wa-variables__label">Variable {{variable_key + 1}}:</label>

								<select 
									class="orderable-wa-variables__field" 
									:id="'orderable-wa-variables-' + idx + '-' + variable_key"
									v-model="notification.wa_variables[variable_key]"
								>
									<?php
									foreach ( Orderable_Notifications_Pro_Helper::get_wa_variable_dropdown_options() as $option_key => $option_string ) {
										printf( "<option value='{%s}'>%s</option>", esc_attr( $option_key ), esc_html( $option_string ) );
									}
									?>
								</select>
							</div>
						</div>
					</div>
				</div>

				<!-- Checkbox: Include Order table -->
				<div class="orderable-fields-row__body-row orderable-cos-field-row--include-order-info" v-show="'email' === notification.type">
					<div class="orderable-fields-row__body-row-left">
						<h3><?php echo esc_html_x( 'Include order info/table', 'custom order status', 'orderable-pro' ); ?></h3>
					</div>
					<div class="orderable-fields-row__body-row-right">
						<input
							type="checkbox"
							v-model='notification.include_order_table'
							class='orderable-cos-field--include-order-table'
							:name='"orderable-cos-field--include-order-table-" + idx'
							value='1'
							>
					</div>
				</div>

				<!-- Checkbox: Include custom information -->
				<div class="orderable-fields-row__body-row orderable-cos-field-row--include-order-info" v-show="'email' === notification.type">
					<div class="orderable-fields-row__body-row-left">
						<h3><?php echo esc_html_x( 'Include Customer information', 'custom order status', 'orderable-pro' ); ?></h3>
					</div>
					<div class="orderable-fields-row__body-row-right">
						<input
							type="checkbox"
							v-model='notification.include_customer_info'
							class='orderable-cos-field--include-custom-info'
							:name='"orderable-cos-field--include-custom-info-" + idx'
							value='1'
							>
					</div>
				</div>

			</div> <!-- .ocos-notifications__repeater-content -->
		</div> <!-- .ocos-notifications__repeater -->
		<button @click.prevent='add_notification' class='button button-primary'><?php echo esc_html_x( 'Add Notification', 'custom order status', 'orderable-pro' ); ?></button>
	</div> <!-- .ocos-notifications-wrap -->

	<input type="hidden" id='orderable-cos-notifications-json' name='orderable-cos-notifications-json' v-model="notifications_json">
</div>
<?php do_action( 'orderable_cos_after_notifications_html' ); ?>
