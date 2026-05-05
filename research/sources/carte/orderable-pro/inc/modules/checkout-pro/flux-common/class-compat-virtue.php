<?php
/**
 * Iconic_Flux_Compat_Virtue.
 *
 * Compatibility with Virtue.
 *
 * @package Iconic_Flux
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( class_exists( 'Iconic_Flux_Compat_Virtue' ) ) {
	return;
}

/**
 * Iconic_Flux_Compat_Virtue.
 *
 * @class    Iconic_Flux_Compat_Virtue.
 * @version  2.0.0.0
 * @package  Iconic_Flux
 */
class Iconic_Flux_Compat_Virtue {
	/**
	 * Run.
	 */
	public static function run() {
		add_action( 'wp', array( __CLASS__, 'compat_virtue' ) );
	}

	/**
	 * Virtue makes use this concept: http://scribu.net/wordpress/theme-wrappers.html
	 * Disable theme wrapper as we don't need theme's header and footer on checkout page.
	 */
	public static function compat_virtue() {
		if ( ! class_exists( 'Kadence_Wrapping' ) || ( class_exists( 'Iconic_Flux_Flux' ) && ! Iconic_Flux_Flux::is_checkout() || ! Orderable_Checkout_Pro::is_checkout_page() ) ) {
			return;
		}

		remove_filter( 'template_include', array( 'Kadence_Wrapping', 'wrap' ), 101 );
	}
}
