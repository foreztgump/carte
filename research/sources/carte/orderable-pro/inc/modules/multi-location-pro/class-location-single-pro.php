<?php
/**
 * Single location class (Pro).
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

use Automattic\WooCommerce\Utilities\OrderUtil;

/**
 * Single location class (Pro).
 */
class Orderable_Location_Single_Pro extends Orderable_Location_Single {
	/**
	 * Constructor.
	 *
	 * @param int|array|null|Orderable_Location_Single $location Location ID or row data.
	 */
	public function __construct( $location = null ) {
		if ( is_numeric( $location ) ) {
			// If $location is numeric, it is either a location_id from the wp_orderable_locations table, or a post_id from the wp_posts table.
			// First we check if a location exists with that ID.
			// If not, we check if a location exists with that post_id.

			$location_data = Orderable_Multi_Location_Pro_Helper::get_location_data_by( 'location_id', $location );

			if ( empty( $location_data ) ) {
				$location_data = Orderable_Multi_Location_Pro_Helper::get_location_data_by( 'post_id', $location );
			}

			if ( ! empty( $location_data ) ) {
				$location = $location_data;
			}
		} elseif ( is_a( $location, 'Orderable_Location_Single' ) ) {
			// Upgrade an Orderable_Location_Single object to an Orderable_Location_Single_Pro object.

			$location = $location->location_data;
		}

		parent::__construct( $location );
	}

	/**
	 * Check if the location is paused to receive orders.
	 *
	 * @param string $service_type It can be `delivery` or `pickup`. Default: delivery.
	 * @return boolean
	 */
	public function is_paused( $service_type = 'delivery' ) {
		return get_transient( $this->get_status_transient_key( $service_type . '-paused' ) );
	}

	/**
	 * Get the transient key for location status.
	 *
	 * @param string $status The location status.
	 * @return string
	 */
	protected function get_status_transient_key( $status ) {
		$transient_key = '';

		if ( empty( $this->get_location_id() ) || empty( $status ) ) {
			return $transient_key;
		}

		return 'orderable_location_' . $this->get_location_id() . '_status_orders_' . $status;
	}

	/**
	 * Get the location status.
	 *
	 * @return string
	 */
	public function get_status() {
		$is_delivery_paused = $this->is_paused( 'delivery' );
		$is_pickup_paused   = $this->is_paused( 'pickup' );

		if ( $is_delivery_paused && $is_pickup_paused ) {
			return __( 'Paused', 'orderable-pro' );
		}

		if ( $is_delivery_paused && ! $is_pickup_paused ) {
			return $this->is_service_enabled( 'pickup' ) ? __( 'Open for Pickup', 'orderable-pro' ) : __( 'Paused', 'orderable-pro' );
		}

		if ( ! $is_delivery_paused && $is_pickup_paused ) {
			return $this->is_service_enabled( 'delivery' ) ? __( 'Open for Delivery', 'orderable-pro' ) : __( 'Paused', 'orderable-pro' );
		}

		$today = new DateTime( 'now', wp_timezone() );

		$location_open_hours = $this->get_open_hours();

		// w: Numeric representation of the day of the week (0 (for Sunday) through 6 (for Saturday)).
		$week_day = $today->format( 'w' );

		if ( empty( $location_open_hours[ $week_day ]['enabled'] ) ) {
			return __( 'Closed', 'orderable-pro' );
		}

		$location_open_from = new DateTime( 'now', wp_timezone() );
		$location_open_to   = new DateTime( 'now', wp_timezone() );

		$from_time = Orderable_Timings::convert_time_to_24_hour( $location_open_hours[ $week_day ]['from'] );
		$to_time   = Orderable_Timings::convert_time_to_24_hour( $location_open_hours[ $week_day ]['to'] );

		$location_open_from->setTime( $from_time['hour'], $from_time['minute'] );
		$location_open_to->setTime( $to_time['hour'], $to_time['minute'] );

		if ( $today->getTimestamp() >= $location_open_from->getTimestamp() && $today->getTimestamp() <= $location_open_to->getTimestamp() ) {
			return __( 'Open', 'orderable-pro' );
		}

		return __( 'Closed', 'orderable-pro' );
	}

