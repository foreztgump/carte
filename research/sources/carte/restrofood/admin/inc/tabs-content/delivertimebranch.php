<?php
namespace RestroFood\Admin;
 /**
  * 
  * @package    RestroFood 
  * @since      3.0.0
  * @version    3.0.0
  * @author     ThemeLooks
  * @Websites:  http://themelooks.com/
  *
  */


class Delivertimebranch_Settings_Tab extends Settings_Fields_Base {

  public function get_option_name() {
    return 'restrofood_options'; // set option name it will be same or different name
  }

   public function tab_setting_fields() {

        $this->start_fields_section([
            'title'   => esc_html__( 'Delivery Settings', 'restrofood' ),
            'icon'    => 'fa fa-truck',
            'id'      => 'delivertimebranch'
        ]);

        $this->switcher(
          [
            'title' => esc_html__( 'Checkout Delivery Option Show/Hide', 'restrofood' ),
            'name'  => 'checkout-delivery-option'
          ]
        );
        $this->selectbox(
          [
            'title'     => esc_html__( 'Set Delivery Options', 'restrofood' ),
            'name'      => 'delivery-options',
            'options'   => [
              'all'   => esc_html__( 'Delivery/Pickup Both', 'restrofood' ),
              'delivery' => esc_html__( 'Only Delivery', 'restrofood' ),
              'pickup'   => esc_html__( 'Only Pickup', 'restrofood' )
            ]
          ]
        );        
        $this->text(
          [
            'title' => esc_html__( 'Set Delivery Fee', 'restrofood' ),
            'name'  => 'delivery-fee'
          ]
        );
        $this->number(
          [
            'title' => esc_html__( 'Minimum order amount', 'restrofood' ),
            'name'  => 'minimum-order-amount'
          ]
        );
        $this->number(
          [
            'title' => esc_html__( 'Free shipping require minimum order amount', 'restrofood' ),
            'name'  => 'free-shipping-amount'
          ]
        );
        $this->switcher(
          [
            'title' => esc_html__( 'Deliver/Pickup Time and Date Show/Hide', 'restrofood' ),
            'name'  => 'pickup-time-switch'
          ]
        );
        $this->switcher(
          [
            'title' => esc_html__( 'Off current date order', 'restrofood' ),
            'name'  => 'off-current-order'
          ]
        );
        $this->switcher(
          [
            'title' => esc_html__( 'Pre order active', 'restrofood' ),
            'name'  => 'pre-order-active'
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Deliver/Pickup Time Option Note', 'restrofood' ),
            'name'  => 'delivery-time-note'
          ]
        );
        // Check multibranch
        if( !restrofood_is_multi_branch() ) {
          $this->day_based_time(
            [
              'title' => esc_html__( 'Delivery Time and Day ', 'restrofood' ),
              'class' => 'delivery-time-day',
              'name'  => 'delivery-time-day'
            ]
          );
        }
        $this->selectbox(
          [
            'title'     => esc_html__( 'Delivery Time Format', 'restrofood' ),
            'name'      => 'delivery-time-format',
            'options'   => [
              '12'    => esc_html__( '12 Hour', 'restrofood' ), 
              '24'    => esc_html__( '24 Hour', 'restrofood' )
            ]
          ]
        );
        $this->selectbox(
          [
            'title'     => esc_html__( 'Delivery Time Slot', 'restrofood' ),
            'name'      => 'delivery-time-slot',
            'options'   => [
              '2,30'    => esc_html__( '30min', 'restrofood' ), 
              '1,60'    => esc_html__( '60min', 'restrofood' ),
              '2,120'   => esc_html__( '120min', 'restrofood' ),
              '3,180'   => esc_html__( '180min', 'restrofood' )
            ]
          ]
        );
        $this->number(
          [
            'title' => esc_html__( 'Order Limit On Time Slot', 'restrofood' ),
            'name'  => 'order-limit-time-slot'
          ]
        );
        $this->number(
          [
            'title' => esc_html__( 'Pre Order Days Limit', 'restrofood' ),
            'name'  => 'date-days-limit'
          ]
        );
        $this->timezone_select(
          [
            'title'     => esc_html__( 'Set Time Zone', 'restrofood' ),
            'name'      => 'time-zone'
          ]
        );
        $this->switcher(
          [
            'title' => esc_html__( 'Order Delivery Directions Map Active', 'restrofood' ),
            'name'  => 'delivery-directions-map'
          ]
        );
        $this->selectbox(
          [
            'title'     => esc_html__( 'Delivery Directions Map Transport Mode', 'restrofood' ),
            'name'      => 'delivery-transport-mode',
            'options'   => [
              'driving'    => esc_html__( 'Driving', 'restrofood' ), 
              'walking'    => esc_html__( 'Walking', 'restrofood' ),
              'bicycling'  => esc_html__( 'Bicycling', 'restrofood' )
            ]
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Closing Time Info Text', 'restrofood' ),
            'name'  => 'closing-time-msg'
          ]
        );

        $this->end_fields_section(); // End fields section
   }
}

new Delivertimebranch_Settings_Tab();