<?php
/**
 * Enqueue scripts
 * @return 
 * 
 */

add_action( 'wp_enqueue_scripts', 'restrofood_enqueue_scripts' );
function restrofood_enqueue_scripts() {

    $getText = \Restrofood\Inc\Text::getText();
    $options = get_option('restrofood_options');
    $getDateFormat = get_option('date_format');

    $branch_manager_page  = !empty( $options['branch-manager'] ) ? $options['branch-manager'] : 'branch-manager';
    $kitchen_manager_page = !empty( $options['kitchen-manager'] ) ? $options['kitchen-manager'] : 'kitchen-manager';
    $delivery_page        = !empty( $options['delivery'] ) ? $options['delivery'] : 'delivery';
    $availabilityCheckerModal = !empty( $options['availability-checker-modal'] ) ? $options['availability-checker-modal'] : 'no';
    $autoreload           = !empty( $options['page-autoreload'] ) ? $options['page-autoreload'] : '6';
    $availabilityCheckerActive = !empty( $options['availability-checker-active'] ) ? $options['availability-checker-active'] : 'no';
    $checkoutDeliveryOption = !empty( $options['checkout-delivery-option'] ) ? $options['checkout-delivery-option'] : 'no';
    $checkoutDeliveryTimeSwitch = !empty( $options['pickup-time-switch'] ) ? $options['pickup-time-switch'] : 'no';
    $deliveryOptions      = !empty( $options['delivery-options'] ) ? $options['delivery-options'] : 'all';
    $audioLoop            = !empty( $options['audio-loop'] ) ? $options['audio-loop'] : 'no';
    $preOrderActive       = !empty( $options['pre-order-active'] ) ? $options['pre-order-active'] : '';
    $modalCloseBtn        = !empty( $options['modal-close-btn-show'] ) ? $options['modal-close-btn-show'] : '';
    $notificationAudio    = !empty( $options['notification-audio'] ) ? $options['notification-audio'] : RESTROFOOD_DIR_URL.'assets/the-little-dwarf-498.mp3';
    $cartModalStyle       = !empty( $options['cart-modal-style'] ) ? $options['cart-modal-style'] : 'canvas';
    

    // Is custom admin pages
    $is_page = false;
    if( is_page( array( $branch_manager_page, $kitchen_manager_page, $delivery_page ) ) ) {
        $is_page = true;
    }

    // Is manager pages
    $is_manager_page = false;
    if( is_page( array( $branch_manager_page, $kitchen_manager_page ) ) ) {
        $is_manager_page = true;
    }

    // Check manager template
    $managerType = '';
    if( is_page( $kitchen_manager_page ) ) {
        $managerType = 'kitchen-manager';
    } elseif ( is_page( $branch_manager_page ) ) {
        $managerType = 'branch-manager';
    }

    //  Style enqueue
    wp_enqueue_style( 'fb-font-awesome', RESTROFOOD_DIR_URL.'assets/css/font-awesome.min.css', array(), '4.7.0', 'all' );
    wp_enqueue_style( 'datatables', RESTROFOOD_DIR_URL.'assets/css/datatables.css', array(), '1.10.18', 'all' );
    wp_enqueue_style( 'fbMyAccount', RESTROFOOD_DIR_URL.'assets/css/fbMyAccount.min.css', array(), '1.0.0', 'all' );
    wp_enqueue_style( 'flexslider', RESTROFOOD_DIR_URL.'assets/css/flexslider.css', array(), '1.0.0', 'all' );
    wp_enqueue_style( 'restrofood', RESTROFOOD_DIR_URL.'assets/css/app.css', array(), '1.0.0', 'all' );

    wp_register_script( 'googleapis-place','//maps.googleapis.com/maps/api/js?key='.\RestroFood\Inc\Google_API::getApiKey().'&callback=restrofoodInitMap&libraries=places&v=weekly', array('location'), '1.0.0', true );
    wp_register_script( 'location', RESTROFOOD_DIR_URL.'assets/js/location.js', array('jquery' ), '1.0.0', true );
    // Scripts enqueue
    if( !empty( $options['location_type'] ) && 'address' == $options['location_type'] ) {

        if( is_page( $availabilityCheckerModal ) ) {
            wp_enqueue_script('googleapis-place');
            wp_enqueue_script('location');
        }
    }

    wp_enqueue_script( 'datatables', RESTROFOOD_DIR_URL.'assets/js/datatables.js', array('jquery' ), '1.10.18', true );
    
    wp_enqueue_script( 'print', RESTROFOOD_DIR_URL.'assets/js/jQuery.print.js', array('jquery' ), '1.6.0', true );

    wp_enqueue_script( 'flexslider', RESTROFOOD_DIR_URL.'assets/js/jquery.flexslider-min.js', array('jquery' ), '1.10.18', true );
    wp_enqueue_script( 'restrofood', RESTROFOOD_DIR_URL.'assets/js/restrofood.js', array( 'jquery','wp-util','wc-checkout', 'underscore', 'jquery-ui-datepicker','jquery-effects-core' ), '1.0.0', true );

    add_filter( 'woocommerce_is_checkout', 'restrofood_is_checkout' );

    wp_localize_script(
        'restrofood', 
        'restrofoodobj',
        array(
            
            "ajaxurl"               => admin_url('admin-ajax.php'),
            'currency'              => get_woocommerce_currency_symbol(), 
            'currency_pos'          => get_option( 'woocommerce_currency_pos' ), 
            'datepicker_format'     => restrofood_datepicker_format( esc_html( $getDateFormat ) ),
            'is_page_custom_admin'  => $is_page, 
            'is_manager_page'       => $is_manager_page,
            'managerType'           => $managerType,
            'page_auto_reload_time' => $autoreload, 
            'is_login'              => is_user_logged_in(),
            'woo_guest_user_allow'  => get_option('woocommerce_enable_guest_checkout'),
            'is_enable_reviews'     => get_option('woocommerce_enable_reviews'),
            'is_rating_verification_required'  => get_option('woocommerce_review_rating_verification_required'),
            'cart_url'              => wc_get_checkout_url(),
            'get_text'              => $getText,
            'view_cart_btn_text'    => esc_html( $getText['view_cart'] ), 
            'buy_more_btn_text'     => esc_html( $getText['buy_more'] ),
            'dont_cart_msg'         => esc_html( $getText['cart_added_error'] ),
            'is_checkout'           => is_checkout(),
            'is_multi_branch'       => restrofood_is_multi_branch(),
            'characters'            => !empty( $options['desc-characters'] ) ? $options['desc-characters'] : '100',
            'wc_decimal_separator'      => wc_get_price_decimal_separator(),
            'wc_thousand_separator'     => wc_get_price_thousand_separator(),
            'price_decimals'            => wc_get_price_decimals(),
            'noti_audio_loop'           => $audioLoop,
            'is_location_type_address'  => restrofood_is_location_type_address(),
            'is_active_location'        => restrofood_getOptionData('popup-location-active'),
            'notification_audio'        => $notificationAudio,
            'is_availability_checker_active' => $availabilityCheckerActive,
            'is_checkout_delivery_option'    => $checkoutDeliveryOption,
            'is_pre_order_active'            => $preOrderActive,
            'is_active_modal_close_btn'      => $modalCloseBtn,
            'delivery_options'               => $deliveryOptions,
            'is_multideliveryfees'           => get_option( 'restrofood_multideliveryfees_option' ),
            'is_active_inrestaurant'         => restrofood_is_active_inrestaurant(),
            'is_checkout_delivery_time_switch' => $checkoutDeliveryTimeSwitch,
            'cartModalStyle'                   => $cartModalStyle

        ) 
    );


    /**
     * Inline css for custom style
     *  
     */
    
    $mainColor = !empty( $options['main-color'] ) ? esc_html( $options['main-color'] ) : '';

    // Global Button
    $gobBtnBgColor        = !empty( $options['gob-btn-bg-color'] ) ? esc_html( $options['gob-btn-bg-color'] ) : '';
    $gobBtnColor          = !empty( $options['gob-btn-color'] ) ? esc_html( $options['gob-btn-color'] ) : '';
    $gobBtnHoverBgColor   = !empty( $options['gob-btn-hover-bg-color'] ) ? esc_html( $options['gob-btn-hover-bg-color'] ) : '';
    $gobBtnHoverColor     = !empty( $options['gob-btn-hover-color'] ) ? esc_html( $options['gob-btn-hover-color'] ) : '';

    $cartBtnBg         = !empty( $options['cart-btn-bg'] ) ? esc_html( $options['cart-btn-bg'] ) : '';
    $cartBtnCountBg    = !empty( $options['cart-btn-count-bg'] ) ? esc_html( $options['cart-btn-count-bg'] ) : '';
    $cartBtnCountColor = !empty( $options['cart-btn-count-color'] ) ? esc_html( $options['cart-btn-count-color'] ) : '';

    $custom_css = "
            .rb_category_list .rb_category_item .rb_category_quantity:before,
            .rb_custom_checkbox label .rb_custom_checkmark:after,
            .rb_pagination_list .rb_pagination_list_item.active, 
            .rb_pagination_list .rb_pagination_list_item:hover,
            .rb_single_product_item .rb_product_top .rb_badge,
            .not-visible-inner,
            .visibility-tag:hover,
            .rb_cart_count_btn .rb_cart_count,
            .fb-product-extra-group-title:hover, 
            .rb_order_button:hover {
                background-color: {$mainColor};
            }
            .rb_category_list .rb_category_item .rb_category_quantity,
            .rb_pagination_list .rb_pagination_list_item,
            .rb_custom_checkbox label input:checked~.rb_input_text, 
            .rb_custom_checkbox label input:checked~.rb_label_title .rb_input_text,
            .preparing-info-tag,
            .visibility-tag,
            .rb_single_product_item .rb_product_content .rb_product_price ins,
            .rb_single_product_item .rb_product_content .rb_product_price,
            .rb_star_rating,
            .stars.fb-product-star a:before,
            .rb_product_price,
            .moal-product-info-tabs-wrap .tab-items ul li.active, 
            .moal-product-info-tabs-wrap .tab-items ul li:hover,
            .rb_offer_list li:hover,
            .rb_category_list li:hover,
            .cart_table .cart_table_item.cart_table_item_subtotal .rb_Price_subtotal,
            .rb_label_title .rb_total_Price {
                color: {$mainColor};
            }
            .rb_custom_checkbox label input:checked~.rb_custom_checkmark,
            .rb_pagination_list .rb_pagination_list_item,
            .preparing-info-tag,
            .visibility-tag,
            .rb_offer_list input[type=radio], 
            .rb_category_list input[type=radio] {
                border-color: {$mainColor};
            }
            .rb_btn_fill:not(.toggle),
            .rb_checkout_steps_content .checkout_coupon button,
            .rb_checkout_steps_content .woocommerce-checkout-review-order #place_order {
                background-color: {$gobBtnBgColor};
                color: {$gobBtnColor};
            }
            .rb_btn_fill:not(.toggle):active, 
            .rb_btn_fill:not(.toggle):focus, 
            .rb_btn_fill:not(.toggle):hover,
            .rb_checkout_steps_content .checkout_coupon button:hover,
            .rb_checkout_steps_content .woocommerce-checkout-review-order #place_order:hover {
                background-color: {$gobBtnHoverBgColor};
                color: {$gobBtnHoverColor};
            }
            .rb_cart_count_btn.rb_floating_cart_btn {
                background-color: {$cartBtnBg}
            }
            .rb_cart_count_btn.rb_floating_cart_btn .rb_cart_count {
                background-color: {$cartBtnCountBg};
                color: {$cartBtnCountColor}
            }
            ";

    //
    wp_enqueue_style(
        'custom-style',
        RESTROFOOD_DIR_URL.'assets/css/custom.css'
    );
    wp_add_inline_style( 'custom-style', $custom_css );

}

function restrofood_is_checkout() {
    return true;
}
