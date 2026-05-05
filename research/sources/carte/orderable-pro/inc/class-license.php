<?php
/**
 * Pro license methods.
 *
 * @package Orderable_Pro/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Settings class.
 */
class Orderable_Pro_License {
	/**
	 * License settings key.
	 *
	 * @var string
	 */
	public static $license_key = 'dashboard_license_key';

	/**
	 * API URL.
	 *
	 * @var string
	 */
	public static $api_url = 'https://my.orderable.com/index.php';

	/**
	 * Product ID.
	 *
	 * @var string
	 */
	public static $product_id = 'orderable-pro';

	/**
	 * This domain
	 *
	 * @return string
	 */
	public static function get_domain() {
		$protocol = is_ssl() ? 'https://' : 'http://';

		return str_replace( $protocol, '', get_bloginfo( 'wpurl' ) );
	}

	/**
	 * Run.
	 */
	public static function run() {
		add_filter( 'wpsf_register_settings_orderable', array( __CLASS__, 'register_settings' ), 20 );
		add_filter( 'orderable_settings_validate', array( __CLASS__, 'maybe_activate_license' ), 10 );
		add_filter( 'orderable_settings_validate', array( __CLASS__, 'maybe_deactivate_license' ), 10 );
	}

	/**
	 * Register settings.
	 *
	 * @param array $settings
	 *
	 * @return array
	 */
	public static function register_settings( $settings = array() ) {
		$settings['sections']['license'] = array(
			'tab_id'              => 'dashboard',
			'section_id'          => 'license',
			'section_title'       => __( 'License Settings', 'orderable-pro' ),
			'section_description' => '',
			'section_order'       => 0,
			'fields'              => array(
				array(
					'id'       => 'key',
					'title'    => __( 'License Key', 'orderable-pro' ),
					'subtitle' => __( 'Enter your license key to receive regular updates and support for Orderable.', 'orderable-pro' ),
					'type'     => 'custom',
					'default'  => '',
					'output'   => self::get_license_key_field(),
				),
			),
		);

		return $settings;
	}

	/**
	 * Get license key field.
	 *
	 * @return false|string
	 */
	public static function get_license_key_field() {
		ob_start();

		$key = self::get_key();

		if ( $key ) { ?>
			<input type="text" id="<?php echo esc_attr( self::$license_key ); ?>" class="regular-text" value="<?php echo esc_attr( substr( $key, 0, 8 ) ); ?>-**********-**********" disabled="disabled">
			<button type="submit" name="orderable_deactivate_license" class="orderable-admin-button orderable-admin-button--deactiavte-license"><?php _e( 'Deactivate', 'orderable-pro' ); ?></button>
		<?php } else { ?>
			<input type="text" name="orderable_settings[<?php echo esc_attr( self::$license_key ); ?>]" id="<?php echo esc_attr( self::$license_key ); ?>" placeholder="" class="regular-text">
			<?php
		}

		echo self::get_status_html();

		return ob_get_clean();
	}

	/**
	 * Get license key.
	 *
	 * @return string
	 */
	public static function get_key() {
		return Orderable_Settings::get_setting( self::$license_key );
	}

	/**
	 * Get license status HTML.
	 *
	 * @return string
	 */
	public static function get_status_html() {
		$key = self::get_key();

		if ( ! empty( $key ) ) {
			return '<span class="orderable-license-status orderable-license-status--actived" style="color: #5B841B;margin: 0 10px;">' . __( 'Activated', 'orderable-pro' ) . '</span>';
		} else {
			return '<span class="orderable-license-status orderable-license-status--deactived" style="color: #96680F;margin: 0 10px;">' . __( 'Not Activated', 'orderable-pro' ) . '</span>';
		}
	}

