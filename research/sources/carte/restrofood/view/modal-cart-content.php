<?php 
global $restrofoodAttr;
$options = get_option('restrofood_options');

$layoutType = !empty( $options['cart-modal-style'] ) && $options['cart-modal-style'] == 'beside-products'  ? true : false;

if( !empty( $restrofoodAttr['mini_cart_type'] ) && $restrofoodAttr['mini_cart_type'] == 'beside-products' ) {
    $layoutType = true;
}

$flyingClass = !empty( $layoutType ) ? 'rb_cart_icon' : '';
?>
<div class="step-cart mini-cart-content">
	<h3><?php echo esc_html('Your Cart: ', 'restrofood' ); ?></h3>
	<div class="cart_table">
		<!-- Cart table Header -->
        <div class="cart_table_header rb_product_details_form <?php echo esc_attr( $flyingClass ); ?>">
            <img src="<?php echo esc_url( RESTROFOOD_DIR_URL.'assets/img/icon/title_icon.png' ); ?>" alt="">
            <h4>
            <?php
            //
            echo esc_html( 'My Orders: ', 'restrofood' );
            //
            if( !empty( $layoutType ) ) {
            	echo '<span class="rb_cart_count rb_cart_icon" style="opacity: 1;"></span>';
            }
            ?>
        	</h4>
        </div>
    	<!-- End Cart table Header -->
		<div class="mini-cart-content-inner">
			<div class="woocommerce-mini-cart-content widget_shopping_cart_content">
                <?php woocommerce_mini_cart(); ?>
            </div>
		</div>
	</div>
</div>