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


class Page_Settings_Tab extends Settings_Fields_Base {

  public function get_option_name() {
    return 'restrofood_options'; // set option name it will be same or different name
  }

   public function tab_setting_fields() {

        $this->start_fields_section([
            'title'   => esc_html__( 'Page Settings', 'restrofood' ),
            'icon'    => 'fa fa-cog',
            'id'      => 'pagesettings'
        ]);
        $this->selectbox(
          [
          'title' => esc_html__( 'Select Restrofood Shop Page', 'restrofood' ),
          'name'  => 'shop-page',
          'options'   => restrofood_get_pages()
          ]
        );
        $this->selectbox(
          [
          'title' => esc_html__( 'Select Branch Manager Page', 'restrofood' ),
          'name'  => 'branch-manager',
          'options'   => restrofood_get_pages()
          ]
        );
        $this->selectbox(
          [
          'title' => esc_html__( 'Select Kitchen Manager Page', 'restrofood' ),
          'name'  => 'kitchen-manager',
          'options'   => restrofood_get_pages()
          ]
        );
        $this->selectbox(
          [
          'title' => esc_html__( 'Select Delivery Page', 'restrofood' ),
          'name'  => 'delivery',
          'options'   => restrofood_get_pages()
          ]
        );
        $this->selectbox(
          [
          'title' => esc_html__( 'Select Admin Page', 'restrofood' ),
          'name'  => 'admin',
          'options'   => restrofood_get_pages()
          ]
        );
        


        $this->end_fields_section(); // End fields section
   }
}

new Page_Settings_Tab();