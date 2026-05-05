<?php
/**
 * Notifications Pro Logging class.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Functions to log messages.
 */
class Orderable_Notifications_Pro_Helper {

	/**
	 * Get WhatsApp template variables dropdown options.
	 *
	 * @return array
	 */
	public static function get_wa_variable_dropdown_options() {
		$options = array(
			'customer_fname'    => esc_html_x( 'Customer First Name', 'notifications', 'orderable-pro' ),
			'customer_lname'    => esc_html_x( 'Customer Last Name', 'notifications', 'orderable-pro' ),
			'customer_fullname' => esc_html_x( 'Customer Full Name', 'notifications', 'orderable-pro' ),
			'order_id'          => esc_html_x( 'Order ID', 'notifications', 'orderable-pro' ),
			'order_date'        => esc_html_x( 'Order Date', 'notifications', 'orderable-pro' ),
			'order_details'     => esc_html_x( 'Order details', 'notifications', 'orderable-pro' ),
			'order_status'      => esc_html_x( 'Order Status', 'notifications', 'orderable-pro' ),
			'billing_address'   => esc_html_x( 'Billing Address', 'notifications', 'orderable-pro' ),
			'shipping_address'  => esc_html_x( 'Shipping Address', 'notifications', 'orderable-pro' ),
		);

		return apply_filters( 'orderable_wa_variable_dropdown_options', $options );
	}

	/**
	 * Log Message.
	 *
	 * @param string $msg Message to log.
	 */
	public static function log( $msg ) {
		/**
		 * Filter to toggle logging. Set value to '1' (string) to enable logging.
		 */
		$log_enabled = apply_filters( 'orderable_pro_notifications_logging_enabled', Orderable_Settings::get_setting( 'notifications_notification_enable_logging' ) );

		if ( '1' !== $log_enabled ) {
			return;
		}

		$logger = wc_get_logger();

		$logger->info( wc_print_r( $msg, true ), array( 'source' => 'orderable-pro' ) );
	}

	/**
	 * Format the phone number.
	 * Adds the country code. If the number is for whatspp, then adds whatsapp: prefix.
	 *
	 * @param string $number Number.
	 *
	 * @return string
	 */
	public static function format_phone_number( $number ) {
		$first_char = substr( $number, 0, 1 );
		if ( '+' === $first_char ) {
			// remove the first character (+).
			$number = substr( $number, 1 );
		} elseif ( '0' === $first_char ) {
			// remove 0, prepend country code.
			$number     = substr( $number, 1 );
			$phone_code = Orderable_Notifications_Pro_Countries::get_phone_code_for_country( WC()->countries->get_base_country() );
			$number     = $phone_code . $number;
		} else {
			$phone_code = Orderable_Notifications_Pro_Countries::get_phone_code_for_country( WC()->countries->get_base_country() );
			$number     = $phone_code . $number;
		}

		$number = str_replace( ' ', '', $number );

		return apply_filters( 'orderable_pro_notifications_formated_phone_number', $number );
	}
}
