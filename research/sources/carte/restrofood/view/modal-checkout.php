<div class="rb_checkout_steps_content step-checkout canvas-modal-checkout">

<?php
global $checkout; 

do_action( 'woocommerce_before_checkout_form', $checkout );
//
$getText = \Restrofood\Inc\Text::getText();
?>
<div class="woocommerce-page woocommerce-checkout">
<form name="checkout" method="post" class="checkout" action="<?php echo esc_url( wc_get_checkout_url() ); ?>" enctype="multipart/form-data">

  <?php do_action( 'woocommerce_checkout_before_customer_details' ); ?>

  <div class="fb-checkout-form-inner">

  <div class="col2-set" id="customer_details">

    <!-- Single Form -->
    <?php
    //
    $deliveryTime = get_option('restrofood_options');

    if( !empty( $deliveryTime['checkout-delivery-option'] ) ) :
    ?>
    <div class="rb_single_form rb_delivery rb_self_pickup_info rb_card">
    <?php
    // Branch Name
    if( restrofood_is_multi_branch() ):
    $rbBranchId = get_transient('rb_branch_id');
    $selectedBranch = !empty( $rbBranchId ) ? $rbBranchId : '';

    if( !empty( restrofood_branch_list_html() ) ):
    ?>
    <p class="form-row rb_mb_20">
      <label for="rb_pickup_branch" class="rb_input_label"><?php esc_html_e( 'Deliver/Pickup Branch Name', 'restrofood' ) ?><span class="fb-required">*</span> </label>
      <select name="rb_pickup_branch" id="rb_pickup_branch" class="rb_input_style">
      <?php
      echo restrofood_branch_list_html( esc_html__( 'Select Branch', 'restrofood' ),'',$selectedBranch );
      ?>
      </select>
    </p>
    <?php
    endif;
    endif;
    // Delivery types hook
    do_action( 'restrofood_delivery_types' );
      //
    if( !empty( $deliveryTime['pickup-time-switch'] ) && $deliveryTime['pickup-time-switch'] == 'yes' ):
        ?>
        <div class="rb_multiform delivery-schedule-options">
          <!-- Form Selector Group -->  
          <label for="rb_delivery_type" class="rb_input_label rb_mb_0">
          <?php esc_html_e( 'Delivery Schedule Type', 'restrofood' ) ?><span class="fb-required">*</span>
          </label>
          <ul class="rb_list_unstyled rb_form_selector_list rb_mt_5">
          <?php
          if( empty( $deliveryTime['off-current-order'] ) ):
          ?>
            <li class="rb_single_form_selector">
                <span class="rb_custom_checkbox">
                  <label>
                    <input type="radio" value="todayDelivery" class="shipping_method" name="rb_delivery_schedule_options" checked>
                    <span class="rb_label_title"><?php echo esc_html( $getText ['dp_today_text'] ); ?></span>
                    <span class="rb_custom_checkmark"></span>
                  </label>
                </span>
            </li>
            <?php
          endif; 
          //
          if( !empty( $deliveryTime['pre-order-active'] ) && 'yes' == $deliveryTime['pre-order-active'] ):
          ?>
            <li class="rb_single_form_selector">
                <span class="rb_custom_checkbox">
                  <label>
                    <input type="radio" value="scheduleDelivery" class="shipping_method" name="rb_delivery_schedule_options">
                    <span class="rb_label_title"><?php echo esc_html( $getText ['dp_schedule_text'] ); ?></span>
                    <span class="rb_custom_checkmark"></span>
                  </label>
                </span>
            </li>
          <?php 
          endif;
          ?>
          </ul>
          <!-- End Form Selector Group -->
        </div>
          <?php 
          if( !empty( $deliveryTime['pre-order-active'] ) && 'yes' == $deliveryTime['pre-order-active'] ):
          ?>
      <div class="dp-date-wrapper">
        <label for="rb_delivery_date" class="rb_input_label">
        <?php echo esc_html( $getText ['dp_date_text'] ); ?>
        </label>
        <select name="rb_delivery_date" id="rb_delivery_date" class="rb_input_style">
        <?php
        $dateList = \RestroFood\Date_Time_Map::getNaxtDaysDateList();
        if( !empty( $dateList ) ) {
          foreach ( $dateList as $date ) {
        
          $getDate = '';
          $dayDate = esc_html__( 'Select Date', 'restrofood' );

          if( !empty( $date['date'] ) ) {
            $dayDate = restrofood_display_day_by_date( $date['date'] ).' - '.esc_html( restrofood_display_date( $date['date'] ) );
            $getDate = $date['date'];
          }

            echo '<option value="'.esc_html( $getDate ).'">'.esc_html( $dayDate ).'</option>';
          }
        }
        ?>
        </select>
        </div>
        <?php
        endif;
        ?>
      <div class="fb-delivery-time-wrapper">
        <label for="rb_delivery_time" class="rb_input_label">
        <?php echo esc_html( $getText ['dp_time_text'] ); ?><span class="fb-required">*</span>
        </label>
        <?php 
        if( !empty( $deliveryTime['delivery-time-note'] ) ) {
          echo '<p class="delivery-time-note">'.esc_html( $deliveryTime['delivery-time-note'] ).'</p>';
        }
        ?>
        <select name="rb_delivery_time" id="rb_delivery_time" class="rb_input_style" required>
        <?php
        $timeList = \RestroFood\Date_Time_Map::getTimes();
        restrofood_time_solt_options_html( $timeList );
        ?>
        </select>
      </div>
      <?php 
      endif; //
      // Action hook checkout page before availability checker
      do_action( 'restrofood_checkout_before_availability_checker' );
      // Delivery Availability Checker Active
      if( !empty( $deliveryTime['availability-checker-active'] ) && $deliveryTime['availability-checker-active'] == 'yes' ):
      // Checkout page delivery location checker ON|OFF
      if( !empty( $deliveryTime['checkout-location-active'] ) && $deliveryTime['checkout-location-active'] == 'yes' ):
      ?>
      <div class="fb-checkout-availability-checker-wrapper">
        <a href="#" class="fb-show-availability-check-modal"><?php esc_html_e( 'Toggle Delivery Availability Form', 'restrofood' ); ?></a>
        <?php
        \Restrofood\Inc\Ability_Checker_Form::checkoutStatus();
        ?>
        <div class="fb-checkout-delivery-availability-checker rb_delivery_availability_checker">
          <?php
                // Form
                \Restrofood\Inc\Ability_Checker_Form::cartModalform();
                ?>
            </div>
          </div>
          <?php 
          endif; // End Checkout page delivery location checker ON|OFF
          endif; // End Delivery Availability Checker Active
          ?>
        <?php 
        // Action hook checkout page before order review
      do_action( 'restrofood_checkout_before_order_review' );
        ?>
    </div>
    <?php 
    endif;
    ?>

    <div class="fb-shipping-billing-address">
      <div class="woo-col-1">
        <?php do_action( 'woocommerce_checkout_billing' ); ?>
      </div>
      <div class="woo-col-2">
        <?php do_action( 'woocommerce_checkout_shipping' ); ?>
      </div>
    </div>
  </div>

  <?php do_action( 'woocommerce_checkout_after_customer_details' ); ?>

  
  <?php do_action( 'woocommerce_checkout_before_order_review_heading' ); ?>
    
  <?php do_action( 'woocommerce_checkout_before_order_review' ); ?>

  <div id="order_review" class="fb-checkout-review-order woocommerce-checkout-review-order">
    
    <!-- End Single Form -->
      
    <div class="rb_card fb-checkout-order-place-area">
        <div class="rb_card_title">
          <h3><?php esc_html_e( 'Your order', 'restrofood' ); ?></h3>
        </div>
      <?php do_action( 'woocommerce_checkout_order_review' ); ?>
    </div>
  </div>

  <?php do_action( 'woocommerce_checkout_after_order_review' ); ?>

  </div>

</form>

<?php do_action( 'woocommerce_after_checkout_form', $checkout ); ?>

  </div>
  </div>
