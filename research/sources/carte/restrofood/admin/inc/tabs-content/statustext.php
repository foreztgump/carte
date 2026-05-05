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


class StatusText_Settings_Tab extends Settings_Fields_Base {

  public function get_option_name() {
    return 'restrofood_options'; // set option name it will be same or different name
  }

   public function tab_setting_fields() {

        $this->start_fields_section([
            'title'   => esc_html__( 'Status Text', 'restrofood' ),
            'icon'    => 'fa fa-pen',
            'id'      => 'statustext'
        ]);
        $this->text(
          [
            'title' => esc_html__( 'Order Cancel Text', 'restrofood' ),
            'name'  => 'order-cancel-text',
            'placeholder' => esc_html__( 'Order Cancel', 'restrofood' )
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Order Failed Text', 'restrofood' ),
            'name'  => 'order-failed-text',
            'placeholder' => esc_html__( 'Order Failed', 'restrofood' )
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'New Order Text', 'restrofood' ),
            'name'  => 'new-order-text',
            'placeholder' => esc_html__( 'New Order', 'restrofood' )
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Send To Cooking Text', 'restrofood' ),
            'name'  => 'send-to-cooking-text',
            'placeholder' => esc_html__( 'Send To Cooking', 'restrofood' )
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Cooking Processing Text', 'restrofood' ),
            'name'  => 'cooking-processing-text',
            'placeholder' => esc_html__( 'Cooking Processing', 'restrofood' )
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Cooking Completed Text', 'restrofood' ),
            'name'  => 'cooking-completed-text',
            'placeholder' => esc_html__( 'Cooking Completed', 'restrofood' )
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Waiting For Kitchen Accept Text', 'restrofood' ),
            'name'  => 'waiting-for-kitchen-accept-text',
            'placeholder' => esc_html__( 'Waiting For Kitchen Accept', 'restrofood' )
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'On The Way Text', 'restrofood' ),
            'name'  => 'on-the-way-text',
            'placeholder' => esc_html__( 'On The Way', 'restrofood' )
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Ready To Delivery Text', 'restrofood' ),
            'name'  => 'ready-to-delivery-text',
            'placeholder' => esc_html__( 'Ready To Delivery', 'restrofood' )
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Delivery Completed Text', 'restrofood' ),
            'name'  => 'delivery-completed-text',
            'placeholder' => esc_html__( 'Delivery Completed', 'restrofood' )
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Order Placed Text', 'restrofood' ),
            'name'  => 'order-placed-text',
            'placeholder' => esc_html__( 'Order Placed', 'restrofood' )
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Accepted Cooking Text', 'restrofood' ),
            'name'  => 'accepted-cooking-text',
            'placeholder' => esc_html__( 'Accepted Cooking', 'restrofood' )
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Processing Text', 'restrofood' ),
            'name'  => 'processing-text',
            'placeholder' => esc_html__( 'Processing', 'restrofood' )
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'On The Way To Delivery Text', 'restrofood' ),
            'name'  => 'way-to-delivery-text',
            'placeholder' => esc_html__( 'On The Way To Delivery', 'restrofood' )
          ]
        );
        
        $this->end_fields_section(); // End fields section
   }
}

new StatusText_Settings_Tab();