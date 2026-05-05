<?php
/**
 * Compatiblity with WPC Product Timer plugin.
 *
 * @package Orderable/Classes
 */

/**
 * Compatiblity with WPC Product Timer plugin.
 */
class Orderable_Pro_Wpc_Product_Timer {
	/**
	 * Initialize.
	 */
	public static function run() {
		add_action( 'init', array( __CLASS__, 'hooks' ) );
	}

	/**
	 * Hooks.
	 */
	public static function hooks() {
		global $woopt;

		if ( empty( $woopt ) ) {
			return;
		}

		add_action( 'orderable_pro_after_calculate_totals', array( __CLASS__, 'disable_wpc_get_price_filters' ) );
	}

	/**
	 * Disable filters for WPC Product Timer.
	 *
	 * @return void
	 */
	public static function disable_wpc_get_price_filters() {
		global $woopt;

		remove_filter( 'woocommerce_product_get_regular_price', array( $woopt, 'woopt_get_regular_price' ), 99 );
		remove_filter( 'woocommerce_product_get_price', array( $woopt, 'woopt_get_price' ), 99 );
		remove_filter( 'woocommerce_product_get_sale_price', array( $woopt, 'woopt_get_price' ), 99 );
	}
}
