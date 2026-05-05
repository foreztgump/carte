<?php 
namespace RestroFood;
/**
 *
 * @package     Restrofood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 *
 */

class Hooks {

  function __construct() {

    // Restrofood shop page shortcode register hook
    add_shortcode( 'restrofood_products', [ __CLASS__, 'restrofood_shortcode' ] );

    // Restrofood shop page shortcode register hook
    add_shortcode( 'restrofood_flash_products', [ __CLASS__, 'restrofood_flash_sale_shortcode' ] );
    
    // Restrofood delivery ability checker shortcode register hook
    add_shortcode( 'restrofood_delivery_ability_checker', [ __CLASS__, 'restrofood_delivery_ability_checker_shortcode' ] );

    // Restrofood shop page Template include filter hook
    add_filter( 'template_include', [ __CLASS__, 'restrofood_page_template'], 99 );

    // register_taxonomy for specialoffer post types.
    add_action( 'init', [ __CLASS__, 'restrofood_specialoffer_taxonomy'], 0 );

    // Add, Edit and Save custom taxonomy product visibility meta fields
    add_action( 'product-visibility_add_form_fields', [ __CLASS__, 'add_visibility_term_fields' ] );
    add_action( 'product-visibility_edit_form_fields', [ __CLASS__, 'edit_visibility_term_fields' ], 10, 2 );
    add_action( 'created_product-visibility', [ __CLASS__, 'save_visibility_term_fields' ] );
    add_action( 'edited_product-visibility', [ __CLASS__, 'save_visibility_term_fields' ] );

    // Js template hook in footer action hook
    add_action( 'wp_footer', [ __CLASS__, 'rb_js_template'] );

    // Login redirect filter hook
    add_filter( 'login_redirect', [ __CLASS__, 'restrofood_login_redirect' ], 10, 3 );

    // Login failed redirect
    add_action( 'wp_login_failed', [ __CLASS__, 'restrofood_login_failed_redirect' ] );

    // Add custom userr roles
    add_filter( 'init', [ __CLASS__, 'restrofood_add_roles' ] );

    //
    add_action( 'admin_init', [$this, 'restrofood_no_admin_access'], 100 );

    //
    add_action( 'after_setup_theme', [ $this, 'disable_admin_bar' ] );

    // Location modal
    add_action( 'wp_footer', [ __CLASS__, 'location_modal'] );

    // Mini Cart
    add_action( 'wp_footer', [ __CLASS__, 'restrofood_mini_cart'] );

  }

  /**
   * Restrofood shop page shortcode register
   *
   * 
   */
  public static function restrofood_shortcode( $atts ) {

    $attr = shortcode_atts( array(
      'limit'     => '10',
      'col'     => '3',
      'style'   => '1',
      'layout'  => 'grid',
      'sidebar' => 'yes',
      'search'  => 'yes',
      'cat'     => '',
      'mini_cart_type'  => '',
      'branch_id'       => '',
      'padding_top'     => '',
      'padding_bottom'  => '',
      'shortcode'       => true
    ), $atts );

    global $restrofoodAttr;

    $restrofoodAttr = $attr;

    ob_start();
    include RESTROFOOD_DIR_PATH.'view/template-part-woo-items.php';
    return ob_get_clean();
   
  }

  /**
   * Restrofood shop page shortcode register
   *
   * 
   */
  public static function restrofood_flash_sale_shortcode( $atts ) {

    $attr = shortcode_atts( array(
      'limit'           => '6',
      'per_slide'       => '4',
      'title'           => '',
      'show_btn'        => '',
      'link'            => '',
      'branch_id'       => '',
      'padding_top'     => '',
      'padding_bottom'  => '',
      'shortcode'       => true
    ), $atts );

    global $restrofoodFlashProducts;

    $restrofoodFlashProducts = $attr;

    ob_start();
    include RESTROFOOD_DIR_PATH.'view/template-woo-flash-sale-items.php';
    return ob_get_clean();
   
  }


  /**
   * restrofood_delivery_ability_checker_shortcode 
   * @param  string $atts
   * @return html form
   */
  public static function restrofood_delivery_ability_checker_shortcode( $atts ) {

    $attr = shortcode_atts( array(
      'button_text'     => esc_html__( 'Search', 'restrofood' ),
    ), $atts );

    wp_enqueue_script('googleapis-place');
    wp_enqueue_script('location');

    ob_start();
    \Restrofood\Inc\Ability_Checker_Form::form_for_shortcode( esc_html( $attr['button_text'] ) );
    return ob_get_clean();

  }

