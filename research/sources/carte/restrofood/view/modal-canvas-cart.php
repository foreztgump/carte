<div class="rb_cart_popup_modal" id="rb_cart_popup_modal">

  <div class="rb_cart_modal_wrap rb_cart">
    <div class="rb_cart_modal">
      <div class="rb_cart_modal_inner">
        <span class="rb_close_mini_cart_modal">
          <img src="<?php echo RESTROFOOD_DIR_URL.'assets/img/icon/close.svg'; ?>" alt="<?php echo esc_attr( 'close', 'restrofood' ); ?>" />
        </span>

        <div class="rb_cart_modal_content">
          <div class="rb_cart_steps_wrapper">
            <?php
            include RESTROFOOD_DIR_PATH.'view/modal-cart-content.php';
            include RESTROFOOD_DIR_PATH.'view/modal-checkout.php';            
            ?>
            <div class="mini-cart-bottom-block">
              <a href="#" class="rb_btn_fill rb_mini_cart_checkout_btn"><?php esc_html_e( 'Check Out', 'restrofood' ); ?></a>
              <a href="#" class="rb_btn_fill back-cart" data-back="cart"><?php esc_html_e( 'Back', 'restrofood' ); ?></a>
              <a href="#" class="rb_btn_fill fb-order-payment"><?php esc_html_e( 'Order & Payment', 'restrofood' ); ?></a>
            </div>
          </div>
        </div>
        
        <!-- End Modal Content -->
      </div>
    </div>
  </div>

  <!-- End Modal -->
</div>
