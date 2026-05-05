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


class OrderReceived_Settings_Tab extends Settings_Fields_Base {

  public function get_option_name() {
    return 'restrofood_options'; // set option name it will be same or different name
  }

   public function tab_setting_fields() {

        $this->start_fields_section([
            'title'   => esc_html__( 'Order Received Pgae', 'restrofood' ),
            'icon'    => 'fa fa-pager',
            'id'      => 'orderReceived'
        ]);
        
        $this->media(
          [
            'title' => esc_html__( 'Page Top Image', 'restrofood' ),
            'name'  => 'received-page-img',
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Page Title', 'restrofood' ),
            'name'  => 'received-page-title',
          ]
        );
        $this->textarea(
          [
            'title' => esc_html__( 'Page Description', 'restrofood' ),
            'name'  => 'received-description'
          ]
        );
        $this->switcher(
          [
            'title' => esc_html__( 'Active Invitation Option', 'restrofood' ),
            'name'  => 'active-invitation'
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Invitation Header ( From ) Email', 'restrofood' ),
            'name'  => 'invitation-from-email',
          ]
        );
        $this->textarea(
          [
            'title' => esc_html__( 'Invitation Message Subject', 'restrofood' ),
            'name'  => 'invitation-subject'
          ]
        );
        $this->textarea(
          [
            'title' => esc_html__( 'Invitation Message', 'restrofood' ),
            'name'  => 'invitation-message'
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Twitter Share Link', 'restrofood' ),
            'name'  => 'twitter-share-link',
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Facebook Share Link', 'restrofood' ),
            'name'  => 'facebook-share-link',
          ]
        );


        $this->end_fields_section(); // End fields section
   }
}

new OrderReceived_Settings_Tab();