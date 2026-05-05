<?php
/**
 * Module: Addons.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Addons module class.
 */
class Orderable_Addons_Pro {
	/**
	 * Init.
	 */
	public static function run() {
		self::load_classes();
		self::register_shortcodes();

		add_filter( 'orderable_is_settings_page', array( __CLASS__, 'is_product_addon_edit_page' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'admin_assets' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'frontend_assets' ) );
		remove_action( 'admin_menu', array( 'Orderable_Addons', 'add_settings_page' ) );
	}

	/**
	 * Load classes.
	 *
	 * @return void
	 */
	public static function load_classes() {
		include 'class-addons-pro-field-groups.php';
		include 'class-addons-pro-fields.php';
		include 'class-addons-pro-fees.php';

		Orderable_Addons_Pro_Field_Groups::run();
		Orderable_Addons_Pro_Fields::run();
		Orderable_Addons_Pro_Fees::run();
	}

	/**
	 * Determine if is product addon edit page.
	 *
	 * @param bool $is_settings_page Bool passed when hooking into `is_settings_page()`.
	 *
	 * @return bool
	 */
	public static function is_product_addon_edit_page( $is_settings_page = false ) {
		if ( ! is_admin() || ! function_exists( 'get_current_screen' ) ) {
			return $is_settings_page;
		}

		$screen = get_current_screen();

		if ( ! $screen || 'post' !== $screen->base || 'orderable_addons' !== $screen->post_type ) {
			return $is_settings_page;
		}

		return true;
	}

	/**
	 * Enqueue admin assets.
	 */
	public static function admin_assets() {
		if ( ! self::is_product_addon_edit_page() ) {
			return;
		}

		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		// Styles.
		wp_enqueue_style( 'orderable-addons-pro', ORDERABLE_PRO_URL . 'inc/modules/addons-pro/assets/admin/css/addons' . $suffix . '.css', array(), ORDERABLE_PRO_VERSION );
		wp_enqueue_style( 'orderable-pro-vselect', ORDERABLE_PRO_ASSETS_URL . 'vendor/vue-select.min.css', array(), ORDERABLE_PRO_VERSION );

		// Scripts.
		wp_enqueue_media();
		wp_enqueue_script( 'orderable-pro-vuejs', ORDERABLE_PRO_ASSETS_URL . 'vendor/vue.js', array( 'jquery' ), ORDERABLE_PRO_VERSION, true );
		wp_enqueue_script( 'orderable-pro-sortable', ORDERABLE_PRO_ASSETS_URL . 'vendor/Sortable.min.js', array( 'jquery' ), ORDERABLE_PRO_VERSION, true );
		wp_enqueue_script( 'orderable-pro-vuedraggable', ORDERABLE_PRO_ASSETS_URL . 'vendor/vuedraggable.umd.min.js', array( 'jquery' ), ORDERABLE_PRO_VERSION, true );
		wp_enqueue_script( 'orderable-pro-vselect', ORDERABLE_PRO_ASSETS_URL . 'vendor/vue-select.min.js', array( 'jquery' ), ORDERABLE_PRO_VERSION, true );
		wp_enqueue_script( 'orderable-pro-main' );

		wp_enqueue_script(
			'orderable-addons-pro',
			ORDERABLE_PRO_URL . 'inc/modules/addons-pro/assets/admin/js/main' . $suffix . '.js',
			array(
				'jquery',
				'orderable-pro-vuejs',
				'orderable-pro-sortable',
				'orderable-pro-sortable',
				'orderable-pro-vselect',
			),
			ORDERABLE_PRO_VERSION,
			true
		);

		wp_localize_script(
			'orderable-addons-pro',
			'orderable_pro_conditions_params',
			array(
				'ajax_url'                => admin_url( 'admin-ajax.php' ),
				'search_products_nonce'   => wp_create_nonce( 'search-products' ),
				'search_categories_nonce' => wp_create_nonce( 'search-categories' ),
				'i18n'                    => array(
					'new_field' => esc_html__( 'New field', 'orderable-pro' ),
				),
			)
		);
	}

	/**
	 * Enqueue frontend assets.
	 */
	public static function frontend_assets() {
		if ( is_admin() ) {
			return;
		}

		$suffix     = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';
		$suffix_css = ( is_rtl() ? '-rtl' : '' ) . $suffix;

		// Styles.
		wp_enqueue_style( 'orderable-addons-pro', ORDERABLE_PRO_URL . 'inc/modules/addons-pro/assets/frontend/css/addons' . $suffix_css . '.css', array(), ORDERABLE_PRO_VERSION );

		// Scripts.
		wp_enqueue_script( 'orderable-addons-pro', ORDERABLE_PRO_URL . 'inc/modules/addons-pro/assets/frontend/js/main' . $suffix . '.js', array( 'jquery', 'accounting' ), ORDERABLE_PRO_VERSION, true );

		wp_localize_script(
			'orderable-addons-pro',
			'orderable_addons_pro_params',
			array(
				'i18n'     => array(
					// Translators: Field name.
					'field_required'   => __( '%s is a required field', 'orderable-pro' ),
					'make_a_selection' => __( 'Please select some product options before adding this product to your cart.', 'orderable-pro' ),
				),
				'currency' => array(
					'format_num_decimals' => wc_get_price_decimals(),
					'format_symbol'       => get_woocommerce_currency_symbol(),
					'format_decimal_sep'  => esc_attr( wc_get_price_decimal_separator() ),
					'format_thousand_sep' => esc_attr( wc_get_price_thousand_separator() ),
					'format'              => esc_attr( str_replace( array( '%1$s', '%2$s' ), array( '%s', '%v' ), get_woocommerce_price_format() ) ),
				),
			)
		);
	}

	/**
	 * Register Shortcodes.
	 *
	 * @return void
	 */
	public static function register_shortcodes() {
		add_shortcode( 'orderable_addons', array( __CLASS__, 'addons' ) );
	}

	/**
	 * Addons shortcode.
	 *
	 * @return string
	 */
	public static function addons() {
		return Orderable_Addons_Pro_Fields::show_product_fields( false, 'shortcode' );
	}
}
