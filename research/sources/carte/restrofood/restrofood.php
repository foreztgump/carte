<?php
/**
 * Plugin Name:       Restrofood
 * Plugin URI:        https://www.themelooks.com/blog/
 * Description:       Restrofood is an online food ordering and delivery system for WordPress. You can manage your restaurant & other food ordering stuff with Restrofood. It has plenty of amazing features. That helps you to build a successful online business.
 * Version:           1.0.1
 * Author:            ThemeLooks
 * Author URI:        https://themelooks.com/
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       restrofood
 * Domain Path:       /languages
 * t
 */

/**
 * Define all constant
 *
 */
update_option( 'restrofood_plugin_lic_Key', '********************' );
// Version constant
if( !defined( 'RESTROFOOD_VERSION' ) ) {
	define( 'RESTROFOOD_VERSION', '1.0.1' );
}

// Plugin dir path constant
if( !defined( 'RESTROFOOD_DIR_PATH' ) ) {
	define( 'RESTROFOOD_DIR_PATH', trailingslashit( plugin_dir_path( __FILE__ ) ) );
}
// Plugin dir url constant
if( !defined( 'RESTROFOOD_DIR_URL' ) ) {
	define( 'RESTROFOOD_DIR_URL', trailingslashit( plugin_dir_url( __FILE__ ) ) );
}
// Plugin dir url constant
if( !defined( 'RESTROFOOD_DIR_ASSETS_URL' ) ) {
	define( 'RESTROFOOD_DIR_ASSETS_URL', trailingslashit( RESTROFOOD_DIR_URL.'assets' ) );
}
// Plugin dir admin assets url constant
if( !defined( 'RESTROFOOD_DIR_ADMIN_ASSETS_URL' ) ) {
	define( 'RESTROFOOD_DIR_ADMIN_ASSETS_URL', trailingslashit( RESTROFOOD_DIR_URL . 'admin/assets' ) );
}
// Admin dir path
if( !defined( 'RESTROFOOD_DIR_ADMIN' ) ) {
	define( 'RESTROFOOD_DIR_ADMIN', trailingslashit( RESTROFOOD_DIR_PATH.'admin' ) );
}
// Inc dir path
if( !defined( 'RESTROFOOD_DIR_INC' ) ) {
	define( 'RESTROFOOD_DIR_INC', trailingslashit( RESTROFOOD_DIR_PATH.'inc' ) );
}

require_once "restrofoodBase.php";

final class RestroFood {

	private static $instance = null;
	
	public $plugin_file 	=__FILE__;
	public $showMessage 	= false;
	public $slug 			= "restrofood_plugin_license";
	public $responseObj;
	public $licenseMessage;
	
	function __construct() {
		add_action( 'init', [ $this, 'restrofood_load_textdomain' ] );
		add_action( 'admin_notices',[ $this, 'restrofood_plugin_activated_notices' ] );
		register_deactivation_hook( __FILE__, [ $this, 'restrofood_plugin_deactivate' ] );
		register_activation_hook( __FILE__, [ $this, 'restrofood_plugin_activate' ] );
		register_activation_hook( __FILE__, [ $this, 'restrofood_admin_notice_activation_hook' ] );
		
		// For License
		add_action( 'admin_print_styles', [ $this, 'SetAdminStyle' ] );
		$licenseKey = get_option( "restrofood_plugin_lic_Key", "" );
		$liceEmail  = get_option( "restrofood_plugin_lic_email", "" );
		
		restrofoodBase::addOnDelete( function(){
		   delete_option( "restrofood_plugin_lic_Key" );
		});
		
		if( restrofoodBase::CheckWPPlugin( $licenseKey, $liceEmail, $this->licenseMessage, $this->responseObj, __FILE__ ) ){
			add_action( 'admin_menu', [ $this, 'ActiveAdminMenu' ], 99999 );
			add_action( 'admin_post_restrofood_plugin_el_deactivate_license', [ $this, 'action_deactivate_license' ] );
			add_action( 'plugins_loaded', [ $this, 'restrofood_is_woocommerce_activated'] );
			delete_transient( 'restrofood_plugin-admin-notice' );
		}else{
			if( !empty( $licenseKey ) && !empty( $this->licenseMessage ) ){
			   $this->showMessage = true;
			}
			update_option( "restrofood_plugin_lic_Key", "" ) || add_option( "restrofood_plugin_lic_Key", "" );
			add_action( 'admin_post_restrofood_plugin_el_activate_license', [ $this, 'action_activate_license' ] );
			add_action( 'admin_menu', [ $this, 'InactiveMenu' ] );
		}
	}
	
