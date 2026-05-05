<?php
/**
 * Checkout Contact Fields.
 *
 * @package orderable-pro
 */

defined( 'ABSPATH' ) || exit; ?>

<div class="orderable-checkout-section orderable-checkout-section--contact">
	<h3><?php esc_html_e( 'Contact Information', 'orderable-pro' ); ?></h3>

	<?php do_action( 'woocommerce_checkout_contact' ); ?>
</div>