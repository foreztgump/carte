<?php
/**
 * Iconic_Flux_Compat_Shopkeeper.
 *
 * Compatibility with Shopkeeper.
 *
 * @package Iconic_Flux
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( class_exists( 'Iconic_Flux_Compat_Shopkeeper' ) ) {
	return;
}

/**
 * Iconic_Flux_Compat_Shopkeeper.
 *
 * @class    Iconic_Flux_Compat_Shopkeeper.
 * @version  2.0.0.0
 * @package  Iconic_Flux
 */
class Iconic_Flux_Compat_Shopkeeper {
	/**
	 * Run.
	 */
	public static function run() {
		add_action( 'wp', array( __CLASS__, 'compat_shopkeeper' ) );
	}

	/**
	 * Disable shopkeeper customisations.
	 */
	public static function compat_shopkeeper() {
		if ( ! function_exists( 'shopkeeper_setup' ) || ( class_exists( 'Iconic_Flux_Flux' ) && ! Iconic_Flux_Flux::is_checkout() || ! Orderable_Checkout_Pro::is_checkout_page() ) ) {
			return;
		}

		remove_action( 'wp_head', 'shopkeeper_custom_styles', 99 );
	}
}
