<?php
/**
 * Iconic_Flux_Compat_Flatsome.
 *
 * Compatibility with Flatsome.
 *
 * @package Iconic_Flux
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( class_exists( 'Iconic_Flux_Compat_Flatsome' ) ) {
	return;
}

/**
 * Iconic_Flux_Compat_Flatsome.
 *
 * @class    Iconic_Flux_Compat_Flatsome.
 * @version  2.0.0.0
 * @package  Iconic_Flux
 */
class Iconic_Flux_Compat_Flatsome {
	/**
	 * Run.
	 */
	public static function run() {
		add_action( 'wp', array( __CLASS__, 'compat_flatsome' ) );
	}

	/**
	 * Disable flatsome customisations.
	 */
	public static function compat_flatsome() {
		if ( ! function_exists( 'flatsome_google_fonts_lazy' ) || ( class_exists( 'Iconic_Flux_Flux' ) && ! Iconic_Flux_Flux::is_checkout() || ! Orderable_Checkout_Pro::is_checkout_page() ) ) {
			return;
		}

		remove_action( 'wp_head', 'flatsome_google_fonts_lazy', 10 );
		remove_action( 'wp_head', 'flatsome_custom_css', 100 );
		remove_action( 'wp_footer', 'flatsome_mobile_menu', 7 );
	}
}
