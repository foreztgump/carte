<?php
/**
 * Module: Notifications Pro.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Notification module class.
 */
class Orderable_Notifications_Pro {
	/**
	 * Init.
	 */
	public static function run() {
		self::load_classes();

		/**
		 * These hooks are triggered in custom order status module.
		 */
		add_action( 'orderable_cos_send_sms_notification', array( __CLASS__, 'send_notification' ), 10, 2 );
		add_action( 'orderable_cos_send_whatsapp_notification', array( __CLASS__, 'send_notification' ), 10, 2 );
		add_action( 'orderable_cos_after_notifications_html', array( __CLASS__, 'print_whatsapp_templates_json_input' ) );

		/**
		 * Add content field and save its data.
		 */
		add_filter( 'woocommerce_checkout_fields', array( __CLASS__, 'add_notification_consent_field' ), 9, 1 );
		add_filter( 'woocommerce_checkout_update_order_meta', array( __CLASS__, 'save_notification_consent_field' ), 10, 1 );
	}

	/**
	 * Load classes.
	 */
	public static function load_classes() {
		$classes = array(
			'notifications-pro-settings'  => 'Orderable_Notifications_Pro_Settings',
			'notifications-pro-twillio'   => 'Orderable_Notififcations_Pro_Twillio',
			'notifications-pro-countries' => 'Orderable_Notifications_Pro_Countries',
			'notifications-pro-whatsapp'  => 'Orderable_Notifications_Pro_Whatsapp',
			'notifications-pro-helper'    => 'Orderable_Notifications_Pro_Helper',
			'notifications-pro-ajax'      => 'Orderable_Notifications_Pro_Ajax',
		);

		Orderable_Helpers::load_classes( $classes, 'notifications-pro', ORDERABLE_PRO_MODULES_PATH );
	}

	/**
	 * Send SMS and whatsapp notification.
	 *
	 * @param int   $order_id     Order ID.
	 * @param array $notification Notification.
	 */
	public static function send_notification( $order_id, $notification ) {
		$order = wc_get_order( $order_id );

		if ( empty( $order ) ) {
			return;
		}

		$optin       = $order->get_meta( 'orderable_notification_optin' );
		$optin_label = Orderable_Settings::get_setting( 'notifications_notification_optin_field_label' );

		if ( 'customer' === $notification['recipient'] ) {

			/**
			 * Return if customer has not opted in to recieve notifications.
			 * If $optin_label is empty then we send notifications to all customers (i.e. do not return).
			 *
			 * @param bool  $customer_has_opted_out
			 * @param array $notification Notification data.
			 */
			$customer_opted_out = apply_filters(
				'orderable_notification_customer_opted_out',
				'no' === $optin && ! empty( $optin_label ),
				$notification
			);

			if ( $customer_opted_out ) {
				return;
			}
		}

		$message         = Orderable_Custom_Order_Status_Pro_Helper::replace_shortcodes( $notification['message'], $order, true );
		$final_recipient = '';

		switch ( $notification['recipient'] ) {
			case 'admin':
				$final_recipient = Orderable_Settings::get_setting( 'notifications_notification_admin_number' );
				break;
			case 'customer':
				$final_recipient = $order->get_billing_phone();
				break;
			case 'custom':
				$final_recipient = $notification['recipient_custom_number'];
				break;
		}

		if ( empty( $final_recipient ) ) {
			return;
		}

		/**
		 * Recipient's phone number before sending the SMS/WhatsApp notification.
		 *
		 * @param string $final_recipient Recipient phone number.
		 * @param array $notification     Notification data.
		 */
		$final_recipient = apply_filters( 'orderable_pro_notifications_recipient', $final_recipient, $notification );

		/**
		 * Message before sending the SMS/WhatsApp notification.
		 *
		 * @param string $message      Message to send.
		 * @param array  $notification Notification data.
		 */
		$message = apply_filters( 'orderable_pro_notifications_message', $message, $notification );

		$final_recipient = Orderable_Notifications_Pro_Helper::format_phone_number( $final_recipient );

		if ( 'whatsapp' === $notification['type'] ) {
			if ( empty( $notification['wa_template_id'] ) ) {
				return false;
			}

			$variables = Orderable_Notifications_Pro_Whatsapp::prepare_variables( $notification, $order );
			$sent      = Orderable_Notifications_Pro_Whatsapp::send_message( $final_recipient, $notification['wa_template_id'], $variables );

			if ( $sent ) {
				// Translators: %s is the phone number.
				$note = sprintf( esc_html__( 'WhatsApp message sent to %s', 'orderable-pro' ), $final_recipient );
				$order->add_order_note( $note );
			}
		} else {
			$sent = Orderable_Notifications_Pro_Twillio::send_message( $final_recipient, $message, $notification['type'] );

			if ( $sent ) {
				// Translators: %s is the phone number.
				$note = sprintf( esc_html__( 'SMS message sent to %s', 'orderable-pro' ), $final_recipient );
				$order->add_order_note( $note );
			}
		}
	}

