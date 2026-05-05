<?php
/**
 * Module: Notifications Pro.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Notification AJAX class.
 */
class Orderable_Notifications_Pro_Ajax {

	/**
	 * Init.
	 */
	public static function run() {
		add_action( 'wp_ajax_orderable_wa_refresh_templates', array( __CLASS__, 'refresh_templates' ) );
	}

	/**
	 * Refresh templates.
	 *
	 * @return void
	 */
	public static function refresh_templates() {
		$templates = Orderable_Notifications_Pro_Whatsapp::get_templates( true );
		wp_send_json_success( $templates );
		wp_die();
	}
}
