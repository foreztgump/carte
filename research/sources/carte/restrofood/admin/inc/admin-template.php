<?php
namespace RestroFood;

/**
 * Restrofood admin
 *
 * @package     Restrofood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 *
 */

if( !class_exists( 'Admin_Templates_Map' ) ) {

	class Admin_Templates_Map {
		
		function __construct() {}

		public function admin_page_init() {
			$this->admin_page_maping();
		}

		public function admin_page_maping() {

			echo '<div class="restrofood-wrapper"><form id="restrofood_settings_from" action="options.php" method="post">';

	            // check if the user have submitted the settings
                if ( isset( $_GET['settings-updated'] ) ) {
                // add settings saved message with the class of "updated"
                add_settings_error( 'restrofood_messages', 'restrofood_message', esc_html__( 'Settings Saved', 'restrofood' ), 'updated' );
                }
                //
                settings_fields( 'restrofood_settings_option_group' ); 
                //
                do_settings_sections( 'restrofood_settings_option_group' ); 

                // show error/update messages
                settings_errors( 'restrofood_messages' );
				
				echo '<div class="settings-wrapper">';

				$this->tab();
				echo '<div class="content-wrapper">';
				$this->content();
				
				echo '</div></div>';

			echo '</form></div>';

		}

		public function tab() {
			?>
			<div class="tab-btn">
			    <div class="container">
					<div class="fb-adminmenu-header">
		                <!-- logo -->
		                <div class="logo">
		                    <img src="<?php echo esc_url( RESTROFOOD_DIR_ADMIN_ASSETS_URL.'logo.svg' ); ?>" alt="logo">
		                </div>
		                <!-- End logo -->
		                <div class="dl-menu-button">
		                    <span></span>
		                </div>
		            </div>
			        <ul class="list-unstyled">
			        	<li data-tab-select="general" class="active"><i class="fa fa-home"></i> <?php esc_html_e( 'General', 'restrofood' ); ?></li>
			        	<li data-tab-select="delivertimebranch"><i class="fa fa-truck"></i> <?php esc_html_e( 'Delivery Settings', 'restrofood' ); ?></li>
			        	<li data-tab-select="kitchenopt"><i class="fa fa-tools"></i> <?php esc_html_e( 'Kitchen Options', 'restrofood' ); ?></li>
			        	<li data-tab-select="orderReceived"><i class="fa fa-pager"></i><?php esc_html_e( 'Order Received Pgae', 'restrofood' ); ?></li>
			        	<li data-tab-select="pagesettings"><i class="fa fa-cog"></i><?php esc_html_e( 'Page Settings', 'restrofood' ); ?></li>
			        	<li data-tab-select="colorsettings"><i class="fa fa-fill"></i><?php esc_html_e( 'Color Settings', 'restrofood' ); ?></li>
			        	<li data-tab-select="locationSettings"><i class="fa fa-map"></i><?php esc_html_e( 'Location Settings', 'restrofood' ); ?></li>
			        	<li data-tab-select="emailsettings"><i class="fa fa-envelope"></i><?php esc_html_e( 'Email Settings', 'restrofood' ); ?></li>
			        	<li data-tab-select="statustext"><i class="fa fa-pen"></i><?php esc_html_e( 'Status Text', 'restrofood' ); ?></li>
			        	<li data-tab-select="textedit"><i class="fa fa-edit"></i> <?php esc_html_e( 'Text Edit', 'restrofood' ); ?></li>
			        	<li data-tab-select="invoicesettings"><i class="fas fa-file-invoice"></i><?php esc_html_e( 'Invoice Settings', 'restrofood' ); ?></li>
						<?php
							do_action( 'restrofood_shortcode_settings_tab_before' );
						?>
			        	<li data-tab-select="shortcodelist"><i class="fa fa-code"></i><?php esc_html_e( 'Shortcode List', 'restrofood' ); ?></li>
						
			        </ul>
			    </div>
			</div>
			<?php
		}

		public function content() {
			echo '<div class="tab-content">';
				require RESTROFOOD_DIR_ADMIN. 'inc/tabs-content/general.php';
				require RESTROFOOD_DIR_ADMIN. 'inc/tabs-content/delivertimebranch.php';
				require RESTROFOOD_DIR_ADMIN. 'inc/tabs-content/kitchen.php';
				require RESTROFOOD_DIR_ADMIN. 'inc/tabs-content/order-received.php';
				require RESTROFOOD_DIR_ADMIN. 'inc/tabs-content/page-settings.php';
				require RESTROFOOD_DIR_ADMIN. 'inc/tabs-content/color-settings.php';
				require RESTROFOOD_DIR_ADMIN. 'inc/tabs-content/location.php';
				require RESTROFOOD_DIR_ADMIN. 'inc/tabs-content/email.php';
				require RESTROFOOD_DIR_ADMIN. 'inc/tabs-content/statustext.php';
				require RESTROFOOD_DIR_ADMIN. 'inc/tabs-content/textedit.php';
				require RESTROFOOD_DIR_ADMIN. 'inc/tabs-content/invoice-settings.php';
				//
				do_action( 'restrofood_shortcode_settings_tab_content_before' );
				require RESTROFOOD_DIR_ADMIN. 'inc/tabs-content/shortcode.php';
				
	        echo '</div>';
			
		}

	}

}
