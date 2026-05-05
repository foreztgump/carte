<?php
/**
 * Multi Location AJAX.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Orderable_Multi_Location_Pro_Ajax class.
 */
class Orderable_Multi_Location_Pro_Ajax {
	/**
	 * Init.
	 *
	 * @return void
	 */
	public static function run() {
		self::add_ajax_events();
	}

	/**
	 * Hook in methods - uses WordPress ajax handlers (admin-ajax).
	 */
	public static function add_ajax_events() {
		// Example: `opml_{event} => nopriv`.
		$ajax_events = array(
			'search_location_by_postcode' => true,
			'save_location'               => true,
			'get_postcode_from_coords'    => true,
		);

		foreach ( $ajax_events as $ajax_event => $nopriv ) {
			add_action( 'wp_ajax_opml_' . $ajax_event, array( __CLASS__, $ajax_event ) );

			if ( $nopriv ) {
				add_action( 'wp_ajax_nopriv_opml_' . $ajax_event, array( __CLASS__, $ajax_event ) );
			}
		}
	}

	/**
	 * Search stores by Postcode.
	 *
	 * @return void
	 */
	public static function search_location_by_postcode() {
		$postcode = filter_input( INPUT_POST, 'postcode' );

		if ( empty( $postcode ) ) {
			wp_send_json_error();
		}

		$locations_data = Orderable_Multi_Location_Pro_Search::get_locations_for_postcode( $postcode );

		if ( empty( $locations_data ) ) {
			wp_send_json_error(
				array(
					'message' => esc_html__( 'No locations found.', 'orderable-pro' ),
				)
			);
		}

		$locations_allowed_for_delivery = (array) $locations_data['delivery'];
		$locations_allowed_for_pickup   = (array) $locations_data['pickup'];
		$locations                      = (array) $locations_data['locations'];
		$matching_location_ids          = (array) $locations_data['matching_location_ids'];

		if ( empty( $locations_allowed_for_delivery ) && empty( $locations_allowed_for_pickup ) ) {
			wp_send_json_error(
				array(
					'message' => esc_html__( 'No locations found offering delivery or pickup.', 'orderable-pro' ),
				)
			);
		}

		ob_start();
		include Orderable_Helpers::get_template_path( 'templates/postcode-search-result.php', 'multi-location-pro', true );
		$html = ob_get_clean();

		wp_send_json_success(
			array(
				'html' => $html,
			)
		);
	}

	/**
	 * Save location information in the session.
	 *
	 * @return void
	 */
	public static function save_location() {
		$location_id = filter_input( INPUT_POST, 'location_id' );
		$type        = filter_input( INPUT_POST, 'type' );
		$postcode    = filter_input( INPUT_POST, 'postcode' );
		self::save_customer( $postcode );

		if ( WC()->session->get( 'orderable_multi_location_id' ) !== $location_id ) {
			// delete transient to avoid getting data from other location.
			delete_transient( 'shipping-transient-version' );
		}

		WC()->session->set( 'orderable_multi_location_id', $location_id );
		WC()->session->set( 'orderable_multi_location_postcode', $postcode );
		WC()->session->set( 'orderable_multi_location_delivery_type', $type );

		$updated_shipping_method = false;

		if ( $type ) {
			$shipping_methods = Orderable_Multi_Location_Pro_Search::get_allowed_shipping_methods_for_address( WC()->countries->get_base_country(), '', '', $postcode );
			foreach ( $shipping_methods as $zone_id => $methods ) {
				foreach ( $methods as $method ) {
					$is_pickup = Orderable_Services::is_pickup_method( $method );

					if ( ( 'delivery' === $type && ! $is_pickup ) || ( 'pickup' === $type && $is_pickup ) ) {
						$updated_shipping_method = $method;
						break;
					}
				}
			}
		}

		if ( $updated_shipping_method ) {
			WC()->session->set( 'chosen_shipping_methods', array( $updated_shipping_method ) );
		}

		wp_send_json_success(
			array(
				'updated_shipping_method' => $updated_shipping_method,
			)
		);
	}

	/**
	 * Get postcode from Coordinates.
	 *
	 * @return void
	 */
	public static function get_postcode_from_coords() {
		$apikey = Orderable_Settings::get_setting( 'integrations_integrations_google_api_key' );
		$lat    = filter_input( INPUT_POST, 'lat' );
		$long   = filter_input( INPUT_POST, 'long' );

		if ( empty( $apikey ) || empty( $long ) || empty( $lat ) ) {
			wp_send_json_error();
		}

		$url = sprintf( 'https://maps.googleapis.com/maps/api/geocode/json?latlng=%f,%f&key=%s', $lat, $long, $apikey );

		$response = wp_remote_get( $url );
		$response = wp_remote_retrieve_body( $response );

		if ( empty( $response ) ) {
			wp_send_json_error();
		}

		$response = json_decode( $response, true );

		if ( empty( $response ) || empty( $response['results'] ) || empty( $response['results'][0] ) ) {
			wp_send_json_error();
		}

		$address_components = $response['results'][0]['address_components'];

		$postcode = '';
		foreach ( $address_components as $component ) {
			if ( in_array( 'postal_code', $component['types'], true ) ) {
				$postcode = $component['long_name'];
			}
		}

		wp_send_json_success(
			array(
				'postcode' => $postcode,
			)
		);
	}

	/**
	 * Save customer data.
	 *
	 * @param string $postcode Postcode.
	 *
	 * @return void
	 */
	public static function save_customer( $postcode ) {
		if ( empty( $postcode ) ) {
			return;
		}

		// Start session if it doesn't already exist.
		if ( ! WC()->session->has_session() ) {
			WC()->session->set_customer_session_cookie( true );
		}

		$customer = WC()->customer;

		$customer->set_shipping_postcode( $postcode );
		if ( 'billing' === get_option( 'woocommerce_ship_to_destination' ) || 'billing_only' === get_option( 'woocommerce_ship_to_destination' ) ) {
			$customer->set_billing_postcode( $postcode );
		}

		$customer->save();
	}
}