	/**
	 * Ger order summary.
	 *
	 * @param WC_Order $order Order.
	 *
	 * @return string
	 */
	public static function get_order_summary( $order ) {
		$items    = $order->get_items();
		$summary  = '';
		$last_key = array_key_last( $items );

		foreach ( $items as $item_id => $item ) {
			$summary .= $item->get_name();

			$summary .= ' X ' . $item->get_quantity();
			$summary .= ' = ' . $order->get_formatted_line_subtotal( $item );

			if ( $last_key !== $item_id ) {
				$summary .= ' | ';
			}
		}

		/**
		 * Order summary.
		 */
		return apply_filters( 'orderable_pro_notifications_order_summary', html_entity_decode( wp_strip_all_tags( $summary ) ) );
	}

	/**
	 * Add consent field.
	 *
	 * @param array $fields Checkout fields.
	 *
	 * @return array
	 */
	public static function add_notification_consent_field( $fields ) {
		if ( ! isset( $fields['billing'], $fields['billing']['billing_phone'] ) ) {
			return $fields;
		}

		// Do not add the field if Twillio or WhatsApp are not setup.
		$account_id  = Orderable_Settings::get_setting( 'notifications_twillio_account_sid' );
		$fb_app_id   = Orderable_Settings::get_setting( 'notifications_whatsapp_app_id' );
		$optin_label = Orderable_Settings::get_setting( 'notifications_notification_optin_field_label' );
		$checked     = Orderable_Settings::get_setting( 'notifications_notification_optin_field_checked' );

		if ( ( empty( $account_id ) && empty( $fb_app_id ) ) || empty( $optin_label ) ) {
			return $fields;
		}

		$phone_priority = $fields['billing']['billing_phone']['priority'];

		$fields['billing']['orderable_notification_optin'] = array(
			'type'        => 'checkbox',
			'label'       => esc_html( $optin_label ),
			'placeholder' => '',
			'priority'    => $phone_priority + 1,
			'default'     => $checked,
		);

		return $fields;
	}

	/**
	 * Save Consent field data.
	 *
	 * @param int $order_id Order ID.
	 *
	 * @return void
	 */
	public static function save_notification_consent_field( $order_id ) {
		$optin = filter_input( INPUT_POST, 'orderable_notification_optin' );
		$optin = ! empty( $optin ) ? 'yes' : 'no';

		$order = wc_get_order( $order_id );

		if ( empty( $order ) ) {
			return;
		}

		$order->update_meta_data( 'orderable_notification_optin', $optin );

		$order->save();
	}

	/**
	 * Makes templates available to notification metabox in form of a hidden input.
	 *
	 * @return void
	 */
	public static function print_whatsapp_templates_json_input() {
		$templates = Orderable_Notifications_Pro_Whatsapp::get_templates();

		if ( empty( $templates ) || empty( $templates['data'] ) ) {
			return;
		}

		?>
		<script id="orderable-cos-wa-templates-json" data-templates="<?php echo esc_attr( wp_json_encode( $templates['data'] ) ); ?>"></script>
		<?php
	}
}
