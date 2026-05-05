<?php
/**
 * Module: Timings Pro.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

use Automattic\WooCommerce\Utilities\OrderUtil;

/**
 * Timings module class.
 */
class Orderable_Timings_Pro {
	/**
	 * Init.
	 */
	public static function run() {
		self::load_classes();

		add_filter( 'orderable_date_available', array( __CLASS__, 'date_available' ), 10, 4 );
		add_filter( 'orderable_time_slot_available', array( __CLASS__, 'time_slot_available' ), 10, 4 );
	}

	/**
	 * Load classes.
	 */
	public static function load_classes() {
		$classes = array(
			'timings-pro-settings' => 'Orderable_Timings_Pro_Settings',
			'timings-pro-checkout' => 'Orderable_Timings_Pro_Checkout',
		);

		Orderable_Helpers::load_classes( $classes, 'timings-pro', ORDERABLE_PRO_MODULES_PATH );
	}

	/**
	 * Is date available for delivery/pickup?
	 *
	 * @param bool                      $available
	 * @param int                       $timestamp
	 * @param string                    $type     Service type.
	 * @param Orderable_Location_Single $location Location instance.
	 *
	 * @return bool
	 * @throws Exception
	 */
	public static function date_available( $available, $timestamp, $type, $location ) {
		$location         = new Orderable_Location_Single_Pro( $location );
		$orders_remaining = $location->get_orders_remaining_for_date( $timestamp );

		return true === $orders_remaining || $orders_remaining >= 1;
	}

	/**
	 * Is time slot available for delivery/pickup?
	 *
	 * @param bool   $available
	 * @param int    $timestamp
	 * @param string $type Service type.
	 * @param array  $time_slot_settings
	 *
	 * @return bool
	 * @throws Exception
	 */
	public static function time_slot_available( $available, $timestamp, $type, $time_slot_settings ) {
		/**
		 * Filter whether orders remaining check should be skipped. Default: `! is_checkout()`.
		 *
		 * @since 1.14.0
		 * @hook orderable_skip_orders_remaining_check
		 * @param  bool   $skip               Wheter skip orders remaining check. Default: `! is_checkout()`.
		 * @param  bool   $available          Time slot availability.
		 * @param  string $type               Service type (`delivery` or `pickup`).
		 * @param  int    $timestamp          Time slot timestamp.
		 * @param  array  $time_slot_settings Time slot settings.
		 * @return bool New value
		 */
		$skip_orders_remaining_check = apply_filters(
			'orderable_skip_orders_remaining_check',
			! is_checkout(),
			$available,
			$type,
			$timestamp,
			$time_slot_settings
		);

		if ( $skip_orders_remaining_check ) {
			return $available;
		}

		$orders_remaining = self::get_orders_remaining_for_time_slot( $timestamp, $type, $time_slot_settings );

		return true === $orders_remaining || $orders_remaining >= 1;
	}

	/**
	 * Get max orders for day from settings.
	 *
	 * @param $timestamp
	 *
	 * @return int|string
	 * @throws Exception
	 */
	public static function get_max_orders_for_day( $timestamp ) {
		if ( ! $timestamp ) {
			return $timestamp;
		}

		$open_hours_settings = Orderable_Location::get_open_hours();

		if ( empty( $open_hours_settings ) ) {
			return apply_filters( 'orderable_get_max_orders_for_day', '', $timestamp );
		}

		$timestamp_adjusted = $timestamp + Orderable_Timings::get_timezone_offset( $timestamp );
		$day_number         = absint( date( 'w', $timestamp_adjusted ) );

		if ( empty( $open_hours_settings[ $day_number ] ) || ! isset( $open_hours_settings[ $day_number ]['max_orders'] ) || '' === $open_hours_settings[ $day_number ]['max_orders'] ) {
			return apply_filters( 'orderable_get_max_orders_for_day', '', $timestamp );
		}

		$max_orders = absint( $open_hours_settings[ $day_number ]['max_orders'] );

		return apply_filters( 'orderable_get_max_orders_for_day', $max_orders, $timestamp );
	}