	// Initial Notice
	public function restrofood_admin_notice_activation_hook(){
        set_transient( 'restrofood_plugin-admin-notice', 'yes', 0 );
    }
	
	public function restrofood_plugin_activated_notices() {
        if( get_transient( 'restrofood_plugin-admin-notice' ) ){
            printf('<div class="notice notice-warning is-dismissible"><h3>Warning!</h3><p><strong>'.esc_html__('Please activate your license to get full access to the Plugin, updates, premium support, etc.','restrofood').'</strong></p><p><a class="button button-primary" href="'.admin_url('/admin.php?page=restrofood_plugin_license').'">'.esc_html__('Active License','restrofood').'</a></p></div>');
        }
    }
	
	public static function getInstance() {
		
		if( is_null( self::$instance ) ) {
			self::$instance = new self;
		}
		return self::$instance;
	}

	/**
	 * Load plugin textdomain.
	 */
	public function restrofood_load_textdomain() {
	    load_plugin_textdomain( 'restrofood', false, RESTROFOOD_DIR_PATH . 'languages' ); 
	}

	/**
	 * Check WooCommerce is activated or not
	 * 
	 */
	public function restrofood_is_woocommerce_activated() {

		if ( class_exists( 'woocommerce' ) ) {
			require_once( RESTROFOOD_DIR_PATH.'restrofood-init.php' );
		} else {
			add_action( 'admin_notices', [ $this, 'restrofood_activation_admin_notice' ] );
		}

	}

	/**
	 * restrofood_activation_admin_notice description
	 * 
	 * If wooocommerce plugin not active 
	 * show the admin notification to active woocommerce plugin 
	 * 
	 * @return 
	 */
	public function restrofood_activation_admin_notice() {
	    $url = "https://wordpress.org/plugins/woocommerce/";
	    ?>
	    <div class="notice notice-error is-dismissible">
	        <h4><?php echo sprintf( esc_html__( 'RestroFood requires the WooCommerce plugin to be installed and active. You can download %s woocommerce %s here. Thanks.', 'restrofood' ), '<a href="'.esc_url( $url ).'" target="_blank">','</a>' ); ?></h4>
	    </div>
	    <?php
	}

	/**
	 * restrofood_default_pages_list 
	 * @return array
	 */
	public function restrofood_default_pages_list() {

	  return [
	    "restrofood"        => "RestroFood",
	    "branch-manager"  => "Branch Manager",
	    "kitchen-manager" => "Kitchen Manager",
	    "delivery"        => "Delivery",
	    "admin"           => "Admin"
	  ];

	}

	/**
	 * restrofood_insert_page 
	 * Add plugin default page
	 * @return 
	 * 
	 */
	public function restrofood_insert_page() {

	  $getPages = $this->restrofood_default_pages_list();

	  foreach( $getPages as $page_title ) {

		  // Create page object
		  $page = array(
		    'post_type'     => 'page',
		    'post_title'    => wp_strip_all_tags( $page_title ),
		    'post_status'   => 'publish'
		  );
		   
		  // Insert the post into the database
		  wp_insert_post( $page );
	  
	  }

	}

	/**
	 * restrofood_delete_page description
	 * @return 
	 */
	public function restrofood_delete_page() {

	    // Pages
	   $getPages = $this->restrofood_default_pages_list();
	    
	    //
	    foreach( $getPages as $key => $page ){
	      $page_data  = get_page_by_path( $key );
	      if( !empty( $page_data->ID ) ) {
	      	wp_delete_post( $page_data->ID );
	      }
	      
	    }

	}

	/**
	 * restrofood_plugin_activate
	 * @return 
	 */
	public function restrofood_plugin_activate() {

		// Insert default pages
		$this->restrofood_insert_page();

		// Default options set
		$defaultOption = array(

			"product-limit" 	=> 6,
			"search-section" 	=> 'yes',
			"show-cart-button" 	=> 'yes',
			"shop-page" 		=> 'restrofood',
			"branch-manager" 	=> 'branch-manager',
			"kitchen-manager" 	=> 'kitchen-manager',
			"checkout-delivery-option" => 'yes',
			"popup-location-active"	   => 'yes',
			"modal-close-btn-show"	   => 'yes',
			"delivery-options" 	 => 'all',
			"pickup-time-switch" => 'yes',
			"delivery" 			 => 'delivery',
			"admin" 			 => 'admin'
		);

		update_option( 'restrofood_options', $defaultOption );

	}
	
	/**
	 * restrofood_plugin_deactivate 
	 * @return 
	 */
	public function restrofood_plugin_deactivate() {

		// Delete default pages
		$this->restrofood_delete_page();

		//
		delete_option('restrofood_options');

	}
	
