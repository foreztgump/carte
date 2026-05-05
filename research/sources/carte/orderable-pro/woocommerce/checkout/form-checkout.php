<?php
/**
 * Checkout Form
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/checkout/form-checkout.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://docs.woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 3.5.0
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>

<div class="orderable-checkout">
	<?php

	// If checkout registration is disabled and not logged in, the user cannot checkout.
	if ( ! $checkout->is_registration_enabled() && $checkout->is_registration_required() && ! is_user_logged_in() ) {
		echo esc_html( apply_filters( 'woocommerce_checkout_must_be_logged_in_message', __( 'You must be logged in to checkout.', 'orderable-pro' ) ) );

		return;
	}
	?>

	<?php do_action( 'woocommerce_before_checkout_form', $checkout ); ?>

	<form name="checkout" method="post" class="checkout woocommerce-checkout" action="<?php echo esc_url( wc_get_checkout_url() ); ?>" enctype="multipart/form-data">
		<div class="orderable-checkout__form">
			<div class="orderable-checkout-mobile-header">
				<a href="javascript:void(0)" class="orderable-checkout-summary-toggle">
						<span class="orderable-checkout-summary-toggle_link">
							<span class="dashicons dashicons-cart"></span>
							<span class="orderable-checkout-summary-toggle_link--show"><?php esc_html_e( 'Show order summary', 'orderable-pro' ); ?></span>
							<span class="orderable-checkout-summary-toggle_link--hide"><?php esc_html_e( 'Hide order summary', 'orderable-pro' ); ?></span>
						</span>
					<span class="orderable-checkout-summary-toggle_total"><?php wc_cart_totals_order_total_html(); ?></span>
				</a>
			</div>
			<div id="order_review" class="orderable-checkout-section checkout_right_section woocommerce-checkout-review-order">
				<?php do_action( 'woocommerce_checkout_before_order_review_heading' ); ?>

				<h3><?php esc_html_e( 'Order Summary', 'orderable-pro' ); ?></h3>

				<?php do_action( 'woocommerce_checkout_before_order_review' ); ?>

				<?php do_action( 'woocommerce_checkout_order_review' ); ?>

				<?php do_action( 'woocommerce_checkout_after_order_review' ); ?>
			</div>

			<div class="checkout_left_section">
				<?php if ( $checkout->get_checkout_fields() ) : ?>
					<div class="orderable-checkout-section orderable-checkout-section--customer-details" id="customer_details">
						<?php do_action( 'woocommerce_checkout_before_customer_details' ); ?>

						<?php wc_get_template( 'orderable/checkout/contact-fields.php' ); ?>
						<?php wc_get_template( 'orderable/checkout/billing-fields.php' ); ?>
						<?php wc_get_template( 'orderable/checkout/shipping-fields.php' ); ?>

						<?php do_action( 'woocommerce_checkout_after_customer_details' ); ?>
					</div>
				<?php endif; ?>

				<div class="orderable-checkout-section orderable-checkout-section--payment">
					<h3><?php esc_html_e( 'Payment Information', 'orderable-pro' ); ?></h3>

					<?php do_action( 'orderable_checkout_payment' ); ?>
				</div>
			</div>
		</div>

		<div class="clear clearfix"></div>
	</form>

	<?php do_action( 'woocommerce_after_checkout_form', $checkout ); ?>
</div>
