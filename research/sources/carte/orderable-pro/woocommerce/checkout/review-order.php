<?php
/**
 * Review order table
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/checkout/review-order.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://docs.woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 5.2.0
 */
defined( 'ABSPATH' ) || exit;

$selected_service = false;

if ( class_exists( 'Orderable_Services' ) ) {
	$selected_service = Orderable_Services::get_selected_service( false );
}

?>
<table class="orderable-checkout__order-review woocommerce-checkout-review-order-table">
	<?php if ( WC()->cart->needs_shipping() && WC()->cart->show_shipping() ) : ?>
		<thead>
		<tr>
			<td colspan="2">
				<table class="orderable-checkout__shipping-table">
					<?php do_action( 'woocommerce_review_order_before_shipping' ); ?>
					<?php wc_cart_totals_shipping_html(); ?>
					<?php do_action( 'woocommerce_review_order_after_shipping' ); ?>
				</table>
			</td>
		</tr>
		</thead>
	<?php endif; ?>
	<tbody>
	<?php
	do_action( 'woocommerce_review_order_before_cart_contents' );

	// Get a clean loop with only valid cart items.
	$valid_cart_items = array();

	foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item ) {
		$_product = apply_filters( 'woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key );

		if ( $_product && $_product->exists() && $cart_item['quantity'] > 0 && apply_filters( 'woocommerce_checkout_cart_item_visible', true, $cart_item, $cart_item_key ) ) {
			$valid_cart_items[ $cart_item_key ] = $cart_item;
		}
	}

	$valid_cart_items_count = count( $valid_cart_items );
	$cart_items_i           = 0;

	// Now loop the clean array of cart items.
	foreach ( $valid_cart_items as $cart_item_key => $cart_item ) {
		$classes = array(
			apply_filters( 'woocommerce_cart_item_class', 'cart-item', $cart_item, $cart_item_key ),
		);

		if ( 0 === $cart_items_i ) {
			$classes[] = 'cart-item--first';
		}

		if ( $valid_cart_items_count - 1 === $cart_items_i ) {
			$classes[] = 'cart-item--last';
		}

		$_product = apply_filters( 'woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key );
		?>
		<tr class="<?php echo esc_attr( implode( ' ', $classes ) ); ?>">
			<td class="product-name">
				<div class="orderable-checkout__cart-item">
					<div class="orderable-checkout__cart-item-image">
						<?php echo wp_kses_post( $cart_item['data']->get_image() ); ?>
					</div>
					<div class="orderable-checkout__cart-item-data">
						<strong><?php echo wp_kses_post( apply_filters( 'woocommerce_cart_item_name', $_product->get_name(), $cart_item, $cart_item_key ) ); ?></strong>
						<?php echo wc_get_formatted_cart_item_data( $cart_item ); ?>
					</div>
				</div>
			</td>
			<td class="product-total">
				<?php echo apply_filters( 'woocommerce_checkout_cart_item_quantity', ' <span class="product-quantity">' . sprintf( '%s x ', $cart_item['quantity'] ) . '</span>', $cart_item, $cart_item_key ); ?>
				<?php echo apply_filters( 'woocommerce_cart_item_price', WC()->cart->get_product_price( $_product ), $cart_item, $cart_item_key ); ?>
			</td>
		</tr>
		<?php
		++$cart_items_i;
	}

	do_action( 'woocommerce_review_order_after_cart_contents' );
	?>
	</tbody>
	<tfoot>
	<tr class="orderable-checkout__cart-subtotal">
		<th><?php esc_html_e( 'Subtotal', 'orderable-pro' ); ?></th>
		<td><?php wc_cart_totals_subtotal_html(); ?></td>
	</tr>

	<?php foreach ( WC()->cart->get_coupons() as $code => $coupon ) : ?>
		<tr class="cart-discount cart-discount--<?php echo esc_attr( sanitize_title( $code ) ); ?>">
			<th><?php wc_cart_totals_coupon_label( $coupon ); ?></th>
			<td><?php wc_cart_totals_coupon_html( $coupon ); ?></td>
		</tr>
	<?php endforeach; ?>

	<?php if ( 'pickup' !== $selected_service && WC()->cart->needs_shipping() && WC()->cart->show_shipping() ) : ?>
	<tr class="orderable-checkout__cart-shipping-total">
		<th><?php esc_html_e( 'Shipping', 'orderable-pro' ); ?></th>
		<td><?php echo wp_kses_post( WC()->cart->get_cart_shipping_total() ); ?></td>
	</tr>
	<?php endif; ?>

	<?php foreach ( WC()->cart->get_fees() as $fee ) : ?>
		<tr class="fee">
			<th><?php echo esc_html( $fee->name ); ?></th>
			<td><?php wc_cart_totals_fee_html( $fee ); ?></td>
		</tr>
	<?php endforeach; ?>

	<?php if ( wc_tax_enabled() && ! WC()->cart->display_prices_including_tax() ) : ?>
		<?php if ( 'itemized' === get_option( 'woocommerce_tax_total_display' ) ) : ?>
			<?php foreach ( WC()->cart->get_tax_totals() as $code => $tax ) : ?>
				<tr class="tax-rate tax-rate--<?php echo esc_attr( sanitize_title( $code ) ); ?>">
					<th><?php echo esc_html( $tax->label ); ?></th>
					<td><?php echo wp_kses_post( $tax->formatted_amount ); ?></td>
				</tr>
			<?php endforeach; ?>
		<?php else : ?>
			<tr class="tax-total">
				<th><?php echo esc_html( WC()->countries->tax_or_vat() ); ?></th>
				<td><?php wc_cart_totals_taxes_total_html(); ?></td>
			</tr>
		<?php endif; ?>
	<?php endif; ?>

	<?php do_action( 'woocommerce_review_order_before_order_total' ); ?>

	<tr class="order-total">
		<th><?php esc_html_e( 'Total', 'orderable-pro' ); ?></th>
		<td><?php wc_cart_totals_order_total_html(); ?></td>
	</tr>

	<?php do_action( 'woocommerce_review_order_after_order_total' ); ?>
	</tfoot>
</table>
