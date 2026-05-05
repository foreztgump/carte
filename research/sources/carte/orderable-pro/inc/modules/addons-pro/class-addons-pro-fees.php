<?php
/**
 * Module: Addons.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Addons module Fees class.
 */
class Orderable_Addons_Pro_Fees {

	/**
	 * Init.
	 */
	public static function run() {
		add_action( 'woocommerce_before_calculate_totals', array( __CLASS__, 'calculate_totals' ), 10 );
	}

	/**
	 * Add fees for cart products.
	 *
	 * @param object $cart Cart object.
	 *
	 * @return void
	 */
	public static function calculate_totals( $cart ) {
		if ( is_admin() && ! defined( 'DOING_AJAX' ) ) {
			return;
		}

		if ( did_action( 'woocommerce_before_calculate_totals' ) >= 2 ) {
			return;
		}

		// Loop through cart items.
		foreach ( $cart->get_cart() as $cart_item_key => $cart_item ) {
			$fees = 0;
			if ( empty( $cart_item['orderable_fields'] ) ) {
				continue;
			}

			foreach ( $cart_item['orderable_fields'] as $field ) {
				$fees += $field['fees'];
			}

			$product = $cart_item['data'];
			$price   = $product->get_price();

			// Only set price if there is a fees.
			if ( $fees ) {
				$cart_item['data']->set_price( floatval( $price + $fees ) );
			}
		}

		do_action( 'orderable_pro_after_calculate_totals' );
	}

	/**
	 * Calculate fees for selected options.
	 *
	 * @param arrar|string $selected_options Selected options for which fees is to be calculated.
	 * @param string       $field_id         Field ID.
	 * @param int          $group_id         Group post ID.
	 *
	 * @return int|float
	 */
	public static function calculate_fees( $selected_options, $field_id, $group_id ) {
		$fees             = 0;
		$selected_options = (array) $selected_options;

		if ( empty( $selected_options ) ) {
			return $fees;
		}

		$field_settings = Orderable_Addons_Pro_Field_Groups::get_field_data( $field_id, $group_id );

		foreach ( $selected_options as $selected_option ) {
			foreach ( $field_settings['options'] as $setting_option ) {
				if ( trim( $setting_option['label'] ) != trim( $selected_option ) ) {
					continue;
				}

				if ( empty( $setting_option['price'] ) || ! is_numeric( $setting_option['price'] ) ) {
					continue;
				}

				$fees += $setting_option['price'];
			}
		}

		return $fees;
	}
}
