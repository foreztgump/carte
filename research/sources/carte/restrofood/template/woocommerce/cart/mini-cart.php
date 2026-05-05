<?php
/**
 * Mini-cart
 *
 * Contains the markup for the mini-cart, used by the cart widget.
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/cart/mini-cart.php.
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

do_action( 'woocommerce_before_mini_cart' );
do_action( 'woocommerce_before_cart' );
 ?>

<?php if ( WC()->cart && ! WC()->cart->is_empty() ) : ?>

	<ul class="woocommerce-mini-cart cart_list product_list_widget <?php echo esc_attr( $args['list_class'] ); ?>">
		<?php
		do_action( 'woocommerce_before_mini_cart_contents' );

		foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item ) {
			$_product   = apply_filters( 'woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key );
			$product_id = apply_filters( 'woocommerce_cart_item_product_id', $cart_item['product_id'], $cart_item, $cart_item_key );

			if ( $_product && $_product->exists() && $cart_item['quantity'] > 0 && apply_filters( 'woocommerce_widget_cart_item_visible', true, $cart_item, $cart_item_key ) ) {
				$product_name      = apply_filters( 'woocommerce_cart_item_name', $_product->get_name(), $cart_item, $cart_item_key );
				$thumbnail         = apply_filters( 'woocommerce_cart_item_thumbnail', $_product->get_image(), $cart_item, $cart_item_key );
				$product_price     = apply_filters( 'woocommerce_cart_item_price', WC()->cart->get_product_price( $_product ), $cart_item, $cart_item_key );
				$product_permalink = apply_filters( 'woocommerce_cart_item_permalink', $_product->is_visible() ? $_product->get_permalink( $cart_item ) : '', $cart_item, $cart_item_key );
				
				//
				
				$isExtraOptions = false;
				$hasExtraOptions = '';

				if( !empty( $cart_item['extra_options'] ) ) {
					$isExtraOptions = true;
					$hasExtraOptions = 'has-extra-addons';
				}
				?>
				<li class="woocommerce-mini-cart-item <?php echo esc_attr( apply_filters( 'woocommerce_mini_cart_item_class', 'mini_cart_item', $cart_item, $cart_item_key ) ); ?>">
					<div class="mini_cart_item_inner">
					<?php if ( empty( $product_permalink ) ) : ?>
					
						<div class="<?php echo esc_attr( 'im-anchor '.$hasExtraOptions); ?>">
							<?php 
							echo $thumbnail; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped 
							echo '<span>';
							echo '<span class="im-cart-item-title">'.wp_kses_post( $product_name ).'</span>';
							// Extra Items
							if( $isExtraOptions ) {
								$extraOptions = explode( '|', $cart_item['extra_options'] );
								echo '<span class="mini-cart-extra-options-wrap">';
								foreach( $extraOptions as $val ) {
									echo '<span>'.esc_html( $val ).'</span>';
								}
								echo '</span>';
							}
							//
							echo '<div class="mini-cart-item-extra">';
							echo wc_get_formatted_cart_item_data( $cart_item ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
							if( !empty( $cart_item['item_instructions'] ) ) {
								echo '<p>'.esc_html( $cart_item['item_instructions'] ).'</p>';
							}
							echo '</div>';
							echo '</span>';
							?>
						</div>
						
						
					<?php else : ?>
						<div class="<?php echo esc_attr( 'im-anchor '.$hasExtraOptions); ?>">
							<?php 
							echo $thumbnail; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped 
							echo '<span>';
							echo '<span class="im-cart-item-title">'.wp_kses_post( $product_name ).'</span>';
							// Extra Items
							if( $isExtraOptions ) {
								$extraOptions = explode( '|', $cart_item['extra_options'] );
								echo '<span class="mini-cart-extra-options-wrap">';
								foreach( $extraOptions as $val ) {
									echo '<span>'.esc_html( $val ).'</span>';
								}
								echo '</span>';
							}
							//
							echo '<div class="mini-cart-item-extra">';
							echo wc_get_formatted_cart_item_data( $cart_item ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
							if( !empty( $cart_item['item_instructions'] ) ) {
								echo '<p>'.esc_html( $cart_item['item_instructions'] ).'</p>';
							}
							echo '</div>';
							echo '</span>';
							?>
						</div>
					<?php endif; ?>
					<div class="rb_quantity rb_d_flex rb_align_items_center">
		            	<div class="rb_input_group">
		                  <input type="text" class="rb_input_text" data-product_id="<?php echo esc_attr( $product_id ); ?>" name="rb_quantity" value="<?php echo esc_attr( $cart_item['quantity'] ); ?>">
		                  <span class="inc-qty rb_minus rb_minus_2"><img src="<?php echo RESTROFOOD_DIR_ASSETS_URL.'img/icon/minus1.svg'; ?>"></span>
		                  <span class="inc-qty rb_plus rb_plus_2"><img src="<?php echo RESTROFOOD_DIR_ASSETS_URL.'img/icon/plus1.svg'; ?>"></span>
		            	</div>
		            </div>
					<?php echo apply_filters( 'woocommerce_widget_cart_item_quantity', '<span class="quantity">' . sprintf( '%s &times; %s', $cart_item['quantity'], $product_price ) . '</span>', $cart_item, $cart_item_key ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					<?php
					echo apply_filters( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						'woocommerce_cart_item_remove_link',
						sprintf(
							'<a href="%s" class="remove remove_from_cart_button" aria-label="%s" data-product_id="%s" data-cart_item_key="%s" data-product_sku="%s">&times;</a>',
							esc_url( wc_get_cart_remove_url( $cart_item_key ) ),
							esc_attr__( 'Remove this item', 'restrofood' ),
							esc_attr( $product_id ),
							esc_attr( $cart_item_key ),
							esc_attr( $_product->get_sku() )
						),
						$cart_item_key
					);
					?>
					</div>
				</li>
				<?php
			}
		}

		do_action( 'woocommerce_mini_cart_contents' );
		?>
	</ul>

	<div class="woocommerce-mini-cart__total total">
		<?php
		/**
		 * Hook: woocommerce_widget_shopping_cart_total.
		 *
		 * @hooked woocommerce_widget_shopping_cart_subtotal - 10
		 */
		do_action( 'woocommerce_widget_shopping_cart_total' );
		?>
	</div>

	<?php do_action( 'woocommerce_widget_shopping_cart_before_buttons' ); ?>

	<p class="woocommerce-mini-cart__buttons buttons"><?php do_action( 'woocommerce_widget_shopping_cart_buttons' ); ?></p>

	<?php do_action( 'woocommerce_widget_shopping_cart_after_buttons' ); ?>

<?php else : ?>

	<p class="woocommerce-mini-cart__empty-message"><?php esc_html_e( 'No products in the cart.', 'restrofood' ); ?></p>

<?php endif; ?>

<?php do_action( 'woocommerce_after_mini_cart' ); ?>
