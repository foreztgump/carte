<?php
/**
 * Module: Timed Products Pro.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Timed Products Pro module class.
 */
class Orderable_Timed_Products_Pro {
	/**
	 * Init.
	 */
	public static function run() {
		self::load_classes();

		if ( is_admin() ) {
			add_filter( 'orderable_is_settings_page', array( __CLASS__, 'is_timed_products_edit_page' ) );
			add_action( 'admin_enqueue_scripts', array( __CLASS__, 'admin_assets' ) );
			remove_action( 'admin_menu', array( 'Orderable_Timed_Products', 'add_settings_page' ) );
		} else {
			add_filter( 'orderable_get_products_by_category', array( __CLASS__, 'hide_products_in_orderble_layout' ), 10, 2 );
			add_action( 'woocommerce_product_query', array( 'Orderable_Timed_Products_Conditions', 'hide_timed_products_in_woocommerce_product_loop' ) );
			add_action( 'woocommerce_before_calculate_totals', array( __CLASS__, 'remove_products_from_cart_if_they_are_hidden' ) );
		}
	}

	/**
	 * Load classes.
	 */
	public static function load_classes() {
		$classes = array(
			'timed-products-pro-admin'      => 'Orderable_Timed_Products_Pro_Admin',
			'timed-products-pro-conditions' => 'Orderable_Timed_Products_Conditions',
		);

		Orderable_Helpers::load_classes( $classes, 'timed-products-pro', ORDERABLE_PRO_MODULES_PATH );
	}

	/**
	 * Enqueue admin assets.
	 */
	public static function admin_assets() {
		if ( ! self::is_timed_products_edit_page() ) {
			return;
		}

		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		// Styles.
		wp_enqueue_style( 'orderable-timed-products-pro', ORDERABLE_PRO_URL . 'inc/modules/timed-products-pro/assets/admin/css/timed-products' . $suffix . '.css', array(), ORDERABLE_PRO_VERSION );
		wp_enqueue_style( 'orderable', ORDERABLE_ASSETS_URL . 'admin/css/main' . $suffix . '.css', array(), ORDERABLE_VERSION );
		wp_enqueue_style( 'orderable-pro-vselect', ORDERABLE_PRO_ASSETS_URL . 'vendor/vue-select.min.css', array(), ORDERABLE_PRO_VERSION );
		wp_enqueue_style( 'vue2-datepicker', ORDERABLE_PRO_ASSETS_URL . 'vendor/vue2-datepicker.css', array(), ORDERABLE_PRO_VERSION );

		// Scripts.
		wp_enqueue_script( 'orderable-pro-vuejs', ORDERABLE_PRO_ASSETS_URL . 'vendor/vue' . $suffix . '.js', array( 'jquery' ), ORDERABLE_PRO_VERSION, true );
		wp_enqueue_script( 'orderable-pro-vselect', ORDERABLE_PRO_ASSETS_URL . 'vendor/vue-select.min.js', array( 'jquery' ), ORDERABLE_PRO_VERSION, true );

		wp_enqueue_script( 'vue2-datepicker', ORDERABLE_PRO_ASSETS_URL . 'vendor/vue2-datepicker.js', array( 'jquery' ), ORDERABLE_PRO_VERSION, true );
		wp_enqueue_script( 'v-tooltip', ORDERABLE_PRO_ASSETS_URL . 'vendor/v-tooltip.umd.min.js', array( 'jquery' ), ORDERABLE_PRO_VERSION, true );
		wp_enqueue_script( 'orderable-pro-timed-product-app', ORDERABLE_PRO_URL . 'inc/modules/timed-products-pro/assets/admin/js/main' . $suffix . '.js', array( 'jquery' ), ORDERABLE_PRO_VERSION, true );
		wp_enqueue_script( 'orderable-pro-main' );

		wp_localize_script(
			'orderable-pro-timed-product-app',
			'orderable_pro_conditions_params',
			array(
				'ajax_url'                => admin_url( 'admin-ajax.php' ),
				'search_products_nonce'   => wp_create_nonce( 'search-products' ),
				'search_categories_nonce' => wp_create_nonce( 'search-categories' ),
				'days'                    => array(
					'Mon' => esc_html__( 'Monday', 'orderable-pro' ),
					'Tue' => esc_html__( 'Tuesday', 'orderable-pro' ),
					'Wed' => esc_html__( 'Wednesday', 'orderable-pro' ),
					'Thu' => esc_html__( 'Thursday', 'orderable-pro' ),
					'Fri' => esc_html__( 'Friday', 'orderable-pro' ),
					'Sat' => esc_html__( 'Saturday', 'orderable-pro' ),
					'Sun' => esc_html__( 'Sunday', 'orderable-pro' ),
				),
				'i18n'                    => array(
					'days_select_value' => esc_html__( '-- Select --', 'orderable-pro' ),
					'from'              => esc_html__( 'From', 'orderable-pro' ),
					'to'                => esc_html__( 'To', 'orderable-pro' ),
					'date'              => esc_html__( 'Date', 'orderable-pro' ),
					'date_validation'   => esc_html__( 'From date cannot be less than/equal to To date', 'orderable-pro' ),
					'time_validation'   => esc_html__( 'From time cannot be less than/equal to To time', 'orderable-pro' ),
				),
			)
		);
	}

