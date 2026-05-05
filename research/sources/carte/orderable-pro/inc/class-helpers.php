<?php
/**
 * Helper methods.
 *
 * @since 1.4.0
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Helpers class.
 */
class Orderable_Pro_Helpers {
	/**
	 * Add info button to product image HTML markup.
	 *
	 * @param WC_Product $product The product.
	 */
	public static function add_info_button( $product ) {
		if ( is_admin() ) {
			return;
		}

		/**
		 * Filter whether show the info button or not.
		 *
		 * @param string $should_show_info_button Default: false.
		 * @param WC_Product $product The product.
		 *
		 * @return bool
		 * @since 1.4.0
		 * @hook  orderable_show_info_product_button
		 */
		$should_show_info_button = apply_filters( 'orderable_show_info_product_button', false, $product );

		if ( ! $should_show_info_button ) {
			return;
		}

		$button_attributes = array(
			'class'                => 'orderable-button orderable-button--icon orderable-button--nutritional-info',
			'title'                => __( 'See nutritional information.', 'orderable-pro' ),
			'data-orderable-focus' => 'accordion-nutritional-info',
		);

		/**
		 * Filter info product button attributes.
		 *
		 * @param array      $button_attributes The button attributes.
		 * @param WC_Product $product The product.
		 *
		 * @return bool
		 * @since 1.4.0
		 * @hook  orderable_info_button_attributes
		 */
		$button_attributes = apply_filters( 'orderable_info_button_attributes', $button_attributes, $product );

		?>
		<button
			data-orderable-trigger="product-options"
			data-orderable-product-id="<?php echo esc_attr( $product->is_type( 'variation' ) ? $product->get_parent_id() : $product->get_id() ); ?>"
			data-orderable-product-type="<?php echo esc_attr( $product->get_type() ); ?>"
			data-orderable-variation-id="<?php echo esc_attr( $product->is_type( 'variation' ) ? $product->get_id() : 0 ); ?>"
			data-orderable-variation-attributes=""
			<?php
			foreach ( $button_attributes as $attribute => $value ) {
				echo esc_attr( $attribute ) . '="' . esc_attr( $value ) . '" ';
			}
			?>
		>
			<?php include ORDERABLE_PRO_PATH . 'inc/modules/layouts-pro/assets/icons/circle-information.svg'; ?>
		</button>
		<?php
	}
}