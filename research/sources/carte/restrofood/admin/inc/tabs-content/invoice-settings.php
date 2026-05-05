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


class Invoice_Settings_Tab extends Settings_Fields_Base {

  public function get_option_name() {
    return 'restrofood_options'; // set option name it will be same or different name
  }

   public function tab_setting_fields() {

        $this->start_fields_section([
            'title'   => esc_html__( 'Invoice Settings', 'restrofood' ),
            'icon'    => 'fas fa-file-invoice',
            'id'      => 'invoicesettings'
        ]);

        $this->selectbox(
          [
          'title' => esc_html__( 'Invoice Type', 'restrofood' ),
          'name'  => 'invoice_type',
          'options'   => [
            'normal' => esc_html__('Normal Printer', 'restrofood'),
            'thermal' => esc_html__('Thermal/Receipt Printer', 'restrofood'),
          ]
          ]
        );
        $this->media(
          [
            'title' => esc_html__( 'Logo Upload', 'restrofood' ),
            'name'  => 'invoice_logo',
          ]
        );
        $this->text(
          [
          'title' => esc_html__( 'Invoice header restaurant name', 'restrofood' ),
          'name'  => 'header_restaurant_name',
          ]
        );
        $this->text(
          [
          'title' => esc_html__( 'Invoice header restaurant Address', 'restrofood' ),
          'name'  => 'header_restaurant_address',
          ]
        );
        $this->text(
          [
          'title' => esc_html__( 'Invoice Footer Text', 'restrofood' ),
          'name'  => 'invoice_footer_text',
          ]
        );   


        $this->end_fields_section(); // End fields section
   }
}

new Invoice_Settings_Tab();