	/**
	 * Get formatted services.
	 *
	 * @return string
	 */
	public function get_formatted_services() {
		$services = $this->get_services();
		$services = array_map( 'ucfirst', $services );

		return ( $services ) ? join( ', ', $services ) : __( 'N/A', 'orderable-pro' );
	}

	/**
	 * Get orders remaining for a date.
	 *
	 * @param int $timestamp Timestamp (GMT).
	 *
	 * @return void
	 */
	public function get_orders_remaining_for_date( $timestamp ) {
		$max_orders_for_day = $this->get_max_orders_for_day( $timestamp );

		if ( empty( $max_orders_for_day ) ) {
			return apply_filters( 'orderable_get_orders_remaining_for_date', true, $timestamp, $max_orders_for_day, null );
		}

		global $wpdb;

		$start = strtotime( 'today', $timestamp );
		$end   = strtotime( 'tomorrow', $start );

		if ( OrderUtil::custom_orders_table_usage_is_enabled() ) {
			$get_orders_args = array(
				'return'     => 'ids',
				'limit'      => 500, // upper limit to prevent crashing the site.
				'meta_query' => array( // phpcs:ignore WordPress.DB.SlowDBQuery
					array(
						'key'     => '_orderable_order_timestamp',
						'compare' => 'BETWEEN',
						'value'   => array( $start, $end ),
					),
				),
			);

			/**
			 * Filter the query args used to retrieve the remaining
			 * order for the date.
			 *
			 * @since 1.8.3
			 * @hook orderable_get_orders_remaining_for_date_query_args
			 * @param  array      $get_orders_args    The args used in wc_get_orders.
			 * @param  int        $timestamp          The Timestamp (GMT).
			 * @param  int|string $max_orders_for_day The max orders for day.
			 * @return array New value
			 */
			$get_orders_args = apply_filters( 'orderable_get_orders_remaining_for_date_query_args', $get_orders_args, $timestamp, $max_orders_for_day );

			$orders = wc_get_orders( $get_orders_args );

			$orders_count = is_array( $orders ) ? count( $orders ) : 0;
		} else {
			$sql = "SELECT 
				COUNT(*)
			FROM 
				{$wpdb->postmeta}
			WHERE 
				meta_key = '_orderable_order_timestamp'
			AND 
				meta_value BETWEEN %d AND %d";

			$orders_count = $wpdb->get_var(
				$wpdb->prepare(
					$sql, // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
					$start,
					$end
				)
			);
		}

		$orders_count = ! is_numeric( $orders_count ) ? 0 : absint( $orders_count );
		$remaining    = $max_orders_for_day - $orders_count;

		return apply_filters( 'orderable_get_orders_remaining_for_date', $remaining, $timestamp, $max_orders_for_day, $orders_count );
	}

	/**
	 * Get max orders for day from settings.
	 *
	 * @param $timestamp
	 *
	 * @return int|string
	 * @throws Exception
	 */
	public function get_max_orders_for_day( $timestamp ) {
		if ( ! $timestamp ) {
			return $timestamp;
		}

		$open_hours_settings = $this->get_open_hours();

		if ( empty( $open_hours_settings ) ) {
			return apply_filters( 'orderable_get_max_orders_for_day', '', $timestamp );
		}

		$timestamp_adjusted = Orderable_Timings::get_timestamp_adjusted( $timestamp );
		$day_number         = absint( date( 'w', $timestamp_adjusted ) );

		if ( empty( $open_hours_settings[ $day_number ] ) || ! isset( $open_hours_settings[ $day_number ]['max_orders'] ) || '' === $open_hours_settings[ $day_number ]['max_orders'] ) {
			return apply_filters( 'orderable_get_max_orders_for_day', '', $timestamp );
		}

		$max_orders = absint( $open_hours_settings[ $day_number ]['max_orders'] );

		return apply_filters( 'orderable_get_max_orders_for_day', $max_orders, $timestamp );
	}

