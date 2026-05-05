<script type="text/html" id="tmpl-rb_billing_summary">
  <!-- Title -->
  <div class="rb_card_title">
    <h5><?php esc_html_e( 'Billing Summary', 'restrofood' ) ?></h5>
  </div>
  <!-- End Title -->

  <!-- Promo Code -->
  <div class="rb_input_group rb_d_flex rb_align_items_center">
    <input
      type="text"
      placeholder="<?php esc_attr_e( 'Promo code', 'restrofood' ); ?>"
      name="coupon_code"
      class="rb_input_style"
    />
    <span class="rb_btn_fill rb_add_coupon">
      <?php esc_html_e( 'Apply', 'restrofood' ) ?>
    </span>
  </div>

  <ul class="rb_list_unstyled rb_billing_summary_list">
    <li
      class="rb_summary_item rb_d_flex rb_align_items_center rb_justify_content_between"
    >
      <span><?php esc_html_e( 'Product Cost', 'restrofood' ) ?></span> <span>{{restrofoodobj.currency}}{{data.cart_subtotal}}</span>
    </li>
    <li class="rb_summary_item rb_d_flex rb_align_items_center rb_justify_content_between">
      
      <span><?php esc_html_e( 'Shipping fee', 'restrofood' ) ?></span>
      <span>{{{data.shipping_total}}}</span>
      
    </li>
    <div id="temp_discount_cart"></div>
    <# _.each( data.discount_cart, function( item ) {  #>
    <li class="rb_summary_item rb_d_flex rb_align_items_center rb_justify_content_between">
      <span>{{item.coupon_label}}</span>
      <span>-{{restrofoodobj.currency}}{{item.discount_amount}}</span>
      <a href="#" class="rb_remove_coupon" data-url="<?php echo esc_url( wc_get_cart_url() );?>" data-coupon={{item.coupon_code}} ><?php esc_html_e( 'Remove', 'restrofood' ) ?></a>
    </li>
    <# }) #>
    <li class="rb_summary_total rb_d_flex rb_align_items_center rb_justify_content_between">
      <span><?php esc_html_e( 'Total Cost :', 'restrofood' ) ?></span> <span id="checkout_order_total">{{restrofoodobj.currency}}{{data.cart_total}}</span>
    </li>
  </ul>
</script>