	// Admin Style Css
	public function SetAdminStyle() {
		wp_register_style( "restrofood_pluginLic", plugins_url( "assets/css/license-style.css", $this->plugin_file ), 10 );
		wp_enqueue_style( "restrofood_pluginLic" );
	}
	
	// Menu For Activate The License
	public function ActiveAdminMenu(){
		add_menu_page (  "Restrofood Licensing", "Restrofood Licensing", "activate_plugins", $this->slug, [ $this, "Activated" ], plugins_url( 'restrofood/assets/img/favicon.png' ) );
	}
	
	public function InactiveMenu() {
		add_menu_page( "Restrofood Licensing", "Restrofood Licensing", 'activate_plugins', $this->slug,  [ $this, "LicenseForm" ], plugins_url( 'restrofood/assets/img/favicon.png' ) );
	}
	
	// Action For Activate The License
	public function action_activate_license(){
        check_admin_referer( 'el-license' );
        $licenseKey   = ! empty( $_POST['el_license_key'] ) ? $_POST['el_license_key'] : "";
        $licenseEmail = ! empty( $_POST['el_license_email']) ? $_POST['el_license_email'] : "";
        update_option( "restrofood_plugin_lic_Key", $licenseKey ) || add_option( "restrofood_plugin_lic_Key", $licenseKey );
        update_option( "restrofood_plugin_lic_email", $licenseEmail ) || add_option( "restrofood_plugin_lic_email", $licenseEmail );
        update_option( '_site_transient_update_plugins', '' );
        wp_safe_redirect( admin_url( 'admin.php?page='.$this->slug ) );
    }
	
	// Action When Deactivate The License
	public function action_deactivate_license() {
		check_admin_referer( 'el-license' );
		if( restrofoodBase::RemoveLicenseKey(__FILE__, $message ) ){
			update_option( "restrofood_plugin_lic_Key", "" ) || add_option( "restrofood_plugin_lic_Key", "" );
			deactivate_plugins( '/restrofood/restrofood.php' );
			wp_safe_redirect( admin_url( 'plugins.php' ) );
		} else {
			wp_safe_redirect( admin_url( 'admin.php?page='.$this->slug ) );
		}
	}
	
	// Interface After Activate The License
	public function Activated(){
        ?>
        <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
            <input type="hidden" name="action" value="restrofood_plugin_el_deactivate_license"/>
            <div class="el-license-container">
                <h3 class="el-license-title"><i class="dashicons-before dashicons-star-filled"></i> <?php esc_html_e( "Restrofood License Info", $this->slug );?> </h3>
                <hr>
                <ul class="el-license-info">
	                <li>
	                    <div>
	                        <span class="el-license-info-title"><?php esc_html_e( "Status", "restrofood" );?></span>

	                        <?php if ( $this->responseObj->is_valid ) : ?>
	                            <span class="el-license-valid"><?php esc_html_e( "Valid", "restrofood" );?></span>
	                        <?php else : ?>
	                            <span class="el-license-valid"><?php esc_html_e( "Invalid", "restrofood" );?></span>
	                        <?php endif; ?>
	                    </div>
	                </li>
	                <li>
	                    <div>
	                        <span class="el-license-info-title"><?php esc_html_e( "License Type", "restrofood" );?></span>
	                        <?php echo $this->responseObj->license_title; ?>
	                    </div>
	                </li>
	                <li>
	                   <div>
	                       <span class="el-license-info-title"><?php esc_html_e( "License Expired on", "restrofood" );?></span>
	                        <?php 
						   		echo $this->responseObj->expire_date;
	                       		if( !empty( $this->responseObj->expire_renew_link ) ){
	                        ?>
	                           <a target="_blank" class="el-blue-btn" href="<?php echo $this->responseObj->expire_renew_link; ?>"><?php echo esc_html__( 'Renew', 'restrofood' );?></a>
	                        <?php
	                       		}
	                        ?>
	                   </div>
	                </li>
	                <li>
	                   <div>
	                       <span class="el-license-info-title"><?php esc_html_e( "Support Expired on", "restrofood" );?></span>
	                        <?php
	                            echo $this->responseObj->support_end;
	                        	if(!empty($this->responseObj->support_renew_link)){
	                        ?>
	                            <a target="_blank" class="el-blue-btn" href="<?php echo $this->responseObj->support_renew_link; ?>"><?php echo esc_html__( 'Renew', 'restrofood' );?></a>
	                        <?php
	                        	}
	                        ?>
	                   </div>
	                </li>
	                <li>
	                    <div>
	                        <span class="el-license-info-title"><?php esc_html_e( "Your License Key", "restrofood" );?></span>
	                        <span class="el-license-key"><?php echo esc_attr( substr( $this->responseObj->license_key,0,9 )."XXXXXXXX-XXXXXXXX".substr( $this->responseObj->license_key,-9 ) ); ?></span>
	                    </div>
	                </li>
                </ul>
                <div class="el-license-active-btn">
                    <?php wp_nonce_field( 'el-license' ); ?>
                    <?php submit_button( 'Deactivate' ); ?>
                </div>
            </div>
        </form>
    <?php
    }
	