  /**
   * Restrofood shop page Template include
   *
   * 
   */   
  public static function restrofood_page_template( $template ) {
   
    $options = get_option('restrofood_options');

    $shop_page            = !empty( $options['shop-page'] ) ? $options['shop-page'] : 'restrofood';
    $branch_manager_page  = !empty( $options['branch-manager'] ) ? $options['branch-manager'] : 'branch-manager';
    $kitchen_manager_page = !empty( $options['kitchen-manager'] ) ? $options['kitchen-manager'] : 'kitchen-manager';
    $delivery_page        = !empty( $options['delivery'] ) ? $options['delivery'] : 'delivery';
    $admin_page           = !empty( $options['admin'] ) ? $options['admin'] : 'admin';


    // Woo Items
    if ( is_page( $shop_page )  ) {

        $new_template = RESTROFOOD_DIR_PATH.'view/template-woo-items.php';

        if ( '' != $new_template ) {
            return $new_template ;
        }
    }
    
    // Manager Admin 
    if ( is_page( $admin_page )  ) {

        $new_template = RESTROFOOD_DIR_PATH.'frontend-admin/templates/template-admin.php';

        if ( '' != $new_template ) {
            return $new_template ;
        }
    }
    // Branch Manager 
    if ( is_page( $branch_manager_page )  ) {

        $new_template = RESTROFOOD_DIR_PATH.'frontend-admin/templates/template-branch-management.php';

        if ( '' != $new_template ) {
            return $new_template ;
        }
    }
    // kitchen Admin 
    if ( is_page( $kitchen_manager_page )  ) {

        $new_template = RESTROFOOD_DIR_PATH.'frontend-admin/templates/template-kitchen-management.php';

        if ( '' != $new_template ) {
            return $new_template ;
        }
    }

    // Delivery Admin 
    if ( is_page( $delivery_page )  ) {

        $new_template = RESTROFOOD_DIR_PATH.'frontend-admin/templates/template-delivery-management.php';

        if ( '' != $new_template ) {
            return $new_template ;
        }
    }

    return $template;

  }

  /**
   * Register.
   *
   * @see register_taxonomy for specialoffer post types.
   * 
   */
  public static function restrofood_specialoffer_taxonomy() {

      $args = array(
          'label'        => esc_html__( 'Special Offer', 'restrofood' ),
          'public'       => true,
          'rewrite'      => array( 'slug' => 'special-offer' ),
          'hierarchical' => true
      );

      register_taxonomy( 'specialoffer', 'product', $args );
      // Product visibility taxonomy
      $args = array(
          'label'        => esc_html__( 'Product Visibility', 'restrofood' ),
          'public'       => true,
          'rewrite'      => array( 'slug' => 'product-visibility' ),
          'hierarchical' => true
      );

      register_taxonomy( 'product-visibility', 'product', $args );
      
  }

  /**
   *
   * Add product visibility term meta field html
   * 
   */
  public static function add_visibility_term_fields( $taxonomy ) {

    echo '<div class="form-field visibility-term-start-wrap">
    <label for="visibility-tag-start-time">'.esc_html__( 'Visibility Start Time', 'restrofood' ).'</label>
    <input name="visibility_start_time" class="time-picker" id="visibility-tag-start-time" type="text" value="" size="40">
  </div>';
    echo '<div class="form-field visibility-term-end-wrap">
    <label for="visibility-tag-end-time">'.esc_html__( 'Visibility End Time', 'restrofood' ).'</label>
    <input name="visibility_end_time" class="time-picker" id="visibility-tag-end-time" type="text" value="" size="40">
  </div>';


  }

  /**
   *
   * Edit product visibility term meta field html
   * 
   */
  public static function edit_visibility_term_fields( $term, $taxonomy ) {

    $startTimeValue = get_term_meta( $term->term_id, '_visibility_start_time', true );
    $endTimeValue = get_term_meta( $term->term_id, '_visibility_end_time', true );
    
    echo '<tr class="form-field">
    <th>
      <label for="visibility-tag-start-time">'.esc_html__( 'Visibility Start Time', 'restrofood' ).'</label>
    </th>
    <td>
      <input name="visibility_start_time" class="time-picker" id="visibility-tag-start-time" type="text" value="' . esc_attr( $startTimeValue ) .'" size="40">
    </td>
    </tr>';
    echo '<tr class="form-field">
    <th>
      <label for="visibility-tag-end-time">'.esc_html__( 'Visibility End Time', 'restrofood' ).'</label>
    </th>
    <td>
      <input name="visibility_end_time" class="time-picker" id="visibility-tag-end-time" type="text" value="' . esc_attr( $endTimeValue ) .'" size="40">
    </td>
    </tr>';

  }