	/**
	 * Get slots with time slots.
	 *
	 * @param int    $timestamp Timestamp (GMT).
	 * @param string $type      Service type (delivery|pickup).
	 *
	 * @return array
	 * @throws Exception
	 */
	public function get_slots( $timestamp, $type = 'delivery' ) {
		$slots    = array();
		$settings = $this->get_service_hours( $type );

		$current_timestamp = time();
		$time_format       = get_option( 'time_format' );
		$date_time         = Orderable_Timings::get_date_time_by_timestamp( $timestamp );
		$day_number        = $date_time->format( 'w' );
		$lead_time_period  = $this->get_lead_time_period();
		$lead_time         = 'days' !== $lead_time_period ? $this->get_lead_time( true ) : 0;

		foreach ( $settings as $setting_key => $setting_row ) {
			if ( ! isset( $setting_row['days'] ) || ! is_array( $setting_row['days'] ) ) {
				continue;
			}

			$days = array_map( 'absint', $setting_row['days'] );

			if ( ! in_array( $day_number, $days ) ) {
				continue;
			}

			if ( 'all-day' === $setting_row['period'] ) {
				$slots = array(
					'all-day' => array(
						'formatted'   => __( 'All Day', 'orderable-pro' ),
						'value'       => 'all-day',
						'timestamp'   => $timestamp,
						'setting_key' => $setting_key,
						'setting_row' => $setting_row,
					),
				);

				break;
			}

			if ( ! isset( $setting_row['frequency'], $setting_row['from'], $setting_row['to'] ) ) {
				continue;
			}

			$frequency = ! empty( $setting_row['frequency'] ) ? $setting_row['frequency'] : 30;

			if ( empty( $setting_row['from'] ) || empty( $setting_row['to'] ) ) {
				continue;
			}

			$from_time = Orderable_Timings::convert_time_to_24_hour( $setting_row['from'] );
			$to_time   = Orderable_Timings::convert_time_to_24_hour( $setting_row['to'] );

			$from = new DateTime( 'now', wp_timezone() );
			$to   = new DateTime( 'now', wp_timezone() );

			$from->setTimestamp( $timestamp )->setTime( $from_time['hour'], $from_time['minute'] );
			$to->setTimestamp( $timestamp )->setTime( $to_time['hour'], $to_time['minute'] );

			// If the end time is less than or equal to the from, then it should be tomorrow.
			if ( $to->getTimestamp() <= $from->getTimestamp() ) {
				$to->modify( '+1 day' );
			}

			$from_date = $from->format( 'd' );

			$range = new DatePeriod(
				$from,
				new DateInterval( sprintf( 'PT%sM', $frequency ) ), // Every x minutes.
				$to
			);

			if ( empty( $range ) ) {
				continue;
			}

			foreach ( $range as $time ) {
				$timestamp        = $time->getTimestamp();
				$date             = $time->format( 'd' );
				$cutoff_timestamp = $timestamp;

				// Deduct cutoff time (minutes).
				if ( ! empty( $lead_time ) || ! empty( $setting_row['cutoff'] ) ) {
					$cutoff_seconds    = (int) $setting_row['cutoff'] * 60;
					$cutoff_timestamp -= $lead_time > $cutoff_seconds ? $lead_time : $cutoff_seconds;
				}

				if ( $date !== $from_date || $cutoff_timestamp <= $current_timestamp ) {
					continue;
				}

				if ( ! apply_filters( 'orderable_time_slot_available', true, $timestamp, $type, $setting_row ) ) {
					// If slot isn't available, skip it.
					continue;
				}

				$time_key           = $time->format( 'Hi' );
				$slots[ $time_key ] = array(
					'formatted'   => $time->format( $time_format ),
					'value'       => $time_key,
					'timestamp'   => $timestamp,
					'setting_key' => $setting_key,
					'setting_row' => $setting_row,
				);
			}
		}

		// Sort slots by time.
		ksort( $slots, 1 );

		return apply_filters( 'orderable_location_get_slots', $slots, $timestamp, $type, $this );
	}

