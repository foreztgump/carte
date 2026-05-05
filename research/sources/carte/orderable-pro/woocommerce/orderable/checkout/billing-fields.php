<?php
/**
 * Checkout Billing Fields.
 *
 * @package orderable-pro
 * @version 1.0.0
 */

defined( 'ABSPATH' ) || exit; ?>

<div class="orderable-placeholder orderable-placeholder--billing">
	<div class="orderable-checkout-section orderable-checkout-section--billing">
		<?php if ( wc_ship_to_billing_address_only() && WC()->cart->needs_shipping() ) : ?>
			<h3><?php esc_html_e( 'Billing &amp; Shipping', 'orderable-pro' ); ?></h3>
		<?php else : ?>
			<h3><?php esc_html_e( 'Billing Address', 'orderable-pro' ); ?></h3>
		<?php endif; ?>

		<?php do_action( 'woocommerce_checkout_billing' ); ?>
	</div>
</div>