	// License Form
	function LicenseForm() {
    ?>
    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
        <input type="hidden" name="action" value="restrofood_plugin_el_activate_license"/>
        <div class="el-license-container">
            <h3 class="el-license-title"><i class="dashicons-before dashicons-star-filled"></i> <?php esc_html_e("Restrofood Licensing","restrofood");?></h3>
            <hr>
            <?php
            	if( !empty( $this->showMessage ) && !empty( $this->licenseMessage ) ){
            ?>
                <div class="notice notice-error is-dismissible">
                    <p><?php echo esc_html_e( $this->licenseMessage, "restrofood" ); ?></p>
                </div>
            <?php
            	}
            ?>
            <p><?php esc_html_e("Enter your license key here, to activate the product, and get full feature updates and premium support.", "restrofood" );?></p>
            <div class="license-wrapper">
                <div class="single-license-wrapper">
                    <h3><?php esc_html_e( "Regular License", "restrofood" );?></h3>
                    <ol>
                        <li><?php echo esc_html__('Login To Your ',"restrofood").'<a href="'.esc_url( 'https://account.envato.com/' ).'">'.esc_html__('Envato Account','restrofood').'</a>'; ?></li>
                        <li><?php echo esc_html__('Download your License certificate & purchase code (text) from here ','restrofood').'<a target="_blank" href="'.esc_url( 'https://codecanyon.net/downloads' ).'">'.esc_html__( 'codecanyon.net/downloads', 'restrofood' ).'</a>'; ?>
                        <?php echo esc_html__('(Check out the ',"restrofood").'<a target="_blank" href="'.esc_url( 'http://prntscr.com/gja0gk' ).'">'.esc_html__( 'Screenshot', 'restrofood' ).'</a>'; ?></li>
                        <li><?php esc_html_e( "Get Your License Key", "restrofood" );?></li>
                    </ol>
                </div>
                <div class="membership-license-wrapper">
                    <h3><?php esc_html_e( "Extended License", "restrofood" );?></h3>
                    <ol>
                        <li><?php echo esc_html__( 'Login To Your ', "restrofood" ).'<a href="'.esc_url( 'https://account.envato.com/' ).'">'.esc_html__( 'Envato Account', 'restrofood' ).'</a>'; ?></li>
                        <li><?php echo esc_html__( 'Download your License certificate & purchase code (text) from here ','restrofood').'<a target="_blank" href="'.esc_url( 'https://codecanyon.net/downloads' ).'">'.esc_html__( 'codecanyon.net/downloads', 'restrofood' ).'</a>'; ?>
                        <?php echo esc_html__( '(Check out the ', "restrofood" ).'<a target="_blank" href="'.esc_url( 'http://prntscr.com/gja0gk' ).'">'.esc_html__( 'Screenshot', 'restrofood' ).'</a>'; ?></li>
                        <li><?php esc_html_e( "Get Your License Key", "restrofood" );?></li>
                    </ol>
                </div>
            </div>
            <hr/>
            <div class="el-license-field">
                <label for="el_license_key"><?php esc_html_e( "License code", "restrofood" );?></label>
                <input type="text" class="regular-text code" name="el_license_key" size="50" placeholder="<?php echo esc_attr__( 'xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx', 'restrofood' );?>" required="required">
            </div>
            <div class="el-license-field">
                <label for="el_license_key"><?php esc_html_e( "Email Address", "restrofood" );?></label>
                <?php
                    $purchaseEmail   = get_option( "restrofood_plugin_lic_email", get_bloginfo( 'admin_email' ));
                ?>
                <input type="text" class="regular-text code" name="el_license_email" size="50" value="<?php echo $purchaseEmail; ?>" placeholder="" required="required">
                <div><small><?php esc_html_e( "We will send update news of this product by this email address, don't worry, we hate spam", "restrofood" );?></small></div>
            </div>
            <div class="el-license-active-btn">
                <?php wp_nonce_field( 'el-license' ); ?>
                <?php submit_button( 'Activate' ); ?>
            </div>
        </div>
    </form>
        <?php
    }
	
}

// Init RestroFood class
RestroFood::getInstance();