	/**
	 * Get ETA for service type.
	 *
	 * @param string $service_type The service type: delivery or pickup.
	 * @param int    $target_date  The target date in timestamp format to
	 *                             select if available. If not, the closer
	 *                             date will be selected.
	 *
	 * @return false|array
	 */
	public function get_eta( $service_type = 'delivery', $target_date = false ) {
		$service_dates = $this->get_service_dates( $service_type, true );

		if ( empty( $service_dates ) || empty( $service_dates[0] ) ) {
			return false;
		}

		$service_date = $service_dates[0];

		/**
		 * Filter if we should select the ETA target date.
		 *
		 * If true, we check if the target date is available and select it.
		 *
		 * By default, we try to get the same date selected by the user
		 * in the `.orderable-order-timings__date` field on the checkout page.
		 *
		 * @since 1.8.3
		 * @hook orderable_should_select_eta_target_date
		 * @param  bool      $should_select_eta_target_date False if target date is empty or is already selected.
		 * @param  string    $service_type                  `delivery` or `pickup`.
		 * @param  int|false $target_date                   The target date in timestamp format.
		 * @param  array     $service_date                  The selected service date.
		 * @return bool New value
		 */
		$should_select_eta_target_date = apply_filters(
			'orderable_should_select_eta_target_date',
			! empty( $target_date ) && $target_date !== $service_date['timestamp'],
			$service_type,
			$target_date,
			$service_date
		);

		if ( $should_select_eta_target_date ) {
			foreach ( $service_dates as $service_date_item ) {
				if ( $service_date_item['timestamp'] !== $target_date ) {
					continue;
				}

				$service_date = $service_date_item;
				break;
			}
		}

		if ( wp_date( 'Ymd' ) !== wp_date( 'Ymd', $service_date['timestamp'] ) ) {
			return $service_date;
		}

		$first_slot = reset( $service_date['slots'] );

		if ( empty( $first_slot ) ) {
			return false;
		}

		if ( 'time-slots' === $first_slot['setting_row']['period'] ) {
			return $first_slot;
		} else {
			return $service_date;
		}
	}

	/**
	 * Helper function to check whether the location is available for the given shipping method.
	 *
	 * @param string $shipping_method Shipping Method.
	 *
	 * @return bool
	 */
	public function is_available_for_shipping_method( $shipping_method = false ) {
		if ( empty( $shipping_method ) ) {
			$shipping_method = Orderable_Multi_Location_Pro_Helper::get_selected_shipping_method();
		}

		if ( is_numeric( $shipping_method ) ) {
			$shipping_method = Orderable_Location_Zones::get_method_id( $shipping_method );
		}

		if ( empty( $shipping_method ) ) {
			return false;
		}

		if ( Orderable_Services::is_pickup_method( $shipping_method ) ) {
			return $this->is_service_enabled( 'pickup' );
		}

		$available_locations = Orderable_Multi_Location_Pro_Search::get_locations_for_shipping_method( $shipping_method );

		if ( empty( $available_locations ) ) {
			return false;
		}

		$available_location_ids = array();

		foreach ( $available_locations as $location ) {
			$available_location_ids[] = $location->get_location_id();
		}

		return in_array( $this->get_location_id(), $available_location_ids, true );
	}

	/**
	 * Pause orders for today.
	 *
	 * @param string $service_type It can be `delivery` or `pickup`. Default: delivery.
	 * @return bool
	 */
	public function pause_orders_for_today( $service_type = 'delivery' ) {
		$tomorrow = new DateTime( 'tomorrow', wp_timezone() );
		$now      = new DateTime( 'now', wp_timezone() );

		$expiration = $tomorrow->getTimestamp() - $now->getTimestamp();

		/**
		 * Filter the expiration time for pause orders transient.
		 *
		 * @since 1.14.0
		 * @hook orderable_pause_orders_expiration
		 * @param  int                           $expiration   Time until expiration in seconds. Set to 0 for no expiration.
		 * @param  string                        $service_type It can be `delivery` or `pickup`.
		 * @param  Orderable_Location_Single_Pro $location     The location.
		 * @return int New value
		 */
		$expiration = apply_filters( 'orderable_pause_orders_expiration', $expiration, $service_type, $this );

		return set_transient( $this->get_status_transient_key( $service_type . '-paused' ), true, $expiration );
	}

	/**
	 * Resume orders for location.
	 *
	 * @param string $service_type It can be `delivery` or `pickup`. Default: delivery.
	 * @return bool
	 */
	public function resume_orders( $service_type = 'delivery' ) {
		return delete_transient( $this->get_status_transient_key( $service_type . '-paused' ) );
	}
}
