<?php
/**
 * Iconic_Flux_Compat_Martfury.
 *
 * Compatibility with Martfury.
 *
 * @package Iconic_Flux
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( class_exists( 'Iconic_Flux_Compat_Martfury' ) ) {
	return;
}

/**
 * Iconic_Flux_Compat_Martfury.
 *
 * @class    Iconic_Flux_Compat_Martfury.
 * @version  2.0.0.0
 * @package  Iconic_Flux
 */
class Iconic_Flux_Compat_Martfury {
	/**
	 * Run.
	 */
	public static function run() {
		add_action( 'wp', array( __CLASS__, 'compat_martfury' ) );
	}

	/**
	 * Martfury theme compatibility.
	 */
	public static function compat_martfury() {
		if ( ! function_exists( 'martfury_quick_view_modal' ) || ( class_exists( 'Iconic_Flux_Flux' ) && ! Iconic_Flux_Flux::is_checkout() || ! Orderable_Checkout_Pro::is_checkout_page() ) ) {
			return;
		}

		global $martfury_mobile;

		remove_action( 'wp_footer', 'martfury_quick_view_modal' );
		remove_action( 'wp_footer', 'martfury_off_canvas_mobile_menu' );
		remove_action( 'wp_footer', 'martfury_off_canvas_layer' );
		remove_action( 'wp_footer', 'martfury_off_canvas_user_menu' );
		remove_action( 'wp_footer', 'martfury_back_to_top' );

		if ( $martfury_mobile ) {
			remove_action( 'wp_footer', array( $martfury_mobile, 'mobile_modal_popup' ) );
			remove_action( 'wp_footer', array( $martfury_mobile, 'navigation_mobile' ) );
		}
	}
}
