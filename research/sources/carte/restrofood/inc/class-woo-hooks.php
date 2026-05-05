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

class Woo_Hooks {

  function __construct() {

    // Add custom field to order object action hook
    add_action( 'woocommerce_checkout_create_order_line_item', [ __CLASS__ ,'restrofood_add_custom_data_to_order' ], 10, 4 );

    // Woocommerce Order meta data after shipping address action hook
    add_action( 'woocommerce_admin_order_data_after_shipping_address', [ __CLASS__, 'restrofood_edit_woocommerce_checkout_page' ], 10, 1 );

    //Woocommerce Order meta data after shipping address action
    add_action( 'woocommerce_checkout_update_order_meta', [ __CLASS__, 'checkout_update_order_meta' ], 10, 2 );

    // Override WooCommerce Templates from plugin filter hook
    add_filter( 'woocommerce_locate_template', [ __CLASS__, 'restrofood_woo_template' ], 1, 3 );

    // WooCommerce order meta query filter hook
    add_filter( 'woocommerce_order_data_store_cpt_get_orders_query', [ __CLASS__, 'restrofood_order_meta_query_var' ], 10, 2 );

    // WooCommerce product meta query filter hook
    add_filter( 'woocommerce_product_data_store_cpt_get_products_query', [ __CLASS__, 'restrofood_product_meta_query_var'], 10, 2 );

    // Add product extra items price action hook
    add_action( 'woocommerce_before_calculate_totals', [ __CLASS__, 'add_product_extra_items_price' ], 10, 1);

    // Order status set ( order place  or pre order )
    add_action( 'woocommerce_order_status_processing', [ __CLASS__, 'order_status_changed' ], 10, 1 );
    add_action( 'woocommerce_order_status_completed', [ __CLASS__, 'order_status_changed' ], 10, 1 );
    add_action( 'woocommerce_order_status_on-hold', [ __CLASS__, 'order_status_changed' ], 10, 1 );

    // Order cancelled hook
    add_action( 'woocommerce_cancelled_order', [ __CLASS__, 'wc_cancelled_order'], 10, 1 );

    // order status failed hook
    add_action('woocommerce_order_status_failed', [ __CLASS__, 'wc_failed_order'], 15, 2);

    // 
    add_action( 'woocommerce_cart_calculate_fees', [ $this, 'checkout_radio_choice_fee' ], 20, 1 );

    // 
    add_action( 'woocommerce_checkout_update_order_review', [ $this, 'checkout_radio_choice_set_session' ] );

    //
    add_filter( 'wc_order_statuses', [ __CLASS__, 'add_pre_order_statuses' ] );
      
    //
    add_action( 'init', [ __CLASS__, 'register_pre_order_status' ] );
    
    //
    add_filter( 'woocommerce_add_to_cart_validation', [ __CLASS__, 'add_to_cart_validation' ], 10, 4 );

    //
    add_filter( 'manage_edit-product_columns', [__CLASS__, 'add_product_column'], 10, 1 );

    //
    add_action( 'manage_product_posts_custom_column', [__CLASS__, 'add_product_column_content'], 10, 2 );

    //
    add_filter( 'woocommerce_package_rates', [__CLASS__, 'hide_shipping_when_free_is_available'], 100 );

    //
    add_action( 'woocommerce_after_checkout_validation', [__CLASS__, 'checkout_page_validate' ], 10, 2);

    //
    add_action( 'woocommerce_checkout_process', [ __CLASS__, 'wc_checkout_minimum_order_amount' ] );

    //
    add_action( 'woocommerce_before_cart' , [ __CLASS__, 'wc_cart_minimum_order_amount' ] );

    // cancel unpaid order
    add_filter( 'woocommerce_cancel_unpaid_order', [ __CLASS__, 'action_woocommerce_cancel_unpaid_orders'], 10, 2 );
    //
    add_filter( 'woocommerce_add_to_cart_fragments', [ __CLASS__, 'cart_count_fragments' ], 10, 1 );
    //
    remove_action( 'woocommerce_widget_shopping_cart_total', 'woocommerce_widget_shopping_cart_subtotal' );
    add_action( 'woocommerce_widget_shopping_cart_total', [ __CLASS__, 'widget_shopping_cart_total' ], 10 );
    //
    remove_action( 'woocommerce_widget_shopping_cart_buttons', 'woocommerce_widget_shopping_cart_button_view_cart', 10 );
    remove_action( 'woocommerce_widget_shopping_cart_buttons', 'woocommerce_widget_shopping_cart_proceed_to_checkout', 20 );

  }

