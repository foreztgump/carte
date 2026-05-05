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

class Components_Ajax {

  function __construct() {


    add_action( 'wp_ajax_login_action', [$this, 'login'] );
    add_action( 'wp_ajax_nopriv_login_action', [$this, 'login'] );

    add_action( 'wp_ajax_registration_action', [$this, 'registration'] );
    add_action( 'wp_ajax_nopriv_registration_action', [$this, 'registration'] );

    add_action( 'wp_ajax_woo_search_product', [$this, 'search_product'] );
    add_action( 'wp_ajax_nopriv_woo_search_product', [$this, 'search_product'] );

    add_action( 'wp_ajax_invitation_mail_action', [$this, 'invitation_mail'] );
    add_action( 'wp_ajax_nopriv_invitation_mail_action', [$this, 'invitation_mail'] );

    add_action( 'wp_ajax_order_tracking_status_action', [$this, 'order_tracking_status'] );
    add_action( 'wp_ajax_nopriv_order_tracking_status_action', [$this, 'order_tracking_status'] ); 

    add_action( 'wp_ajax_notification_number_action', [$this, 'notification_number'] );
    add_action( 'wp_ajax_nopriv_notification_number_action', [$this, 'notification_number'] );

    add_action( 'wp_ajax_order_delivery_boy_assign_action', [$this, 'order_delivery_boy_assign'] );
    add_action( 'wp_ajax_nopriv_order_delivery_boy_assign_action', [$this, 'order_delivery_boy_assign'] );

    add_action( 'wp_ajax_order_filter_by_date_action', [$this, 'order_filter_by_date'] );
    add_action( 'wp_ajax_nopriv_order_filter_by_date_action', [$this, 'order_filter_by_date'] );

    add_action( 'wp_ajax_order_branch_transfer_action', [$this, 'order_branch_transfer'] );
    add_action( 'wp_ajax_nopriv_order_branch_transfer_action', [$this, 'order_branch_transfer'] );

    add_action( 'wp_ajax_order_statistic_action', [$this, 'order_statistic'] );
    add_action( 'wp_ajax_nopriv_order_statistic_action', [$this, 'order_statistic'] );

    add_action( 'wp_ajax_update_order_review_action', [$this, 'update_order_review'] );
    add_action( 'wp_ajax_nopriv_update_order_review_action', [$this, 'update_order_review'] );

    add_action( 'wp_ajax_new_order_push_notification_action', [$this, 'new_order_push_notification'] );
    add_action( 'wp_ajax_nopriv_new_order_push_notification_action', [$this, 'new_order_push_notification'] );

    add_action( 'wp_ajax_branch_manager_data_action', [$this, 'branch_manager_data'] );
    add_action( 'wp_ajax_nopriv_branch_manager_data_action', [$this, 'branch_manager_data'] );

    add_action( 'wp_ajax_order_data_action', [$this, 'order_data'] );
    add_action( 'wp_ajax_nopriv_order_data_action', [$this, 'order_data'] );

    add_action( 'wp_ajax_manager_date_filter_data_action', [$this, 'manager_date_filter_data'] );
    add_action( 'wp_ajax_nopriv_manager_date_filter_data_action', [$this, 'manager_date_filter_data'] );

    add_action( 'wp_ajax_preorder_date_filter_data_action', [$this, 'preorder_date_filter_data'] );
    add_action( 'wp_ajax_nopriv_preorder_date_filter_data_action', [$this, 'preorder_date_filter_data'] );

    add_action( 'wp_ajax_order_time_lists_action', [$this, 'order_time_lists'] );
    add_action( 'wp_ajax_nopriv_order_time_lists_action', [$this, 'order_time_lists'] );

    add_action( 'wp_ajax_client_location_action', [$this, 'client_location'] );
    add_action( 'wp_ajax_nopriv_client_location_action', [$this, 'client_location'] );

    add_action( 'wp_ajax_location_availability_check_action', [$this, 'location_availability_check'] );
    add_action( 'wp_ajax_nopriv_location_availability_check_action', [$this, 'location_availability_check'] );

    add_action( 'wp_ajax_get_branch_location_action', [$this, 'get_branch_location'] );
    add_action( 'wp_ajax_nopriv_get_branch_location_action', [$this, 'get_branch_location'] );

    add_action( 'wp_ajax_visitor_address_from_cookie_action', [$this, 'visitor_address_from_cookie'] );
    add_action( 'wp_ajax_nopriv_visitor_address_from_cookie_action', [$this, 'visitor_address_from_cookie'] );

    add_action( 'wp_ajax_get_branch_location_by_id_action', [__CLASS__, 'get_branch_location_by_id'] );
    add_action( 'wp_ajax_nopriv_get_branch_location_by_id_action', [__CLASS__, 'get_branch_location_by_id'] );

    add_action( 'wp_ajax_get_branch_table_number', [__CLASS__, 'get_branch_table_numbers'] );
    add_action( 'wp_ajax_nopriv_get_branch_table_number', [__CLASS__, 'get_branch_table_numbers'] );

    add_action( 'wp_ajax_holy_day_check_action', [__CLASS__, 'holy_day_check'] );
    add_action( 'wp_ajax_nopriv_holy_day_check_action', [__CLASS__, 'holy_day_check'] );

    add_action( 'wp_ajax_woo_update_fixed_cart_subtotal', [__CLASS__, 'update_fixed_cart_subtotal'] );
    add_action( 'wp_ajax_nopriv_woo_update_fixed_cart_subtotal', [__CLASS__, 'update_fixed_cart_subtotal'] );



  }

  /**
   * [order_data description]
   * @return json object
   */
  public function order_data() {

    if( isset( $_POST['order_id'] ) ) {
      $obj = new Order_Details_Json( $_POST['order_id'] );
      echo $obj->getOrderData();
    }

    exit;

  }

  public function login() {

    // First check the nonce, if it fails the function will break
    $formData = isset( $_POST['data'] ) ? $_POST['data'] : '';
    $parms = [];
    parse_str( $formData, $parms );
    // Nonce is checked, get the POST data and sign user on
    $info = [];
    $info['user_login'] = $parms['uname'];
    $info['user_password'] = $parms['paw'];
    $info['remember'] = true;

    $user_signon = wp_signon( $info, false );

    if ( is_wp_error($user_signon) ){
        $s = array( 'loggedin' => false, 'message' => esc_html__('Wrong username or password.', 'restrofood' ) );
    } else {
        $s = array( 'loggedin' => true,  'message' => esc_html__('Login successful, redirecting...', 'restrofood' ) );
    }

    wp_send_json_success( $s );

  exit();

  }

