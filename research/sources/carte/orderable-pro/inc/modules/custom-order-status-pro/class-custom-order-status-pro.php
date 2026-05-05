<?php
/**
 * Module: Custom Order Status Pro.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

use Automattic\WooCommerce\Utilities\OrderUtil;

/**
 * Custom Order Status Pro module class.
 */
class Orderable_Custom_Order_Status_Pro {
	/**
	 * Key for the custom post type.
	 *
	 * @var string
	 */
	public static $cpt_key = 'orderable_status';

	/**
	 * Code order statuses.
	 *
	 * @var array
	 */
	public static $core_order_statuses = array();

	/**
	 * Init.
	 */
	public static function run() {
		self::load_classes();

		define( 'ORDERABLE_PRO_COS_PATH', plugin_dir_path( __FILE__ ) );

		if ( is_admin() ) {
			add_filter( 'orderable_is_settings_page', array( __CLASS__, 'is_custom_status_edit_page' ) );
			add_action( 'admin_enqueue_scripts', array( __CLASS__, 'admin_assets' ) );
			remove_action( 'admin_menu', array( 'Orderable_Custom_Order_Status', 'add_settings_page' ) );
		}

		add_action( 'init', array( __CLASS__, 'on_init' ) );
		add_filter( 'wc_order_statuses', array( __CLASS__, 'modify_order_status' ) );
		add_filter( 'woocommerce_register_shop_order_post_statuses', array( __CLASS__, 'modify_order_status_post_types' ) );
		add_filter( 'woocommerce_reports_order_statuses', array( __CLASS__, 'add_remove_order_status_in_report' ) );
		add_filter( 'woocommerce_email_classes', array( __CLASS__, 'register_email' ) );
		add_action( 'woocommerce_order_status_changed', array( __CLASS__, 'send_notifications' ), 10, 3 );
		add_action( 'woocommerce_email_from_name', array( __CLASS__, 'modify_from_name' ), 10, 3 );
		add_action( 'woocommerce_email_from_address', array( __CLASS__, 'modify_from_address' ), 10, 3 );
		add_action( 'wp_trash_post', array( __CLASS__, 'maybe_reassign_custom_order_status' ) );
		add_action( 'woocommerce_after_order_object_save', array( __CLASS__, 'prevent_sending_default_woocommerce_email' ) );
	}

	/**
	 * On Init.
	 */
	public static function on_init() {
		self::register_custom_post_status();
	}

	/**
	 * Load classes.
	 */
	public static function load_classes() {
		$classes = array(
			'custom-order-status-pro-admin'  => 'Orderable_Custom_Order_Status_Pro_Admin',
			'custom-order-status-pro-icons'  => 'Orderable_Custom_Order_Status_Pro_Icons',
			'custom-order-status-pro-helper' => 'Orderable_Custom_Order_Status_Pro_Helper',
			'custom-order-status-pro-ajax'   => 'Orderable_Custom_Order_Status_Pro_Ajax',
		);

		Orderable_Helpers::load_classes( $classes, 'custom-order-status-pro', ORDERABLE_PRO_MODULES_PATH );
	}