	/**
	 * Get orders remaining for day.
	 *
	 * Returns true when the Max Orders (Slot) field is empty.
	 *
	 * @param int    $timestamp          The timestamp.
	 * @param string $type               The service type: `delivery` or `pickup`.
	 * @param array  $time_slot_settings The time slot settings.
	 *
	 * @return int|true
	 */
	public static function get_orders_remaining_for_time_slot( $timestamp, $type, $time_slot_settings ) {
		$max_orders = isset( $time_slot_settings['max_orders'] ) ? $time_slot_settings['max_orders'] : '';

		if ( empty( $max_orders ) ) {
			// phpcs:ignore WooCommerce.Commenting.CommentHooks
			return apply_filters( 'orderable_get_orders_remaining_for_time_slot', true, $timestamp, $type, $time_slot_settings, null );
		}

		$max_orders = absint( $max_orders );

		$statuses = array_filter(
			array_keys( wc_get_order_statuses() ),
			function ( $status_key ) {
				$filter_out_statuses = array(
					'wc-cancelled',
					'wc-refunded',
					'wc-failed',
				);

				return ! in_array( $status_key, $filter_out_statuses, true );
			}
		);

		/**
		 * Filter order statuses used to retrieve the remaining orders for time slot.
		 *
		 * @since 1.13.0
		 * @hook orderable_get_orders_remaining_order_statuses
		 * @param  array  $statuses   The order statuses to retrieve the orders.
		 * @param  string $type       The service type: `delivery` or `pickup`.
		 * @param  string $timestamp  The timestamp.
		 * @param  int    $max_orders The max orders for slot.
		 * @return array New value
		 */
		$statuses = apply_filters( 'orderable_get_orders_remaining_order_statuses', $statuses, $type, $timestamp, $max_orders );

		if ( OrderUtil::custom_orders_table_usage_is_enabled() ) {
			$args = array(
				'return'     => 'ids',
				'meta_query' => array( // phpcs:ignore WordPress.DB.SlowDBQuery
					array(
						'key'   => '_orderable_order_timestamp',
						'value' => $timestamp,
					),
					array(
						'key'   => '_orderable_service_type',
						'value' => $type,
					),
				),
			);

			if ( is_array( $statuses ) && ! empty( $statuses ) ) {
				$args['status'] = $statuses;
			}

			$orders = wc_get_orders( $args );

			$orders_count = is_array( $orders ) ? count( $orders ) : 0;
		} else {
			global $wpdb;

			$statuses_placeholders = join( ', ', array_fill( 0, count( $statuses ), '%s' ) );
			$prepared_values       = array_merge( array( $timestamp, $type ), $statuses );

			$orders_count = $wpdb->get_var(
				$wpdb->prepare( // phpcs:ignore WordPress.DB.PreparedSQLPlaceholders
					"SELECT COUNT(*)
					FROM $wpdb->postmeta as m1
					INNER JOIN $wpdb->postmeta m2 ON m1.post_id = m2.post_id
					INNER JOIN $wpdb->posts posts ON m1.post_id = posts.ID
					WHERE m1.meta_key = '_orderable_order_timestamp'
					AND m1.meta_value = %d
					AND m2.meta_key = '_orderable_service_type'
					AND m2.meta_value = %s
					AND posts.post_status IN ( $statuses_placeholders )", // phpcs:ignore WordPress.DB.PreparedSQL
					$prepared_values
				)
			);

			$orders_count = is_wp_error( $orders_count ) || ! is_numeric( $orders_count ) ? 0 : absint( $orders_count );
		}

		$remaining = $max_orders - $orders_count;

		/**
		 * Filter the orders remaining for time slot.
		 *
		 * @since 1.0.0
		 * @hook orderable_get_orders_remaining_for_time_slot
		 * @param  int|true $remaining          The number of orders remaining for the day or `true` when Max Orders (Slot) field is empty.
		 * @param  int      $timestamp          The timestamp.
		 * @param  string   $type               The service type: `delivery` or `pickup`.
		 * @param  array    $time_slot_settings The time slot settings.
		 * @param  int|null $orders_count       The number of the orders for the day or `null` when Max Orders (Slot) field is empty.
		 * @return int New value
		 */
		return apply_filters( 'orderable_get_orders_remaining_for_time_slot', $remaining, $timestamp, $type, $time_slot_settings, $orders_count );
	}
}
