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

class Shortcodelist_Settings_Tab extends Settings_Fields_Base {

  public function get_option_name() {
    return 'restrofood_options'; // set option name it will be same or different name
  }

   public function tab_setting_fields() {

        $this->start_fields_section([
            'title'   => esc_html__( 'Shortcode List', 'restrofood' ),
            'icon'    => 'fa fa-code',
            'id'      => 'shortcodelist'
        ]);
        ?>
        <h3><?php esc_html_e( 'Shortcode List', 'restrofood' ); ?></h3>
              <div class="shortcode-item-list">
                <h4><?php esc_html_e( 'Product Page Shortcode:', 'restrofood' ); ?></h4>

                <code>[restrofood_products]</code>
                <code>[restrofood_products col="4" cat="accessories" layout="grid" search="yes" padding_top="120px" padding_bottom="120px"]</code>
                <h5><?php esc_html_e( 'Attrubute List', 'restrofood' ); ?></h5>
                <ul>
                  <li><pre><?php esc_html_e( 'cat - cat="category name"', 'restrofood' ); ?> </pre></li>
                  <li><pre><?php esc_html_e( 'col - col="column" available value like ( 2, 3, 4 )', 'restrofood' ); ?> </pre></li>
                  <li><pre><?php esc_html_e( 'layout - layout="layout" available value like grid or list', 'restrofood' ); ?> </pre></li>
                  <li><pre><?php esc_html_e( 'style - style="1" available value like 1,2,3', 'restrofood' ); ?> </pre></li>
                  <li><pre><?php esc_html_e( 'mini cart type - mini_cart_type="canvas" available value like canvas, footer-fixed, beside-products', 'restrofood' ); ?> </pre></li>
                  <li><pre><?php esc_html_e( 'search - search="yes" available value like yes or no', 'restrofood' ); ?> </pre></li>
                  <li><pre><?php esc_html_e( 'Wrapper Padding Top - padding_top="120px" ', 'restrofood' ); ?> </pre></li>
                  <li><pre><?php esc_html_e( 'Wrapper Padding Bottom - padding_bottom="120px" ', 'restrofood' ); ?> </pre></li>
                </ul>
              </div>
              <div class="shortcode-item-list">
                <h4><?php esc_html_e( 'Delivery ability checker form:', 'restrofood' ); ?></h4>
                <code>[restrofood_delivery_ability_checker]</code>
                <code>[restrofood_delivery_ability_checker button_text="search"]</code>
                <h5><?php esc_html_e( 'Attrubute List', 'restrofood' ); ?></h5>
                <ul>
                  <li><pre><?php esc_html_e( 'button_text - button_text="search"', 'restrofood' ); ?> </pre></li>
                </ul>
              </div>

              <div class="restrofood-shortcode-generator-wrapper">
                  <h2><?php esc_html_e( 'Shortcode Generator', 'restrofood' ); ?></h2>
                  <div class="restrofood-shortcode-generator-inner">
                      <select id="shortcodeType">
                          <option value=""><?php esc_html_e( 'Shortcode For ?', 'restrofood' ); ?></option>
                          <option value="restrofood_products"><?php esc_html_e( 'Products', 'restrofood' ); ?></option>
                          <option value="restrofood_delivery_ability_checker"><?php esc_html_e( 'Delivery ability checker form', 'restrofood' ); ?></option>
                      </select>
                      <select id="layout" class="single-field shortcode-attr-single-field produt-attr-field">
                          <option value=""><?php esc_html_e( 'Select layout type', 'restrofood' ); ?></option>
                          <option value="grid"><?php esc_html_e( 'Grid', 'restrofood' ); ?></option>
                          <option value="list"><?php esc_html_e( 'List', 'restrofood' ); ?></option>
                      </select>
                      <select id="column" class="single-field shortcode-attr-single-field produt-attr-field">
                          <option value=""><?php esc_html_e( 'Select Column', 'restrofood' ); ?></option>
                          <option value="1"><?php esc_html_e( '1 Column', 'restrofood' ); ?></option>
                          <option value="2"><?php esc_html_e( '2 Column', 'restrofood' ); ?></option>
                          <option value="3"><?php esc_html_e( '3 Column', 'restrofood' ); ?></option>
                          <option value="4"><?php esc_html_e( '4 Column', 'restrofood' ); ?></option>
                      </select>
                      <select id="style" class="single-field shortcode-attr-single-field produt-attr-field">
                          <option value=""><?php esc_html_e( 'Select Style', 'restrofood' ); ?></option>
                          <option value="1"><?php esc_html_e( 'Style 1', 'restrofood' ); ?></option>
                          <option value="2"><?php esc_html_e( 'Style 2', 'restrofood' ); ?></option>
                          <option value="3"><?php esc_html_e( 'Style 3', 'restrofood' ); ?></option>
                      </select>
                      <select id="mini_cart_type" class="single-field shortcode-attr-single-field produt-attr-field">
                          <option value=""><?php esc_html_e( 'Mini Cart Type', 'restrofood' ); ?></option>
                          <option value="canvas"><?php esc_html_e( 'Canvas Modal', 'restrofood' ); ?></option>
                          <option value="footer-fixed"><?php esc_html_e( 'Footer Fixed', 'restrofood' ); ?></option>
                          <option value="beside-products"><?php esc_html_e( 'Beside Products', 'restrofood' ); ?></option>
                      </select>
                      <input type="number" id="limit" class="single-field shortcode-attr-single-field produt-attr-field" placeholder="<?php esc_html_e( 'Limit', 'restrofood' ); ?>" />
                      <select id="search" class="single-field shortcode-attr-single-field produt-attr-field">
                          <option value=""><?php esc_html_e( 'Product quick search bar?', 'restrofood' ); ?></option>
                          <option value="yes"><?php esc_html_e( 'Yes', 'restrofood' ); ?></option>
                          <option value="no"><?php esc_html_e( 'No', 'restrofood' ); ?></option>
                      </select>
                      <select id="categories" class="single-field shortcode-attr-single-field produt-attr-field" multiple>
                          <option value=""><?php esc_html_e( 'Select Categoty', 'restrofood' ); ?></option>
                          <?php 
                          $getTerms = restrofood_get_terms('product_cat');
                          if( !empty( $getTerms ) ) {
                            foreach ( $getTerms as $key => $value) {

                              echo '<option value="'.esc_html( $value->slug ).'">'.esc_html( $value->name ).'</option>';
                            }
                          }
                          ?>
                      </select>
                      <?php
                      do_action('restrofood_shortcode_branch_list');
                      ?>
                      <input type="number" id="padding_top" class="single-field shortcode-attr-single-field produt-attr-field" placeholder="<?php esc_html_e( 'Padding Top', 'restrofood' ); ?>" />

                      <input type="number" id="padding_bottom" class="single-field shortcode-attr-single-field produt-attr-field" placeholder="<?php esc_html_e( 'Padding Bottom', 'restrofood' ); ?>" />

                      <input type="text" id="search_text" class="single-field shortcode-attr-single-field ability-checker-attr-field" placeholder="<?php esc_html_e( 'Search....', 'restrofood' ); ?>" />

                      <div class="button-area">
                        <span id="scodegenerate" class="button button-primary"><?php esc_html_e( 'Generate', 'restrofood' ); ?></span>
                        <span id="scode-copy" class="button button-primary"><?php esc_html_e( 'Copy', 'restrofood' ); ?></span>
                      </div>

                  </div>
                  <div class="scode-show"></div>
              </div>
              
        <?php
        $this->end_fields_section(); // End fields section
   }
}

new Shortcodelist_Settings_Tab();