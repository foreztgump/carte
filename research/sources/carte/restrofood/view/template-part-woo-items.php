<?php
  global $restrofoodAttr;
  $getText = \Restrofood\Inc\Text::getText();
  $options = get_option('restrofood_options');

  $limit       = '';
  $column       = '4';
  $style        = '1';
  $shortCodeCat = '';
  $layout       = 'grid';
  $sidebar      = 'yes';
  $search       = 'yes';
  $paddingTop   = '';
  $paddingBottom = '';
  $miniCart = '';
  $branch_id    = '';
  $is_shortcode = false;
  
  if( !empty( $restrofoodAttr ) ) {
    $limit       = !empty(  $restrofoodAttr['limit'] ) ? $restrofoodAttr['limit'] : '';
    $column = restrofood_bootstrap_column_map( $restrofoodAttr['col'] );
    $style = !empty(  $restrofoodAttr['style'] ) ? $restrofoodAttr['style'] : '1';
    $shortCodeCat    = !empty(  $restrofoodAttr['cat'] ) ? $restrofoodAttr['cat'] : '';
    $layout          = !empty(  $restrofoodAttr['layout'] ) ? $restrofoodAttr['layout'] : '';
    $sidebar         = !empty(  $restrofoodAttr['sidebar'] ) ? $restrofoodAttr['sidebar'] : '';
    $search          = !empty(  $restrofoodAttr['search'] ) ? $restrofoodAttr['search'] : '';
    $paddingTop      = !empty(  $restrofoodAttr['padding_top'] ) ? $restrofoodAttr['padding_top'] : '';
    $paddingBottom   = !empty(  $restrofoodAttr['padding_bottom'] ) ? $restrofoodAttr['padding_bottom'] : '';
    $miniCart = !empty( $restrofoodAttr['mini_cart_type'] ) ? $restrofoodAttr['mini_cart_type'] : '';
    // Check
    if( !empty(  $restrofoodAttr['branch_id'] ) ) {
      $branch_id = $restrofoodAttr['branch_id'];
      $is_shortcode = true;
    }

  } else {

    $column = !empty(  $options['product-column'] ) ? $options['product-column'] : '';
    $style = !empty(  $options['product-layout-style'] ) ? $options['product-layout-style'] : '1';
    $layout = !empty(  $options['product-layout'] ) ? $options['product-layout'] : 'grid';
    $search = !empty( $options['search-section'] ) && $options['search-section'] == 'yes' ? 'yes' : 'no';
    $miniCart = !empty( $options['cart-modal-style'] ) ? $options['cart-modal-style'] : '';

  }

  // Add attr
  $getAttr = '';

  if( !empty( $paddingTop ) ) {
    $getAttr .= "padding-top:{$paddingTop};";
  }
  //
  if( !empty( $paddingBottom ) ) {
    $getAttr .= "padding-bottom:{$paddingBottom};";
  }

  //

  $optionMarge = [
    'branchid' => $branch_id, 
    'cat' => $shortCodeCat, 
    'col' => $column, 
    'style' => $style, 
    'layout' => $layout, 
    'limit' => $limit  
  ];

  $optionsInJson = json_encode( $optionMarge );

?>

<div class="rb__wrapper" style="<?php echo apply_filters( 'restrofood_shortcode_woo_items', $getAttr ); ?>">
  <?php 
  // Search
  if( $search == 'yes' ) {
    include RESTROFOOD_DIR_PATH.'view/template-part-woo-search.php';
  }

  // Product
  ?>
  <section>
    <div class="rb_container">
      <div class="rb_row">
        <div class="rb_col_lg_12">
          <!-- Section Title -->
          <div class="rb_section_title rb_food_item_list_header">
            <h3><?php echo esc_html( $getText['product_top_title_text'] ); ?></h3>
            <div class="rb_select_wrap">
              <?php
              // product filter by branch
              do_action( 'restrofood_product_page_branch_selectbox', $is_shortcode );
              ?>
              <select name="orderby" class="orderby-filter rb_select" aria-label="Shop order">
                  <option value="menu_order" selected="selected"><?php esc_html_e( 'Default sorting', 'restrofood' ); ?></option>
                  <option value="popularity"><?php esc_html_e( 'Sort by popularity', 'restrofood' ); ?></option>
                  <option value="rating"><?php esc_html_e( 'Sort by average rating', 'restrofood' ); ?></option>
                  <option value="date"><?php esc_html_e( 'Sort by latest', 'restrofood' ); ?></option>
                  <option value="price"><?php esc_html_e( 'Sort by price: low to high', 'restrofood' ); ?></option>
                  <option value="price-desc"><?php esc_html_e( 'Sort by price: high to low', 'restrofood' ); ?></option>
              </select>
            </div>
          </div>
          <!-- Section Title -->
          <!-- Product List -->
          <?php
          if( $miniCart != 'beside-products' ):
          ?>
          <div class="rb_row restrofood-products" data-options="<?php echo htmlspecialchars( $optionsInJson, ENT_QUOTES, 'UTF-8'); ?>"></div>
          <?php 
          else:
          ?>
          <div class="rb_row">

            <div class="rb_col_xl_8">
              <div class="rb_row restrofood-products" data-options="<?php echo htmlspecialchars( $optionsInJson, ENT_QUOTES, 'UTF-8'); ?>"></div>
            </div>
            <div class="rb_col_xl_4">
              <div class="rb_cart_modal_content rb_grid_layout_cart_content">

                <div class="restrofood-grid-layout-cart-mobile-bar">
                    <div class="restrofood-grid-layout-cart-mobile-bar-left-content">
                    <div class="grid-layout-cart-mobile-bar-cart-up rb_btn_circle"><i class="fa fa-angle-up"></i></div>
                    <h5 class="grid-layout-cart-mobile-bar-cart-added-qty"><?php esc_html_e( 'Your Orders', 'restrofood' ); ?><span class="rb_cart_count rb_cart_icon"></span></h5>
                    </div>
                    <h5 class="grid-layout-cart-mobile-bar-cart-total"><?php esc_html_e( 'Sub Total:', 'restrofood' ); ?> <span class="fixed-cart-subtotal"></span></h5>
                </div>

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
            </div>

          </div>
          <?php 
          endif;
          ?>

          <!-- End Product List -->
        </div>
      </div>
    </div>
  </section>
  <!-- End Product -->
</div>
