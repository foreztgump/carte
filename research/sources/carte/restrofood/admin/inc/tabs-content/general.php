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


class General_Settings_Tab extends Settings_Fields_Base {

  public function get_option_name() {
    return 'restrofood_options'; // set option name it will be same or different name
  }

   public function tab_setting_fields() {

        $this->start_fields_section([

            'title'   => esc_html__( 'General Settings', 'restrofood' ),
            'class'   => 'active',
            'id'      => 'general',
            'icon'    => 'fa fa-home',
            'display' => 'block'

        ]);

        $this->switcher(
          [
            'title' => esc_html__( 'Search Section Show', 'restrofood' ),
            'name'  => 'search-section'
          ]
        );
        $this->selectbox(
          [
            'title' => esc_html__( 'Mini Cart Style', 'restrofood' ),
            'name'  => 'cart-modal-style',
            'options'   => [
              'canvas'          => esc_html__( 'Canvas Modal', 'restrofood' ), 
              'footer-fixed'    => esc_html__( 'Footer Fixed', 'restrofood' ),
              'beside-products' => esc_html__( 'Beside Products', 'restrofood' )
            ]
          ]
        );
        $this->switcher(
          [
            'title' => esc_html__( 'Add To Cart Button Show', 'restrofood' ),
            'name'  => 'show-cart-button'
          ]
        );
        $this->number(
          [
            'title' => esc_html__( 'Product Per Page', 'restrofood' ),
            'name'  => 'product-limit'
          ]
        );
        $this->selectbox(
          [
            'title' => esc_html__( 'Product Order By', 'restrofood' ),
            'name'  => 'product-order',
            'options'   => [
              'DESC' => esc_html__( 'DESC', 'restrofood' ), 
              'ASC'  => esc_html__( 'ASC', 'restrofood' )
            ]
          ]
        );
        $this->selectbox(
          [
            'title' => esc_html__( 'Product Layout', 'restrofood' ),
            'name'  => 'product-layout',
            'options'   => [ 'grid' => esc_html__( 'Grid Column', 'restrofood' ), 'list' => esc_html__( 'List Column', 'restrofood' ) ]
          ]
        );
        $this->selectbox(
          [
            'title' => esc_html__( 'Layout Style', 'restrofood' ),
            'name'  => 'product-layout-style',
            'options'   => [
              '1' => esc_html__( 'Style 1', 'restrofood' ), 
              '2' => esc_html__( 'Style 2', 'restrofood' ),
              '3' => esc_html__( 'Style 3', 'restrofood' ) 
            ]
          ]
        );
        $this->selectbox(
          [
            'title' => esc_html__( 'Product Column', 'restrofood' ),
            'name'  => 'product-column',
            'options'   => [ 
              '6' => esc_html__( '2 Column', 'restrofood' ), 
              '4' => esc_html__( '3 Column', 'restrofood' ), 
              '3' => esc_html__( '4 Column', 'restrofood' ) 
            ]
          ]
        );
        $this->number(
          [
            'title' => esc_html__( 'Manager Page Order Notification Delay Time ( default 6 second )', 'restrofood' ),
            'name'  => 'page-autoreload',
            'placeholder' => esc_attr__( '6', 'restrofood' )
          ]
        );
        $this->number(
          [
            'title' => esc_html__( 'Set List View Product Description Characters', 'restrofood' ),
            'name'  => 'desc-characters',
            'description' => esc_html__( 'This option work only for list style 3.', 'restrofood' ),
          ]
        );
        $this->text(
          [
            'title'       => esc_html__( 'Order Button Text', 'restrofood' ),
            'name'        => 'order-btn-text',
          ]
        );
        $this->media(
          [
            'title'       => esc_html__( 'Cart Button Icon', 'restrofood' ),
            'name'        => 'cart-btn-icon',
          ]
        );
        if( restrofood_is_active_multi_branch() ) {
          $this->selectbox(
            [
              'title' => esc_html__( 'Branch Type', 'restrofood' ),
              'name'  => 'brunch-type',
              'options'   => [ 
                'single' => esc_html__( 'Single Branch', 'restrofood' ), 
                'multi' => esc_html__( 'Multi Branch', 'restrofood' ) 
              ]
            ]
          );
        }
        $this->switcher(
          [
            'title' => esc_html__( 'Notification Audio Loop', 'restrofood' ),
            'name'  => 'audio-loop'
          ]
        );
        $this->media(
          [
            'title'       => esc_html__( 'Upload Notification Audio MP3', 'restrofood' ),
            'name'        => 'notification-audio',
          ]
        );
        $this->end_fields_section(); // End fields section
   }
}

new General_Settings_Tab();