<?php
namespace RestroFood\Admin;
 /**
  * 
  * @package    RestroFood 
  * @since      1.0.0
  * @version    1.0.0
  * @author     ThemeLooks
  * @Websites:  http://themelooks.com/
  *
  */


class Color_Settings_Tab extends Settings_Fields_Base {

  public function get_option_name() {
    return 'restrofood_options'; // set option name it will be same or different name
  }

   public function tab_setting_fields() {

        $this->start_fields_section([
            'title'   => esc_html__( 'Color Settings', 'restrofood' ),
            'icon'    => 'fa fa-fill',
            'id'      => 'colorsettings'
        ]);

        $this->colorpicker(
          [
            'title' => esc_html__( 'Main Color', 'restrofood' ),
            'name'  => 'main-color',
          ]
        );
        $this->colorpicker(
          [
            'title' => esc_html__( 'All Button Background Color', 'restrofood' ),
            'name'  => 'gob-btn-bg-color',
          ]
        );
        $this->colorpicker(
          [
            'title' => esc_html__( 'All Button Text Color', 'restrofood' ),
            'name'  => 'gob-btn-color',
          ]
        );
        $this->colorpicker(
          [
            'title' => esc_html__( 'All Button Hover Background Color', 'restrofood' ),
            'name'  => 'gob-btn-hover-bg-color',
          ]
        );
        $this->colorpicker(
          [
            'title' => esc_html__( 'All Button Hover Text Color', 'restrofood' ),
            'name'  => 'gob-btn-hover-color',
          ]
        );
        $this->colorpicker(
          [
            'title' => esc_html__( 'Canvas Mini Cart Button background', 'restrofood' ),
            'name'  => 'cart-btn-bg',
          ]
        );
        $this->colorpicker(
          [
            'title' => esc_html__( 'Canvas Mini Cart Button Count background', 'restrofood' ),
            'name'  => 'cart-btn-count-bg',
          ]
        );
        $this->colorpicker(
          [
            'title' => esc_html__( 'Canvas Mini Cart Button Count Text Color', 'restrofood' ),
            'name'  => 'cart-btn-count-color',
          ]
        );

        $this->end_fields_section(); // End fields section
   }
}

new Color_Settings_Tab();