  public function registration() {

    $formData = isset( $_POST['data'] ) ? $_POST['data'] : '';

    $parms = [];

    parse_str( $formData, $parms );

    $new_user_login = stripcslashes( $parms['username'] );
    $new_user_email = stripcslashes( $parms['useremail'] );
    $new_user_password = $parms['password'];

    $user_data = array(
        'user_login' => $new_user_login,
        'user_email' => $new_user_email,
        'user_pass' => $new_user_password,
        'role' => 'customer'
      );

      $user_id = wp_insert_user($user_data);
      //
      $status = [];

      if ( !is_wp_error( $user_id ) ) {

        wp_set_current_user( $user_id );
        wp_set_auth_cookie( $user_id );

        $status = [ 'loggedin' => true, 'user_id' => $user_id, 'message' => esc_html__('Wrong username or password.', 'restrofood' ) ];

      } else {

        if ( isset( $user_id->errors['empty_user_login'] ) ) {
            
            $status = [ 'loggedin' => false, 'message' => esc_html__('User Name and Email are mandatory', 'restrofood' ) ];

          } elseif (isset( $user_id->errors['existing_user_login'] ) ) {

            $status = [ 'loggedin' => false, 'message' => esc_html__('User name already exixts.', 'restrofood' ) ];

          } else {

            $status = [ 'loggedin' => false, 'message' => esc_html__('Error Occured please fill up the sign up form carefully.', 'restrofood' ) ];
           

          }

      }

      wp_send_json_success( $status );

    exit;

  }

  public function search_product() {
 
    global $wpdb, $woocommerce;
    $settionsOpt = get_option( 'restrofood_options' );
    if ( isset( $_POST['keyword'] ) && !empty( $_POST['keyword'] ) ) {
      
        $keyword = $_POST['keyword'];
        $getLayout = $_POST['layout'];
        $col = $_POST['col'];
        
        // Check multibranch
        if( restrofood_is_multi_branch() ) {
        $branchId  = isset( $_POST['branch'] ) ? $_POST['branch'] : '';

        $querystr = "SELECT DISTINCT $wpdb->posts.*
        FROM $wpdb->posts, $wpdb->postmeta
        WHERE $wpdb->posts.ID = $wpdb->postmeta.post_id
        AND (
            ($wpdb->postmeta.meta_key = '_sku' AND $wpdb->postmeta.meta_value LIKE '%{$keyword}%')
            OR
            ($wpdb->posts.post_content LIKE '%{$keyword}%')
            OR
            ($wpdb->posts.post_title LIKE '%{$keyword}%')
        )
        AND ($wpdb->postmeta.meta_key = 'restrofoodbranch_list' AND $wpdb->postmeta.meta_value LIKE '%{$branchId}%')
        AND $wpdb->posts.post_status = 'publish'
        AND $wpdb->posts.post_type = 'product'
        ORDER BY $wpdb->posts.post_date DESC";

        } else {

        $querystr = "SELECT DISTINCT $wpdb->posts.*
        FROM $wpdb->posts, $wpdb->postmeta
        WHERE $wpdb->posts.ID = $wpdb->postmeta.post_id
        AND (
            ($wpdb->postmeta.meta_key = '_sku' AND $wpdb->postmeta.meta_value LIKE '%{$keyword}%')
            OR
            ($wpdb->posts.post_content LIKE '%{$keyword}%')
            OR
            ($wpdb->posts.post_title LIKE '%{$keyword}%')
        )
        AND $wpdb->posts.post_status = 'publish'
        AND $wpdb->posts.post_type = 'product'
        ORDER BY $wpdb->posts.post_date DESC";

        }

        $query_results = $wpdb->get_results( $querystr );

        if ( !empty( $query_results ) ) {
 
            ob_start();
 
            $layout = new Product_Layout();

            foreach ( $query_results as $result ) {
 
                $product = get_product( $result->ID );
                // Product visibility time and preparing info
                $metaData = restrofood_visibility_time_preparing_info( $result->ID );

                $productData = [
                  'query_type'  => 'search',
                  'column' => $col,
                  'product' => $product,
                  'options' => $settionsOpt,
                  'is_visible' => $metaData['is_visible'],
                  'visibility_time_type' => $metaData['visibility_type'],
                  'preparing_data' => $metaData['preparing_data'],
                ];

                if( $getLayout != 'grid' ) {
                  $layout->setProductArgs( $productData )->product_layout_list();
                } else {
                  $layout->setProductArgs( $productData )->product_layout_grid();
                }
            
            }
            
    } else {
        esc_html_e( 'Product not found.', 'restrofood' );
    }
    
     echo ob_get_clean();

    }
    die();
  }


/**
 * order_delivery_boy_assign
 *
 * 
 */

public function order_delivery_boy_assign() {

  if( isset( $_POST['boy_id'] ) && isset( $_POST['orderId'] ) ) {
    
    $options = get_option('restrofood_options');

    $boyId   = $_POST['boy_id'];
    $orderId = $_POST['orderId'];

    $res = update_post_meta( absint( $orderId ), '_order_delivery_boy', sanitize_text_field( $boyId ) );

    // Order data
    $addNewOrders = [];
    $newOrder = sanitize_text_field( $orderId );
    $getOrders = get_user_meta( absint( $boyId ), '_delivery_boy_orders', true );

    if( !empty( $getOrders ) ) {
      $addNewOrders = $getOrders;
    }
    // Update Order
    if( ! in_array( $newOrder, $addNewOrders ) ) {
      array_push( $addNewOrders, $newOrder );
      update_user_meta( absint( $boyId ), '_delivery_boy_orders', $addNewOrders );

    }

    // Mail Send to delivery boy
    if( !empty( $options['active-order-assign-mail-notification'] ) ) {
      $mailNotifier = new \RestroFood\Inc\Delivery_Boy_Order_Assign_Mail();
      $mailNotifier->setBoyId($boyId)->setReceiverEmail()->setOrderId( $orderId )->mailFunc();
    }
    
    //
    if( !is_wp_error( $res ) ) {
       wp_send_json_success();
    } else {
      wp_send_json_error();
    }

  } else {
    wp_send_json_error();
  }


  exit;

}

/**
 * order tracking status change
 *
 * 
 */

public function order_tracking_status() {

  $options = get_option('restrofood_options');
  
  if( isset( $_POST['orderId'] ) && isset( $_POST['status'] )  ) {

    $order = wc_get_order( absint( $_POST['orderId'] ) );
    $time = current_time( "Y-m-d H:i:s" );

    // Order cancel status update in woocommerce 
    if( $_POST['status'] == 'OC' ) {
      // Status without the "wc-" prefix
      $order->update_status( 'wc-cancelled' );

    }

    // Order Delivery Complete status update in woocommerce 
    if( $_POST['status'] == 'DC' ) {
      // Status without the "wc-" prefix
      $order->update_status( 'wc-completed' );

    }

    //
    update_post_meta( absint( $_POST['orderId'] ), '_pre_order_status', sanitize_text_field( 'mf' ) ); // mf - modified
    update_post_meta( absint( $_POST['orderId'] ), '_order_tracking_status', sanitize_text_field( $_POST[ 'status' ] ) );
    update_post_meta( absint( $_POST['orderId'] ), '_order_tracking_status_time', sanitize_text_field( $time ) );

    // Mail notification
    if( !empty( $options['active-e-notification'] ) ) {
      $mailNotifier = new \RestroFood\Inc\Mail_Notifier();
      $mailNotifier->setOrderData( $order )->setReceiverEmail()->setStatus( esc_html( $_POST['status'] ) )->mailFunc();
    }

  }

  exit;

}

