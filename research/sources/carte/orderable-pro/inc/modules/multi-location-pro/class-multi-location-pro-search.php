<?php
/**
 * Multi Location Search.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Orderable_Multi_Location_Pro_Search class.
 */
class Orderable_Multi_Location_Pro_Search {
	/**
	 * Get locations for the given postcode.
	 *
	 * @param string $postcode Postcode.
	 *
	 * @return array.
	 */
	public static function get_locations_for_postcode( $postcode ) {
		$shipping_methods = (array) self::get_allowed_shipping_methods_for_address( WC()->countries->get_base_country(), '', '', $postcode );
		$location_ids     = self::get_locations_for_shipping_zones( array_keys( $shipping_methods ), true );

		$locations                      = Orderable_Multi_Location_Pro_Helper::get_all_locations( $location_ids );
		$locations_allowed_for_pickup   = array();
		$locations_allowed_for_delivery = array();

		foreach ( $locations as $key => $location ) {
			if ( $location->has_service_dates( 'delivery' ) ) {
				$locations_allowed_for_delivery[] = $location->get_location_id();
			}

			if ( $location->has_service_dates( 'pickup' ) ) {
				$locations_allowed_for_pickup[] = $location->get_location_id();
			}
		}

		return array(
			'pickup'                => $locations_allowed_for_pickup,
			'delivery'              => $locations_allowed_for_delivery,
			'locations'             => $locations,
			'matching_location_ids' => $location_ids,
		);
	}


	/**
	 * Is searching.
	 *
	 * @return bool
	 */
	public static function is_searching() {
		$action = filter_input( INPUT_POST, 'action' );
		$debug  = filter_input( INPUT_GET, 'opml_debug' );

		return ( wp_doing_ajax() && 'opml_search_location_by_postcode' === $action ) || $debug;
	}

	/**
	 * Determine allowed shipping methods for the given address.
	 *
	 * @param string $country  Country.
	 * @param string $state    State.
	 * @param string $city     City.
	 * @param string $postcode Postcode.
	 *
	 * @return array|bool
	 */
	public static function get_allowed_shipping_methods_for_address( $country, $state, $city, $postcode ) {
		$methods = array();

		$address = array(
			'country'   => ! empty( $country ) ? $country : WC()->countries->get_base_country(),
			'state'     => $state,
			'postcode'  => $postcode,
			'city'      => $city,
			'address'   => '',
			'address_1' => '', // Provide both address and address_1 for backwards compatibility.
			'address_2' => '',
		);

		$packages = WC()->shipping()->calculate_shipping(
			array(
				array(
					'contents'        => array(),
					'contents_cost'   => 0,
					'applied_coupons' => array(),
					'user'            => array(
						'ID' => get_current_user_id(),
					),
					'destination'     => $address,
					'cart_subtotal'   => 0,
				),
			)
		);

		if ( empty( $packages ) ) {
			return $methods;
		}

		$package = $packages[0];
		$rates   = $package['rates'];
		$zone_id = Orderable_Location_Zones::get_zone_id_matching_package( $package );

		if ( ! $zone_id ) {
			return $methods;
		}

		$methods[ $zone_id ] = array_keys( $rates );

		return $methods;
	}

	/**
	 * Get locations for given shipping method.
	 *
	 * @param string $shipping_method Shipping method.
	 *
	 * @return array|Orderable_Location_Single_Pro[]
	 */
	public static function get_locations_for_shipping_method( $shipping_method ) {
		global $wpdb;

		// Parse the shipping method string to get the method_id and instance_id
		list( $method_id, $instance_id ) = explode( ':', $shipping_method );

		// Orderable methods use the zone ID instead of the instance ID.
		if ( false === strpos( $method_id, 'orderable' ) ) {
			// Prepare the query to get the shipping zone ID for the specified instance_id and method_id
			$zone_id_query = $wpdb->prepare(
				"SELECT zone_id
		FROM {$wpdb->prefix}woocommerce_shipping_zone_methods
		WHERE method_id = %s AND instance_id = %d",
				$method_id,
				$instance_id
			);

			// Execute the query and get the zone ID
			$zone_id = $wpdb->get_var( $zone_id_query );
		} else {
			$zone_id = $instance_id;
		}

		// If no zone ID is found, return an empty array
		if ( null === $zone_id ) {
			return array();
		}

		// Get locations for the shipping zone
		return self::get_locations_for_shipping_zones( array( $zone_id ) );
	}


	/**
	 * Get locations for given shipping zones.
	 *
	 * @param array $shipping_zone_ids Shipping zone IDs.
	 *
	 * @return array|Orderable_Location_Single_Pro[]
	 */
	public static function get_locations_for_shipping_zones( $shipping_zone_ids = array(), $return_ids = false ) {
		if ( empty( $shipping_zone_ids ) || ! is_array( $shipping_zone_ids ) ) {
			return array();
		}

		global $wpdb;
		$locations        = array();
		$cache_key        = 'orderable_locations_for_zones_' . md5( implode( ',', $shipping_zone_ids ) . ( $return_ids ? '_ids' : '' ) );
		$cached_locations = wp_cache_get( $cache_key );

		if ( false !== $cached_locations ) {
			return $cached_locations;
		}

		$zone_ids = implode( ',', array_map( 'intval', $shipping_zone_ids ) );

		$results = $wpdb->get_results(
			"SELECT DISTINCT ol.* FROM {$wpdb->prefix}orderable_locations AS ol
         INNER JOIN {$wpdb->posts} AS p ON ol.post_id = p.ID
         LEFT JOIN {$wpdb->prefix}orderable_location_delivery_zones_lookup AS lz ON ol.location_id = lz.location_id
         LEFT JOIN {$wpdb->prefix}orderable_location_time_slots AS ts ON ol.location_id = ts.location_id
         WHERE (lz.zone_id IN ({$zone_ids}) OR ts.has_zones = 0) AND p.post_status = 'publish'
         ORDER BY ts.has_zones DESC, ol.location_id ASC",
			ARRAY_A
		);

		if ( empty( $results ) || ! is_array( $results ) ) {
			return array();
		}

		foreach ( $results as $row ) {
			$location    = $return_ids ? absint( $row['location_id'] ) : new Orderable_Location_Single_Pro( $row );
			$locations[] = $location;
		}

		wp_cache_set( $cache_key, $locations );

		return $locations;
	}
}
