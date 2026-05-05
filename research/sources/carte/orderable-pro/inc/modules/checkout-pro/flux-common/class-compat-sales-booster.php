<?php
/**
 * Iconic_Flux_Compat_Sales_Booster.
 *
 * Compatibility with Sales Booster.
 *
 * @package Iconic_Flux
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( class_exists( 'Iconic_Flux_Compat_Sales_Booster' ) ) {
	return;
}

/**
 * Iconic_Flux_Compat_Sales_Booster.
 *
 * @class    Iconic_Flux_Compat_Sales_Booster.
 * @version  2.0.0.0
 * @package  Iconic_Flux
 */
class Iconic_Flux_Compat_Sales_Booster {
	/**
	 * Run.
	 */
	public static function run() {
		add_action( 'iconic_wsb_supported_hooks', array( __CLASS__, 'v2_hook_support' ) );
	}

	/**
	 * Add Fast Checkout Compatibility.
	 */
	public static function v2_hook_support( $hooks ) {

		foreach ( $hooks as $key => &$hook ) {
			if ( 'woocommerce_after_checkout_form' === $key || $hook['flux_support'] ) {
				continue;
			}

			$hook['flux_support'] = true;
		}

		return $hooks;
	}
}
