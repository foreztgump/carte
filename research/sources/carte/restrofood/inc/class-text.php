<?php 
namespace RestroFood\Inc;
/**
 *
 * @package     Restrofood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 *
 */

class Text {

  public static function getText() {
    return self::definedText();
  }

  public static function definedText() {

    $getText = [
      'view_cart'           => esc_html__( 'View Cart', 'restrofood' ),
      'buy_more'            => esc_html__( 'Buy More', 'restrofood' ),
      'cart_added_error'    => esc_html__( 'Product don\'t added in the cart. please try again.', 'restrofood' ),
      'review_success_msg'  => esc_html__( 'Review has been submitted successfully.', 'restrofood' ),
      'review_error_msg'    => esc_html__( 'Review submission Failed. Please try again.', 'restrofood' ),
      'show_more'           => esc_html__( 'Show More', 'restrofood' ),
      'show_less'           => esc_html__( 'Less', 'restrofood' ),
      'loading'             => esc_html__( 'Loading', 'restrofood' ),
      'new_order_placed'    => esc_html__( 'New Order Placed', 'restrofood' ),
      'start_order'         => esc_html__( 'Start Order', 'restrofood' ),
      'delivery_available_success' => esc_html__( 'Delivery is available', 'restrofood' ),
      'delivery_available_error'   => esc_html__( 'Sorry, We are not available to delivery in your area', 'restrofood' ),
      'dp_date_text'       => esc_html__( 'Deliver/Pickup Date', 'restrofood' ),
      'dp_time_text'       => esc_html__( 'Deliver/Pickup Time', 'restrofood' ),
      'dp_today_text'      => esc_html__( 'Today Delivery/Pickup', 'restrofood' ),
      'dp_schedule_text'   => esc_html__( 'Schedule Delivery/Pickup', 'restrofood' ),
      'boy_assigned_success'   => esc_html__( 'Delivery boy assigned success', 'restrofood' ),
      'boy_assigned_failed'   => esc_html__( 'Delivery boy assigned failed', 'restrofood' ),
      'Order_transfer_success'   => esc_html__( 'Order transfer success', 'restrofood' ),
      'Order_transfer_failed'    => esc_html__( 'Order transfer failed', 'restrofood' ),
      'list_type'   => esc_html__( 'List Type', 'restrofood' ),
      'checkbox'    => esc_html__( 'Checkbox', 'restrofood' ),
      'radio'       => esc_html__( 'Radio', 'restrofood' ),
      'feature_section_title'     => esc_html__( 'Feature Section Title', 'restrofood' ),
      'min_required_number'       => esc_html__( 'Feature minimum required number', 'restrofood' ),
      'max_required_number'       => esc_html__( 'Feature max required number', 'restrofood' ),
      'frature_title'             => esc_html__( 'Frature Title', 'restrofood' ),
      'price'                     => esc_html__( 'Price', 'restrofood' ),
      'add_group'                 => esc_html__( 'Add Group', 'restrofood' ),
      'remove_group'              => esc_html__( 'Remove Group', 'restrofood' ),
      'add'                       => esc_html__( 'Add', 'restrofood' ),
      'add_features'              => esc_html__( 'Add Features', 'restrofood' ),
      'remove'                    => esc_html__( 'Remove', 'restrofood' ),
      'slot_full_text'            => esc_html__( 'This time slot is full. Try another time slot', 'restrofood' ),
      'valid_slot_not_available'  => esc_html__( 'Your selected time slot is not available for order.', 'restrofood' ),
      'valid_break_time'          => esc_html__( 'This is break time. Not available for order.', 'restrofood' ),
      'valid_delivery_time_field' => esc_html__( 'Deliver/Pickup Time is a required field.', 'restrofood' ),
      'valid_delivery_type_field' => esc_html__( 'Deliver/Pickup type is a required field.', 'restrofood' ),
      'valid_branch_field'        => esc_html__( 'Deliver/Pickup Branch Name is a required field.', 'restrofood' ),
      'set_flash_sale'           => esc_html__( 'Set Meta', 'restrofood' ),
      'nutrition_title'           => esc_html__( 'Nutrition Title', 'restrofood' ),
      'quantity'                  => esc_html__( 'Quantity', 'restrofood' ),
      'branch_select_msg'         => esc_html__( 'Please select the branch', 'restrofood' ),
      'table_number_label'        => esc_html__( 'Select Table Number', 'restrofood' ),
      'addcart_ranch_select_alert_msg' => esc_html__( 'Please Select the branch before add to cart', 'restrofood' ),
      'closing_time_msg'   => restrofood_getOptionData( 'closing-time-msg', esc_html__( 'This is closing time. So you can\'t order.', 'restrofood' ) ),
      'cat_nav_text' => restrofood_getOptionData( 'category-nav-text', esc_html__( 'Offers & Category', 'restrofood' ) ),
      'cat_heading_text' => restrofood_getOptionData( 'categories-heading-text', esc_html__( 'Categories', 'restrofood' ) ),
      'spec_offer_heading_text' => restrofood_getOptionData( 'special-offer-heading-text', esc_html__( 'Special Offer', 'restrofood' ) ),
      'visibility_heading_text' => restrofood_getOptionData( 'food-visibility-heading-text', esc_html__( 'Food Visibility', 'restrofood' ) ),
      'product_top_title_text' => restrofood_getOptionData( 'product-top-title-text', esc_html__( 'Our All Delicious Foods', 'restrofood' ) )
    ];

    return apply_filters( 'restrofood_define_text', $getText );

  }


}


