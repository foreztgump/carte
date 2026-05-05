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


class Textedit_Settings_Tab extends Settings_Fields_Base {

  public function get_option_name() {
    return 'restrofood_options'; // set option name it will be same or different name
  }

   public function tab_setting_fields() {

        $this->start_fields_section([
            'title'   => esc_html__( 'Text Edit', 'restrofood' ),
            'icon'    => 'fa fa-edit',
            'id'      => 'textedit'
        ]);

        $this->text( 
          [
            'title' => esc_html__( 'Category Nav Text', 'restrofood' ),
            'name'  => 'category-nav-text',
            'placeholder' => esc_html__('Offers & Category', 'restrofood')
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Categories Heading Text', 'restrofood' ),
            'name'  => 'categories-heading-text',
            'placeholder' => esc_html__('Categories', 'restrofood')
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Special Offer Categories Heading Text', 'restrofood' ),
            'name'  => 'special-offer-heading-text',
            'placeholder' => esc_html__('Special Offer', 'restrofood')
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Food Visibility Categories Heading Text', 'restrofood' ),
            'name'  => 'food-visibility-heading-text',
            'placeholder' => esc_html__('Food Visibility', 'restrofood')
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Visiblity Alert Message', 'restrofood' ),
            'name'  => 'product-visibility-alert-msg',
            'placeholder' => esc_html__( 'Not Available for this time.', 'restrofood' )
          ]
        );
        $this->text(
          [
            'title' => esc_html__( 'Products Top Title Text', 'restrofood' ),
            'name'  => 'product-top-title-text',
            'placeholder' => esc_html__( 'Our All Delicious Foods', 'restrofood' )
          ]
        );


        $this->end_fields_section(); // End fields section
   }
}

new Textedit_Settings_Tab();