<?php
/**
 * Module: Timings Pro Checkout.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Timings module class.
 */
class Orderable_Timings_Pro_Checkout {
	/**
	 * Init.
	 */
	public static function run() {
		add_action( 'woocommerce_checkout_process', array( __CLASS__, 'validate_checkout' ) );
		add_action( 'woocommerce_store_api_cart_errors', [ __CLASS__, 'validate_checkout_block' ], 20, 1 );

		add_filter( 'orderable_checkout_data', array( __CLASS__, 'modify_checkout_data' ) );
	}

	/**
	 * Validate checkout fields.
	 *
	 * @throws Exception
	 */
	public static function validate_checkout() {
		$order_date = sanitize_text_field( wp_unslash( $_POST['orderable_order_date'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification
		$order_time = sanitize_text_field( wp_unslash( $_POST['orderable_order_time'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification

		if ( ! empty( $order_date ) && 'asap' !== $order_date ) {
			$location = new Orderable_Location_Single_Pro( Orderable_Location::get_selected_location() );

			$orders_remaining = $location->get_orders_remaining_for_date( $order_date );

			if ( $orders_remaining <= 0 ) {
				wc_add_notice( __( 'Sorry, the date you selected is no longer available. Please choose another.', 'orderable-pro' ), 'error' );

				return;
			}
		}

		if ( ! isset( $_POST['orderable_order_time'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}

		if ( empty( $order_time ) ) {
			wc_add_notice( __( 'Please select an order time.', 'orderable-pro' ), 'error' );

			return;
		}

		if ( 'asap' === $order_time ) {
			return;
		}

		$now               = new DateTime( 'now', wp_timezone() );
		$order_date_object = new DateTime( 'now', wp_timezone() );

		$order_date_object->setTimestamp( $order_date );

		// If the selected date is not today, no additional checks are needed
		if ( $now->format( 'd/m/Y' ) !== $order_date_object->format( 'd/m/Y' ) ) {
			return;
		}

		if ( self::is_order_time_valid( $order_time, $now ) ) {
			return;
		}

		wc_add_notice( __( 'Sorry, the timeslot you selected is no longer available. Please choose another.', 'orderable-pro' ), 'error' );
	}

	/**
	 * Check if the order time is valid.
	 *
	 * A order time can be invalid when is a past date or
	 * it doesn't respect the lead time.
	 *
	 * @param string        $order_time      The order time in the format `Hi`. E.g. `0900` and `1500`.
	 * @param DateTime|null $date_to_compare The date to compare with e.g. the current datetime.
	 * @return boolean
	 */
	protected static function is_order_time_valid( $order_time, $date_to_compare = null ) {
		global $wpdb;

		if ( ! is_a( $date_to_compare, 'DateTime' ) ) {
			$date_to_compare = new DateTime( 'now', wp_timezone() );
		}

		$order_time_object = new DateTime( 'now', wp_timezone() );
		$hour              = (int) substr( $order_time, 0, 2 );
		$minute            = (int) substr( $order_time, 2, 2 );
		$order_time_object->setTime( $hour, $minute, 0 );

		if ( $order_time_object < $date_to_compare ) {
			return false;
		}

		$time_slot_id = self::retrieve_time_slot_id();

		if ( empty( $time_slot_id ) ) {
			return true;
		}

		if ( empty( $wpdb->orderable_location_time_slots ) ) {
			return true;
		}

		$lead_time = (int) $wpdb->get_var(
			$wpdb->prepare(
				"
					SELECT
						cutoff
					FROM
						{$wpdb->orderable_location_time_slots}
					WHERE
						time_slot_id = %d
				",
				$time_slot_id
			)
		);

		$now_plus_lead_time = new DateTime( "+{$lead_time} minutes", wp_timezone() );

		if ( $order_time_object >= $now_plus_lead_time ) {
			return true;
		}

		return false;
	}

	/**
	 * Retrieve the time slot ID.
	 *
	 * The time slot ID can be sent via $_POST or REST request.
	 *
	 * @return int
	 */
	protected static function retrieve_time_slot_id() {
		global $wp_rest_server; // WP_REST_Server object

		if ( ! $wp_rest_server || ! $wp_rest_server->is_dispatching() ) {
			return absint( wp_unslash( $_POST['orderable_order_time_slot_id'] ?? 0 ) ); // phpcs:ignore WordPress.Security.NonceVerification
		}

		$request_data = json_decode( (string) $wp_rest_server::get_raw_data( '/wc/store/v1/checkout' ), true );

		$time_slot_id = absint( $request_data['extensions']['orderable-pro/order-service-time']['time-slot-id'] ?? 0 );

		return $time_slot_id;
	}

	/**
	 * Process checkout fields.
	 *
	 * @param array $checkout_data Checkout data to save.
	 *
	 * @return mixed
	 */
	public static function modify_checkout_data( $checkout_data ) {
		$order_date = empty( $_POST['orderable_order_date'] ) ? '' : sanitize_text_field( wp_unslash( $_POST['orderable_order_date'] ) ); // phpcs:ignore WordPress.Security.NonceVerification
		$order_time = empty( $_POST['orderable_order_time'] ) ? '' : sanitize_text_field( wp_unslash( $_POST['orderable_order_time'] ) ); // phpcs:ignore WordPress.Security.NonceVerification
		$location   = Orderable_Location::get_selected_location();

		if ( $order_time && 'asap' !== $order_time ) {
			$hours       = substr( $order_time, 0, 2 );
			$minutes     = substr( $order_time, 2, 2 );
			$time_format = get_option( 'time_format' );

			$date_and_time = new DateTime( 'now', wp_timezone() );
			$date_and_time->setTimestamp( (int) $checkout_data['_orderable_order_timestamp']['value'] );
			$date_and_time->setTime( $hours, $minutes );

			$timestamp  = $date_and_time->getTimestamp();
			$order_time = $date_and_time->format( $time_format );

			$checkout_data['orderable_order_time'] = array(
				'save'  => true,
				'value' => $order_time,
			);

			$checkout_data['_orderable_order_timestamp'] = array(
				'save'  => true,
				'value' => $timestamp,
			);
		}

		if ( $order_time && 'asap' === $order_time ) {
			$dates = $location->get_service_dates();

			if ( ! $dates || ! $order_date ) {
				return;
			}

			$date = array_filter(
				$dates,
				function ( $value ) use ( $order_date ) {
					return (int) $value['timestamp'] === (int) $order_date;
				},
				ARRAY_FILTER_USE_BOTH
			);

			if ( count( $date ) < 1 ) {
				return;
			}

			$date                     = array_values( $date )[0];
			$earliest_order_time      = array_key_first( $date['slots'] );
			$earliest_order_timestamp = array_values( $date['slots'] )[0]['timestamp'];

			$hours       = substr( $earliest_order_time, 0, 2 );
			$minutes     = substr( $earliest_order_time, 2, 2 );
			$time_format = get_option( 'time_format' );

			$date_and_time = new DateTime( 'now', wp_timezone() );
			$date_and_time->setTimestamp( (int) $earliest_order_timestamp );
			$date_and_time->setTime( $hours, $minutes );

			$timestamp           = $date_and_time->getTimestamp();
			$earliest_order_time = $date_and_time->format( $time_format );

			$checkout_data['orderable_order_time'] = array(
				'save'  => true,
				'value' => $earliest_order_time . esc_html__( ' (As soon as possible)', 'orderable-pro' ),
			);

			$checkout_data['_orderable_order_timestamp'] = array(
				'save'  => true,
				'value' => $timestamp,
			);
		}

		return $checkout_data;
	}

	/**
	 * Check if the selected order time is still valid.
	 *
	 * @param WP_Error $cart_errors  WP_Error object.
	 * @return void
	 */
	public static function validate_checkout_block( $cart_errors ) {
		global $wp_rest_server; // WP_REST_Server object

		if ( ! is_a( $wp_rest_server, 'WP_REST_Server' ) ) {
			return;
		}

		$request_data = json_decode( (string) $wp_rest_server::get_raw_data( '/wc/store/v1/checkout' ), true );

		$order_date = sanitize_text_field( $request_data['extensions']['orderable/order-service-date']['timestamp'] ?? '' );

		if ( empty( $order_date ) || 'asap' === $order_date ) {
			return;
		}

		$order_date_object = new DateTime( 'now', wp_timezone() );
		$now               = new DateTime( 'now', wp_timezone() );

		$order_date_object->setTimestamp( $order_date );

		// If the selected date is not today, no additional checks are needed
		if ( $now->format( 'd/m/Y' ) !== $order_date_object->format( 'd/m/Y' ) ) {
			return;
		}

		$order_time = sanitize_text_field( $request_data['extensions']['orderable-pro/order-service-time']['time'] ?? '' );

		if ( empty( $order_time ) ) {
			return;
		}

		if ( 'asap' === $order_time ) {
			return;
		}

		if ( self::is_order_time_valid( $order_time, $now ) ) {
			return;
		}

		$cart_errors->add(
			'orderable_pro_order_time_error',
			__( 'Sorry, the timeslot you selected is no longer available. Please choose another.', 'orderable-pro' )
		);
	}
}
