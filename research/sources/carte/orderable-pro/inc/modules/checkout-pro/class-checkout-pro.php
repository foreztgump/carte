<?php

/**
 * Module: Checkout Pro.
 *
 * @package Orderable/Classes
 */
defined( 'ABSPATH' ) || exit;

/**
 * Checkout module class.
 */
class Orderable_Checkout_Pro {
	/**
	 * Init.
	 */
	public static function run() {
		self::load_classes();

		if ( Orderable_Checkout_Pro_Flux_Compat::is_flux_checkout_active() ) {
			return;
		}

		$max_priority = defined( 'PHP_INT_MAX' ) ? PHP_INT_MAX : 2147483647;

		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'dequeue_wc_styles' ), 5 );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'frontend_assets' ), $max_priority );
		add_filter( 'orderable_styles', array( __CLASS__, 'inline_styles' ) );
		add_action( 'init', array( __CLASS__, 'register_blocks' ) );
	}

	/**
	 * Load classes.
	 */
	public static function load_classes() {
		require_once ORDERABLE_PRO_MODULES_PATH . 'checkout-pro/class-checkout-pro-flux-compat.php';

		$classes = array(
			'checkout-pro-settings'    => 'Orderable_Checkout_Pro_Settings',
			'checkout-pro-flux-compat' => 'Orderable_Checkout_Pro_Flux_Compat',
		);

		if ( ! Orderable_Checkout_Pro_Flux_Compat::is_flux_checkout_active() ) {
			$classes['checkout-pro-override-checkout'] = 'Orderable_Checkout_Pro_Override_Checkout';
		}

		Orderable_Helpers::load_classes( $classes, 'checkout-pro', ORDERABLE_PRO_MODULES_PATH );
	}

	/**
	 * Enqueue frontend assets.
	 */
	public static function frontend_assets() {
		if ( is_admin() || ! self::is_checkout_page() || is_wc_endpoint_url( 'order-received' ) || is_wc_endpoint_url( 'order-pay' ) ) {
			return;
		}

		$override_checkout = Orderable_Settings::get_setting( 'checkout_general_override_checkout' );

		if ( ! $override_checkout ) {
			return;
		}

		global $wp_scripts, $wp_styles;

		foreach ( $wp_scripts->queue as $key => $name ) {
			$src = $wp_scripts->registered[ $name ]->src;
			if ( strpos( $src, '/themes/' ) ) {
				wp_dequeue_script( $name );
			}
		}

		foreach ( $wp_styles->queue as $key => $name ) {
			$src = $wp_styles->registered[ $name ]->src;
			// The twenty-x themes have custom CSS within woo.
			if ( strpos( $src, '/themes/' ) || strpos( $src, '/twenty' ) ) {
				wp_dequeue_style( $name );
			}
		}

		$suffix     = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';
		$suffix_css = ( is_rtl() ? '-rtl' : '' ) . $suffix;

		// Styles.
		wp_enqueue_style( 'orderable-checkout-pro', ORDERABLE_PRO_URL . 'inc/modules/checkout-pro/assets/frontend/css/checkout-pro' . $suffix_css . '.css', array(), ORDERABLE_PRO_VERSION );

		// Scripts.
		wp_enqueue_script( 'orderable-checkout-pro', ORDERABLE_PRO_URL . 'inc/modules/checkout-pro/assets/frontend/js/main' . $suffix . '.js', array( 'jquery', 'wc-checkout', 'wp-hooks' ), ORDERABLE_PRO_VERSION, true );

		wp_localize_script(
			'orderable-checkout-pro',
			'orderable_checkout_pro_params',
			array(
				'i18n'                            => array(
					'shipping_title' => esc_html__( 'Shipping', 'orderable-pro' ),
				),
				'woocommerce_ship_to_destination' => get_option( 'woocommerce_ship_to_destination' ),
			)
		);

		do_action( 'orderable_pro_checkout_assets' );
	}

	/**
	 * Style checkbox/radio buttons with brand color.
	 *
	 * @param string $styles
	 *
	 * @return string
	 */
	public static function inline_styles( $styles ) {
		$brand_color = Orderable_Settings::get_setting( 'style_style_color' );

		$styles .= 'body.woocommerce-checkout #customer_details .orderable-checkout__shipping-table td input[type=radio]:checked+label:after, body.woocommerce-checkout #payment .payment_methods>li:not(.woocommerce-notice) input[type=radio]:checked+label:after, body.woocommerce-checkout .form-row input[type=radio]:checked+label:after, body.woocommerce-checkout .woocommerce-shipping-methods#shipping_method li input[type=radio]:checked+label:after, body.woocommerce-checkout input[type=radio]:checked+label:after { background-color: %1$s !important; border-color: %1$s !important; }';
		$styles .= 'body.woocommerce-checkout #customer_details .orderable-checkout__shipping-table td input[type=checkbox]:checked:after, body.woocommerce-checkout #payment .payment_methods>li:not(.woocommerce-notice) input[type=checkbox]:checked:after, body.woocommerce-checkout .form-row input[type=checkbox]:checked:after, body.woocommerce-checkout .woocommerce-shipping-methods#shipping_method li input[type=checkbox]:checked:after, body.woocommerce-checkout input[type=checkbox]:checked:after { border-color: %1$s !important; }';

		return sprintf( $styles, $brand_color );
	}

	/**
	 * Dequeue WooCommerce styles when custom checkout is enabled.
	 *
	 * @return void
	 */
	public static function dequeue_wc_styles() {
		if (
			is_admin() ||
			! self::is_checkout_page() ||
			! Orderable_Checkout_Pro_Settings::is_override_checkout() ||
			is_wc_endpoint_url( 'order-received' ) ||
			is_wc_endpoint_url( 'order-pay' )
		) {
			return;
		}

		add_filter( 'woocommerce_enqueue_styles', '__return_empty_array' );
	}

	/**
	 * Check if the current page is the checkout page in WooCommerce.
	 *
	 * It checks if the current page is checkout and has the shortcode
	 * `[woocommerce_checkout]` or if it has the block `woocommerce/checkout`.
	 *
	 * @return bool
	 */
	public static function is_checkout_page() {
		global $post;

		$has_checkout_shortcode = is_checkout() && has_shortcode( $post->post_content, 'woocommerce_checkout' );
		$has_checkout_block     = is_checkout() && has_block( 'woocommerce/checkout', $post );

		return ( $has_checkout_shortcode || $has_checkout_block );
	}

	/**
	 * Register blocks to be used on the WooCommerce Checkout block.
	 *
	 * @return void
	 */
	public static function register_blocks() {
		register_block_type( ORDERABLE_PRO_MODULES_PATH . 'checkout-pro/blocks/tip/build' );
		register_block_type( ORDERABLE_PRO_MODULES_PATH . 'checkout-pro/blocks/location-selector/build' );
		register_block_type( ORDERABLE_PRO_MODULES_PATH . 'checkout-pro/blocks/table/build' );
	}
}
