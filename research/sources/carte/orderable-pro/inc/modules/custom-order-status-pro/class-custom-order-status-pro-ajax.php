<?php
/**
 * Module: Custom Order Status Pro.
 *
 * @package Orderable/Classes
 */

/**
 * Ajax class.
 */
class Orderable_Custom_Order_Status_Pro_Ajax {

	/**
	 * Init.
	 *
	 * @return void
	 */
	public static function run() {
		$events = array(
			'check_slug_exists' => false,
		);

		// Action will be like: orderable_cos_$event.
		foreach ( $events as $event => $nopriv ) {
			add_action( 'wp_ajax_orderable_cos_' . $event, array( __CLASS__, $event ) );
			if ( $nopriv ) {
				add_action( 'wp_ajax_nopriv_orderable_cos_' . $event, array( __CLASS__, $event ) );
			}
		}
	}

	/**
	 * Check slug exists
	 *
	 * @return void
	 */
	public static function check_slug_exists() {
		// Verify nonce.
		check_ajax_referer( 'orderable_pro_custom_order_status', 'nonce' );

		$slug     = filter_input( INPUT_POST, 'slug' );
		$statuses = wc_get_order_statuses();

		if ( isset( $statuses[ 'wc-' . $slug ] ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'Slug already exists', 'orderable-custom-order-status-pro' ),
				)
			);
		}

		wp_send_json_success();
		wp_die();
	}
}
