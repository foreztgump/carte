<?php
/**
 * Iconic_Flux_Compat_Neve.
 *
 * Compatibility with Neve.
 *
 * @package Iconic_Flux
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( class_exists( 'Iconic_Flux_Compat_Neve' ) ) {
	return;
}

/**
 * Iconic_Flux_Compat_Neve.
 *
 * @class    Iconic_Flux_Compat_Neve.
 * @version  2.0.0.0
 * @package  Iconic_Flux
 */
class Iconic_Flux_Compat_Neve {
	/**
	 * Run.
	 */
	public static function run() {
		add_action( 'wp', array( __CLASS__, 'compat_neve' ), 99 );
	}

	/**
	 * Compatibility with Neve theme.
	 *
	 * @return void
	 */
	public static function compat_neve() {

		if ( ! class_exists( '\\Neve\\Compatibility\\WooCommerce' ) || ( class_exists( 'Iconic_Flux_Flux' ) && ! Iconic_Flux_Flux::is_checkout() || ! Orderable_Checkout_Pro::is_checkout_page() ) ) {
			return;
		}

		Iconic_Flux_Helpers::remove_class_filter( 'woocommerce_before_checkout_form', 'Neve\Compatibility\Woocommerce', 'move_coupon' );
		Iconic_Flux_Helpers::remove_class_filter( 'woocommerce_before_checkout_billing_form', 'Neve\Compatibility\Woocommerce', 'clear_coupon' );
	}
}
