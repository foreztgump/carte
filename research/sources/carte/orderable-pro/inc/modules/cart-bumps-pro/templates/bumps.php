<?php
/**
 * Cart Bumps: Main.
 *
 * This template can be overridden by copying it to yourtheme/orderable/cart-bumps-pro/bumps.php
 *
 * HOWEVER, on occasion Orderable will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @package Orderable/Templates
 *
 * @var $bumps WC_Product[] Bump products.
 */

defined( 'ABSPATH' ) || exit;
?>

<div class="orderable-cart-bumps">
	<h4 class="orderable-cart-bumps__heading"><?php _e( 'You May Also Like...', 'orderable-pro' ); ?></h4>
	<div class="orderable-cart-bumps__contents">
		<?php foreach ( $bumps as $bump ) { ?>

			<div class="orderable-cart-bumps__bump">
				<div class="orderable-cart-bumps__bump-content">
					<?php
					echo wp_kses_post(
						$bump->get_image(
							'woocommerce_thumbnail',
							array(
								'class' => 'orderable-cart-bumps__bump-image',
							)
						)
					);
					?>
					<div class="orderable-cart-bumps__bump-data">
						<p class="orderable-cart-bumps__bump-title"><?php echo wp_kses_post( $bump->get_name() ); ?></p>
						<p class="orderable-cart-bumps__bump-price"><?php echo wp_kses_post( $bump->get_price_html() ); ?></p>
					</div>
					<?php echo Orderable_Products::get_add_to_cart_button( $bump, 'orderable-cart-bumps__bump-button' ); ?>
				</div>
			</div>
		<?php } ?>
	</div>
</div>