  /**
   *  Notification
   * 
   */
  
  public function notification_number() {

    $options = get_option('restrofood_options');

    $currentUser = get_current_user_id();

    // User data
    $user_meta = get_userdata( $currentUser );

    $user_roles = $user_meta->roles;


    $toDay = restrofood_current_date();

    // Get Selected date
    if( isset( $_POST['date'] ) && !empty( $_POST['date'] ) ) {
      $toDay = $_POST['date'];
    }
    // Get Selected branch id
    if( isset( $_POST['branche_id'] ) && !empty( $_POST['branche_id'] ) ) {
      $branche_id = $_POST['branche_id'];
    }

    // Check kitchen manager
    $is_kitchen = 0;
    if( $user_roles[0] == 'kitchen_manager' ) {
      $is_kitchen = 1;
    }


      // branch type check
      
      if( restrofood_is_multi_branch() ) {

        // Get Branch order

        $meta_key = '';

        if( $user_roles[0] == 'branch_manager' ) {
          $meta_key = 'restrofoodbranch_manager';
        }
        //
        
        if( $user_roles[0] == 'kitchen_manager' ) {
          $meta_key = 'restrofoodkitchen_manager';

        }


          // Get branch
          $args = array (
              'post_type'        => 'branches',
              'post_status'      => 'publish',
              'meta_key'         => $meta_key,
              'meta_value'       => esc_html( $currentUser ),
              'meta_compare' => 'LIKE'
          );

          $getBranchesId = get_posts( $args );

          $getBranchesId = array_column( $getBranchesId, 'ID' );
          
          // Check Admin
          if( !current_user_can('administrator') ) {
            $branchesId = $getBranchesId[0];
          } else {
            $branchesId = $branche_id;
          } 


        $args = array(
          'limit'          => '-1',
          'date_created'   => esc_html( $toDay ),
          'branch'         => esc_html( $branchesId ) // Branch id
        );

        $orders = wc_get_orders( $args );


      } else {

        $args = array(
          'limit'          => '-1',
          'date_created'   => esc_html( $toDay )
        );

        $orders = wc_get_orders( $args );

      }

      // Status Code
      ob_start();

      $statusText = restrofood_getStatusText();
      $new = $ac = $cc = $dc = $owd = 0;

      foreach( $orders as $order ) {
        
        $status = get_post_meta( $order->get_id(), '_order_tracking_status', true );
        if( $is_kitchen == 1  ) {

          if( empty( $options['kitchen-all-order'] ) ) {

            if( $status == 'STC' ) {
              $new = $new + 1;
            }

          } else {

            if( $status == 'OP' || $status == 'STC' ) {
              $new = $new + 1;
            }

          }

        } else {

          if( $status == 'OP' ) {
            $new = $new + 1;
          }

        }

        //
        if( $status == 'CC' ) {
          $cc = $cc + 1;
        }
        //
        if( $status == 'AC' ) {
          $ac = $ac + 1;
        }
        //
        if( $status == 'OWD' ) {
          $owd = $owd + 1;
        }
        //
        if( $status == 'DC' ) {
          $dc = $dc + 1;
        }

      } 

      echo '<div class="notifi-number-count">';
        echo '<span class="fb-noti-inner" data-filter="'.esc_attr( $statusText['op'] ).'">'.esc_html( $statusText['no'] ).'<span class="n-new">'.esc_html( $new ).'</span></span>';
        echo '<span class="fb-noti-inner" data-filter="'.esc_attr( $statusText['ac'] ).'">'.esc_html( $statusText['cp'] ).'<span class="n-cooking">'.esc_html( $ac ).'</span></span>';
        echo '<span class="fb-noti-inner" data-filter="'.esc_attr( $statusText['cc'] ).'">'.esc_html( $statusText['cc'] ).'<span class="n-completed">'.esc_html( $cc ).'</span></span>';
        echo '<span class="fb-noti-inner" data-filter="'.esc_attr( $statusText['owd'] ).'">'.esc_html( $statusText['otw'] ).'<span class="n-completed">'.esc_html( $owd ).'</span></span>';
        echo '<span class="fb-noti-inner" data-filter="'.esc_html( $statusText['dc'] ).'">'.esc_html( $statusText['dc'] ).'<span class="n-completed">'.esc_html( $dc ).'</span></span>';

      echo '</div>';

      echo ob_get_clean();

    exit;


  } 

  
  /**
   * 
   * @return [string] [description]
   */
  public function invitation_mail() {

    $getData = get_option( 'restrofood_options' );

    $headerMail = !empty( $getData['invitation-from-email'] ) ? $getData['invitation-from-email'] : get_option('admin_email');
    $subject = !empty( $getData['invitation-subject'] ) ? $getData['invitation-subject'] : "";
    $message = !empty( $getData['invitation-message'] ) ? $getData['invitation-message'] : "";
    // Mail header
    $headers  = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= 'From: <'.$headerMail.'>' . "\r\n";

    if( isset( $_POST['mail'] ) ) {

      $res = mail( sanitize_email( $_POST['mail'] ) , esc_html( $subject ), $message, $headers );

      if( $res ) {
        esc_html_e( 'Thanks for sending invitation', 'restrofood' );
      }else {
        esc_html_e( 'Invite failed, please try again.', 'restrofood' );
      }
      
    } else {
      esc_html_e( 'E-mail id not found.', 'restrofood' );
    }

    exit;

  }

/**
 * order_filter_by_date for wp admin foodfook manager
 * @return
 * 
 */

public function order_filter_by_date() {
      
        $toDay = restrofood_current_date();
        $Components      = new Components();
        $currency_symbol = get_woocommerce_currency_symbol();

        $date = isset( $_POST['date'] ) ? esc_html( $_POST['date'] ) : esc_html( $toDay );
        $preorder = isset( $_POST['preorder'] ) ? esc_html( $_POST['preorder'] ) : '';
        $deliveryDate = restrofood_date_format( $date, 'd-m-Y' );

        $is_multi_branch = false;

        // Order Args
        $orderargs = ['limit' => '-1'];
        $branch = '';
        if( restrofood_is_multi_branch() ) {

          $is_multi_branch = true;

          $branch = isset( $_POST['branch'] ) ? esc_html( $_POST['branch'] ) : '';

          // Add branch in order args
          $orderargs['branch'] = esc_html( $branch );  // Branch id

          if( isset( $_POST['queryType'] ) && 'preorder' == $_POST['queryType'] ) {

            // Add delivery date in order args
            if( !empty( $deliveryDate ) && !$preorder ) {
              $orderargs['delivery_date'] = $deliveryDate;
            }
            // Add pre order status in order args
            if( !empty( $preorder ) ) {
              $orderargs['pre_order_status'] = $preorder;
            }

          } else {
            $orderargs['date_created'] = $date;
          }

        } else {

          if( isset( $_POST['queryType'] ) && 'preorder' == $_POST['queryType'] ) {

            // Add delivery date in order args
            if( !empty( $deliveryDate ) && !$preorder ) {
              $orderargs['delivery_date'] = $deliveryDate;
            }
            // Add pre order status in order args
            if( !empty( $preorder ) ) {
              $orderargs['pre_order_status'] = $preorder;
            }


          } else {
            $orderargs['date_created'] = $date;
          }

        }
    
        $orders = wc_get_orders( $orderargs );

      ob_start();
        
        if( !empty( $orders ) ) {

          ?>
          <table class="wp-list-table widefat fixed responsive restrofood-order-list dataTable">
             
          <?php 
          // Table header 
          \RestroFood\Admin_Sub_Menu_Templates::data_table_header();
                    
          ?>

          <tbody id="admin-branch-order-list">
                
          <?php

          foreach( $orders as $order ) {
           
            $paymentMethod = $order->get_payment_method_title();
            $wcOrderStatus = $order->get_status();
            
            $orderId = $order->get_id();
            
            $status         = get_post_meta( absint( $orderId ), '_order_tracking_status', true );
            $preOrder       = get_post_meta( absint( $orderId ), '_pre_order_status', true );
            $pickup_time    = get_post_meta( absint( $orderId ), '_pickup_time', true );

            $delivery_date  = get_post_meta( absint( $orderId ) , '_delivery_date', true );
            $delivery_display_date = restrofood_display_date( $delivery_date );

            $delivery_time  = get_post_meta( absint( $orderId ) , '_pickup_time', true );

            $delivery_time  = !empty( $delivery_time ) ? ' - '.$delivery_time : '';

            $delivery_type  = get_post_meta( absint( $orderId ), '_delivery_type', true );

            if( $is_multi_branch ) {
              $branchID = get_post_meta( absint( $orderId ), '_rb_pickup_branch', true );
              $branchName  = get_the_title( $branchID );
            }

            $time = get_post_meta( absint( $orderId ), '_order_tracking_status_time', true );

            $orderDate = $order->get_date_created()->format ('M-d-Y');
            
            $orderDisplayDate = restrofood_display_date($orderDate);

            $orderTime = $order->get_date_created()->format ( restrofood_time_format() );

            $getTime = restrofood_time_elapsed_string( $time , true );

            $oc = $stc = $cc = $OWD = $DC = ''; 

            // 
            if( $status == 'OC' ) {
              $oc = 'status-active';
            }
            // 
            if( $status == 'STC' ) {
              $stc = 'status-active';
            }
            // 
            if( $status == 'CC' ) {
              $cc = 'status-active';
            }
            // 
            if( $status == 'OWD' ) {
              $OWD = 'status-active';
            }
            // 
            if( $status == 'DC' ) {
              $DC = 'status-active';
            }

            ?>
            <tr>
              <td><?php echo esc_html( '#'.$order->get_id() ); ?></td>
              <td><?php echo esc_html( $orderDisplayDate.' - '.$orderTime ); ?></td>
              <td>
                <?php 
                  $preOrderClass = '';
                  if( !empty( $preOrder ) && $preOrder == 'PO' ) {
                    $preOrderClass = 'pre-order';
                    echo esc_html( $delivery_display_date.$delivery_time ); 
                  } else {
                    echo esc_html( $orderDisplayDate.$delivery_time );
                  }
                ?>
              </td>
              <td><?php echo esc_html( $delivery_type ); do_action( 'restrofood_order_table_delivery_type_td', $orderId ); ?></td>
              <td>
                <?php 
                echo sprintf( esc_html__( "Method: %s", "restrofood" ), $paymentMethod );
                echo '<br>';
                echo sprintf( esc_html__( "Status: %s", "restrofood" ), $wcOrderStatus ); 
                ?>
              </td>
              <td>
                <span class="order-status <?php echo esc_attr( strtolower( $status ).'-status' ); ?>"><?php echo esc_html( restrofood_converted_tracking_status( $status )  ); ?></span>

                <?php 
                if( !empty( $preOrder ) && $preOrder == 'PO' ):
                ?>
                <span class="order-status <?php echo esc_html( $preOrderClass ); ?>"><?php echo esc_html( restrofood_converted_tracking_status( $preOrder )  ); ?></span>
                <?php 
                endif;
                ?>
                <br>
                <span class="time-status"><?php echo esc_html( $getTime ); ?></span>
              </td>
              <td>
                <span class="fb-view-order"><?php esc_html_e( 'View Details', 'restrofood' ); ?></span>
                <div class="rb_popup_modal">
                  <div class="rb_modal_wrap">
                    <div class="rb_modal">
                      <div class="rb_modal_inner">
                          <span class="rb_close_modal">
                            <img src="<?php echo RESTROFOOD_DIR_URL.'assets/img/icon/close.svg'; ?>" alt="<?php echo esc_attr( 'close', 'restrofood' ); ?>" />
                          </span>
                          <div class="rb_modal_content">
                            <div class="rb_modal_title text-center">
                              <h3><?php esc_html_e( 'Order Details', 'restrofood' ); ?></h3>
                              <div class="print-btn-area">
                                <span class="rb_btn_fill fb-inv-back fb-admin-modal-inv-back"><?php esc_html_e( 'Back', 'restrofood' ); ?></span>
                                <span class="rb_btn_fill fb-inv-print fb-admin-modal-inv-print"><?php esc_html_e( 'Print Invoice', 'restrofood' ); ?></span>
                              </div>
                            </div>
                            <?php
                            // Invoice Template
                            $Components->invoice_template_wpadmin( $order );
                            ?>
                            <div class="rb_modal_content_inner content-inner-hide">
                              <h4 class="order-id"><?php esc_html_e( 'Order ID:', 'restrofood' ); ?> <?php echo esc_html( '#'.$order->get_id() ); ?></h4>
                              <?php 
                              if( $is_multi_branch ):
                              ?>
                              <h4 class="order-id"><?php echo sprintf( esc_html__( 'Branch Name: %s', 'restrofood' ), esc_html( $branchName )  ); ?></h4>
                              <?php 
                              endif;
                              ?>
                              <h4 class="order-id"><?php echo sprintf( esc_html__( 'Order Date: %s', 'restrofood' ), esc_html( $orderDisplayDate )  ); ?></h4>
                              <h4 class="order-id"><?php echo sprintf( esc_html__( 'Delivery Type: %s', 'restrofood' ), esc_html( $delivery_type )  ); ?></h4>
                              <?php
                              //
                              do_action( 'restrofood_order_modal_header_after_delivery_type', $orderId );
                              ?>
                              <h4 class="order-id"><?php echo sprintf( esc_html__( 'Order Delivery/Pickup Date and Time: %s', 'restrofood' ), esc_html( $delivery_display_date.' / '.$pickup_time )  ); ?></h4>
                              <h4 class="order-id"><?php echo sprintf( esc_html__( 'Payment Method: %s', 'restrofood' ), esc_html( $paymentMethod )  ); ?></h4>
                              <?php
                              // Billing shipping details
                              $Components->order_billing_shipping_details( $order );
                               
                              if( $status != 'OF' ):  
                              ?>
                              <div class="kitchen-change-tracking">
                                <h4 class="rb_text_center"><?php esc_html_e( 'Tracking Status Action', 'restrofood' ); ?></h4>
                                <div class="status-button-area">
                                  <?php
                                  $Components->status_button_html( $order->get_id(), $status );
                                  ?>
                                </div>
                                <div class="row">
                                  <div class="col-md-6">
                                    <?php
                                      // Delivery Boy assign component
                                      $Components = new Components();
                                      $Components->delivery_boy_assign_component( $order, esc_html( $branch ) );
                                    ?>
                                  </div>
                                  <div class="col-md-6">
                                    <?php
                                      //
                                      if( restrofood_is_multi_branch() ) {
                                        $Components->order_transfer_component( $order );
                                      }
                                    ?>
                                  </div>
                                </div>
                              </div>
                              <?php 
                              endif;
                              ?>
                              <div class="fb--modal-inner">
                                <table>
                                  <thead>
                                    <tr>
                                      <th><?php esc_html_e( 'Item Name', 'restrofood' ); ?></th>
                                      <th><?php esc_html_e( 'Quantity', 'restrofood' ); ?></th>
                                      <th><?php esc_html_e( 'Extra Item', 'restrofood' ); ?></th>
                                      <th><?php esc_html_e( 'Item Total Price', 'restrofood' ); ?></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <?php

                                    foreach ( $order->get_items() as $item_id => $item ) {

                                      ?>
                                      <tr>
                                        <td><?php echo esc_html( $item->get_name() ); ?></td>
                                        <td><?php echo esc_html( $item->get_quantity() ); ?></td>
                                        <td>
                                        <?php
                                          // Display product meta
                                          wc_display_item_meta($item);
                                        ?>  
                                        </td>
                                        <td><?php echo esc_html( restrofood_currency_symbol_position( $item->get_total() ) ); ?></td>
                                      </tr>
                                      <?php
                                    }
                                    ?>
                                    <tr>
                                      <td><?php esc_html_e( 'Order Notes:', 'restrofood' ); ?></td>
                                      <td>
                                        <?php
                                        if( !empty( $order->get_customer_note() ) ) {
                                          echo esc_html( $order->get_customer_note() );
                                        }
                                        ?>
                                      </td>
                                      <td></td>
                                      <td></td>
                                    </tr>
                                  </tbody>
                                  <tfoot>
                                  <?php 
                                  if( !empty( $order->get_subtotal_to_display() ) ):
                                  ?>
                                  <tr>
                                    <th rowspan="1" colspan="1"></th>
                                    <th rowspan="1" colspan="1"></th>
                                    <th rowspan="1" colspan="1"><?php esc_html_e( 'Items Subtotal', 'restrofood' ); ?></th>
                                    <th rowspan="1" colspan="1"><?php echo $order->get_subtotal_to_display(); ?></th>
                                  </tr>
                                  <?php
                                  endif;
                                  if( !empty( $order->get_discount_to_display() ) ):
                                  ?>
                                  <tr>
                                    <th rowspan="1" colspan="1"></th>
                                    <th rowspan="1" colspan="1"></th>
                                    <th rowspan="1" colspan="1"><?php esc_html_e( 'Coupon(s): ', 'restrofood' ); echo implode(',', $order->get_coupon_codes()); ?></th>
                                    <th rowspan="1" colspan="1"><?php echo '- '.$order->get_discount_to_display(); ?></th>
                                  </tr>
                                  <?php 
                                  endif;
                                  // Fees
                                  if( !empty( $order->get_total_fees() ) ):
                                    foreach( $order->get_items('fee') as $fee ) {
                                  ?>
                                  <tr>
                                    <th rowspan="1" colspan="1"></th>
                                    <th rowspan="1" colspan="1"></th>
                                    <th rowspan="1" colspan="1"><?php echo esc_html( $fee->get_name() ); ?></th>
                                    <th rowspan="1" colspan="1"><?php echo esc_html( restrofood_currency_symbol_position( $fee->get_total()  ) ); ?></th>
                                  </tr>
                                  <?php 
                                   } // Endforeach
                                  endif;

                                  // Tax Fee
                                  if( wc_tax_enabled() ) {
                                  foreach( $order->get_tax_totals() as $tax ) {
                                  ?>
                                  <tr>
                                    <th rowspan="1" colspan="1"></th>
                                    <th rowspan="1" colspan="1"></th>
                                    <th rowspan="1" colspan="1"><?php echo esc_html( $tax->label ); ?></th>
                                    <th rowspan="1" colspan="1"><?php echo $tax->formatted_amount; ?></th>
                                  </tr>
                                  <?php
                                  }// End tax foreach
                                  }// end if
                                  //
                                  if( !empty( $order->get_shipping_total() ) ):
                                  ?>
                                  <tr>
                                    <th rowspan="1" colspan="1"></th>
                                    <th rowspan="1" colspan="1"></th>
                                    <th rowspan="1" colspan="1"><?php esc_html_e( 'Shipping Fee', 'restrofood' ); ?></th>
                                    <th rowspan="1" colspan="1"><?php echo restrofood_currency_symbol_position( $order->get_shipping_total() ); ?></th>
                                  </tr>
                                  <?php 
                                  endif;
                                  ?>
                                  <tr>
                                    <th rowspan="1" colspan="1"></th>
                                    <th rowspan="1" colspan="1"></th>
                                    <th rowspan="1" colspan="1"><?php esc_html_e( 'Total', 'restrofood' ); ?></th>
                                    <th rowspan="1" colspan="1"><?php echo esc_html( restrofood_currency_symbol_position( $order->get_total() ) ); ?></th>
                                  </tr>
                                </tfoot>
                                </table>

                              </div>
                            </div>
                          </div>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            <?php
            
          }

          ?>
          </tbody>
          <?php 
          // Table footer
          \RestroFood\Admin_Sub_Menu_Templates::data_table_footer();
          ?>

        </table>
          <?php


        } else {
          echo '<h4 class="order-notfound">'.esc_html( 'Order Not found', 'restrofood' ).'</h4>';
        }

       echo ob_get_clean();

        exit;



}

/**
 * order_branch_transfer
 * @return [type] [description]
 */
public function order_branch_transfer () {

  $update = update_post_meta( absint( $_POST['orderId'] ), '_rb_pickup_branch', sanitize_text_field( $_POST['branch_id'] ) );
  
  if( !is_wp_error( $update ) ) {
    wp_send_json_success();
  } else {
    wp_send_json_error();
  }

  exit;
  
  
}

/**
 * order_statistic
 * @return array
 */
public function order_statistic() {

  $toDay = restrofood_current_date();

  if( isset( $_POST['date'] ) && !empty( $_POST['date'] ) ) {
    $toDay = $_POST['date'];
  }

 
  // branch type check
  if( restrofood_is_multi_branch() ) {

    // check admin
    if( !current_user_can('administrator') ) {

      // Get Branch order
      $currentUser = get_current_user_id();

      // User data
      $user_meta = get_userdata( $currentUser );

      $user_roles = $user_meta->roles;

      $meta_key = '';

      if( $user_roles[0] == 'branch_manager' ) {

        $meta_key = 'restrofoodbranch_manager';
       
      }

      // Get branch
      
      $args = array (
        'post_type'        => 'branches',
        'post_status'      => 'publish',
        'meta_key'         => $meta_key,
        'meta_value'       => esc_html( $currentUser ),
        'meta_compare' => 'LIKE'
      );

      $getBranchesId = get_posts( $args );

      $getBranchesId = array_column( $getBranchesId, 'ID' );

      $getBranchesId = $getBranchesId[0];

    } else {
      $getBranchesId = isset( $_POST['branchId'] ) ? $_POST['branchId'] : '';
    }

    $args = array(
      'limit'          => '-1',
      'date_created'   => esc_html( $toDay ),
      'branch'         => esc_html( $getBranchesId ) // Branch id
    );

    $orders = wc_get_orders( $args );


  } else {

    $args = array(
      'limit'          => '-1',
      'date_created'   => esc_html( $toDay )
    );

    $orders = wc_get_orders( $args );

  }

  $totalOrder = $totalCompletedOrder = $totalCancelOrder = [];

  foreach( $orders as $order ) {

    $getStatus = get_post_meta( $order->get_id(), '_order_tracking_status', true );

    $orderId    =  $order->get_id();
    $orderTotal =  $order->get_total();

    //
    $totalOrder[] = [
        'count' => 1,
        'value' => $order->get_total()
    ]; 


    if( $getStatus == 'OC' ) {
      
      $totalCancelOrder[] = [
        'count' => 1,
        'value' => $order->get_total()

      ];

    } else if( $getStatus == 'DC' ) {

      $totalCompletedOrder[] = [
        'count' => 1,
        'value' => $order->get_total()

      ];

    }


  }

  //
  $getTotalCancelOrderVal = restrofood_currency_symbol_position( array_sum( array_column( $totalCancelOrder, 'value' ) ) );

  $getTotalCancelOrder = [ 
    "total_count" => count( $totalCancelOrder ), 
    "total_value" => !empty( $getTotalCancelOrderVal ) ? $getTotalCancelOrderVal : 0
  ];

  //
  $getTotalCompletedOrderVal = restrofood_currency_symbol_position( array_sum( array_column( $totalCompletedOrder, 'value' ) ) );

  $getTotalCompletedOrder = [ 
    "total_count" => count( $totalCompletedOrder ), 
    "total_value" => !empty( $getTotalCompletedOrderVal ) ? $getTotalCompletedOrderVal : 0
  ];

  // 
  $getTotalOrderVal = restrofood_currency_symbol_position( array_sum( array_column( $totalOrder, 'value' ) ) );

  $getTotalOrder = [
    "total_count" => count( $totalOrder ), 
    "total_value" => !empty( $getTotalOrderVal ) ? $getTotalOrderVal : 0
  ];

  
  $getData = [

    "total_order" => $getTotalOrder,
    "completed_order" => $getTotalCompletedOrder,
    "cancel_order" => $getTotalCancelOrder
    
  ];
  

  wp_send_json_success( $getData );


  exit;

}

/**
 * update_order_review
 * @return
 * 
 */
public function update_order_review() {

  WC()->cart->calculate_shipping();
  WC()->cart->calculate_totals();
  wp_die();
}

public function new_order_push_notification() {

      $options = get_option('restrofood_options');

      $toDay = restrofood_current_date();

      if( isset( $_POST['branche_id'] ) && !empty( $_POST['branche_id'] ) ) {
        $branche_id = $_POST['branche_id'];
      }

      // Get User role
      $currentUser = get_current_user_id();
      // User data
      $user_meta = get_userdata( $currentUser );
      $user_roles = $user_meta->roles;


      // Check Is kitchen
      $is_kitchen = 0;
      if( $user_roles[0] == 'kitchen_manager' ) {
        $is_kitchen = 1;
      }

      // branch type check
      
      if( restrofood_is_multi_branch() ) {

        // Get Branch order

        $meta_key = '';

        if( $user_roles[0] == 'branch_manager' ) {
          $meta_key = 'restrofoodbranch_manager';
        }
        //
        if( $user_roles[0] == 'kitchen_manager' ) {
          $meta_key = 'restrofoodkitchen_manager';
        }

          // Get branch
          $args = array (
              'post_type'        => 'branches',
              'post_status'      => 'publish',
              'meta_key'         => $meta_key,
              'meta_value'       => esc_html( $currentUser ),
              'meta_compare' => 'LIKE'
          );

          $getBranchesId = get_posts( $args );

          $getBranchesId = array_column( $getBranchesId, 'ID' );
          
          // Check Admin
          if( !current_user_can('administrator') ) {
            $branchesId = $getBranchesId[0];
          } else {
            $branchesId = $branche_id;
          } 


        $args = array(
          'limit'          => '-1',
          'date_created'   => esc_html( $toDay ),
          'branch'         => esc_html( $branchesId ) // Branch id
        );

        $orders = wc_get_orders( $args );


      } else {

        $args = array(
          'limit'          => '-1',
          'date_created'   => esc_html( $toDay )
        );

        $orders = wc_get_orders( $args );

      }
      
      // Status Code 
      
      $new = 0;

      foreach( $orders as $order ) {

      $status = get_post_meta( $order->get_id(), '_order_tracking_status', true );
      
        if( $is_kitchen == 1 ) {

          if( empty( $options['kitchen-all-order'] ) ) {

            if( $status == 'STC' ) {
              $new = $new + 1;
            }

          } else {

            if( $status == 'OP' || $status == 'STC' ) {
              $new = $new + 1;
            }

          }

        } else {

          if( $status == 'OP' ) {
            $new = $new + 1;
          }

        }

       
      } 

      echo $new;      


    exit;

}

public function branch_manager_data() {

  $date = isset( $_POST['date'] ) ? $_POST['date'] : '';

  if( isset( $_POST['managertype'] ) && $_POST['managertype'] == 'branch-manager' ) {
    $obj = new \RestroFood\Admin_Sub_Menu_Templates();
    $obj->branch_order_manage( $date );

  } elseif (isset( $_POST['managertype'] ) && $_POST['managertype'] == 'kitchen-manager') {
    $obj = new \RestroFood\Admin_Sub_Menu_Templates();
    $obj->kitchen_template( $date );
  } else {
    $obj = new \RestroFood\Admin_Sub_Menu_Templates();
    $obj->delivery_order_manage( $date );
  }

  exit;
}

/**
 * [manager_date_filter_data description]
 * @return [type] [description]
 */
public function manager_date_filter_data() {

  $date = isset( $_POST['date'] ) ? $_POST['date'] : '';

  if( isset( $_POST['managertype'] ) && $_POST['managertype'] == 'branch-manager' ) {
    $obj = new \RestroFood\Admin_Sub_Menu_Templates();
    $obj->branch_order_manage( $date );

  } elseif (isset( $_POST['managertype'] ) && $_POST['managertype'] == 'kitchen-manager') {
    $obj = new \RestroFood\Admin_Sub_Menu_Templates();
    $obj->kitchen_template( $date );
  } else {
    $obj = new \RestroFood\Admin_Sub_Menu_Templates();
    $obj->delivery_order_manage( $date );
  }

  exit;

}

/**
 * [preorder_date_filter_data description]
 * @return [type] [description]
 */
public function preorder_date_filter_data() {

  //Pre order date filter
  $date     = isset( $_POST['date'] ) ? restrofood_date_format( $_POST['date'], 'd-m-Y' ) : '';
  $preorder = isset( $_POST['preorder'] ) ? $_POST['preorder'] : '';

  $obj = new \RestroFood\Admin_Sub_Menu_Templates();
  $obj->pre_order_date_filter( $date, $preorder );
   
  exit;
}

/**
 * [order_time_lists description]
 * @return [type] [description]
 */
public function order_time_lists() {

  $date = isset( $_POST['date'] ) ? $_POST['date'] : '';
  $branchid = isset( $_POST['branchid'] ) ? $_POST['branchid'] : '';
  $timeList = \RestroFood\Date_Time_Map::getTimes( $date, $branchid );
  restrofood_time_solt_options_html( $timeList );
  die();
}

/**
 * [client_location description]
 * @return [type] [description]
 */
public function client_location() {

  $lat  = isset( $_POST['lat'] ) ? $_POST['lat'] : '';
  $long = isset( $_POST['long'] ) ? $_POST['long'] : ''; 

  if( $lat && $long ) {
    echo \RestroFood\Inc\Location::longLatToAddress( $lat, $long );
    exit;
  }

}

/**
 * [location_availability_check description]
 * @return 
 */
public function location_availability_check() {

  $getText = \Restrofood\Inc\Text::getText();
  $options = \get_option('restrofood_options');
  $multideliveryfees = \get_option('restrofood_multideliveryfees_option');

  // Location type check
  
  if( restrofood_is_location_type_address() ) {

    //
    if( restrofood_is_multi_branch() ) {
      $DistanceRestrict = get_post_meta( $_POST['branchId'], 'restrofoodbranch_distance_restrict', true );
    } else {
      $DistanceRestrict = !empty( $options['distance-restrict'] ) ? $options['distance-restrict'] : 0;
    }

    $branchLocation  = isset( $_POST['branchLocation'] ) ? $_POST['branchLocation'] : '';
    $visitorLocation = isset( $_POST['visitorLocation'] ) ? $_POST['visitorLocation'] : '';

    $getLocationDistance = \Restrofood\Inc\Location_Distance::longLatToAddress( esc_html( $branchLocation ), esc_html( $visitorLocation ) );

    //
    if( !empty( $getLocationDistance ) ) {

      $getLocationDistance = explode( ' ' , $getLocationDistance);
      $locationDistance = str_replace(',', '', $getLocationDistance[0] );

      //
      if( in_array( 'm' , $getLocationDistance ) ) {

        if( !empty( $locationDistance ) ) {

          // Restrict distance kilometer to meter
          $restrictDistanceKmTom = $DistanceRestrict * 1000;

          // Check visitor area in Restrict distance
          if( $locationDistance <= $restrictDistanceKmTom  ) {

            $status = true;

          } else {
            $status = false;
          }
          
        }

      } else {

        // Check visitor area in Restrict distance
        if( $locationDistance <= $DistanceRestrict  ) {
          $status = true;
        } else {
          $status = false;
        }

      }

    } else {
      $status = false;
    }

  } else {

    $zipCode = isset( $_POST['zipcode'] ) ? $_POST['zipcode'] : '';
    
    if( restrofood_is_multi_branch() ) {

      if( !empty( $multideliveryfees ) && $multideliveryfees == 'yes' ) {

        $getZipCodes = get_post_meta( $_POST['branchId'], 'restrofoodbranch_zipcode_with_fee', true );
        $zipCodes = array_column( $getZipCodes, 'code');

      } else {
        $zipCodes = get_post_meta( $_POST['branchId'], 'restrofoodbranch_zipcode', true );
      }

    } else {
      
      if( !empty( $multideliveryfees ) && $multideliveryfees == 'yes' ) {

        $getZipCodes = !empty( $options['zip-delivery-fee'] ) ? $options['zip-delivery-fee'] : '';

        $zipCodes = array_column( $getZipCodes, 'code');

      } else {
        $zipCodes = !empty( $options['delivery_zip'] ) ? $options['delivery_zip'] : '';
      }
      
    }

    //
    if( in_array( $zipCode , $zipCodes ) ) {
      $status = true;
    } else {
      $status = false;
    }

  }
  // Set Cookie Time
  $cookieTime = 2 * DAY_IN_SECONDS;
  // Check status
  if( $status ) {
    
    echo json_encode( [ 'status' => 'success', 'msg' => esc_html( $getText['delivery_available_success'] ) ] );

    // Set ookie for visior location
    set_transient( 'restrofood_visitor_location', $visitorLocation, $cookieTime );
    set_transient( 'd_availability_status', 'yes', $cookieTime );
    set_transient( 'rb_location_distance', esc_html( $locationDistance ), $cookieTime );

    // If Multibranch
    if( restrofood_is_multi_branch() ) {
      set_transient( 'rb_branch_id', esc_html( $_POST['branchId'] ), $cookieTime );

    }

    // ZipCode Set in cookie
    if( !empty( $zipCode ) ) {
      set_transient( 'rb_selected_zipcode', esc_html( $zipCode ), $cookieTime );
    }

  } else {
    echo json_encode( [ 'status' => 'error', 'msg' => esc_html( $getText['delivery_available_error'] ) ] );
    set_transient( 'd_availability_status', 'no', $cookieTime );

  }

  exit;
}

/**
 * [get_branch_location description]
 * @return [type] [description]
 */
public static function get_branch_location() {
  $getBranch = isset( $_POST['branchId'] ) ? $_POST['branchId'] : '';
  $branchLocation   = get_post_meta( $getBranch, 'restrofoodbranch_location', true );
  //$distanceRestrict = get_post_meta( $getBranch, 'restrofoodbranch_distance', true );
  echo $branchLocation;
  exit;

}

/**
 * [visitor_address_from_cookie description]
 * @return [type] [description]
 */
public static function visitor_address_from_cookie() {

  $visitorLocation = get_transient('restrofood_visitor_location');

  if( !empty( $visitorLocation ) ) {
    echo $visitorLocation;
  }

  exit;

}
/**
 * [get_branch_location_by_id description]
 * @return [type] [description]
 */
public static function get_branch_location_by_id() {

  if( ! isset( $_POST['branchId'] ) ) return;
  
  $locationType = get_option('restrofood_options');
  $multideliveryfees = get_option('restrofood_multideliveryfees_option');
  $location = '';

  if( !empty( $locationType['location_type'] ) && $locationType['location_type'] == 'address' ) {

    $address = get_post_meta( esc_html( $_POST['branchId'] ), 'restrofoodbranch_location', true );
    $location = json_encode( [ 'type' => 'address','address' => $address ] );

  } else {

    if( !empty( $multideliveryfees ) && $multideliveryfees == 'yes' ) {

      $zipCodes = get_post_meta( esc_html( $_POST['branchId'] ), 'restrofoodbranch_zipcode_with_fee', true );
      $zipCodes = array_column($zipCodes, 'code');

    } else {
      $zipCodes = get_post_meta( esc_html( $_POST['branchId'] ), 'restrofoodbranch_zipcode', true );
    }

    $location = json_encode( [ 'type' => 'zip','zipcode' => $zipCodes ] );

  }

  echo $location;
  
  exit;
}
/**
 * [get_branch_table_numbers description]
 * @return [type] [description]
 */
public static function get_branch_table_numbers() {

  if( restrofood_is_multi_branch() && isset( $_POST['branchId'] ) ) {  
    $tabls = get_post_meta( esc_html( $_POST['branchId'] ), 'restrofoodbranch_restaurant_table_number', true );
  }else {
    $opt = get_option('restrofood_options');
    $tabls = !empty( $opt['restaurant-table-number'] ) ? $opt['restaurant-table-number'] : '';
  }

  echo json_encode( $tabls );

  exit;
}

/**
 * [holy_day_check description]
 * @return [type] [description]
 */
public static function holy_day_check() {

  $date = $_POST['date'] ? $_POST['date'] : '';
  $branch_id = $_POST['branch_id'] ? $_POST['branch_id'] : '';

  echo  Date_Time_Map::is_holy_day( $date, $branch_id );
  die();
}

/**
 * [holy_day_check description]
 * @return [type] [description]
 */
public static function update_fixed_cart_subtotal() {
  echo WC()->cart->get_cart_subtotal();
  die();
}

} // End class

// Components_Ajax Class init
new Components_Ajax();
