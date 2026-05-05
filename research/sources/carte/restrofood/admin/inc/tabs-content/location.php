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


class Location_Settings_Tab extends Settings_Fields_Base {

  public function get_option_name() {
    return 'restrofood_options'; // set option name it will be same or different name
  }

   public function tab_setting_fields() {

        $this->start_fields_section([
            'title'   => esc_html__( 'Location Settings', 'restrofood' ),
            'icon'    => 'fa fa-map',
            'id'      => 'locationSettings'
        ]);

        $this->switcher(
          [
            'title' => esc_html__( 'Delivery Availability Checker Active', 'restrofood' ),
            'name'  => 'availability-checker-active'
          ]
        );
        $this->selectbox(
          [
            'title' => esc_html__( 'Location Type', 'restrofood' ),
            'name'  => 'location_type',
            'options'   => [
              'address' => esc_html__( 'Address', 'restrofood' ),
              'zip'     => esc_html__( 'Zip Code', 'restrofood' )
            ]
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Set Google API Key', 'restrofood' ),
            'name'  => 'google-api-key',
            'wrapperclass' => 'fb-address-conditional-field',
            'description' => '<a href="http://console.cloud.google.com/" target="_blank">'.esc_html__( 'Create google API ', 'restrofood' ).'</a>',
          ]
        );
        // Check multibranch
        if( !restrofood_is_multi_branch() ) {

          if( !get_option('restrofood_multideliveryfees_option') ) {
            $this->zipcode([
              'title' => esc_html__( 'Add Single Branch Shop Zip Code', 'restrofood' ),
              'name'  => 'delivery_zip',
              'add_btn_text' => esc_html__( 'Add Zip Code', 'restrofood' ),
              'wrap_class' => 'fb-zip-conditional-field'
            ]);
          }
          $this->locationSearch([
            'title' => esc_html__( 'Set Single Branch Shop Location', 'restrofood' ),
            'name'  => 'branch-location',
          ]);
          $this->number(
            [
              'title' => esc_html__( 'Set Distance Restrict (KM)', 'restrofood' ),
              'name'  => 'distance-restrict',
              'class' => 'fb-address-conditional-field'
            ]
          );

          // Get zipcode with fee field from multideliveryfee plugin
          do_action('restrofood_multideliveryfee_field_delivery_settings', $this );
        }

        $this->switcher(
          [
            'title' => esc_html__( 'Location Modal Popup Active', 'restrofood' ),
            'name'  => 'location-popup-active'
          ]
        );
        $this->switcher(
          [
            'title' => esc_html__( 'Modal Location Checker Active', 'restrofood' ),
            'name'  => 'popup-location-active'
          ]
        );
        $this->switcher(
          [
            'title' => esc_html__( 'Modal Close Button Show', 'restrofood' ),
            'name'  => 'modal-close-btn-show'
          ]
        );
        $this->switcher(
          [
            'title' => esc_html__( 'Checkout Page Delivery Location Checker Active', 'restrofood' ),
            'name'  => 'checkout-location-active'
          ]
        );
        
        $this->multiple_select(
          [
            'title' => esc_html__( 'Set Delivery Availability Checker Modal Show Page', 'restrofood' ),
            'name'  => 'availability-checker-modal',
            'options'   => restrofood_get_pages()
          ]
        );

        $this->end_fields_section(); // End fields section
   }
}

new Location_Settings_Tab();