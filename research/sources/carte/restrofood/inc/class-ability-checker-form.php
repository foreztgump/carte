<?php 
namespace RestroFood\Inc;
/**
 *
 * @package     Restrofood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 *
 */

class Ability_Checker_Form {

  /**
   * [availabilityStatus description]
   * @return [type] [description]
   */
  public static function availabilityStatus() {

      $getText = \Restrofood\Inc\Text::getText();
      $availabilityStatus = '';
      $dAvailabilityStatus = get_transient('d_availability_status');

      if( !empty( $dAvailabilityStatus ) ) {
        if( $dAvailabilityStatus == 'yes' ) {
          $availabilityStatus = [ 'class' => 'status-success', 'msg' => esc_html( $getText['delivery_available_success'] ) ];
        } else if( $dAvailabilityStatus == 'no' ) {
          $availabilityStatus = [ 'class' => 'status-error', 'msg' => esc_html( $getText['delivery_available_error'] ) ];
        }

      }

      return $availabilityStatus;

  }
  /**
   * [checkoutStatus description]
   * @return [type] [description]
   */
  public static function checkoutStatus() {
    echo'<div class="d_availability_status">';
      $status = self::availabilityStatus();
      if( !empty( $status ) ) {
        echo '<p class="fb-checkout-status-inner '.esc_attr( $status['class'] ).'">'.esc_html( $status['msg'] ).'</p>';        
      }
    echo'</div>';
  }
  /**
   * [getBranch description]
   * @return [type] [description]
   */
  public static function getBranch() {
    ?>
    <p><?php esc_html_e( 'Select Branch', 'restrofood' ); ?></p>
    <?php
    self::branchInput();
  }

  public static function branchInput() {
    ?>
    <select class="rb_input_style get_product_by_branch" name="rb_pickup_branch">
      <?php
      echo restrofood_branch_list_html( esc_html__( 'Select Branch', 'restrofood' ), '' );
      ?>
    </select>
    <?php
  }

  /**
   * [form description]
   * @return [type] [description]
   */
  public static function form() {

    $is_active_location = restrofood_getOptionData('popup-location-active');
    $deliveryType = restrofood_getOptionData('delivery-options');
    ?>
    <!-- End Close Modal -->
    <div class="rb_modal_content fb-ability-checker-form-wrapper">
      <h4><?php esc_html_e( 'Delivery Availability Checker', 'restrofood' ); ?></h4>
      <?php
      if( !is_checkout() ) {
        self::delivery_types();
      }
      // branch 
      if( restrofood_is_active_multi_branch() && !is_checkout() ) {
        self::getBranch();
      }
      // 
      if( $is_active_location && $deliveryType != 'pickup' ) {

        if( restrofood_is_location_type_address() ) {
          self::addressInput();
        } else {
          self::zipcodeInput();
        }
        
      }
      //
      do_action('restrofood_modal_ability_checker_form_result_before');
      ?>
      <div id="infowindow-content" style="display: none">
        <img src="" width="16" height="16" id="place-icon" />
        <span id="place-name" class="title"></span><br />
        <span id="place-address"></span>
      </div>
      <div class="fb-availability-check-result" style="display: none;"></div>
      <?php
      if( $is_active_location ) {
        if( restrofood_is_location_type_address() ) {
          self::button();
        }
      }
      ?>
    </div>
    <?php
  }
  /**
   * [form description]
   * @return [type] [description]
   */
  public static function cartModalform() {

    $is_active_location = restrofood_getOptionData('popup-location-active');
    $deliveryType = restrofood_getOptionData('delivery-options');
    ?>
    <!-- End Close Modal -->
    <div class="rb_modal_content fb-ability-checker-form-wrapper">
      <h4><?php esc_html_e( 'Delivery Availability Checker', 'restrofood' ); ?></h4>
      <?php
      // 
      if( $is_active_location && $deliveryType != 'pickup' ) {

        if( restrofood_is_location_type_address() ) {
          self::addressInput();
        } else {
          self::zipcodeInput();
        }
        
      }
      //
      do_action('restrofood_modal_ability_checker_form_result_before');
      ?>
      <div id="infowindow-content" style="display: none">
        <img src="" width="16" height="16" id="place-icon" />
        <span id="place-name" class="title"></span><br />
        <span id="place-address"></span>
      </div>
      <div class="fb-availability-check-result" style="display: none;"></div>
      <?php
      if( $is_active_location ) {
        if( restrofood_is_location_type_address() ) {
          self::button();
        }
      }
      ?>
    </div>
    <?php
  }

