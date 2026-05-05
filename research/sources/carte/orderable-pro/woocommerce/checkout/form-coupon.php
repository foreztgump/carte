<?php
/**
 * Checkout coupon form
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/checkout/form-coupon.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://docs.woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 3.4.4
 */

defined( 'ABSPATH' ) || exit;

if ( ! wc_coupons_enabled() ) { // @codingStandardsIgnoreLine.
	return;
}

?>
<div class="woocommerce-form-coupon-toggle">
	<a href="#" class="showcoupon showcoupon-link"><span class="showcoupon_icon dashicons dashicons-tag"></span><?php esc_html_e( 'Apply Promo Code', 'orderable-pro' ); ?></a>
</div>

<form class="checkout_coupon woocommerce-form-coupon" method="post" style="display:none">

	<span class="form-row form-row-first">
		<input type="text" name="coupon_code" class="input-text" placeholder="<?php esc_attr_e( 'Coupon code', 'orderable-pro' ); ?>" id="coupon_code" value="" />
	</span>

	<span class="form-row form-row-last orderable-form-coupon__actions">
		<button type="submit" class="orderable-button orderable-form-coupon__apply-button" name="apply_coupon" value="<?php esc_attr_e( 'Apply coupon', 'orderable-pro' ); ?>"><?php esc_html_e( 'Apply coupon', 'orderable-pro' ); ?></button>
	</span>

	<div class="clear"></div>
</form>
