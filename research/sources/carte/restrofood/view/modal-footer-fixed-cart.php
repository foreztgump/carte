<div class="rb_order_details_main">
    <span class="rb_cart_close">
        <img src="<?php echo esc_url( RESTROFOOD_DIR_URL.'assets/img/icon/close.svg' ); ?>">
    </span>
    <div class="rb_container">
        <div class="rb_row">
            <div class="rb_col_12">
                <div class="rb_table_responsive">
                    <?php
                    include RESTROFOOD_DIR_PATH.'view/modal-cart-content.php';
                    include RESTROFOOD_DIR_PATH.'view/modal-footer-fixed-checkout.php';
                    ?>
                </div>
            </div>
        </div>
    </div>
</div>
<!------>
<div class="rb_order_details_bar">
    <div class="rb_container">
        <div class="rb_row">
            <div class="rb_col_12">
                <div class="rb_order_details_bar_content">
                    <ul class="rb_order_info_list">
                        <li>
                            <button type="button" class="rb_btn_circle rb_cart_btn_circle">
                                <img src="<?php echo esc_url( RESTROFOOD_DIR_URL.'assets/img/icon/angle-up.svg' ); ?>" class="svg" alt="">
                            </button>
                            <h5><?php esc_html_e( 'Your Orders', 'restrofood' ); ?>
                            <span class="rb_cart_count rb_cart_icon"></span>
                            </h5>
                        </li>
                    </ul>
                    <div class="rb_order_process">
                        <h5><?php esc_html_e( 'Sub Total:', 'restrofood' ); ?> <span class="fixed-cart-subtotal"><?php echo WC()->cart->get_cart_subtotal();?></span></h5>
                       
                        <div class="mini-cart-bottom-block">
                          <a href="#" class="rb_btn_fill rb_mini_cart_checkout_btn"><?php esc_html_e( 'Check Out', 'restrofood' ); ?></a>
                          <a href="#" class="rb_btn_fill back-cart" data-back="cart"  style="display:none;"><?php esc_html_e( 'Back', 'restrofood' ); ?></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>