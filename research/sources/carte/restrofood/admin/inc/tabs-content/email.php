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


class Email_Settings_Tab extends Settings_Fields_Base {

  public function get_option_name() {
    return 'restrofood_options'; // set option name it will be same or different name
  }

   public function tab_setting_fields() {

        $this->start_fields_section([
            'title'   => esc_html__( 'Email Settings', 'restrofood' ),
            'icon'    => 'fa fa-envelope',
            'id'      => 'emailsettings'
        ]);

        $this->switcher(
          [
            'title' => esc_html__( 'Active Email Notification', 'restrofood' ),
            'name'  => 'active-e-notification'
          ]
        );
        $this->switcher(
          [
            'title' => esc_html__( 'Active Delivery Boy Assign Email Notification', 'restrofood' ),
            'name'  => 'active-order-assign-mail-notification'
          ]
        );
        $this->text(
          [
            'title'       => esc_html__( 'Subject Text', 'restrofood' ),
            'name'        => 'subject-text',
          ]
        );
        $this->text(
          [
            'title'       => esc_html__( 'Order Cancel Notification Text', 'restrofood' ),
            'name'        => 'on-cancel-text',
          ]
        );
        $this->text(
          [
            'title'       => esc_html__( 'Send To Cooking Notification Text', 'restrofood' ),
            'name'        => 'on-stc-text',
          ]
        );
        $this->text(
          [
            'title'       => esc_html__( 'Accept Cooking Notification Text', 'restrofood' ),
            'name'        => 'on-ac-text',
          ]
        );
        $this->text(
          [
            'title'       => esc_html__( 'Cooking Complete Notification Text', 'restrofood' ),
            'name'        => 'on-cc-text',
          ]
        );
        $this->text(
          [
            'title'       => esc_html__( 'On The Way Notification Text', 'restrofood' ),
            'name'        => 'on-owd-text',
          ]
        );
        $this->text(
          [
            'title'       => esc_html__( 'Delivery Complete Notification Text', 'restrofood' ),
            'name'        => 'on-dc-text',
          ]
        );
        $this->text(
          [
            'title'       => esc_html__( 'Email Template Header Text', 'restrofood' ),
            'name'        => 'et-header-text',
          ]
        );
        $this->text(
          [
            'title'       => esc_html__( 'Email Template Footer Text', 'restrofood' ),
            'name'        => 'et-footer-text',
          ]
        );
        $this->colorpicker(
          [
            'title'       => esc_html__( 'Email Template Header Background Color', 'restrofood' ),
            'name'        => 'et-bg-color',
          ]
        );

        $this->end_fields_section(); // End fields section
   }
}

new Email_Settings_Tab();