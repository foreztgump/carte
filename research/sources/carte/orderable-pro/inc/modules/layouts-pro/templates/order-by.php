<?php
/**
 * Layout: Show options for ordering.
 *
 * This template can be overridden by copying it to yourtheme/orderable/layouts-pro/order-by.php
 *
 * HOWEVER, on occasion Orderable will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @package Orderable_Pro/Templates
 *
 * @var array $args     Array of shortcode args.
 */

defined( 'ABSPATH' ) || exit;

$selected_sort = empty( $_GET['order_by'] ) ? '' : sanitize_text_field( wp_unslash( $_GET['order_by'] ) ); // phpcs:ignore WordPress.Security.NonceVerification

if ( empty( $selected_sort ) ) {
	$selected_sort = empty( $args['sort'] ) ? 'menu_order' : $args['sort'];
}

$product_layout_order_by_options = array(
	'menu_order' => __( 'Default sorting', 'orderable-pro' ),
	'title'      => __( 'Sort by name', 'orderable-pro' ),
	'date'       => __( 'Sort by latest', 'orderable-pro' ),
	'price'      => __( 'Sort by price: low to high', 'orderable-pro' ),
	'price-desc' => __( 'Sort by price: high to low', 'orderable-pro' ),
);

/**
 * Filter the product layout order by options.
 *
 * @since 1.10.0
 * @hook orderable_product_layout_order_by_options
 * @param  array  $options       The order by options.
 * @param  string $selected_sort The default order to be selected.
 * @param  string $args          The product layout args.
 * @return array New value
 */
$product_layout_order_by_options = apply_filters(
	'orderable_product_layout_order_by_options',
	$product_layout_order_by_options,
	$selected_sort,
	$args
);

?>

<form class="orderable-product-layout-ordering" method="get">
	<select
		id="orderable_product_layout_order_by"
		name="order_by"
		class="orderable-product-layout-ordering__select"
	>
		<?php foreach ( $product_layout_order_by_options as $key => $option ) : ?>
			<option
				value="<?php echo esc_attr( $key ); ?>"
				<?php selected( $key, $selected_sort ); ?>
			>
				<?php echo esc_html( $option ); ?>
			</option>
		<?php endforeach; ?>
	</select>
</form>
