<?php
/**
 * Multi Location Helper function.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Orderable_Multi_Location_Pro_Helper class.
 */
class Orderable_Multi_Location_Pro_Helper {
	/**
	 * Get location data by field.
	 *
	 * @param string $field Field to search by.
	 * @param mixed  $value Value to search for.
	 *
	 * @return array|null
	 */
	public static function get_location_data_by( $field, $value ) {
		$location_data = null;

		if ( empty( $field ) || empty( $value ) ) {
			return $location_data;
		}

		if ( 'location_id' === $field ) {
			$location_data = self::get_location_data_by_location_id( $value );
		} elseif ( 'post_id' === $field ) {
			$location_data = self::get_location_data_by_post_id( $value );
		}

		return $location_data;
	}

	/**
	 * Get location data by location ID.
	 *
	 * @param int $id Location ID.
	 *
	 * @return array|null
	 */
	public static function get_location_data_by_location_id( $id ) {
		global $wpdb;

		$location_data = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT
					*
				FROM
					{$wpdb->orderable_locations}
				WHERE
					location_id = %d",
				$id
			),
			ARRAY_A
		);

		if ( empty( $location_data ) ) {
			$location_data = null;
		}

		return $location_data;
	}

	/**
	 * Get location data by post ID.
	 *
	 * @param int $id Post ID.
	 *
	 * @return array|null
	 */
	public static function get_location_data_by_post_id( $id ) {
		global $wpdb;

		$location_data = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT
					*
				FROM
					{$wpdb->orderable_locations}
				WHERE
					post_id = %d",
				$id
			),
			ARRAY_A
		);

		if ( empty( $location_data ) ) {
			$location_data = null;
		}

		return $location_data;
	}

	/**
	 * Get selected shipping method.
	 *
	 * @param bool $return_instance_id Return just the instance id if true.
	 *
	 * @return string
	 */
	public static function get_selected_shipping_method( $return_instance_id = false ) {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput, WordPress.Security.NonceVerification
		$postcode = $_POST['s_postcode'] ?? $_POST['postcode'] ?? false;

		if ( ! empty( $postcode ) ) {
			$postcode         = sanitize_text_field( wp_unslash( $postcode ) );
			$country          = empty( $_POST['country'] ) ? WC()->countries->get_base_country() : sanitize_text_field( wp_unslash( $_POST['country'] ) ); // phpcs:ignore WordPress.Security.NonceVerification
			$state            = empty( $_POST['state'] ) ? '' : sanitize_text_field( wp_unslash( $_POST['state'] ) ); // phpcs:ignore WordPress.Security.NonceVerification
			$city             = empty( $_POST['city'] ) ? '' : sanitize_text_field( wp_unslash( $_POST['city'] ) ); // phpcs:ignore WordPress.Security.NonceVerification
			$shipping_methods = (array) Orderable_Multi_Location_Pro_Search::get_allowed_shipping_methods_for_address( $country, $state, $city, $postcode );

			foreach ( $shipping_methods as $shipping_method_id => $shipping_method ) {
				if ( self::is_orderable_shipping_method( $shipping_method ) ) {
					return $shipping_method_id;
				}
			}
		}

		if ( empty( WC()->session ) ) {
			return false;
		}

		$choosen_shipping_methods = WC()->session->get( 'chosen_shipping_methods' );
		$method                   = isset( $choosen_shipping_methods[0] ) ? $choosen_shipping_methods[0] : false;

		if ( empty( $method ) || ! $return_instance_id ) {
			return $method;
		}

		if ( ! strpos( $method, ':' ) ) {
			return false;
		}

		$arr = explode( ':', $method );
		return $arr[1];
	}

	/**
	 * Is given shipping method an orderable shipping method.
	 *
	 * @param string $shipping_method_id Shipping Method instance.
	 *
	 * @return bool
	 */
	public static function is_orderable_shipping_method( $shipping_method_id ) {
		if ( is_string( $shipping_method_id ) ) {
			return false !== strpos( $shipping_method_id, 'orderable_pickup' ) || false !== strpos( $shipping_method_id, 'orderable_delivery' );
		}

		if ( ! is_numeric( $shipping_method_id ) ) {
			return false;
		}

		$shipping_method_id = Orderable_Location_Zones::get_method_id( $shipping_method_id );

		return 'orderable_pickup' === $shipping_method_id || 'orderable_delivery' === $shipping_method_id;
	}

	/**
	 * Get main location ID.
	 *
	 * @return int|false
	 */
	public static function get_main_location_id() {
		global $wpdb;

		$transient_key = 'orderable_multi_location_main_location_id';

		$main_location_id = get_transient( $transient_key );

		if ( false !== $main_location_id ) {
			return $main_location_id;
		}

		$main_location_id = $wpdb->get_var(
			"SELECT
				location_id
			FROM
				{$wpdb->orderable_locations}
			WHERE
				is_main_location = 1
			LIMIT
				1
			"
		);

		if ( empty( $main_location_id ) ) {
			return false;
		}

		set_transient( $transient_key, $main_location_id, WEEK_IN_SECONDS );

		return $main_location_id;
	}

	/**
	 * Get all locations.
	 *
	 * @param int[]|false $preferred_location_ids These should be first in the array.
	 *
	 * @return Orderable_Location_Single_Pro[]
	 */
	public static function get_all_locations( $preferred_location_ids = false ) {
		global $wpdb;
		$locations = array();

		$order_by = '';

		if ( is_array( $preferred_location_ids ) && ! empty( $preferred_location_ids ) ) {
			$location_ids = implode( ',', array_map( 'intval', $preferred_location_ids ) );
			/**
			 * We prioritize the locations specified in `$location_ids` variable.
			 * Locations out of this list fallback to 9999 and are shown
			 * after the prioritized locations.
			 *
			 * See:
			 * - https://mariadb.com/kb/en/coalesce/
			 * - https://mariadb.com/kb/en/nullif/
			 * - https://mariadb.com/kb/en/field/
			 */
			$order_by = "COALESCE( NULLIF( FIELD( ol.location_id, {$location_ids} ), 0 ), 9999 ) ASC, ";
		}

		$results = $wpdb->get_results(
			"SELECT ol.* FROM {$wpdb->prefix}orderable_locations AS ol
			INNER JOIN {$wpdb->posts} AS p ON ol.post_id = p.ID
			WHERE p.post_status = 'publish'
			ORDER BY {$order_by}ol.location_id ASC",
			ARRAY_A
		);

		if ( empty( $results ) || ! is_array( $results ) ) {
			// phpcs:ignore WooCommerce.Commenting.CommentHooks
			return apply_filters( 'orderable_all_locations', $locations, $preferred_location_ids );
		}

		foreach ( $results as $row ) {
			$location    = new Orderable_Location_Single_Pro( $row );
			$locations[] = $location;
		}

		/**
		 * Filter all locations.
		 *
		 * @since 1.10.1
		 * @hook orderable_all_locations
		 * @param Orderable_Location_Single_Pro[] $locations              All locations.
		 * @param int[]|false                     $preferred_location_ids Prioritized location IDs.
		 * @return Orderable_Location_Single_Pro[] New value
		 */
		$locations = apply_filters( 'orderable_all_locations', $locations, $preferred_location_ids );

		return $locations;
	}

	/**
	 * Pause orders for all location for today.
	 *
	 * @param string $service_type The type of service: `delivery` or `pickup`.
	 * @return bool Returns true if all locations get paused.
	 */
	public static function pause_orders_all_locations_for_today( $service_type ) {
		$result = [];

		foreach ( self::get_all_locations() as $location ) {
			$result[] = $location->pause_orders_for_today( $service_type );
		}

		return ! in_array( false, $result, true );
	}

	/**
	 * Resume orders for all location for today.
	 *
	 * @param string $service_type The type of service: `delivery` or `pickup`.
	 * @return bool Returns true if all locations get resumed.
	 */
	public static function resume_orders_all_locations_for_today( $service_type ) {
		$result = [];

		foreach ( self::get_all_locations() as $location ) {
			if ( ! $location->is_paused( $service_type ) ) {
				continue;
			}

			$result[] = $location->resume_orders( $service_type );
		}

		return ! in_array( false, $result, true );
	}

	/**
	 * Check if delivery is enabled for at least one location.
	 *
	 * @return boolean
	 */
	public static function is_delivery_enable_at_any_location() {
		foreach ( self::get_all_locations() as $location ) {
			if ( $location->is_service_enabled( 'delivery' ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if pickup is enabled for at least one location.
	 *
	 * @return boolean
	 */
	public static function is_pickup_enable_at_any_location() {
		foreach ( self::get_all_locations() as $location ) {
			if ( $location->is_service_enabled( 'pickup' ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if delivery is paused for at least one location.
	 *
	 * @return boolean
	 */
	public static function is_delivery_paused_at_any_location() {
		foreach ( self::get_all_locations() as $location ) {
			if ( $location->is_paused( 'delivery' ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if pickup is paused for at least one location.
	 *
	 * @return boolean
	 */
	public static function is_pickup_paused_at_any_location() {
		foreach ( self::get_all_locations() as $location ) {
			if ( $location->is_paused( 'pickup' ) ) {
				return true;
			}
		}

		return false;
	}
}