	/**
	 * Maybe activate license.
	 *
	 * @param array $settings
	 *
	 * @return array
	 */
	public static function maybe_activate_license( $settings = array() ) {
		if ( empty( $settings ) ) {
			return $settings;
		}

		$current_key   = self::get_key();
		$submitted_key = isset( $settings[ self::$license_key ] ) ? sanitize_key( trim( $settings[ self::$license_key ] ) ) : false;

		if ( ! $submitted_key ) {
			$settings[ self::$license_key ] = $current_key;

			return $settings;
		}

		if ( $submitted_key === $current_key ) {
			return $settings;
		}

		// Activate.
		$response = self::activate( $submitted_key );

		if ( is_wp_error( $response ) ) {
			$settings[ self::$license_key ] = '';
			add_settings_error( 'orderable_license_key', esc_attr( 'orderable-error' ), $response->get_error_message(), 'error' );
		}

		return $settings;
	}

	/**
	 * Maybe activate license.
	 *
	 * @param array $settings
	 *
	 * @return array
	 */
	public static function maybe_deactivate_license( $settings = array() ) {
		if ( ! isset( $_POST['orderable_deactivate_license'] ) ) {
			return $settings;
		}

		$response = self::deactivate();

		if ( is_wp_error( $response ) ) {
			add_settings_error( 'orderable_license_key', esc_attr( 'orderable-error' ), $response->get_error_message(), 'error' );
		} else {
			$settings[ self::$license_key ] = '';
		}

		return $settings;
	}

	/**
	 * Send API request.
	 *
	 * @param array $args
	 *
	 * @return object|WP_Error
	 */
	public static function send_api_request( $args = array() ) {
		$request_uri = add_query_arg( $args, self::$api_url );
		$data        = wp_remote_get( $request_uri );

		$error = __( 'There was a problem establishing a connection to the licensing server. Please try again in a few minutes.', 'orderable-pro' );

		// error
		if ( is_wp_error( $data ) || $data['response']['code'] != 200 ) {
			return new WP_Error( 'connection_error', $error );
		}

		// check body
		$data_body = json_decode( $data['body'] );
		$data_body = is_array( $data_body ) && isset( $data_body[0] ) ? $data_body[0] : $data_body;

		if ( ! isset( $data_body->status ) ) {
			return new WP_Error( 'connection_error', $error );
		}

		return $data_body;
	}

	/**
	 * Activate a license
	 *
	 * @param string $key
	 *
	 * @return bool|WP_Error
	 */
	public static function activate( $key ) {
		$api_request = self::send_api_request(
			array(
				'woo_sl_action'     => 'activate',
				'licence_key'       => wp_kses_post( $key ),
				'product_unique_id' => self::$product_id,
				'domain'            => self::get_domain(),
			)
		);

		if ( is_wp_error( $api_request ) ) {
			return $api_request;
		}

		if ( $api_request->status == 'success' && ( $api_request->status_code == 's100' || $api_request->status_code == 's101' ) ) {
			return true;
		} else {
			if ( $api_request->message ) {
				$code = ! empty( $api_request->status_code ) ? $api_request->status_code : 'error';

				return new WP_Error( $code, $api_request->message );
			}

			return new WP_Error( 'activation_error', __( 'There was a problem activating the license. Please check your license expiration.', 'orderable-pro' ) );
		}
	}

	/**
	 * Deactivate license on this site
	 *
	 * @return string|WP_Error
	 */
	public static function deactivate() {
		$api_request = self::send_api_request(
			array(
				'woo_sl_action'     => 'deactivate',
				'licence_key'       => wp_kses_post( self::get_key() ),
				'product_unique_id' => self::$product_id,
				'domain'            => self::get_domain(),
			)
		);

		if ( is_wp_error( $api_request ) ) {
			return $api_request;
		}

		if ( 'success' === $api_request->status && 's201' === $api_request->status_code ) {
			return true;
		} elseif ( 'e002' === $api_request->status_code || 'e104' === $api_request->status_code || 'e211' === $api_request->status_code ) {
			return true;
		} else {
			if ( $api_request->message ) {
				$code = ! empty( $api_request->status_code ) ? $api_request->status_code : 'error';

				return new WP_Error( $code, $api_request->message );
			}

			return new WP_Error( 'error', __( 'There was a problem deactivating the licence. Please try again.', 'orderable-pro' ) );
		}
	}
}