  /**
   * [form_for_shortcode description]
   * @return html
   */
  public static function form_for_shortcode( $text ) {
        
    echo '<div class="fb-ability-checker-form-wrapper">';
    echo '<div class="ability-checker-shortcode-form">';
      $borderLeft = 'single-branch-input';

      if( restrofood_is_active_multi_branch() ) {
        $borderLeft = 'border-left-0';
        echo '<div class="fb-select-box-wrapper">';
        self::branchInput();
        echo '<input type="hidden" name="branch_address" />';
        echo '</div>';
      }
      echo '<div class="visitor-location-input-wrapper '.esc_attr( $borderLeft ).'">';
      echo '<div class="fb-locate-me-wrapper">';
          self::locateMeIcon();
      echo '</div>';
      if( !restrofood_is_active_multi_branch() ) {
      $location = \get_option('restrofood_options');
      $location = !empty( $location['branch-location'] ) ? $location['branch-location'] : '';
      echo '<input type="hidden" class="rb_input_style" name="branch_address" readonly value="'.esc_html( $location ).'" />';
      }
      self::visitorLocationInput();
      echo '<div class="fb-locate-me-and-button-wrapper">';
        self::button( $text, true );
        echo '</div>';
      echo '</div>';
    echo '</div>';
      echo '<div class="fb-availability-check-result" style="display: none;"></div>';
    echo '</div>';
    
  }

  /**
   * [zipcodeInput description]
   * @return [type] [description]
   */
  public static function zipcodeInput() {
    $zipCodes = restrofood_get_zipcodes();
    
    ?>
    <div class="zip-code-list hide-availability-checker">
      <?php
      if( !empty( $zipCodes ) ):
      ?>
      <p><?php esc_html_e( 'Select Your Location Zip Code', 'restrofood' ); ?></p>
      <div class="zip-codes">
        <?php 
        foreach( $zipCodes as $zip ):
        ?>
          <label for="zipcode<?php echo esc_attr( $zip ); ?>">
            <input id="zipcode<?php echo esc_attr( $zip ); ?>" class="fb-availability-check" type="radio" value="<?php echo esc_attr( $zip ); ?>" name="zipcode">
            <span><?php echo esc_html( $zip ); ?></span>
          </label>
        <?php
        endforeach; 
        ?>
      </div>
      <?php 
      endif;
      ?>
    </div>
    <?php
  }

  /**
   * [addressInput description]
   * @return [type] [description]
   */
  public static function addressInput() {

      if( restrofood_is_active_multi_branch() && !is_checkout() ):
        echo '<div class="hide-availability-checker"><input type="hidden" name="branch_address" /></div>';
      else: 
      $location = \get_option('restrofood_options');
      $branchLocation = !empty( $location['branch-location'] ) ? $location['branch-location'] : '';
      echo '<div class="restaurant-location-area hide-availability-checker"><p>'.esc_html__( 'Restaurant Location', 'restrofood' ).'</p>';
      echo '<input type="text" class="rb_input_style" name="branch_address" readonly value="'.esc_html( $branchLocation ).'" /></div>';
      endif;
      ?>
      <div class="pac-card hide-availability-checker" id="pac-card">
        <div class="location-input-before">
          <span><?php esc_html_e( 'Search your location', 'restrofood' ); ?> </span>
          <?php 
          self::locateMeIcon();
          ?>
        </div>
        <div id="pac-container">
          <?php self::visitorLocationInput(); ?>
        </div>
      </div>
      <?php
  }

  public static function visitorLocationInput() {
    ?>
    <input id="pac-input" name="visitor_location" class="rb_input_style pac-input" required type="text" placeholder="<?php esc_html_e( 'Enter a location', 'restrofood' ); ?>" />
    <?php
  }

  public static function locateMeIcon() {
    echo '<div class="locate-me-icon-wrapper"><span>'.esc_html__( 'Locate Me', 'restrofood' ).'</span><img class="fb-locate-me" src="'. RESTROFOOD_DIR_URL.'assets/img/located_me_icon.png" /></div>';
  }

  /**
   * [button description]
   * @return [type] [description]
   */
  public static function button( $text = '', $shortcode = false ) {
    $text = $text ? $text :  esc_html__( 'Availability Check', 'restrofood' );
   
    echo '<div class="fb-availability-check-buton hide-availability-checker">';
      if( $shortcode ) {
        echo '<button class="fb-availability-check" ><i class="fa fa-search"></i></button>';
      } else {
        echo '<button class="fb-availability-check rb_btn_fill">'.esc_html( $text ).'</button>';
      }
    echo '</div>';

  }
  
  public static function delivery_types() {
    do_action( 'restrofood_delivery_types' );
  }

}
