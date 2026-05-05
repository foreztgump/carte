<?php
/**
 * Iconic_Flux_Compat_Astra.
 *
 * Compatibility with Astra.
 *
 * @package Iconic_Flux
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( class_exists( 'Iconic_Flux_Compat_Astra' ) ) {
	return;
}

/**
 * Iconic_Flux_Compat_Astra.
 *
 * @class    Iconic_Flux_Compat_Astra.
 * @version  2.0.0.0
 * @package  Iconic_Flux
 */
class Iconic_Flux_Compat_Astra {
	/**
	 * Run.
	 */
	public static function run() {
		add_action( 'init', array( __CLASS__, 'compat_astra' ) );
		add_action( 'wp_print_scripts', array( __CLASS__, 'compat_astra_dequeue_scripts' ), 100 );
	}

	/**
	 * Disable astra checkout customisations.
	 */
	public static function compat_astra() {
		if ( ! class_exists( 'Astra_Woocommerce' ) ) {
			return;
		}

		$astra = Astra_Woocommerce::get_instance();

		remove_action( 'wp', array( $astra, 'woocommerce_checkout' ) );
	}

	/**
	 * Dequeue scripts.
	 */
	public static function compat_astra_dequeue_scripts() {
		wp_dequeue_script( 'astra-checkout-persistence-form-data' );
	}
}
