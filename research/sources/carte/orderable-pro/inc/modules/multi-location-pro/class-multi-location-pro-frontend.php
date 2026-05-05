<?php
/**
 * Multi Location Frontend.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Orderable_Multi_Location_Pro_Frontend class.
 */
class Orderable_Multi_Location_Pro_Frontend {
	/**
	 * Init.
	 *
	 * @return void
	 */
	public static function run() {
		add_action( 'init', array( __CLASS__, 'on_init' ) );
	}

	/**
	 * On init.
	 */
	public static function on_init() {
		add_action( 'wp_footer', array( __CLASS__, 'add_popup_tempalte' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'admin_enqueue_assets' ) );
		add_action( 'woocommerce_review_order_before_shipping', array( __CLASS__, 'display_checkout_location_selector' ) );

		// Shortcodes.
		add_shortcode( 'orderable_store_locator', array( __CLASS__, 'shortcode_store_locator' ) );
		add_shortcode( 'orderable_store_mini_locator', array( __CLASS__, 'shortcode_store_mini_locator' ) );
		add_shortcode( 'orderable_store_postcode_locator', array( __CLASS__, 'shortcode_store_postcode_locator' ) );

		add_filter( 'woocommerce_package_rates', array( __CLASS__, 'modify_package_rates' ), 30 );
		add_filter( 'woocommerce_no_shipping_available_html', array( __CLASS__, 'no_shipping_available_html' ), 30 );
		add_filter( 'woocommerce_shipping_chosen_method', array( __CLASS__, 'set_chosen_method_as_default' ), 10, 3 );
	}

	/**
	 * Enqueue assets.
	 *
	 * @return void
	 */
	public static function enqueue_assets() {
		wp_enqueue_style( 'multi-location-pro-css', ORDERABLE_PRO_URL . 'inc/modules/multi-location-pro/assets/frontend/css/multi-locations.css', array(), ORDERABLE_PRO_VERSION );
		wp_enqueue_script( 'multi-location-pro-js', ORDERABLE_PRO_URL . 'inc/modules/multi-location-pro/assets/frontend/js/main.js', array( 'jquery' ), ORDERABLE_PRO_VERSION, true );

		$data = array(
			'location_nonce'         => wp_create_nonce( 'opml-change-location' ),
			'is_multi_location_mode' => Orderable_Multi_Location_Pro::is_multi_location_active(),
			'i18n'                   => array(
				'geolocate_error' => esc_html_x( 'Failed to load geolocation data.', 'Multi-locaiton', 'orderable-pro' ),
				'edit'            => esc_html_x( 'Edit', 'Multi-locaiton', 'orderable-pro' ),
			),
		);
		wp_localize_script( 'multi-location-pro-js', 'orderable_multi_location_params', $data );
		wp_localize_script( 'orderable-pro-location-selector-block-view-script', 'orderable_multi_location_params', $data );
	}

	/**
	 * Enqueue admin assets.
	 *
	 * @return void
	 */
	public static function admin_enqueue_assets() {
		$screen = get_current_screen();

		if ( ! method_exists( $screen, 'is_block_editor' ) || ! $screen->is_block_editor() ) {
			return;
		}

		wp_enqueue_style( 'multi-location-pro', ORDERABLE_PRO_URL . 'inc/modules/multi-location-pro/assets/frontend/css/multi-locations.css', array(), ORDERABLE_PRO_VERSION );
	}

	/**
	 * Add popup template.
	 *
	 * @return void
	 */
	public static function add_popup_tempalte() {
		include Orderable_Helpers::get_template_path( 'templates/store-locator-popup.php', 'multi-location-pro', true );
	}

	/**
	 * Store locator shortcode.
	 *
	 * @return string
	 */
	public static function shortcode_store_locator() {
		ob_start();
		include Orderable_Helpers::get_template_path( 'templates/store-locator-content.php', 'multi-location-pro', true );
		return ob_get_clean();
	}

	/**
	 * Mini store locator shortcode.
	 *
	 * @return string
	 */
	public static function shortcode_store_mini_locator() {
		ob_start();
		self::mini_locator();
		return ob_get_clean();
	}

	/**
	 * Postcode locator shortcode.
	 *
	 * @return string
	 */
	public static function shortcode_store_postcode_locator() {
		ob_start();
		include Orderable_Helpers::get_template_path( 'templates/postcode-locator.php', 'multi-location-pro', true );
		return ob_get_clean();
	}

	/**
	 * Display mini locator.
	 *
	 * @return void
	 */
	public static function mini_locator() {
		$location_data  = Orderable_Multi_Location_Pro::get_selected_location_data_from_session();
		$location       = new Orderable_Location_Single_Pro( isset( $location_data['id'] ) ? $location_data['id'] : null );
		$delivery_type  = ! empty( $location_data['delivery_type'] ) ? $location_data['delivery_type'] : 'notset';
		$location_title = esc_html__( 'Find a Location', 'orderable-pro' );
		$has_data       = ! empty( $location_data['postcode'] ) && Orderable_Multi_Location_Pro_Helper::get_selected_shipping_method();
		$is_available   = true;

		if ( ! empty( $location_data['id'] ) ) {
			$location_title = 'location_name' === Orderable_Settings::get_setting( 'locations_multi_location_mini_locator_title' ) ? $location->get_title() : $location_data['postcode'];
			$is_available   = $has_data ? $location->is_available_for_shipping_method() : true;
		}

		include Orderable_Helpers::get_template_path( 'templates/mini-locator.php', 'multi-location-pro', true );
	}

	/**
	 * Display mini checkout at location selector.
	 *
	 * @return void
	 */
	public static function display_checkout_location_selector() {
		if ( ! Orderable_Multi_Location_Pro::is_multi_location_active() ) {
			return;
		}
		?>
		<tr>
			<th>
				<?php esc_html_e( 'Location', 'orderable-pro' ); ?>
			</th>
			<td>
				<div class="opml-checkout-store-selector">
					<?php
					self::mini_locator();
					?>
				</div>
			</td>
		</tr>
		<?php
	}

	/**
	 * Modify package rates.
	 *
	 * Don't show shipping options if no location has been selected.
	 *
	 * @param  array $rates Array of shipping rate objects.
	 *
	 * @return array
	 */
	public static function modify_package_rates( $rates ) {
		if ( ! Orderable_Checkout_Pro::is_checkout_page() ) {
			return $rates;
		}

		if ( Orderable_Multi_Location_Pro::is_multi_location_active() && empty( Orderable_Multi_Location_Pro::get_selected_location_data_from_session() ) ) {
			return array();
		}

		return $rates;
	}

	/**
	 * Shows when no shipping options are available.
	 *
	 * @param string $html Text string about no shipping options.
	 *
	 * @return string
	 */
	public static function no_shipping_available_html( $html ) {
		// If there is only one location, or a location has been selected, don't show this message.
		if ( ! Orderable_Multi_Location_Pro::is_multi_location_active() || ! empty( Orderable_Multi_Location_Pro::get_selected_location_data_from_session() ) ) {
			return $html;
		}

		return __( 'Please choose a location first to see the available delivery/pickup options.', 'orderable-pro' );
	}

	/**
	 * Set the default shipping method based on the chosen method.
	 *
	 * @param string $default       Default shipping method ID.
	 * @param array  $rates         Array of shipping rates.
	 * @param string $chosen_method Chosen shipping method ID.
	 *
	 * @return string
	 */
	public static function set_chosen_method_as_default( $default, $rates, $chosen_method ) {
		if ( ! empty( $rates[ $chosen_method ] ) ) {
			$default = $chosen_method;
		}

		return $default;
	}
}
