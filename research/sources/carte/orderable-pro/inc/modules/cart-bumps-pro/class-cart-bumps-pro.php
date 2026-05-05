<?php
/**
 * Module: Cart Bumps.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Cart Bumps module class.
 */
class Orderable_Cart_Bumps_Pro {
	/**
	 * Init.
	 */
	public static function run() {
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'frontend_assets' ) );
		add_action( 'woocommerce_widget_shopping_cart_before_total', array( __CLASS__, 'display_cart_bumps' ) );
	}

	/**
	 * Display cart bumps.
	 */
	public static function display_cart_bumps() {
		$bumps = self::get_cart_bumps();

		if ( empty( $bumps ) ) {
			return;
		}

		include Orderable_Helpers::get_template_path( 'bumps.php', 'cart-bumps-pro', true );
	}

	/**
	 * Get cart bump products.
	 *
	 * @param bool $validate Ensure only valid bumps are returned.
	 *
	 * @return WC_Product[]
	 */
	public static function get_cart_bumps( $validate = true ) {
		$bumps          = array();
		$cross_sell_ids = self::get_cross_sell_ids();

		if ( ! empty( $cross_sell_ids ) ) {
			foreach ( $cross_sell_ids as $cross_sell_id ) {
				$bump = wc_get_product( $cross_sell_id );

				if ( ! $bump || ( $validate && ( ! $bump->is_purchasable() || ! $bump->is_in_stock() ) ) ) {
					continue;
				}

				if ( ! Orderable_Timed_Products_Conditions::is_product_visible_now( $bump ) ) {
					continue;
				}

				// Remove variations for now.
				// @todo allow variations to be bumped.
				if ( 'variation' === $bump->get_type() ) {
					continue;
				}

				$bumps[] = $bump;
			}
		}

		$bumps = array_unique( array_filter( $bumps ) );

		/**
		 * Filter the cart bump products.
		 *
		 * @since 1.8.3
		 * @hook orderable_cart_bumps
		 * @param  array $bumps The product cart bumps.
		 * @return array New value
		 */
		return apply_filters( 'orderable_cart_bumps', $bumps );
	}

	/**
	 * Get cross sell IDs.
	 *
	 * @return array
	 */
	public static function get_cross_sell_ids() {
		$cross_sell_ids = array();
		$cart_items     = WC()->cart->get_cart();

		if ( ! empty( $cart_items ) ) {
			$cart_item_ids = wp_list_pluck( $cart_items, 'product_id' );

			foreach ( $cart_items as $cart_item ) {
				$product_cross_sells = $cart_item['data']->get_cross_sell_ids();

				if ( empty( $product_cross_sells ) ) {
					continue;
				}

				// Remove products already in the cart.
				$remaining_cross_sells = array_diff( $product_cross_sells, $cart_item_ids );

				// Add remaining cross sells to array.
				$cross_sell_ids = array_merge( $cross_sell_ids, $remaining_cross_sells );
			}
		}

		return apply_filters( 'orderable_cross_sell_ids', $cross_sell_ids );
	}

	/**
	 * Enqueue frontend assets.
	 */
	public static function frontend_assets() {
		if ( is_admin() ) {
			return;
		}

		$suffix     = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';
		$suffix_css = ( is_rtl() ? '-rtl' : '' ) . $suffix;

		// Styles.
		wp_enqueue_style( 'orderable-cart-bumps-pro', ORDERABLE_PRO_URL . 'inc/modules/cart-bumps-pro/assets/frontend/css/cart-bumps' . $suffix_css . '.css', array(), ORDERABLE_PRO_VERSION );

		// Scripts.
		wp_enqueue_script( 'flexslider' );
		wp_enqueue_script( 'orderable-cart-bumps-pro', ORDERABLE_PRO_URL . 'inc/modules/cart-bumps-pro/assets/frontend/js/main' . $suffix . '.js', array( 'jquery', 'flexslider' ), ORDERABLE_PRO_VERSION, true );
	}
}
