<?php
/**
 * Iconic_Flux_Compat_Avada.
 *
 * Compatibility with Avada.
 *
 * @package Iconic_Flux
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( class_exists( 'Iconic_Flux_Compat_Avada' ) ) {
	return;
}

/**
 * Iconic_Flux_Compat_Avada.
 *
 * @class    Iconic_Flux_Compat_Avada.
 * @version  2.0.0.0
 * @package  Iconic_Flux
 */
class Iconic_Flux_Compat_Avada {
	/**
	 * Run.
	 */
	public static function run() {
		add_action( 'init', array( __CLASS__, 'compat_avada' ) );
		add_action( 'wp', array( __CLASS__, 'compat_avada_disable_css' ), 0 );
	}

	/**
	 * Disable avada checkout customisations.
	 */
	public static function compat_avada() {
		if ( ! class_exists( 'Avada_Woocommerce' ) ) {
			return;
		}

		global $avada_woocommerce;

		remove_action( 'woocommerce_order_button_html', array( $avada_woocommerce, 'order_button_html' ) );
		remove_action( 'woocommerce_checkout_after_order_review', array( $avada_woocommerce, 'checkout_after_order_review' ), 20 );
		remove_action( 'woocommerce_before_checkout_form', array( $avada_woocommerce, 'checkout_coupon_form' ), 10 );
		remove_action( 'woocommerce_before_checkout_form', array( $avada_woocommerce, 'before_checkout_form' ) );
		remove_action( 'woocommerce_after_checkout_form', array( $avada_woocommerce, 'after_checkout_form' ) );
		remove_action( 'woocommerce_checkout_before_customer_details', array( $avada_woocommerce, 'checkout_before_customer_details' ) );
		remove_action( 'woocommerce_checkout_after_customer_details', array( $avada_woocommerce, 'checkout_after_customer_details' ) );
		remove_action( 'woocommerce_before_checkout_form', array( $avada_woocommerce, 'avada_top_user_container' ), 1 );
		remove_action( 'woocommerce_checkout_billing', array( $avada_woocommerce, 'checkout_billing' ), 20 );
		remove_action( 'woocommerce_checkout_shipping', array( $avada_woocommerce, 'checkout_shipping' ), 20 );

		add_action( 'woocommerce_before_checkout_form', 'woocommerce_checkout_coupon_form', 10 );
	}

	/**
	 * Disable Avada CSS.
	 */
	public static function compat_avada_disable_css() {
		if ( ( class_exists( 'Iconic_Flux_Flux' ) && ! Iconic_Flux_Flux::is_checkout() || ! Orderable_Checkout_Pro::is_checkout_page() ) || ! class_exists( 'Fusion_Dynamic_CSS' ) ) {
			return;
		}

		$fusion_dynamic_css = Fusion_Dynamic_CSS::get_instance();

		remove_action( 'wp', array( $fusion_dynamic_css, 'init' ), 999 );
		remove_action( 'wp_footer', array( 'Avada_Privacy_Embeds', 'display_privacy_bar' ), 10 );
	}
}