  public static function getText() {
    return \RestroFood\Inc\Text::getText();
  } 

  /**
   * Add custom field to order object
   */
  public static function restrofood_add_custom_data_to_order( $item, $cart_item_key, $values, $order ) {

    foreach( $item as $cart_item_key => $values ) {
      // Item Instructions
      if( isset( $values['item_instructions'] ) ) {
        $item->add_meta_data( esc_html__( 'Item Instructions', 'restrofood' ), sanitize_text_field( $values['item_instructions'] ), true );
      }
      // Item extra features
      if( isset( $values['extra_options'] ) ) {
        $item->add_meta_data( esc_html__( 'Item Extra:-', 'restrofood' ), sanitize_text_field( $values['extra_options'] ), true );
      }

    }

  }
  
/**
 * Woocommerce Order meta data after shipping address
 *
 * 
 */
public static function restrofood_edit_woocommerce_checkout_page( $order ){

  global $post_id;
  $order = new \WC_Order( $post_id );

  $orderID = $order->get_id();
  $time = get_post_meta ( absint( $orderID ) , '_pickup_time', true );
  $deliveryType = get_post_meta ( absint( $orderID ) , '_delivery_type', true );
  $branch = get_post_meta ( absint( $orderID ), '_rb_pickup_branch', true );

  //
  if( !empty( $deliveryType ) ) {
    echo '<p><strong>'.esc_html__('Delivery Type', 'restrofood' ).':</strong> ' . esc_html( $deliveryType ) . '</p>';
  }
  //
  if( !empty( $time ) ) {
    echo '<p><strong>'.esc_html__('Time to Deliver/Pickup', 'restrofood' ).':</strong> ' . esc_html( $time ) . '</p>';
  }
  //
  if( !empty( $branch ) ) {
    echo '<p><strong>'.esc_html__('Pickup Branch Name', 'restrofood' ).':</strong> ' . esc_html( get_the_title( $branch ) ) . '</p>';
  }
  
}

/**
 * Woocommerce Add Order meta data 
 *
 */
public static function checkout_update_order_meta( $order_id, $posted ) {

    $order = wc_get_order( $order_id );

    //
    if( isset( $_POST['rb_delivery_time'] ) ) {
      $time = explode( ',', $_POST['rb_delivery_time']);
      $order->update_meta_data( '_pickup_time', sanitize_text_field( $time[0] ) );
    }
    //
    if( isset( $_POST['rb_delivery_options'] ) ) {
      $order->update_meta_data( '_delivery_type', sanitize_text_field( $_POST['rb_delivery_options'] ) );
    }
    //
    if( isset( $_POST['rb_pickup_branch'] ) ) {
      $order->update_meta_data( '_rb_pickup_branch', sanitize_text_field( $_POST['rb_pickup_branch'] ) );
    }
    //
    if( isset( $_POST['rb_delivery_date'] ) ) {
      $order->update_meta_data( '_delivery_date', sanitize_text_field( $_POST['rb_delivery_date'] ) );
    }
    
    $order->save();

} 

/**
 *
 * Override WooCommerce Templates
 * 
 */
public static function restrofood_woo_template( $template, $template_name, $template_path ) {

     global $woocommerce;
     $_template = $template;
     if ( ! $template_path ) 
        $template_path = $woocommerce->template_url;
 
     $plugin_path  = untrailingslashit( RESTROFOOD_DIR_PATH )  . '/template/woocommerce/';
 
    // Look within passed path within the theme - this is priority
    $template = locate_template(
    array(
      $template_path . $template_name,
      $template_name
    )
   );
 
   if( file_exists( $plugin_path . $template_name ) )
    $template = $plugin_path . $template_name;
 
   if ( ! $template )
    $template = $_template;

   return $template;

}

/**
 *
 * WooCommerce order meta query 
 * 
 */
public static function restrofood_order_meta_query_var( $query, $query_vars ) {

  if ( ! empty( $query_vars['tracking_status'] ) ) {
    $query['meta_query'][] = array(
      'key' => '_order_tracking_status',
      'value' => esc_attr( $query_vars['tracking_status'] ),
    );
  }

  //
  if ( ! empty( $query_vars['branch'] ) ) {
    $query['meta_query'][] = array(
      'key' => '_rb_pickup_branch',
      'value' => esc_attr( $query_vars['branch'] ),
    );
  }
  
  //
  if ( ! empty( $query_vars['delivery_boy'] ) ) {
    $query['meta_query'][] = array(
      'key' => '_order_delivery_boy',
      'value' => esc_attr( $query_vars['delivery_boy'] ),
    );
  }
  //
  if ( ! empty( $query_vars['delivery_date'] ) ) {
    $query['meta_query'][] = array(
      'key' => '_delivery_date',
      'value' => esc_attr( $query_vars['delivery_date'] ),
    );
  }
  //
  if ( ! empty( $query_vars['pre_order_status'] ) ) {
    $query['meta_query'][] = array(
      'key' => '_pre_order_status',
      'value' => esc_attr( $query_vars['pre_order_status'] ),
    );
  }
  //
  if ( ! empty( $query_vars['pickup_time'] ) ) {
    $query['meta_query'][] = array(
      'key' => '_pickup_time',
      'value' => esc_attr( $query_vars['pickup_time'] ),
    );
  }

  return $query;
}

/**
 *
 * WooCommerce product meta query 
 * 
 */

public static function restrofood_product_meta_query_var( $query, $query_vars ) {

  // low to high price

  if ( ! empty( $query_vars['low_to_high_price'] ) ) {
    $query['meta_query'][] = array(
      'relation' => 'OR',
      array(
          'key' => '_price',
          'value' => esc_attr( $query_vars['low_to_high_price'] ),
          'compare' => '>',
          'type' => 'NUMERIC'
      ),         
      array(
          'key' => '_sale_price',
          'value' => esc_attr( $query_vars['low_to_high_price'] ),
          'compare' => '>',
          'type' => 'NUMERIC'
      )
    );
  }

  // Average rating
  if ( ! empty( $query_vars['average_rating_product'] ) ) {
    $query['meta_query'][] = array(
      array(
          'key' => '_wc_average_rating',
          'value' => esc_attr( $query_vars['average_rating_product'] ),
          'compare' => '>',
          'type' => 'NUMERIC'
      )
    );
  }

  // Product query by branch meta
  if ( ! empty( $query_vars['product_by_branch'] ) ) {
    $query['meta_query'][] = array(
      array(
          'key' => 'restrofoodbranch_list',
          'value' => esc_attr( $query_vars['product_by_branch'] ),
          'compare' => 'LIKE'
      )
    );
  }

  // Average rating
  if ( ! empty( $query_vars['total_sales_product'] ) ) {
    $query['meta_query'][] = array(
      array(
          'key' => 'total_sales'
      )
    );
  }
  

  return $query;

}

/**
 *
 * Before calculate totals
 * Add product extra items price
 * 
 */
public static function add_product_extra_items_price( $cart_object ) {

    if ( is_admin() && ! defined( 'DOING_AJAX' ) )
        return;

    foreach ( $cart_object->get_cart() as $cart_item ) {

      if( !empty( $cart_item['extra_options_price'] ) ) {
        $cart_item['data']->set_price( $cart_item['data']->get_price() + $cart_item['extra_options_price'] );
      }

    }
}

public static function order_status_changed( $order_id ) {

  $time = current_time( "Y-m-d H:i:s" );
  $CurrentDate = current_time( "d-m-Y" );

  // Get delivery date
  $dDate = get_post_meta( absint($order_id), '_delivery_date', true );

  // Pre order status
  if( strtotime( $dDate ) >  strtotime( $CurrentDate ) ) {
    update_post_meta( absint( $order_id ), '_pre_order_status', sanitize_text_field( 'PO' ) );
  }

  // Update status
  update_post_meta( absint( $order_id ), '_order_tracking_status', sanitize_text_field( 'OP' ) );
  update_post_meta( absint( $order_id ), '_order_tracking_status_time', sanitize_text_field( $time ) );

}

/**
 * WooCommerce order cancelled callback
 * Update order tracking status
 * @param  int $order_id
 * @return void
 */
public static function wc_cancelled_order( $order_id ) {
  $time = current_time( "Y-m-d H:i:s" );
  update_post_meta( absint( $order_id ), '_order_tracking_status', sanitize_text_field( 'OC' ) );
  update_post_meta( absint( $order_id ), '_order_tracking_status_time', sanitize_text_field( $time ) );
}

/**
 * wc_failed_order 
 * Update order tracking status when order failed
 * @param  int $order_id and object $order
 * @return void
 */
public static function wc_failed_order( $order_id, $order ) {
  $time = current_time( "Y-m-d H:i:s" );
  update_post_meta( absint( $order_id ), '_order_tracking_status', sanitize_text_field( 'OF' ) );
  update_post_meta( absint( $order_id ), '_order_tracking_status_time', sanitize_text_field( $time ) );
}

/**
 * action_woocommerce_cancel_unpaid_orders
 * Update order tracking status to cancelled when unpaid order time limit reached.
 * @param  bool $cby and object $order
 * @return void
 */
public static function action_woocommerce_cancel_unpaid_orders( $cby, $order ) {

  if( $cby ) {
    update_post_meta( $order->get_id(), '_order_tracking_status', sanitize_text_field( 'OC' ) );
    $order->update_status( 'cancelled', esc_html__( 'Unpaid order cancelled - time limit reached.', 'restrofood' ) );
  }
  
}

/**
 *
 * Add Fee and Calculate Total
 * 
 */

function checkout_radio_choice_fee( $cart ) {
   
  if ( is_admin() && ! defined( 'DOING_AJAX' ) ) return;

  $options = get_option('restrofood_options');

  //
  if( !empty( $options['location_type'] ) && $options['location_type'] == 'address' ) {
    $deliveryFee = restrofood_radius_based_delivery_fee();
  } else {
    $deliveryFee = restrofood_zipcode_based_delivery_fee();
  }

  $freeShippingAmount = isset( $options['free-shipping-amount'] ) ? $options['free-shipping-amount'] : '';

  // Free shipping
  if( !empty( $freeShippingAmount ) && WC()->cart->get_subtotal() >= $freeShippingAmount ) {
    return;
  }
  //
  $radio = WC()->session->get( 'radio_chosen' );

  if ( $radio == 'Delivery' ) {
      $fee = $deliveryFee;
  }else {
      $fee = 0;
  }

  //
  if ( $fee ) {
    $cart->add_fee( esc_html__( 'Delivery Fee', 'restrofood' ), esc_html( $fee ) );
  }
   
}

/**
 *
 * Add Radio Choice to Session
 * 
 */
function checkout_radio_choice_set_session( $posted_data ) {
  parse_str( $posted_data, $output );
  if ( isset( $output['rb_delivery_options'] ) ){
      WC()->session->set( 'radio_chosen', $output['rb_delivery_options'] );
  }
}

/**
 * [register_pre_order_status description]
 * @return [type] [description]
 */
public static  function register_pre_order_status() {
 
  register_post_status( 'wc-pre-order', array(

  'label' => esc_html__( 'Pre Order', 'restrofood' ),
  'public' => true,
  'show_in_admin_status_list' => true,
  'show_in_admin_all_list' => true,
  'exclude_from_search' => false,
  'label_count' => _n_noop( 'Pre Order <span class="count">(%s)</span>', 'Pre Order <span class="count">(%s)</span>' )

  ) );

}

/**
 * [add_pre_order_statuses description]
 * @param [type] $order_statuses [description]
 */
public static function add_pre_order_statuses( $order_statuses ) {

  $new_order_statuses = array();

  foreach ( $order_statuses as $key => $status ) {
    $new_order_statuses[ $key ] = $status;
    if ( 'wc-processing' === $key ) {
      $new_order_statuses['wc-pre-order'] = esc_html__( 'Pre Order', 'restrofood' );
    }

  }

  return $new_order_statuses;

}


/**
 * Validate product extra features option
 */
public static function add_to_cart_validation( $passed, $product_id, $quantity, $variation_id=null ) {

  // Check product extra required item selected
  $requiredStatus = !empty( $_POST['required_status'] ) ? $_POST['required_status'] : [];
  if( in_array( 'false' , $requiredStatus ) ) {
    $passed = false;
    wc_add_notice( esc_html__( 'Features items is a required field.', 'restrofood' ), 'error' );
  }
  return $passed;
}

/**
 * [add_product_column description]
 * @param [type] $columns [description]
 */
public static function add_product_column( $columns ) {
    //add branch column 
    
    if( restrofood_is_multi_branch() ) {
      $columns['branch_name'] = esc_html__( 'Branch Name', 'restrofood' );
    }

    return $columns;
}

/**
 * [add_product_column_content description]
 * @param [type] $column [description]
 * @param [type] $postid [description]
 */
public static function add_product_column_content( $column, $postid ) {

    if ( restrofood_is_multi_branch() && $column == 'branch_name' ) {

      $branch = get_post_meta( $postid, 'restrofoodbranch_list', true );

      if( !empty( $branch ) ) {
        $BranchName = [];
        foreach( $branch as $branchId ) {
          $BranchName[] = get_the_title( $branchId );
        }

        echo implode(', ', $BranchName);
      }
        
    }

}

/**
 * [hide_shipping_when_free_is_available description]
 * @param  [type] $rates [description]
 * @return [type]        [description]
 */
public static function hide_shipping_when_free_is_available( $rates ) {
  $free = array();

  $options = get_option('restrofood_options');
  $freeShippingAmount = isset( $options['free-shipping-amount'] ) ? $options['free-shipping-amount'] : '';

  // Free shipping
  if( !empty( $freeShippingAmount ) && WC()->cart->get_subtotal() >= $freeShippingAmount ) {

    foreach ( $rates as $rate_id => $rate ) {
      if ( 'free_shipping' == $rate->method_id ) {
        $free[ $rate_id ] = $rate;
        break;
      }
    }

    return ! empty( $free ) ? $free : $rates;
  } else {
    
    return $rates;
  }

}

/**
  * Validate checkout branch select option
  */
public static function checkout_page_validate( $fields, $errors ) {
  
  $options = get_option('restrofood_options');
  $text = self::getText();

  // Check delivery option status
  if( empty( $options['checkout-delivery-option'] ) ) {
    return;
  }

  // Check branch 
  if( restrofood_is_multi_branch() &&  empty( $_POST['rb_pickup_branch'] ) ) {
    $errors->add( 'validation', esc_html( $text['valid_branch_field'] ) );
  }

  // Check delivery pickup type
  if( empty( $_POST['rb_delivery_options'] ) ) {
    $errors->add( 'validation', esc_html( $text['valid_delivery_type_field'] ) );
  }

  // Check inrestaurant table number
  if( $_POST['rb_delivery_options'] == 'In-Restaurant' && empty( $_POST['rb_inrestaurant_table'] ) ) {
    $errors->add( 'validation', esc_html( $text['valid_inrestaurant_table_number_field'] ) );
  }

  // Check delivery time validation 
  if( !empty( $options['pickup-time-switch'] ) && ( !empty( $_POST['rb_delivery_options'] ) && $_POST['rb_delivery_options'] != 'In-Restaurant'  ) ) {

    // delivery time empty check 
    if( empty( $_POST['rb_delivery_time'] ) ) {
      $errors->add( 'validation', esc_html( $text['valid_delivery_time_field'] ) );
    }
    //
    if( !empty( $_POST['rb_delivery_time'] ) && in_array( 'no', explode(',', $_POST['rb_delivery_time']) ) ) {
      $errors->add( 'validation', esc_html( $text['valid_slot_not_available'] ) );
    }
    //
    if( !empty( $_POST['rb_delivery_time'] ) && in_array( 'true', explode(',', $_POST['rb_delivery_time'] ) ) ) {
      $errors->add( 'validation', esc_html( $text['valid_break_time'] ) );
    }

  }

  //
  if( !empty( $options['availability-checker-active'] ) && $_POST['rb_delivery_options'] == 'Delivery' ) {

    $dAvailabilityStatus = get_transient('d_availability_status');

    if( empty( $dAvailabilityStatus ) ) {
        $errors->add( 'validation', esc_html__( 'Please check delivery availability on your location, Before place order', 'restrofood' ) );
    } else {
      if( $dAvailabilityStatus == 'no' ) {
        $errors->add( 'validation', esc_html( $text['delivery_available_error'] ) );
      }
    }

  }
  
}

/**
 * Set a minimum order amount for checkout
 * @return [type] [description]
 */
public static function wc_cart_minimum_order_amount() {
    // Set this variable to specify a minimum order value
  if( ! WC()->cart ) {
    return;
  }
    $minimum = restrofood_getOptionData( 'minimum-order-amount' );
    $cartSubtotal = WC()->cart->get_subtotal();

    if ( !empty( $minimum ) && $cartSubtotal < $minimum ) {

      $notice = sprintf(
        esc_html__( 'Your current cart total is %s — you must have an order with a minimum of %s to place your order', 'restrofood' ) , 
        wc_price( $cartSubtotal ), 
        wc_price( $minimum )
      );

      wc_print_notice( $notice, 'error' );

    }
}

/**
 * [wc_checkout_minimum_order_amount description]
 * @return [type] [description]
 */
public static function wc_checkout_minimum_order_amount() {
    // Set this variable to specify a minimum order value
    $minimum = restrofood_getOptionData( 'minimum-order-amount' );
    $cartSubtotal = WC()->cart->get_subtotal();

    if ( !empty( $minimum ) && $cartSubtotal < $minimum ) {

      $notice = sprintf(
        esc_html__( 'Your current order sub total is %s — you must have an order with a minimum of %s to place your order', 'restrofood' ) , 
        wc_price( $cartSubtotal ), 
        wc_price( $minimum )
      );

      wc_add_notice( $notice, 'error' );

    }
}


// Update Cart Count & Mini Cart

public static function cart_count_fragments( $fragments ) {

 ob_start();
    ?>
    <span class="rb_cart_count rb_cart_icon"><?php echo sprintf( esc_html__( '%s Items', 'restrofood' ), esc_html( WC()->cart->get_cart_contents_count() ) ); ?> </span>
    <?php
        $fragments['.rb_cart_count'] = ob_get_clean();
    return $fragments;
      
}

public static function widget_shopping_cart_total() {
  echo '<div class="cart_table_item cart_table_item_subtotal">
      <div class="rb_product_info">
        <img src="'.esc_url( RESTROFOOD_DIR_URL. 'assets/img/icon/subtotal.png' ).'">
        <h4>'.esc_html__( 'Subtotal :', 'restrofood' ).'</h4>
    </div>
    <h6 class="rb_Price_subtotal">'.WC()->cart->get_cart_subtotal().'</h6>
  </div>';
}


}//

// Woo_Hooks class init

new Woo_Hooks();