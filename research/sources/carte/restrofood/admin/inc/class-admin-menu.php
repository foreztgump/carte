<?php
namespace RestroFood;

/**
 * restrofood admin class
 *
 * @package     Restrofood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 *
 */

if( !class_exists('Admin_Menu') ) {
	class Admin_Menu {

		private static $getPermission;
		private static $instance = null;

		function __construct() {
			self::$getPermission = restrofoodgetG();
			add_action( 'admin_menu', array( __CLASS__, 'admin_menu_page' ) );
			add_action( 'admin_init', array( __CLASS__, 'page_settings_init' ) );
		}

		public static function getInstance() {
			if( is_null( self::$instance ) ) {
				self::$instance = new self();
			}
			return self::$instance;
		}

		public static function admin_menu_page() {

			if( !self::$getPermission ) {
				return;
			}

			// add top level menu page
			add_menu_page(
				esc_html__( 'Restrofood Settings', 'restrofood' ),
				esc_html__( 'Restrofood', 'restrofood' ),
				'manage_options',
				'restrofood',
				array( __CLASS__, 'admin_view' ),
				RESTROFOOD_DIR_ADMIN_ASSETS_URL.'menu-icon.png'
			);
			add_submenu_page( 'restrofood', esc_html__( 'Restrofood Settings', 'restrofood' ), esc_html__( 'Settings', 'restrofood' ),'manage_options', 'restrofood');
			do_action('restrofood_admin_menu');
			add_submenu_page(
		        'restrofood',
		        esc_html__( 'Order Manage', 'restrofood' ), //page title
		        esc_html__( 'Orders', 'restrofood' ), //menu title
		        'manage_options', //capability,
		        'restrofood-branch-order',//menu slug
		        array( __CLASS__, 'branch_order_submenu_page' ) //callback function
		        
		    );
		}

		public static function admin_view() {
			$Admin_Templates = new Admin_Templates_Map();
			$Admin_Templates->admin_page_init();
		}
		public static function page_settings_init() {
			register_setting(
	            'restrofood_settings_option_group', // Option group
	            'restrofood_options' // Option name
	        );  
		}

		public static function branch_order_submenu_page() {
			// 
			$obj = new Admin_Sub_Menu_Templates();
			$obj->admin_branches_manage();
		}

	}

	Admin_Menu::getInstance();
}