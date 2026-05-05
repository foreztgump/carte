<?php
/**
 * Iconic_Flux_Compat_Germanized.
 *
 * Compatibility with Germanized.
 *
 * @package Iconic_Flux
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( class_exists( 'Iconic_Flux_Compat_Germanized' ) ) {
	return;
}

/**
 * Iconic_Flux_Compat_Germanized.
 *
 * @class    Iconic_Flux_Compat_Flatsome.
 * @version  2.0.0.0
 * @package  Iconic_Flux
 */
class Iconic_Flux_Compat_Germanized {
	/**
	 * Run.
	 */
	public static function run() {
		add_action( 'init', array( __CLASS__, 'compat_germanized' ) );
	}

	/**
	 * Germanized compatibility.
	 */
	public static function compat_germanized() {
		if ( ! class_exists( 'WooCommerce_Germanized' ) ) {
			return;
		}

		add_action( 'woocommerce_review_order_after_payment', array( __CLASS__, 'compat_gzd_order_review_title' ), 100 );
		remove_action( 'woocommerce_review_order_after_cart_contents', 'woocommerce_gzd_template_checkout_back_to_cart' );
	}


	/**
	 * Add title to review order for consistency.
	 */
	public static function compat_gzd_order_review_title() {
		echo '<h4>' . esc_html__( 'Review Order', 'flux-checkout' ) . '</h4>';
	}
}
