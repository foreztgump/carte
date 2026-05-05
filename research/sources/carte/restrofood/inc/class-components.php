<?php
namespace RestroFood;
/**
 *
 * @package     Restrofood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 *
 */

class Components {

  /**
   * delivery_boy_assign_component 
   * @param  [obj] $order 
   * @return html        
   */
  
  public function delivery_boy_assign_component( $order, $branch_id = '' ) {

    ?>
    <div class="delivery-boy rb_input_wrapper">
        <?php
        $boies = restrofood_get_branch_delivery_boy( $branch_id );
        $asigned_boy = get_post_meta( $order->get_id(), '_order_delivery_boy', true );
        ?>
        <select class="rb_input_style" id="delivery_boy" name="delivery_boy">
          <?php
          foreach( $boies as $key => $boy ) {
            echo '<option value="'.esc_html( $key ).'" '.selected( $key, $asigned_boy, false ).' >'.esc_html( $boy ).'</option>';
          }
          ?>
        </select>
        <button class="rb_btn_fill" id="delivery_assign" data-orderid="<?php echo esc_attr( $order->get_id() ); ?>" > <?php esc_html_e( 'Assign', 'restrofood' ); ?> </button>
    </div>
    <?php

  }

  /**
   * order_transfer_component 
   * 
   * @return html        
   */
  public function order_transfer_component( $order ) {
    ?>
    <div class="order-transfer rb_input_wrapper">
        <?php
        $branch = restrofood_branch_list();
        ?>
        <select class="rb_input_style" id="branch_list" name="branch_id">
          <option value=""><?php esc_html_e( 'Select Branch', 'restrofood' ); ?></option>
          <?php
          foreach( $branch as $key => $value ) {
            echo '<option value="'.esc_html( $key ).'">'.esc_html( $value ).'</option>';
          }
          ?>
        </select>
        <button class="rb_btn_fill" id="order_transfer" data-orderid="<?php echo esc_attr( $order->get_id() ); ?>" > <?php esc_html_e( 'Transfer', 'restrofood' ); ?> </button>
    </div>
    <?php

  }

/**
 * logout_url_html 
 * @return 
 */
public function logout_url_html() {

  $options = get_option('restrofood_options');
  $admin_page = !empty( $options['admin'] ) ? $options['admin'] : 'admin';

  $redirectUrl = home_url( $admin_page );
  echo '<a class="rb_btn_fill" href="'.esc_url( wp_logout_url( $redirectUrl ) ).'">'.esc_html__('Log Out', 'restrofood' ).'</a>';
}

/**
 * filter_form_html  
 * Order Date filter html form 
 * @return
 */

public function filter_form_html() {

  $currentDate = restrofood_current_date(true);

  ?>
  <div class="order-filter rb_mb_30 rb_mb_md_0">
    <label> <?php esc_html_e( 'Filter By Order Date:', 'restrofood' ); ?> </label>
      <div class="filter-form-inner">
        <div class="rb_input_wrapper">
          <input type="text" class="rb_input_style datepicker order-date" value="<?php echo esc_html( $currentDate ); ?>" data-getdate="" name="date" required />
          <button class="rb_btn_fill order-date-filter" type="submit"><?php esc_html_e( 'Filter', 'restrofood' ); ?></button>
        </div>
      </div>
  </div>
  <?php

}

/**
 * [preorder_filter_form_html description]
 * @return [type] [description]
 */
public function preorder_filter_form_html() {
  ?>
  <div class="order-filter rb_mb_30 rb_mb_md_0">
    <label> <?php esc_html_e( 'Filter By Delivery Date:', 'restrofood' ); ?> </label>
      <div class="filter-form-inner">
        <div class="rb_input_wrapper">
          <input type="text" class="rb_input_style datepicker preorder-date" data-getdate="" name="date" required />
          <?php
          if( restrofood_is_multi_branch() && current_user_can('administrator') ):
          ?>
            <?php 
            $branch = restrofood_branch_list();
            ?>
            <select class="w-100" id="order-branch" name="branch" required>
              <option value="0"><?php esc_html_e( 'All Branches', 'restrofood' ); ?></option>
              <?php 
              foreach( $branch as $key => $value )
                echo '<option value="'.esc_attr( $key ).'">'.esc_html( $value ).'</option>';
              ?>
            </select>
          <?php 
          endif;
          ?>
          <button class="rb_btn_fill preorder-date-filter" type="submit"><?php esc_html_e( 'Filter', 'restrofood' ); ?></button>
          <a class="rb_btn_fill preorder-date-filter" data-all-preorder="PO"><?php esc_html_e( 'All Pre Order', 'restrofood' ); ?></a>
        </div>
      </div>
  </div>
  <?php
}

/**
 * [filter_area description]
 * @return [type] [description]
 */
public function filter_area() {
  ?>
  <div class="rb_row admin-filter-area rb_align_items_end rb_mb_50">
    <div class="rb_col_md_5">
      <?php
      $this->filter_form_html();
      ?>
    </div>
    <div class="rb_col_md_5">
      <?php 

      if( !restrofood_is_user_role( 'delivery_boy' ) ) {
        $this->preorder_filter_form_html(); 
      }
      
      ?>
    </div>
    <div class="rb_col_md_2 rb_text_md_right admin-logout-btn">
      <?php
      $this->logout_url_html();
      ?>
    </div>
  </div>
  <?php
}


/**
 * admin_filter_form_html  
 * Date admin filter html form 
 * @return
 */

public function admin_filter_form_html() {

  $currentDate = restrofood_current_date(true);

  $date = isset( $_GET['date'] ) ? $_GET['date'] : $currentDate;

  ?>
  <label> <?php esc_html_e( 'Filter By Order Date:', 'restrofood' ); ?> </label>
  <form action="#" id="restrofood_filter" method="post" >
    <div class="filter-form-inner row">
      <div class="input-group col-md-6 col-12">
        <input type="text" class="w-100 datepicker order-date" data-getdate="" value="<?php echo esc_html( $date ); ?>" name="date" required />
      </div>
      <?php 
      if( restrofood_is_multi_branch() ):
      ?>
      <div class="input-group col-md-3 col-6">
        <?php 
        $branch = restrofood_branch_list();
        ?>
        <select class="w-100" id="order-branch" name="branch" required>
          <option value="0"><?php esc_html_e( 'All Branches', 'restrofood' ); ?></option>
          <?php 
          foreach( $branch as $key => $value )
            echo '<option value="'.esc_attr( $key ).'">'.esc_html( $value ).'</option>';
          ?>
        </select>
      </div>
      <?php 
      endif;
      ?>
      <div class="input-group col-md-3 col-6">
        <button class="w-100 fb-admin-btn" type="submit"><?php esc_html_e( 'Filter', 'restrofood' ); ?></button>
      </div>
    </div>
  </form>
  <?php

}

/**
 * status_button_html
 * @return html
 */
public function status_button_html( $order_id, $status ) {

  $statusText = restrofood_getStatusText();

  $oc = $stc = $ac = $cc = $OWD = $DC = '';

  //
  if( $status == 'OC' ) {
    $oc = 'status-active';
    $stc = $ac = $cc = $OWD = $DC = 'fb-d-none';
  }

  // 
  if( $status == 'STC' ) {
    $oc = 'fb-d-none';
    $stc = 'status-active';
  }
  // 
  if( $status == 'AC' ) {
    $oc = $stc = 'fb-d-none';
    $ac = 'status-active';
  }
  // 
  if( $status == 'CC' ) {
    $oc = $stc = $ac = 'fb-d-none';
    $cc = 'status-active';
  }
  // 
  if( $status == 'OWD' ) {
    $oc = $stc = $ac = $cc = 'fb-d-none';
    $OWD = 'status-active';
  }
  // 
  if( $status == 'DC' ) {
    $oc = $stc = $ac = $cc = $OWD = 'fb-d-none';
    $DC = 'status-active';
  }
  
  // // Don't show if user  delivery boy
  if( ! restrofood_is_user_role('delivery_boy') ):
  ?>

  <span data-orderid="<?php echo esc_html( $order_id ); ?>" data-tracking-status="OC" class="order-cancel <?php echo esc_attr( $oc ); ?>"><?php echo esc_html( $statusText['oc'] ); ?></span>

  <?php
  // Don't show if user not branch manager

  if( restrofood_is_user_role('branch_manager') || is_admin() ):
  ?>
  <span data-orderid="<?php echo esc_html( $order_id ); ?>" data-tracking-status="STC"  class="status-btn send-to-cooking <?php echo esc_attr( $stc ); ?>"><?php echo esc_html( $statusText['stc'] ); ?></span>
  <?php
  endif;
  // Don't show if user not kitchen manager
  if( restrofood_is_user_role('kitchen_manager') || is_admin() ):
  ?>
  <span data-orderid="<?php echo esc_html( $order_id ); ?>" data-tracking-status="AC" class="cooking-accept status-btn <?php echo esc_attr( $ac ); ?>"><?php echo esc_html( $statusText['ac'] ); ?></span>
  <?php
  endif;
  ?>

  <span data-orderid="<?php echo esc_html( $order_id ); ?>" data-tracking-status="CC" class="cooking-complete status-btn <?php echo esc_attr( $cc ); ?>"><?php echo esc_html( $statusText['cc'] ); ?></span>

  <?php
  endif // end check Delivery boy user
  ?>

  <span data-orderid="<?php echo esc_html( $order_id ); ?>" data-tracking-status="OWD" class="status-btn <?php echo esc_attr( $OWD ); ?>"><?php echo esc_html( $statusText['otw'] ); ?></span>

  <span data-orderid="<?php echo esc_html( $order_id ); ?>" data-tracking-status="DC" class="cooking-accept status-btn <?php echo esc_attr( $DC ); ?>"><?php echo esc_html_e( $statusText['dc'] ); ?></span>


<?php

}

/**
 * status_button_html
 * @return html
 */

function order_billing_shipping_details( $order ) {

  $billingName = $order->get_billing_first_name().' '.$order->get_billing_last_name();
  $shippingName = $order->get_shipping_first_name().' '.$order->get_shipping_last_name();

  $billingAddress = [
    $order->get_billing_address_1(),
    $order->get_billing_address_2(),
    $order->get_billing_city(),
    $order->get_billing_postcode()
  ];

  $shippingAddress = [
    $order->get_shipping_address_1(),
    $order->get_shipping_address_2(),
    $order->get_shipping_city(),
    $order->get_shipping_postcode()
  ];

  ?>
  <div class="fb-address-wrapper">
    <div class="row">
    <div class="col-md-6">
      <div class="fb-billing-address">
        <h4><?php esc_html_e( 'Billing Information', 'restrofood' ); ?></h4>
        <?php
        if( !empty( trim( $billingName ) ) ) {
        echo '<p>'.sprintf( esc_html__( 'Name: %s', 'restrofood' ), $billingName ).'</p>';
        }
        echo '<p>'.sprintf(  esc_html__( 'Phone: ', 'restrofood' ).'<a href="tel:%1$s">%1$s</a>', $order->get_billing_phone() ).'</p>';

        echo '<p>'.esc_html__( 'Address: ', 'restrofood' ).esc_html( implode( ', ' , $billingAddress ) ).'</p>';

        ?>
      </div>
    </div>

    <?php 
    $checkAddress = array_filter( $shippingAddress );
    if( !empty( $checkAddress ) ):
    ?>
    <div class="col-md-6">
      <div class="fb-shipping-address">
        <h4><?php esc_html_e( 'Shipping Information', 'restrofood' ); ?></h4>
        <?php
        if( !empty( trim($shippingName) ) ) {
          echo '<p>'.sprintf( esc_html__( 'Name: %s', 'restrofood' ), $shippingName ).'</p>';
        }
        //
        if( !empty( $checkAddress ) ) {
          //
          echo '<p>'.esc_html__( 'Address: ', 'restrofood' ).esc_html( implode( ', ' , $shippingAddress ) ).'</p>';
        }
        
        ?>
      </div>
    </div>
    <?php 
    endif;
    ?>

    </div>
  </div>
  <?php
}

/**
 * [invoice_js_template description]
 * @return HTML
 */
public function invoice_js_template() {

  ?>
  <div class="fb-invoice-template rb_modal_content_inner" style="display: none;">
    <?php
    // Logo
    $this->invoice_logo();
    // Header text restaurant name
    $this->invoice_header_text();
    $styleAttrOrderInfo = 'float: left;width:50%';
    $styleAttrInvAddress = 'float: right;width:50%';
    ?>
    <div class="inv-header-info">
      <div class="inv-order-info" style="<?php echo esc_attr( $styleAttrOrderInfo ); ?>">
        <p class="order-id"><?php esc_html_e( 'Order ID: #', 'restrofood' ); ?> {{data.order_id}}</p>
        <p class="order-id"><?php esc_html_e( 'Order Date:', 'restrofood' ); ?> {{data.created_date}}</p>
        <p class="order-id"><?php echo sprintf( esc_html__( 'Delivery Type: %s', 'restrofood' ), "{{data.delivery_type}}"  ); ?></p>
        <# 
        var dDate = data.delivery_date ? data.delivery_date : '';
        var dTime = data.pickup_time ? data.pickup_time : '';
        #>
        <p class="order-id"><?php echo sprintf( esc_html__( 'Order Delivery/Pickup Time: %s', 'restrofood' ), "{{dDate+' / '+dTime}}"  ); ?></p>
        <p class="order-id"><?php echo sprintf( esc_html__( 'Payment Method: %s', 'restrofood' ), "{{data.payment_method}}"  ); ?></p>
      </div>
      <div class="inv-address" style="<?php echo esc_attr( $styleAttrInvAddress ); ?>">
        <div class="fb-billing-address">
          <h4><?php esc_html_e( 'Billing Information', 'restrofood' ); ?></h4>
          <# if( data.order_address.billing_name ){ #>
          <?php echo '<p>'.sprintf( esc_html__( 'Name: %s', 'restrofood' ), "{{data.order_address.billing_name}}" ).'</p>'; ?>
          <# } if( data.order_address.billing_name ){ #>
          <?php echo '<p>'.sprintf(  esc_html__( 'Phone: ', 'restrofood' ).'<a href="tel:%1$s">%1$s</a>', "{{data.order_address.billing_phone}}" ).'</p>'; ?>
          <# } #>
          <?php echo '<p>'.esc_html__( 'Address: ', 'restrofood' ).'{{data.order_address.billing_address}}</p>'; ?>
        </div>

        <# if( data.order_address.shipping_address ) { #>
          <div class="fb-shipping-address">
            <h4><?php esc_html_e( 'Shipping Information', 'restrofood' ); ?></h4>
            <?php
            echo '<p>'.sprintf( esc_html__( 'Name: %s', 'restrofood' ), "{{data.order_address.shipping_name}}" ).'</p>';
                  echo '<p>'.esc_html__( 'Address: ', 'restrofood' ).'{{data.order_address.shipping_address}}</p>';
            
            ?>
          </div>
        <#}#>

      </div>
    </div>
    
    <div class="rb_order_table">
      <table>
        <thead>
          <tr>
          <th><?php esc_html_e( 'Item Name', 'restrofood' ); ?></th>
          <th><?php esc_html_e( 'Extra Item', 'restrofood' ); ?></th>
          <th><?php esc_html_e( 'Item Total Price', 'restrofood' ); ?></th>
          </tr>
        </thead>
        <tbody>
        <# _.each( data.order_items, function( item ) { #>
          <tr>
            <td>{{item.item_name}} X {{item.item_qty}}</td>
            <td>
              {{{item.item_meta_data}}}               
            </td>
            <td>{{{item.item_total_price}}}</td>
          </tr>
          <# } ) #>
        </tbody>
        <tfoot>
          <# if( data.discount_display ) { #>
          <tr>
            <th rowspan="1" colspan="1"></th>
            <th rowspan="1" colspan="1"><?php esc_html_e( 'Discount:', 'restrofood' ); ?></th>
            <th rowspan="1" colspan="1">- {{{data.discount_display}}}</th>
          </tr>
          <# } #>

          <# if( data.order_shipping_total ) { #>
          <tr>
            <th rowspan="1" colspan="1"></th>
            <th rowspan="1" colspan="1"><?php esc_html_e( 'Shipping Fee', 'restrofood' ); ?></th>
            <th rowspan="1" colspan="1">{{{data.order_shipping_total}}}</th>
          </tr>
          <# } #>
          <# if( data.order_total_fees ) { 
            _.each( data.get_fees, function( item ) {
          #>
          <tr>
            <th rowspan="1" colspan="1"></th>
            <th rowspan="1" colspan="1">{{{item.name}}}</th>
            <th rowspan="1" colspan="1">{{{item.amount}}}</th>
          </tr>
          <# })}
          <!-- Tax -->
          if( data.get_tax_totals ) { 
            _.each( data.get_tax_totals, function( item ) {
          #>
          <tr>
            <th rowspan="1" colspan="1"></th>
            <th rowspan="1" colspan="1">{{{item.label}}}</th>
            <th rowspan="1" colspan="1">{{{item.formatted_amount}}}</th>
          </tr>
          <# } )} #>
          <tr>
            <th rowspan="1" colspan="1"></th>
            <th rowspan="1" colspan="1"><?php esc_html_e( 'Total', 'restrofood' ); ?></th>
            <th rowspan="1" colspan="1">{{{data.order_total}}}</th>
          </tr>
        </tfoot>
      </table>

    </div>
    <?php 
    // Footer text
    $this->invoice_footer_text();
    ?>
  </div>
  <?php

}

/**
 * [thermal_printer_invoice_template description]
 * @return HTML
 */
public function thermal_printer_invoice_template() {
  $styleAttr = 'display: none;width:320px;background: rgb(243 243 243);';
  ?>
  <div class="fb-invoice-template thermal-printer-receipt rb_modal_content_inner" style="<?php echo esc_attr( $styleAttr ); ?>">
  
    <div class="inv-header-info">
      <?php
      // Logo
      $this->invoice_logo();
      // Header text restaurant name
      $this->invoice_header_text();
      ?>

      <div class="inv-order-info">
        <p class="order-id"><?php esc_html_e( 'Order ID: #', 'restrofood' ); ?> {{data.order_id}}</p>
        <p class="order-id"><?php esc_html_e( 'Order Date:', 'restrofood' ); ?> {{data.created_date}}</p>
        <p class="order-id"><?php echo sprintf( esc_html__( 'Delivery Type: %s', 'restrofood' ), "{{data.delivery_type}}"  ); ?></p>
        <# 
        var dDate = data.delivery_date ? data.delivery_date : '';
        var dTime = data.pickup_time ? data.pickup_time : '';
        #>
        <p class="order-id"><?php echo sprintf( esc_html__( 'Order Delivery/Pickup Time: %s', 'restrofood' ), "{{dDate+' / '+dTime}}"  ); ?></p>
        <p class="order-id"><?php echo sprintf( esc_html__( 'Payment Method: %s', 'restrofood' ), "{{data.payment_method}}"  ); ?></p>
      </div>
      <div class="inv-address">
        <div class="fb-billing-address">
          <h4><?php esc_html_e( 'Billing Information', 'restrofood' ); ?></h4>
          <# if( data.order_address.billing_name ){ #>
          <?php echo '<p>'.sprintf( esc_html__( 'Name: %s', 'restrofood' ), "{{data.order_address.billing_name}}" ).'</p>'; ?>
          <# } if( data.order_address.billing_name ){ #>
          <?php echo '<p>'.sprintf(  esc_html__( 'Phone: ', 'restrofood' ).'<a href="tel:%1$s">%1$s</a>', "{{data.order_address.billing_phone}}" ).'</p>'; ?>
          <# } #>
          <?php echo '<p>'.esc_html__( 'Address: ', 'restrofood' ).'{{data.order_address.billing_address}}</p>'; ?>
        </div>

        <# if( data.order_address.shipping_address ) { #>
          <div class="fb-shipping-address">
            <h4><?php esc_html_e( 'Shipping Information', 'restrofood' ); ?></h4>
            <?php
            echo '<p>'.sprintf( esc_html__( 'Name: %s', 'restrofood' ), "{{data.order_address.shipping_name}}" ).'</p>';
                  echo '<p>'.esc_html__( 'Address: ', 'restrofood' ).'{{data.order_address.shipping_address}}</p>';
            
            ?>
          </div>
        <#}#>

      </div>
    </div>
    
    <div class="rb_order_table">
      <table>
        <thead>
          <tr>
          <th><?php esc_html_e( 'Item Name', 'restrofood' ); ?></th>
          <th><?php esc_html_e( 'Extra Item', 'restrofood' ); ?></th>
          <th><?php esc_html_e( 'Item Total Price', 'restrofood' ); ?></th>
          </tr>
        </thead>
        <tbody>
        <# _.each( data.order_items, function( item ) { #>
          <tr>
            <td>{{item.item_name}} X {{item.item_qty}}</td>
            <td>
              {{{item.item_meta_data}}}            
            </td>
            <td>{{{item.item_total_price}}}</td>
          </tr>
          <# } ) #>
        </tbody>
        <tfoot>
          <# if( data.discount_display ) { #>
          <tr>
            <th rowspan="1" colspan="1"></th>
            <th rowspan="1" colspan="1"><?php esc_html_e( 'Discount:', 'restrofood' ); ?></th>
            <th rowspan="1" colspan="1">- {{{data.discount_display}}}</th>
          </tr>
          <# } #>

          <# if( data.order_shipping_total ) { #>
          <tr>
            <th rowspan="1" colspan="1"></th>
            <th rowspan="1" colspan="1"><?php esc_html_e( 'Shipping Fee', 'restrofood' ); ?></th>
            <th rowspan="1" colspan="1">{{{data.order_shipping_total}}}</th>
          </tr>
          <# } #>
          <# if( data.get_fees ) { 
            _.each( data.get_fees, function( item ) {
          #>
          <tr>
            <th rowspan="1" colspan="1"></th>
            <th rowspan="1" colspan="1">{{{item.name}}}</th>
            <th rowspan="1" colspan="1">{{{item.amount}}}</th>
          </tr>
          <# } )}
          <!-- Tax -->
          if( data.get_tax_totals ) { 
            _.each( data.get_tax_totals, function( item ) {
          #>
          <tr>
            <th rowspan="1" colspan="1"></th>
            <th rowspan="1" colspan="1">{{{item.label}}}</th>
            <th rowspan="1" colspan="1">{{{item.formatted_amount}}}</th>
          </tr>
          <# } )} #>
          <tr>
            <th rowspan="1" colspan="1"></th>
            <th rowspan="1" colspan="1"><?php esc_html_e( 'Total', 'restrofood' ); ?></th>
            <th rowspan="1" colspan="1">{{{data.order_total}}}</th>
          </tr>
        </tfoot>
      </table>

    </div>
    <?php
    // restaurant footer text
    $this->invoice_footer_text();
    ?>
  </div>
  <?php

}


/**
 * invoice_template
 * @return html
 */
public function invoice_template_wpadmin( $order ) {

  $order_id = $order->get_id();
  $paymentMethod = $order->get_payment_method_title();
  $pickup_time  = get_post_meta( absint( $order_id ) , '_pickup_time', true );
  $delivery_type  = get_post_meta( absint( $order_id ) , '_delivery_type', true );

  // address
  $billingName = $order->get_billing_first_name().' '.$order->get_billing_last_name();
  $shippingName = $order->get_shipping_first_name().' '.$order->get_shipping_last_name();

  $billingAddress = [
    $order->get_billing_address_1(),
    $order->get_billing_address_2(),
    $order->get_billing_city(),
    $order->get_billing_postcode()
  ];

  $shippingAddress = [
    $order->get_shipping_address_1(),
    $order->get_shipping_address_2(),
    $order->get_shipping_city(),
    $order->get_shipping_postcode()
  ];

  // Check print type
  $invoiceType = restrofood_getOptionData( 'invoice_type' );

  if( $invoiceType != 'thermal' ) {
    $pinterType = '';
  } else {
    $pinterType = ' thermal-printer-receipt';
  }

  ?>
  <div class="fb-invoice-template rb_modal_content_inner<?php echo esc_html( $pinterType ); ?>" style="display: none;">
    <?php
    // Logo
    $this->invoice_logo();
    // Header text restaurant name
    $this->invoice_header_text();
    ?>
    <div class="inv-header-info">
      <div class="inv-order-info" style="float: left">
        <p class="order-id"><?php esc_html_e( 'Order ID:', 'restrofood' ); ?> <?php echo esc_html( '#'.absint( $order_id ) ); ?></p>
        <p class="order-id"><?php esc_html_e( 'Order Date:', 'restrofood' ); ?> <?php echo esc_html( $order->get_date_created()->format ('M-d-Y') ); ?></p>
        <p class="order-id"><?php echo sprintf( esc_html__( 'Delivery Type: %s', 'restrofood' ), esc_html( $delivery_type )  ); ?></p>
        <p class="order-id"><?php echo sprintf( esc_html__( 'Order Delivery/Pickup Time: %s', 'restrofood' ), esc_html( $pickup_time )  ); ?></p>
        <p class="order-id"><?php echo sprintf( esc_html__( 'Payment Method: %s', 'restrofood' ), esc_html( $paymentMethod )  ); ?></p>
      </div>
      <div class="inv-address" style="float: right">
        
        <div class="fb-billing-address">
          <p><b><?php esc_html_e( 'Billing Information', 'restrofood' ); ?></b></p>
          <?php
          if( !empty( trim( $billingName ) ) ) {
          echo '<p>'.sprintf( esc_html__( 'Name: %s', 'restrofood' ), $billingName ).'</p>';
          }
          echo '<p>'.sprintf(  esc_html__( 'Phone: ', 'restrofood' ).'<a href="tel:%1$s">%1$s</a>', $order->get_billing_phone() ).'</p>';
          echo '<p>'.esc_html__( 'Address: ', 'restrofood' ).esc_html( implode( ', ' , $billingAddress ) ).'</p>';

          ?>
        </div>

        <?php 
        // Shipping address
        $checkAddress = array_filter( $shippingAddress );
        if( !empty( $checkAddress ) ):
        ?>
          <div class="fb-shipping-address">
            <p><b><?php esc_html_e( 'Shipping Information', 'restrofood' ); ?></b></p>
            <?php
            if( !empty( trim($shippingName) ) ) {
              echo '<p>'.sprintf( esc_html__( 'Name: %s', 'restrofood' ), $shippingName ).'</p>';
            }
            //
            if( !empty( $checkAddress ) ) {
              //
              echo '<p>'.esc_html__( 'Address: ', 'restrofood' ).esc_html( implode( ', ' , $shippingAddress ) ).'</p>';
            }
            
            ?>
          </div>
        <?php 
        endif;
        ?>
      </div>
    </div>
    
    <div class="rb_order_table">           
      <table>
        <thead>
          <tr>
          <th><?php esc_html_e( 'Item Name', 'restrofood' ); ?></th>
          <th><?php esc_html_e( 'Extra Item', 'restrofood' ); ?></th>
          <th><?php esc_html_e( 'Item Total Price', 'restrofood' ); ?></th>
          </tr>
        </thead>
        <tbody>
          <?php
          foreach ( $order->get_items() as $item_id => $item ) {
          ?>
          <tr>
            <td><?php echo esc_html( $item->get_name().' X '.$item->get_quantity() ); ?></td>
            <td>
            <?php
            wc_display_item_meta( $item );
            ?>
            </td>
            <td><?php echo esc_html( restrofood_currency_symbol_position( $item->get_total() ) ); ?></td>
          </tr>
          <?php
          }
          ?>
        </tbody>
        <tfoot>
          <?php 
          if( $order->get_discount_to_display() ):
          ?>
          <tr>
            <th rowspan="1" colspan="1"></th>
            <th rowspan="1" colspan="1"><?php esc_html_e( 'Discount:', 'restrofood' ); ?></th>
            <th rowspan="1" colspan="1"><?php echo $order->get_discount_to_display(); ?></th>
          </tr>
          <?php 
          endif;
          //
          if( $order->get_shipping_total() ):
          ?>
          <tr>
            <th rowspan="1" colspan="1"></th>
            <th rowspan="1" colspan="1"><?php esc_html_e( 'Shipping Fee', 'restrofood' ); ?></th>
            <th rowspan="1" colspan="1"><?php echo esc_html( restrofood_currency_symbol_position( $order->get_shipping_total() ) ); ?></th>
          </tr>
          <?php
          endif;
          // Fees
          if( !empty( $order->get_total_fees() ) ){
          foreach( $order->get_items('fee') as $fee ) {
          ?>
          <tr>
            <th rowspan="1" colspan="1"></th>
            <th rowspan="1" colspan="1"><?php echo esc_html( $fee->get_name() ); ?></th>
            <th rowspan="1" colspan="1"><?php echo esc_html( restrofood_currency_symbol_position( $fee->get_total()  ) ); ?></th>
          </tr>
          <?php 
          } // end foreach
          } // end if
          ?>
          <?php
          // Tax Fee
          if( wc_tax_enabled() ) {
          foreach( $order->get_tax_totals() as $tax ) {
          ?>
          <tr>
            <th rowspan="1" colspan="1"></th>
            <th rowspan="1" colspan="1"><?php echo esc_html( $tax->label ); ?></th>
            <th rowspan="1" colspan="1"><?php echo $tax->formatted_amount; ?></th>
          </tr>
          <?php 
          }// End tax foreach
          }// end if
          ?>
          <tr>
            <th rowspan="1" colspan="1"></th>
            <th rowspan="1" colspan="1"><?php esc_html_e( 'Total', 'restrofood' ); ?></th>
            <th rowspan="1" colspan="1"><?php echo esc_html( restrofood_currency_symbol_position( $order->get_total() ) ); ?></th>
          </tr>
        </tfoot>
      </table>
    </div>
    <?php
    // restaurant footer text
    $this->invoice_footer_text();
    ?>
  </div>
  <?php
}

/**
 * Invoice header text ( Restaurant name and address )
 * @return void
 */
public function invoice_header_text() {

  // restaurant name
  if( restrofood_getOptionData( 'header_restaurant_name' ) ) {
    $styleAttr = 'margin-bottom:6px;margin-top:0px;font-size:18px;font-weight:700;';
    echo '<h5 style="'.esc_attr( $styleAttr ).'">'.esc_html( restrofood_getOptionData( 'header_restaurant_name' ) ).'</h5>';
  }
  // restaurant address
  if( restrofood_getOptionData( 'header_restaurant_address' ) ) {
    $styleAttr = 'margin-bottom:6px;font-size:16px;font-weight:500;';
    echo '<p style="'.esc_attr( $styleAttr ).'">'.esc_html( restrofood_getOptionData( 'header_restaurant_address' ) ).'</p>';
  }
}

/**
 * Invoice footer text
 * @return void
 */
public function invoice_footer_text() {
  if( restrofood_getOptionData( 'invoice_footer_text' ) ) {
    $styleAttr = 'margin-top:12px;font-weight:600;font-size: 12px;';
      echo '<p style="'.esc_attr( $styleAttr ).'">'.esc_html( restrofood_getOptionData( 'invoice_footer_text' ) ).'</p>';
  }
}

/**
 * [invoice_logo description]
 * @return [type] [description]
 */
public function invoice_logo() {

  if( restrofood_getOptionData( 'invoice_logo' ) ) {
    echo '<img src="'.esc_url( restrofood_getOptionData( 'invoice_logo' ) ).'" />';
  }

}


}
