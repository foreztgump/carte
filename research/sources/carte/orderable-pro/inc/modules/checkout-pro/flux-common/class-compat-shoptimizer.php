<?php
/**
 * Iconic_Flux_Compat_Shoptimizer.
 *
 * Compatibility with Shoptimizer.
 *
 * @package Iconic_Flux
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( class_exists( 'Iconic_Flux_Compat_Shoptimizer' ) ) {
	return;
}

/**
 * Iconic_Flux_Compat_Shoptimizer.
 *
 * @class    Iconic_Flux_Compat_Shoptimizer.
 * @version  2.0.0.0
 * @package  Iconic_Flux
 */
class Iconic_Flux_Compat_Shoptimizer {
	/**
	 * Run.
	 */
	public static function run() {
		add_action( 'wp', array( __CLASS__, 'compat_shoptimizer' ) );
	}

	/**
	 * Shoptimizer compatibility.
	 */
	public static function compat_shoptimizer() {
		if ( ! function_exists( 'shoptimizer_get_option' ) || ( class_exists( 'Iconic_Flux_Flux' ) && ! Iconic_Flux_Flux::is_checkout() || ! Orderable_Checkout_Pro::is_checkout_page() ) ) {
			return;
		}

		remove_action( 'wp_head', 'ccfw_criticalcss', 5 );
		remove_action( 'woocommerce_before_cart', 'shoptimizer_cart_progress' );
		remove_action( 'woocommerce_before_checkout_form', 'shoptimizer_cart_progress', 5 );
	}
}