  /**
   *
   * Product visibility term meta field data save
   * 
   */
  public static function save_visibility_term_fields( $term_id ) {

    update_term_meta(
      $term_id,
      '_visibility_start_time',
      sanitize_text_field( $_POST[ 'visibility_start_time' ] )
    );
    update_term_meta(
      $term_id,
      '_visibility_end_time',
      sanitize_text_field( $_POST[ 'visibility_end_time' ] )
    );

  }

  /**
   *
   * Js template hook in footer
   * 
   * 
   */  
  public static function rb_js_template() {

    include RESTROFOOD_DIR_PATH.'view/template-modal-wrapper.php';
    include RESTROFOOD_DIR_PATH.'view/template-modal-product-content.php';
    include RESTROFOOD_DIR_PATH.'view/template-modal-loginreg.php';
    include RESTROFOOD_DIR_PATH.'view/template-modal-reviews.php';
    include RESTROFOOD_DIR_PATH.'view/template-modal-billing-summary.php';
    include RESTROFOOD_DIR_PATH.'view/template-modal-alert.php';
    include RESTROFOOD_DIR_PATH.'frontend-admin/js-templates/template-order-modal.php';

    // Template Without Underscore
    include RESTROFOOD_DIR_PATH.'view/modal-cart.php';

  }

/**
 * restrofood_login_redirect 
 * @param  [type] $redirect_to 
 * @param  [type] $request     
 * @param  [type] $user        
 * @return [type]              
 */
public static function restrofood_login_redirect( $redirect_to, $request, $user ) {

    $options = get_option('restrofood_options');

    $branch_manager_page  = !empty( $options['branch-manager'] ) ? $options['branch-manager'] : 'branch-manager';
    $kitchen_manager_page = !empty( $options['kitchen-manager'] ) ? $options['kitchen-manager'] : 'kitchen-manager';
    $delivery_page        = !empty( $options['delivery'] ) ? $options['delivery'] : 'delivery';

    //is there a user to check?
    if ( isset( $user->roles ) && is_array( $user->roles ) ) {
        //check for admins
        if ( in_array( 'administrator', $user->roles ) ) {
          // redirect them to the default place
          return $redirect_to;
        } elseif( in_array( 'branch_manager', $user->roles ) ) {
          return home_url( esc_html( $branch_manager_page ) );
        }elseif( in_array( 'kitchen_manager', $user->roles ) ){
          return home_url( esc_html( $kitchen_manager_page ) );
        }elseif( in_array( 'delivery_boy', $user->roles ) ) {
          return home_url( esc_html( $delivery_page ) );
        } else {
          return $redirect_to;
        }

    } else {
        return $redirect_to;
    }

}

/**
 * restrofood_login_failed_redirect
 * login failed redirect
 * @return 
 */
public static function restrofood_login_failed_redirect() {

  $options     = get_option('restrofood_options');
  $admin_page  = !empty( $options['admin'] ) ? $options['admin'] : 'admin';
  wp_redirect( site_url( esc_html( $admin_page ) ) );

}

/**
 * restrofood_add_roles
 * add custom role
 * @return 
 */
public static function restrofood_add_roles() {

  add_role( 'kitchen_manager', esc_html__( 'Kitchen Manager', 'restrofood' ), get_role( 'subscriber' )->capabilities );
  add_role( 'branch_manager', esc_html__( 'Branch Manager', 'restrofood' ), get_role( 'subscriber' )->capabilities );
  add_role( 'delivery_boy', esc_html__( 'Delivery Boy', 'restrofood' ), get_role( 'subscriber' )->capabilities );

}

/**
 * restrofood_no_admin_access
 * prevent wp admin access
 * @return 
 * 
 */
public function restrofood_no_admin_access() {

  $options = get_option('restrofood_options');

  $admin_page  = !empty( $options['admin'] ) ? $options['admin'] : 'admin';
  
  if ( ( current_user_can( 'kitchen_manager' ) || 
    current_user_can( 'branch_manager' ) || 
    current_user_can( 'delivery_boy' ) ) &&
    ! ( defined( 'DOING_AJAX' ) && DOING_AJAX )
  ) {

    wp_redirect( site_url( esc_html( $admin_page ) ) );
    exit;

  }

}

public function disable_admin_bar() {

   if ( current_user_can( 'kitchen_manager' ) || 
    current_user_can( 'branch_manager' ) || 
    current_user_can( 'delivery_boy' ) ) {

    // hide admin bar
    show_admin_bar(false);

   } else {

    // user can view admin bar
    show_admin_bar(true);

   }

}


/**
 * [location_modal description]
 * @return [type] [description]
 */
public static function location_modal() {

  $modalShow = get_option('restrofood_options');
  $popupActive = isset( $modalShow['location-popup-active'] ) ? $modalShow['location-popup-active'] : '';
  $availabilityCheckerActive = isset( $modalShow['availability-checker-active'] ) ? $modalShow['availability-checker-active'] : '';

  if( !$popupActive || !$availabilityCheckerActive ) {
    return;
  }

  $getPages = !empty( $modalShow['availability-checker-modal'] ) ? $modalShow['availability-checker-modal'] : 'restrofood';

  if( !is_page( $getPages ) ) {
    return;
  }

  ?>
  <script>
    jQuery('body').addClass('fbPopupModal-opened rb_popup_modal-opened');
  </script>
  <div class="rb__wrapper orderadmin_popup_modal rb_delivery_availability_checker" id="orderadmin_popup_modal">
    <div class="rb_popup_modal open" style="display: block">
      <div class="rb_modal_wrap rb_modal_location">
        <div class="rb_modal">
          <div class="rb_modal_inner">
          <?php
          // Close Modal
          if( !empty( $modalShow['modal-close-btn-show'] ) ):
          ?>
            <span class="rb_close_modal sad">
              <img src="<?php echo RESTROFOOD_DIR_URL.'assets/img/icon/close.svg'; ?>" alt="<?php esc_attr_e( 'close', 'restrofood' ); ?>" />
            </span>
            <?php 
            endif;
            // Form
            \Restrofood\Inc\Ability_Checker_Form::form();
            ?>
          </div>
        </div>
      </div>
    </div>
  </div>
  <?php
}

/**
 * restrofood_mini_cart
 * @return html
 */
public static function restrofood_mini_cart() {
  //
  global $restrofoodAttr;
  //  
  if(  !is_page( restrofood_getOptionData('shop-page') ) && !isset( $restrofoodAttr['shortcode'] ) ) {
    return;
  }
  // Check cart modal style is not canvas
  $miniCartType = !empty( $restrofoodAttr['mini_cart_type'] ) ? $restrofoodAttr['mini_cart_type'] : '';
  $is_minicart = false;

  if( 'canvas' == $miniCartType ) {
    $is_minicart = true;
  } else if( 'canvas' == restrofood_getOptionData('cart-modal-style') && !$miniCartType ) {
    $is_minicart = true;
  }
  //
  if( !$is_minicart ) {
    return;
  }

  ?>
  <!-- Cart Button -->
  <span class="rb_cart_count_btn rb_floating_cart_btn">
    <?php
    if( !is_admin() ):
    ?>
    <span class="rb_cart_count rb_cart_icon"><?php echo sprintf( esc_html__( '%s Items', 'restrofood' ), esc_html( WC()->cart->get_cart_contents_count() ) ); ?></span>
    <?php
    endif;
    ?>
    <span class="rb_cart_icon">
      <?php 
      if( !empty( $options['cart-btn-icon'] ) ) {
        echo '<img src="'.esc_url( $options['cart-btn-icon'] ).'" class="rb_svg" alt="'.esc_attr( 'cart count', 'restrofood' ).'" />';
      } else {
        $icon = RESTROFOOD_DIR_URL.'assets/img/icon/cart-btn-icon.svg';
        echo '<img src="'.esc_url( $icon ).'" class="rb_svg" alt="'.esc_attr( 'cart count', 'restrofood' ).'" />';
      }
      ?>
    </span>
  </span>
  <!-- End Cart Button -->
  <?php
}


}

// Hooks class init
new Hooks();