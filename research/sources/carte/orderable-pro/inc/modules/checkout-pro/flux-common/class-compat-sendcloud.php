<?php
/**
 * Iconic_Flux_Compat_Sendcloud.
 *
 * Compatibility with Sendcloud.
 *
 * @package Iconic_Flux
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( class_exists( 'Iconic_Flux_Compat_Sendcloud' ) ) {
	return;
}

/**
 * Iconic_Flux_Compat_Sendcloud.
 *
 * @class    Iconic_Flux_Compat_Sendcloud.
 * @version  2.0.0.0
 * @package  Iconic_Flux
 */
class Iconic_Flux_Compat_Sendcloud {
	/**
	 * Run.
	 */
	public static function run() {
		add_action( 'init', array( __CLASS__, 'compat_sendcloud' ) );
	}

	/**
	 * Add compatibility for Sendcloud plugin.
	 */
	public static function compat_sendcloud() {
		if ( ! function_exists( 'sendcloudshipping_init' ) ) {
			return;
		}

		add_action( 'woocommerce_checkout_order_review', 'sendcloudshipping_add_service_point_to_checkout', 100 );
	}
}