	/**
	 * Determine if it is product addon edit page.
	 *
	 * @param bool $is_settings_page Bool passed when hooking into `is_settings_page()`.
	 *
	 * @return bool
	 */
	public static function is_timed_products_edit_page( $is_settings_page = false ) {
		if ( ! is_admin() || ! function_exists( 'get_current_screen' ) ) {
			return $is_settings_page;
		}

		$screen = get_current_screen();

		if ( ! $screen || 'post' !== $screen->base || 'timed_prod_condition' !== $screen->post_type ) {
			return $is_settings_page;
		}

		return true;
	}

	/**
	 * Filter out products based on timed rules.
	 *
	 * @param array $product_categories Products.
	 * @param array $args               Arguments.
	 */
	public static function hide_products_in_orderble_layout( $product_categories, $args ) {
		foreach ( $product_categories as $category_id => &$category ) {

			// Recursion: first unset the products from children array.
			if ( ! empty( $category['category']['children'] ) ) {
				$category['category']['children'] = self::hide_products_in_orderble_layout( $category['category']['children'], $args );
			}

			// Unset the whole category if it matches with the condition.
			if ( ! Orderable_Timed_Products_Conditions::is_product_category_visible_now( $category_id ) ) {
				if ( ! empty( $category['category']['children']['products'] ) ) {
					unset( $product_categories[ $category_id ] );
					continue;
				}
			}

			// Unset individual products.
			foreach ( $category['products'] as $key => $product ) {
				$visible = Orderable_Timed_Products_Conditions::is_product_visible_now( $product );

				if ( ! $visible ) {
					unset( $category['products'][ $key ] );
				}
			}

			// If there are no products left in this category then remove this category.
			if ( empty( $category['products'] ) && empty( $category['category']['children'] ) ) {
				unset( $product_categories[ $category_id ] );
			}
		}

		return $product_categories;
	}

	/**
	 * Remove products from cart if they are Hidden based on timed rules.
	 *
	 * @param WC_Cart $cart Cart object.
	 *
	 * @return void
	 */
	public static function remove_products_from_cart_if_they_are_hidden( $cart ) {
		$cart_items = $cart->get_cart();

		foreach ( $cart_items as $cart_item_key => $cart_item ) {
			if ( ! Orderable_Timed_Products_Conditions::is_product_visible_now( $cart_item['data'] ) ) {
				wc_add_notice(
					sprintf(
						/* translators: %s: product name */
						esc_html__( '%s is not available for ordering now.', 'orderable-pro' ),
						$cart_item['data']->get_name()
					),
					'error'
				);
				$cart->remove_cart_item( $cart_item_key );
			}
		}
	}
}
