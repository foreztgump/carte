<?php
/**
 * Checkout Shipping Fields.
 *
 * @package orderable-pro
 */

defined( 'ABSPATH' ) || exit;

$style               = Orderable_Services::get_selected_service( false ) === 'pickup' ? 'display:none;' : '';
$show_delivery_title = 'billing_only' !== get_option( 'woocommerce_ship_to_destination' ) && WC()->cart->needs_shipping() && WC()->cart->show_shipping();
?>

<div class="orderable-placeholder orderable-placeholder--shipping">
	<div class="orderable-checkout-section orderable-checkout-section--shipping">
			<?php if ( $show_delivery_title ) : ?>
				<h3 style="<?php echo esc_html( $style ); ?>"><?php esc_html_e( 'Delivery Address', 'orderable-pro' ); ?></h3>
			<?php endif; ?>
			<?php do_action( 'woocommerce_checkout_shipping' ); ?>
		</div>
</div>