<?php
/**
 * Pro auto updates methods.
 *
 * @package Orderable_Pro/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Settings class.
 */
class Orderable_Pro_Auto_Update {
	/**
	 * API Version.
	 *
	 * @var float
	 */
	public static $api_version = 1.1;

	/**
	 * Run.
	 */
	public static function run() {
		add_filter( 'pre_set_site_transient_update_plugins', array( __CLASS__, 'check_for_update' ) );
		add_filter( 'plugins_api', array( __CLASS__, 'plugins_api_call' ), 10, 3 );
	}

	/**
	 * Check for update.
	 *
	 * @param object $checked_data
	 *
	 * @return mixed
	 */
	public static function check_for_update( $checked_data ) {
		global $wp_version;

		if ( ! is_object( $checked_data ) || ! isset( $checked_data->response ) ) {
			return $checked_data;
		}

		$request_data = self::prepare_request( 'plugin_update' );

		if ( false === $request_data ) {
			return $checked_data;
		}

		// Start checking for an update.
		$request_uri = add_query_arg( $request_data, Orderable_Pro_License::$api_url );

		// Check if cached.
		$data = get_site_transient( 'orderable_check_for_plugin_update_' . md5( $request_uri ) );

		if ( $data === false ) {
			$data = wp_remote_get(
				$request_uri,
				array(
					'timeout'    => 20,
					'user-agent' => 'WordPress/' . $wp_version . '; ' . get_bloginfo( 'url' ),
				)
			);

			if ( is_wp_error( $data ) || $data['response']['code'] != 200 ) {
				return $checked_data;
			}

			// Cache for 4 hours.
			set_site_transient( 'orderable_check_for_plugin_update_' . md5( $request_uri ), $data, 4 * HOUR_IN_SECONDS );
		}

		// Get response.
		$response_block = json_decode( $data['body'] );

		if ( ! is_array( $response_block ) || count( $response_block ) < 1 ) {
			return $checked_data;
		}

		// Retrieve the last message within the $response_block.
		$response_block = $response_block[ count( $response_block ) - 1 ];
		$response       = isset( $response_block->message ) ? $response_block->message : '';

		// Feed the update data into WP updater.
		if ( is_object( $response ) && ! empty( $response ) ) {
			$response                                    = self::post_process_response( $response );
			$checked_data->response[ $response->plugin ] = $response;
		}

		return $checked_data;
	}

	/**
	 * Fetches plugin data from orderable.com
	 *
	 * @param false|object|array $def
	 * @param string             $action
	 * @param object             $args
	 *
	 * @return false|object|array
	 */
	public static function plugins_api_call( $def, $action, $args ) {
		// Only for our plugin.
		if ( ! is_object( $args ) || ! isset( $args->slug ) || ORDERABLE_PRO_SLUG !== $args->slug ) {
			return $def;
		}

		// Prepare request.
		$request_data = self::prepare_request( $action, $args );

		if ( $request_data === false ) {
			return new WP_Error( 'plugins_api_failed', __( 'An error occour when try to identify the plugin.', 'orderable-pro' ) . '&lt;/p> &lt;p>&lt;a href=&quot;?&quot; onclick=&quot;document.location.reload(); return false;&quot;>' . __( 'Try again', 'orderable-pro' ) . '&lt;/a>' );
		}

		global $wp_version;

		// Make call to server.
		$request_uri = add_query_arg( $request_data, Orderable_Pro_License::$api_url );
		$data        = wp_remote_get(
			$request_uri,
			array(
				'timeout'    => 20,
				'user-agent' => 'WordPress/' . $wp_version . '; ' . get_bloginfo( 'url' ),
			)
		);

		if ( is_wp_error( $data ) || $data['response']['code'] != 200 ) {
			return new WP_Error( 'plugins_api_failed', __( 'An Unexpected HTTP Error occurred during the API request.', 'orderable-pro' ) . '&lt;/p> &lt;p>&lt;a href=&quot;?&quot; onclick=&quot;document.location.reload(); return false;&quot;>' . __( 'Try again', 'orderable-pro' ) . '&lt;/a>', $data->get_error_message() );
		}

		// Retrieve the last message within the $response_block.
		$response_block = json_decode( $data['body'] );
		$response_block = $response_block[ count( $response_block ) - 1 ];
		$response       = $response_block->message;

		if ( is_object( $response ) && ! empty( $response ) ) {
			$response = self::post_process_response( $response );

			return $response;
		}

		return $def;
	}

	/**
	 * Prepare request arguments
	 *
	 * @param string $action Type of action
	 * @param array  $args   Query arguments for request
	 *
	 * @return array
	 */
	public static function prepare_request( $action, $args = array() ) {
		global $wp_version;

		return array(
			'woo_sl_action'     => $action,
			'version'           => ORDERABLE_PRO_VERSION,
			'product_unique_id' => Orderable_Pro_License::$product_id,
			'licence_key'       => Orderable_Pro_License::get_key(),
			'domain'            => Orderable_Pro_License::get_domain(),
			'wp-version'        => $wp_version,
			'api_version'       => self::$api_version,
		);
	}

	/**
	 * Postprocess update response.
	 *
	 * @param object $response
	 *
	 * @return object
	 */
	public static function post_process_response( $response ) {
		// Include slug and plugin data.
		$response->slug   = ORDERABLE_PRO_SLUG;
		$response->plugin = Orderable_Pro::get_plugin_uri();

		// If sections are being set, force array.
		if ( isset( $response->sections ) ) {
			$response->sections = (array) $response->sections;
		}

		// If banners are being set, force array.
		if ( isset( $response->banners ) ) {
			$response->banners = (array) $response->banners;
		}

		// If icons being set, force array.
		if ( isset( $response->icons ) ) {
			$response->icons = (array) $response->icons;
		}

		return $response;
	}
}