	/**
	 * Enqueue admin assets.
	 */
	public static function admin_assets() {
		$screen                    = get_current_screen();
		$shop_order_page_screen_id = OrderUtil::custom_orders_table_usage_is_enabled() ? wc_get_page_screen_id( 'shop-order' ) : 'shop_order';

		if ( ! self::is_custom_status_edit_page() && ! in_array( $screen->id, array( 'edit-orderable_status', $shop_order_page_screen_id ), true ) ) {
			return;
		}

		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		// Styles.
		wp_enqueue_style( 'orderable-custom-order-css', ORDERABLE_PRO_URL . 'inc/modules/custom-order-status-pro/assets/admin/css/custom-order-status' . $suffix . '.css', array(), ORDERABLE_PRO_VERSION );
		wp_enqueue_style( 'orderable-custom-order-fontawesome', ORDERABLE_PRO_URL . 'inc/modules/shared/fonts/fontawesome/css/font-awesome.min.css', array(), ORDERABLE_PRO_VERSION );
		wp_enqueue_style( 'wp-color-picker' );
		wp_enqueue_style( 'orderable-pro-vselect', ORDERABLE_PRO_ASSETS_URL . 'vendor/vue-select.min.css', array(), ORDERABLE_PRO_VERSION );

		// Scripts.
		if ( ! self::is_custom_status_edit_page() ) {
			return;
		}

		wp_enqueue_script( 'orderable-pro-vuejs', ORDERABLE_PRO_ASSETS_URL . 'vendor/vue' . $suffix . '.js', array( 'jquery' ), ORDERABLE_PRO_VERSION, true );
		wp_enqueue_script( 'orderable-pro-vselect', ORDERABLE_PRO_ASSETS_URL . 'vendor/vue-select.min.js', array( 'jquery' ), ORDERABLE_PRO_VERSION, true );
		wp_enqueue_script( 'orderable-pro-custom-order-status-js', ORDERABLE_PRO_URL . 'inc/modules/custom-order-status-pro/assets/admin/js/main' . $suffix . '.js', array( 'jquery', 'wp-color-picker', 'orderable-pro-vuejs' ), ORDERABLE_PRO_VERSION, true );

		wp_localize_script(
			'orderable-pro-custom-order-status-js',
			'orderable_pro_custom_order_status',
			array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'orderable_pro_custom_order_status' ),
				'i18n'     => array(
					'are_your_sure'         => esc_html_x( 'Are you sure you want to delete this notification?', 'custom order status', 'orderable-pro' ),
					'email_title'           => esc_html_x( 'Your order is now {order_status}', 'custom order status', 'orderable-pro' ),
					'email_subject'         => esc_html_x( '[Order #{order_id}] Your order is now {order_status}', 'custom order status', 'orderable-pro' ),
					'move_to_trash'         => esc_html_x( 'All orders belonging to this order status will be changed to On Hold. Are you sure you want to delete this order status?', 'custom order status', 'orderable-pro' ),
					'slug_already_exists'   => esc_html_x( 'Slug is already in use, please choose a different one.', 'custom order status', 'orderable-pro' ),
					'enter_recipient_email' => esc_html_x( 'Please enter the recipient email', 'custom order status', 'orderable-pro' ),
					'enter_valid_email'     => esc_html_x( 'Please enter a valid email address', 'custom order status', 'orderable-pro' ),
					'customer'              => esc_html_x( 'Customer', 'custom order status', 'orderable-pro' ),
					'to'                    => esc_html_x( 'to', 'custom order status', 'orderable-pro' ),
					'admin'                 => esc_html_x( 'Admin', 'custom order status', 'orderable-pro' ),
					'email'                 => esc_html_x( 'Email', 'custom order status', 'orderable-pro' ),
					'whatsapp'              => esc_html_x( 'WhatsApp', 'custom order status', 'orderable-pro' ),
					'sms'                   => esc_html_x( 'SMS', 'custom order status', 'orderable-pro' ),
				),
			)
		);
	}

	/**
	 * Determine if it is product addon edit page.
	 *
	 * @param bool $is_settings_page Bool passed when hooking into `is_settings_page()`.
	 *
	 * @return bool
	 */
	public static function is_custom_status_edit_page( $is_settings_page = false ) {
		if ( ! is_admin() || ! function_exists( 'get_current_screen' ) ) {
			return $is_settings_page;
		}

		$screen = get_current_screen();

		if ( ! $screen || 'post' !== $screen->base || self::$cpt_key !== $screen->post_type ) {
			return $is_settings_page;
		}

		return true;
	}

	/**
	 * Register custom post status.
	 *
	 * @return void
	 */
	public static function register_custom_post_status() {
		$statuses = Orderable_Custom_Order_Status_Pro_Helper::get_custom_order_statuses();

		foreach ( $statuses as $status ) {
			if ( 'custom' !== $status->data['status_type'] ) {
				continue;
			}

			$arguments = array(
				'label'                     => $status->post_title,
				'public'                    => true,
				'show_in_admin_status_list' => true,
				'show_in_admin_all_list'    => true,
				'exclude_from_search'       => false,
				'label_count'               => array(
					'singular' => $status->post_title . ' <span class="count">(%s)</span>',
					'plural'   => $status->post_title . ' <span class="count">(%s)</span>',
					'context'  => 'custom order status',
					'domain'   => 'orderable-pro',
				),
			);

			register_post_status( 'wc-' . $status->data['slug'], $arguments );
		}
	}

	/**
	 * Modify order statuses
	 *
	 * @param array $statuses Order statuses.
	 *
	 * @return array
	 */
	public static function modify_order_status( $statuses ) {
		self::$core_order_statuses = $statuses;

		$statuses = self::register_custom_order_status( $statuses );
		$statuses = self::maybe_hide_core_order_status( $statuses );

		return $statuses;
	}

	/**
	 * Register custom order status.
	 *
	 * @param array $statuses Order statuses.
	 *
	 * @return array
	 */
	public static function register_custom_order_status( $statuses ) {
		$custom_statuses = Orderable_Custom_Order_Status_Pro_Helper::get_custom_order_statuses();

		foreach ( $custom_statuses as $status ) {
			$slug = 'wc-' . $status->data['slug'];

			if ( 'custom' !== $status->data['status_type'] ) {
				$statuses[ $slug ] = $status->post_title;
			}

			$statuses[ $slug ] = $status->post_title;
		}

		return $statuses;
	}

	/**
	 * Maybe hide core order status.
	 *
	 * @param array $statuses Statuses.
	 *
	 * @return array
	 */
	public static function maybe_hide_core_order_status( $statuses ) {
		global $current_screen;

		$shop_order_page_screen_id = OrderUtil::custom_orders_table_usage_is_enabled() ? 'woocommerce_page_wc-orders' : 'shop_order';

		if ( empty( $current_screen ) || $shop_order_page_screen_id !== $current_screen->id ) {
			return $statuses;
		}

		$custom_statuses = Orderable_Custom_Order_Status_Pro_Helper::get_custom_order_statuses( true );

		foreach ( $custom_statuses as $status ) {
			if ( 'custom' === $status->data['status_type'] ) {
				continue;
			}

			$slug = 'wc-' . $status->data['slug'];

			if ( '1' !== $status->data['enable'] ) {
				unset( $statuses[ $slug ] );
			}
		}

		return $statuses;
	}


	/**
	 * Get order title from the given slug.
	 *
	 * @param string $slug Order slug.
	 *
	 * @return string|false
	 */
	public static function get_order_title_from_slug( $slug ) {
		$statuses = Orderable_Custom_Order_Status_Pro_Helper::get_custom_order_statuses();

		foreach ( $statuses as $status ) {
			if ( $slug === $status->data['slug'] ) {
				return $status->post_title;
			}
		}

		$wc_statuses = wc_get_order_statuses();

		if ( isset( $wc_statuses[ 'wc-' . $slug ] ) ) {
			return $wc_statuses[ 'wc-' . $slug ];
		}

		return false;
	}

	/**
	 * Add order status in report.
	 *
	 * @param array $report_statuses Statuses allowed in reports.
	 *
	 * @return array
	 */
	public static function add_remove_order_status_in_report( $report_statuses ) {
		if ( ! is_array( $report_statuses ) ) {
			return $report_statuses;
		}

		// If refunded is the only array key.
		if ( 1 === count( $report_statuses ) && 'refunded' === $report_statuses[0] ) {
			return $report_statuses;
		}

		$custom_statuses = Orderable_Custom_Order_Status_Pro_Helper::get_custom_order_statuses();

		foreach ( $custom_statuses as $status ) {
			$slug = $status->data['slug'];
			if ( $status->data['include_in_reports'] ) {
				$report_statuses[] = $slug;
			} else {
				// Remove it from array if exists.
				$index = array_search( $slug, $report_statuses, true );
				if ( false !== $index ) {
					unset( $report_statuses[ $index ] );
				}
			}
		}

		$report_statuses = array_unique( $report_statuses );

		return $report_statuses;
	}

	/**
	 * Register custom email.
	 *
	 * @param array $emails Emails.
	 *
	 * @return array
	 */
	public static function register_email( $emails ) {
		require_once 'class-custom-order-status-pro-email.php';

		$emails['Orderable_Custom_Order_Status_Pro_Email'] = new Orderable_Custom_Order_Status_Pro_Email();

		return $emails;
	}

	/**
	 * On order status change.
	 *
	 * @param int    $order_id   Order ID.
	 * @param string $old_status Old status.
	 * @param string $new_status New status.
	 *
	 * @return void
	 */
	public static function send_notifications( $order_id, $old_status, $new_status ) {
		$order = wc_get_order( $order_id );

		if ( empty( $new_status ) || empty( $order ) ) {
			return;
		}

		$status = Orderable_Custom_Order_Status_Pro_Helper::get_custom_order_status_by_slug( $new_status );

		if ( empty( $status ) || empty( $status->data['notifications'] ) ) {
			return;
		}

		$location_id = $order->get_meta( '_orderable_location_id', true );

		/**
		 * When the main location is selected in the checkout page,
		 * we don't store the ID in the `_orderable_location_id` key.
		 * That way, when empty, we need to use the main location ID.
		 */
		if ( empty( $location_id ) ) {
			$location_id = (string) Orderable_Location::get_main_location_id();
		}

		foreach ( $status->data['notifications'] as $notification ) {
			$email_recipient  = '';
			$number_recipient = '';

			if ( isset( $notification['enabled'] ) && false === $notification['enabled'] ) {
				continue;
			}

			if ( ! empty( $notification['location'] ) && $location_id !== $notification['location'] ) {
				continue;
			}

			switch ( $notification['recipient'] ) {
				case 'admin':
					$email_recipient = get_option( 'admin_email' );
					break;
				case 'customer':
					$email_recipient = $order->get_billing_email();
					break;
				case 'custom':
					$email_recipient = $notification['recipient_custom_email'];
					break;
			}

			if ( empty( $notification['type'] ) || 'email' !== $notification['type'] ) {
				$notification['final_email_recipient'] = '';
			} else {
				$notification['final_email_recipient'] = $email_recipient;
			}

			/**
			 * Notification data before sending.
			 *
			 * @param array $notification Notification data.
			 * @param int   $order_id     Order ID.
			 */
			$notification = apply_filters( 'orderable_custom_order_status_pro_notification_before_send', $notification, $order );

			$wc_email   = WC_Emails::instance();
			$all_emails = $wc_email->get_emails();

			if ( ! empty( $all_emails['Orderable_Custom_Order_Status_Pro_Email'] ) ) {
				$email = $all_emails['Orderable_Custom_Order_Status_Pro_Email'];
				$email->trigger( $order_id, $notification );
			}

			// Type can be 'email', 'sms' or 'whatsapp'.
			do_action( 'orderable_cos_send_' . $notification['type'] . '_notification', $order_id, $notification );
		}
	}

	/**
	 * Modify from Address.
	 *
	 * @param string   $from_email From email.
	 * @param WC_Email $email      Email.
	 * @param string   $passed_address Passed address.
	 *
	 * @return string
	 */
	public static function modify_from_address( $from_email, $email, $passed_address ) {
		if ( empty( $email->orderable_cos_from_email ) ) {
			return $from_email;
		}

		return $email->orderable_cos_from_email;
	}

	/**
	 * Modify from name.
	 *
	 * @param string   $from_name From name.
	 * @param WC_Email $email     Email.
	 * @param string   $passed_name Passed name.
	 *
	 * @return string
	 */
	public static function modify_from_name( $from_name, $email, $passed_name ) {
		if ( empty( $email->orderable_cos_from_name ) ) {
			return $from_name;
		}

		return $email->orderable_cos_from_name;
	}

	/**
	 * Maybe ressign order status when an custom order status is trashed.
	 *
	 * @param int $post_id Post ID of the custom order status post type.
	 *
	 * @return void
	 */
	public static function maybe_reassign_custom_order_status( $post_id ) {
		if ( empty( $post_id ) ) {
			return;
		}

		if ( get_post_type( $post_id ) !== self::$cpt_key ) {
			return;
		}

		// Get data for this custom order status.
		$status_data = Orderable_Custom_Order_Status_Pro_Admin::get_order_settings( $post_id );
		if ( empty( $status_data ) || empty( $status_data['slug'] ) ) {
			return;
		}

		$core_statuses = Orderable_Custom_Order_Status_Pro_Helper::get_core_order_statuses();

		// If it is one of the core statuses then return.
		if ( $core_statuses[ $status_data['slug'] ] ) {
			return;
		}

		$status_slug = 'wc-' . $status_data['slug'];
		$args        = array(
			'status' => array( $status_slug ),
		);
		$orders      = wc_get_orders( $args );

		if ( empty( $orders ) ) {
			return;
		}

		foreach ( $orders as $order ) {
			/**
			 * Assign the orders of this custom order status to a core order status.
			 */
			$order->update_status( apply_filters( 'orderable_custom_order_status_ondelete_fallback_status', 'wc-on-hold' ) );
		}
	}

	/**
	 * Modify Order Status Post types.
	 *
	 * @param array $post_types Post types.
	 *
	 * @return array
	 */
	public static function modify_order_status_post_types( $post_types ) {
		$statuses = Orderable_Custom_Order_Status_Pro_Helper::get_custom_order_statuses();

		if ( empty( $statuses ) ) {
			return $post_types;
		}

		foreach ( $post_types as $post_key => $post_type ) {
			$post_key_trimmed = str_replace( 'wc-', '', $post_key );

			if ( ! empty( $statuses[ $post_key_trimmed ] ) ) {
				$post_types[ $post_key ]['label_count'] = array(
					'singular' => $statuses[ $post_key_trimmed ]->post_title . ' <span class="count">(%s)</span>',
					'plural'   => $statuses[ $post_key_trimmed ]->post_title . ' <span class="count">(%s)</span>',
					'context'  => '',
					'domain'   => 'orderable-pro',
				);
			}
		}

		return $post_types;
	}

	/**
	 * Prevent sending the default WooCommerce email for core status
	 * when there is a custom Orderable status assigned to it.
	 *
	 * @return void
	 */
	public static function prevent_sending_default_woocommerce_email() {
		$core_statuses = Orderable_Custom_Order_Status_Pro_Helper::get_core_order_statuses();

		foreach ( array_keys( $core_statuses ) as $core_status ) {
			add_action(
				'woocommerce_order_status_' . $core_status,
				array( __CLASS__, 'remove_triggers_to_send_default_woocommerce_notification_to_the_customer' ),
				5,
				2
			);
		}
	}

	/**
	 * Remove the triggers to send the defautl WooCommerce notification.
	 *
	 * This function checks if there is a custom Order Status assigned
	 * to a WooCommerce core status and if it has a email notification
	 * enabled.
	 *
	 * If so, we prevent the WooCommerce email notification to be
	 * sent avoiding duplicated emails to the customer about the same
	 * order status.
	 *
	 * @param int      $order_id The Order ID.
	 * @param WC_Order $order    The Order object.
	 * @return void
	 */
	public static function remove_triggers_to_send_default_woocommerce_notification_to_the_customer( $order_id, $order ) {
		$status = $order->get_status();

		if ( ! in_array( $status, array( 'processing', 'on-hold', 'completed' ), true ) ) {
			return;
		}

		if ( ! self::has_email_notification_to_the_customer_enabled( $status ) ) {
			return;
		}

		switch ( $status ) {
			case 'processing':
				self::remove_processing_notification_to_the_customer();
				break;
			case 'on-hold':
				self::remove_on_hold_notification_to_the_customer();
				break;
			case 'completed':
				self::remove_completed_notification_to_the_customer();
				break;
			default:
				break;
		}
	}

	/**
	 * Check if there is a notification to the customer enabled in the
	 * custom Order Status posts.
	 *
	 * @param string $order_status The order status to check.
	 * @return boolean
	 */
	protected static function has_email_notification_to_the_customer_enabled( $order_status ) {
		$query = new WP_Query(
			array(
				'fields'                 => 'ids',
				'posts_per_page'         => 1,
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
				'post_type'              => 'orderable_status',
				'post_status'            => 'publish',
				'meta_query'             => array( // phpcs:ignore WordPress.DB.SlowDBQuery
					array(
						'key'   => 'orderable_cos_status_type',
						'value' => $order_status,
					),
					array(
						'key' => 'orderable_cos_notifications',
					),
				),
			)
		);

		if ( empty( $query->posts[0] ) ) {
			return false;
		}

		$notifications = get_post_meta( $query->posts[0], 'orderable_cos_notifications', true );

		$has_email_notification_enabled = false;
		foreach ( $notifications as $notification ) {
			if ( empty( $notification['enabled'] ) ) {
				continue;
			}

			if ( empty( $notification['type'] ) || 'email' !== $notification['type'] ) {
				continue;
			}

			if ( empty( $notification['recipient'] ) || 'customer' !== $notification['recipient'] ) {
				continue;
			}

			$has_email_notification_enabled = true;
			break;
		}

		return $has_email_notification_enabled;
	}

	/**
	 * Remove the WooCommerce notification emails to the customer when
	 * the status changes to `processing`.
	 *
	 * Look at WC_Email_Customer_Processing_Order's construct method to
	 * check the transitions that trigger an email notification.
	 *
	 * @return void
	 */
	protected static function remove_processing_notification_to_the_customer() {
		$wc_email_customer_processing_order = WC()->mailer()->emails['WC_Email_Customer_Processing_Order'];

		remove_action(
			'woocommerce_order_status_cancelled_to_processing_notification',
			array( $wc_email_customer_processing_order, 'trigger' )
		);

		remove_action(
			'woocommerce_order_status_failed_to_processing_notification',
			array( $wc_email_customer_processing_order, 'trigger' )
		);

		remove_action(
			'woocommerce_order_status_on-hold_to_processing_notification',
			array( $wc_email_customer_processing_order, 'trigger' )
		);

		remove_action(
			'woocommerce_order_status_pending_to_processing_notification',
			array( $wc_email_customer_processing_order, 'trigger' )
		);
	}

	/**
	 * Remove the WooCommerce notification emails to the customer when
	 * the status changes to `on-hold`.
	 *
	 * Look at WC_Email_Customer_On_Hold_Order's construct method to
	 * check the transitions that trigger an email notification.
	 *
	 * @return void
	 */
	protected static function remove_on_hold_notification_to_the_customer() {
		$wc_email_customer_on_hold_order = WC()->mailer()->emails['WC_Email_Customer_On_Hold_Order'];

		remove_action(
			'woocommerce_order_status_pending_to_on-hold_notification',
			array( $wc_email_customer_on_hold_order, 'trigger' )
		);

		remove_action(
			'woocommerce_order_status_failed_to_on-hold_notification',
			array( $wc_email_customer_on_hold_order, 'trigger' )
		);

		remove_action(
			'woocommerce_order_status_cancelled_to_on-hold_notification',
			array( $wc_email_customer_on_hold_order, 'trigger' )
		);
	}

	/**
	 * Remove the WooCommerce notification emails to the customer when
	 * the status changes to `on-hold`.
	 *
	 * Look at WC_Email_Customer_Completed_Order's construct method to
	 * check the transitions that trigger an email notification.
	 *
	 * @return void
	 */
	protected static function remove_completed_notification_to_the_customer() {
		remove_action(
			'woocommerce_order_status_completed_notification',
			array( WC()->mailer()->emails['WC_Email_Customer_Completed_Order'], 'trigger' )
		);
	}
}
