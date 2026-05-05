<?php
/**
 * Module: Custom Order Status Pro.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

use Automattic\WooCommerce\Utilities\OrderUtil;

/**
 * Timed Products Pro Settings class.
 */
class Orderable_Custom_Order_Status_Pro_Admin {
	/**
	 * Init.
	 */
	public static function run() {
		add_action( 'init', array( __CLASS__, 'register_cpt' ), 100 );
		add_action( 'load-post.php', array( __CLASS__, 'init_metaboxes' ) );
		add_action( 'load-post-new.php', array( __CLASS__, 'init_metaboxes' ) );
		add_action( 'save_post', array( __CLASS__, 'save_metabox' ) );
		add_filter( 'manage_' . Orderable_Custom_Order_Status_Pro::$cpt_key . '_posts_columns', array( __CLASS__, 'add_custom_post_columns' ), 20 );
		add_filter( 'manage_' . Orderable_Custom_Order_Status_Pro::$cpt_key . '_posts_custom_column', array( __CLASS__, 'display_custom_column_content' ), 10, 2 );
		add_filter( 'woocommerce_admin_order_actions', array( __CLASS__, 'add_next_action_buttons' ), 10, 2 );
		add_filter( 'bulk_actions-edit-shop_order', array( __CLASS__, 'update_bulk_actions' ), 20 );
		add_filter( 'admin_footer', array( __CLASS__, 'add_css' ) );
	}


	/**
	 * Register Custom Post Type.
	 */
	public static function register_cpt() {
		$labels = array(
			'plural'   => __( 'Order Statuses', 'orderable-pro' ),
			'singular' => __( 'Order Status', 'orderable-pro' ),
		);

		$args = array(
			'labels'              => Orderable_Helpers::prepare_post_type_labels( $labels ),
			'supports'            => array( 'title' ),
			'hierarchical'        => false,
			'public'              => false,
			'show_ui'             => true,
			'show_in_menu'        => 'orderable',
			'menu_position'       => 10,
			'show_in_admin_bar'   => true,
			'show_in_nav_menus'   => false,
			'can_export'          => true,
			'has_archive'         => false,
			'exclude_from_search' => true,
			'publicly_queryable'  => false,
			'capability_type'     => 'product',
		);

		register_post_type( Orderable_Custom_Order_Status_Pro::$cpt_key, $args );
	}

	/**
	 * Initialize meta boxes.
	 */
	public static function init_metaboxes() {
		add_meta_box(
			'orderable-custom-status-metabox',
			__( 'Custom Status Settings', 'orderable-pro' ),
			array( __CLASS__, 'output_settings_metabox' ),
			Orderable_Custom_Order_Status_Pro::$cpt_key,
			'advanced',
			'default'
		);

		add_meta_box(
			'orderable-custom-status-notification-metabox',
			__( 'Notifications', 'orderable-pro' ),
			array( __CLASS__, 'output_notifications_metabox' ),
			Orderable_Custom_Order_Status_Pro::$cpt_key,
			'advanced',
			'default'
		);
	}

	/**
	 * Output settings metabox.
	 *
	 * @param WP_Post $post Post object.
	 */
	public static function output_settings_metabox( $post ) {
		$all_statuses    = Orderable_Custom_Order_Status_Pro_Helper::get_all_order_status();
		$core_statuses   = Orderable_Custom_Order_Status_Pro_Helper::get_core_order_statuses();
		$settings        = self::get_order_settings( $post->ID );
		$readonly_fields = ! empty( $settings['slug'] ) ? 'readonly' : '';

		include ORDERABLE_PRO_PATH . 'inc/modules/custom-order-status-pro/templates/admin/settings-metabox.php';
	}

	/**
	 * Output notification metabox.
	 *
	 * @param WP_Post $post Post object.
	 *
	 * @return void
	 */
	public static function output_notifications_metabox( $post ) {
		$settings       = self::get_order_settings( $post->ID );
		$twilio_setup   = ! empty( Orderable_Settings::get_setting( 'notifications_twillio_account_sid' ) );
		$whatsapp_setup = ! empty( Orderable_Settings::get_setting( 'notifications_whatsapp_app_id' ) );
		$locations      = Orderable_Multi_Location_Pro_Helper::get_all_locations();
		$location_json  = array();

		foreach ( $locations as $location ) {
			if ( ! is_object( $location ) || empty( $location ) ) {
				continue;
			}

			$location_json[] = array(
				'label'            => $location->location_data['title'],
				'id'               => $location->location_data['location_id'],
				'is_main_location' => $location->location_data['is_main_location'],
			);
		}

		include ORDERABLE_PRO_PATH . 'inc/modules/custom-order-status-pro/templates/admin/notifications-metabox.php';
	}

	/**
	 * Save metabox data.
	 *
	 * @param int $post_id Post ID.
	 */
	public static function save_metabox( $post_id ) {
		// Bail out if post type is not custom status.
		if ( get_post_type( $post_id ) !== Orderable_Custom_Order_Status_Pro::$cpt_key ) {
			return;
		}

		$enable             = filter_input( INPUT_POST, 'orderable_cos_enable' );
		$status_type        = filter_input( INPUT_POST, 'orderable_cos_status_type' );
		$slug               = filter_input( INPUT_POST, 'orderable_cos_slug' );
		$color              = filter_input( INPUT_POST, 'orderable_cos_color' );
		$icon               = filter_input( INPUT_POST, 'orderable_cos_icon' );
		$icon_family        = filter_input( INPUT_POST, 'orderable_cos_icon_family' );
		$nextstep           = filter_input( INPUT_POST, 'orderable_cos_nextstep', FILTER_DEFAULT, FILTER_REQUIRE_ARRAY );
		$include_in_reports = (bool) filter_input( INPUT_POST, 'orderable_cos_include_in_reports' );

		/**
		 * Slug is saved in the column `post_status` in the wp_posts table
		 * and the length of this column is 20. Since WooCommerce adds
		 * `wc-` before saving, we have to limit the max length to 17
		 * characters.
		 */
		$slug = is_string( $slug ) ? substr( $slug, 0, 17 ) : false;

		if ( empty( $slug ) ) {
			return;
		}

		update_post_meta( $post_id, 'orderable_cos_enable', $enable );
		update_post_meta( $post_id, 'orderable_cos_slug', $slug );
		update_post_meta( $post_id, 'orderable_cos_color', $color );
		update_post_meta( $post_id, 'orderable_cos_icon', $icon );
		update_post_meta( $post_id, 'orderable_cos_icon_family', $icon_family );
		update_post_meta( $post_id, 'orderable_cos_nextstep', $nextstep );
		update_post_meta( $post_id, 'orderable_cos_include_in_reports', $include_in_reports );

		// Need to add additional check for status because it is disabled after first update.
		if ( $status_type ) {
			update_post_meta( $post_id, 'orderable_cos_status_type', $status_type );
		}

		// Update notifications.
		$notification_json = filter_input( INPUT_POST, 'orderable-cos-notifications-json' );
		$notifications     = json_decode( $notification_json, true );
		if ( self::is_json( $notification_json ) ) {
			update_post_meta( $post_id, 'orderable_cos_notifications', $notifications );
		}
	}

	/**
	 * Get Order settings.
	 *
	 * @param int $post_id Post ID.
	 *
	 * @return array
	 */
	public static function get_order_settings( $post_id ) {
		$data = array(
			'post_id'            => $post_id,
			'title'              => get_the_title( $post_id ),
			'enable'             => get_post_meta( $post_id, 'orderable_cos_enable', true ),
			'status_type'        => get_post_meta( $post_id, 'orderable_cos_status_type', true ),
			'slug'               => get_post_meta( $post_id, 'orderable_cos_slug', true ),
			'color'              => get_post_meta( $post_id, 'orderable_cos_color', true ),
			'icon'               => get_post_meta( $post_id, 'orderable_cos_icon', true ),
			'icon_family'        => get_post_meta( $post_id, 'orderable_cos_icon_family', true ),
			'nextstep'           => get_post_meta( $post_id, 'orderable_cos_nextstep', true ),
			'include_in_reports' => get_post_meta( $post_id, 'orderable_cos_include_in_reports', true ),
			'notifications'      => get_post_meta( $post_id, 'orderable_cos_notifications', true ),
		);

		$data['icon']        = empty( $data['icon'] ) ? 'fa-cog' : $data['icon'];
		$data['icon_family'] = empty( $data['icon_family'] ) ? 'fontawesome' : $data['icon_family'];
		$data['color']       = empty( $data['color'] ) ? '#2271b1' : $data['color'];

		/**
		 * Settings for the given status.
		 *
		 * @param array $data    Settings.
		 * @param int   $post_id Post ID.
		 */
		return apply_filters( 'orderable_cos_get_order_settings', $data, $post_id );
	}

	/**
	 * Get all order status.
	 *
	 * @return array
	 */
	public static function get_all_order_status() {
		$statuses       = wc_get_order_statuses();
		$clean_statuses = array();

		foreach ( $statuses as $status_key => $status ) {
			$status_key                    = str_replace( 'wc-', '', $status_key );
			$clean_statuses[ $status_key ] = $status;
		}

		return $clean_statuses;
	}

	/**
	 * Add custom columns.
	 *
	 * @param array $columns Columns.
	 */
	public static function add_custom_post_columns( $columns ) {
		$new_columns = array(
			'icon'          => '',
			'enabled'       => __( 'Enabled', 'orderable-pro' ),
			'title'         => __( 'Name', 'orderable-pro' ),
			'slug'          => __( 'Slug', 'orderable-pro' ),
			'notifications' => __( 'Notifications', 'orderable-pro' ),
			'status_type'   => __( 'Type', 'orderable-pro' ),
			'next_steps'    => __( 'Next Steps', 'orderable-pro' ),
		);

		return $new_columns;
	}

	/**
	 * Display custol column content.
	 *
	 * @param array $column Columns.
	 * @param int   $post_id Post ID.
	 *
	 * @return void
	 */
	public static function display_custom_column_content( $column, $post_id ) {
		$order_type_settings = self::get_order_settings( $post_id );
		if ( 'icon' === $column ) {
			Orderable_Custom_Order_Status_Pro_Icons::display_icon( $order_type_settings );
		} elseif ( 'enabled' === $column ) {
			echo '1' === $order_type_settings['enable'] ? '<span class="dashicons dashicons-yes"></span>' : '<span class="dashicons dashicons-no-alt"></span>';
		} elseif ( 'status_type' === $column ) {
			echo 'custom' === $order_type_settings['status_type'] ? esc_html__( 'Custom', 'orderable-pro' ) : esc_html__( 'Core', 'orderable-pro' );
		} elseif ( 'slug' === $column ) {
			echo esc_html( $order_type_settings['slug'] );
		} elseif ( 'notifications' === $column ) {
			self::output_notifications_column_content( $post_id );
		} elseif ( 'next_steps' === $column ) {
			$next_steps = is_array( $order_type_settings['nextstep'] ) ? $order_type_settings['nextstep'] : array();
			$next_steps = array_map( array( 'Orderable_Custom_Order_Status_Pro', 'get_order_title_from_slug' ), $next_steps );
			echo esc_html( implode( ', ', (array) $next_steps ) );
		}
	}

	/**
	 * Add action button in order table.
	 *
	 * @param array    $actions Actions.
	 * @param WC_Order $order   Order object.
	 *
	 * @return array
	 */
	public static function add_next_action_buttons( $actions, $order ) {
		$custom_order_status = Orderable_Custom_Order_Status_Pro_Helper::get_custom_order_statuses();

		foreach ( $custom_order_status as $status ) {
			$slug         = $status->data['slug'];
			$next_steps   = $status->data['nextstep'];
			$order_status = $order->get_status();

			if ( isset( $actions[ $slug ] ) ) {
				$actions[ $slug ]['name'] = $status->post_title;
			}

			if ( empty( $next_steps ) || $slug !== $order_status ) {
				continue;
			}

			foreach ( $next_steps as $next_step ) {
				if ( $next_step === $slug ) {
					continue;
				}

				$action = 'completed' === $next_step ? 'complete' : $next_step;

				$actions[ $action ] = array(
					'url'    => wp_nonce_url( admin_url( 'admin-ajax.php?action=woocommerce_mark_order_status&order_id=' . $order->get_id() . '&status=' . $next_step ), 'woocommerce-mark-order-status' ),
					'name'   => Orderable_Custom_Order_Status_Pro::get_order_title_from_slug( $next_step ),
					'action' => $action,
				);
			}
		}

		return $actions;
	}

	/**
	 * Update bulk actions.
	 *
	 * @param array $actions Actions.
	 *
	 * @return array
	 */
	public static function update_bulk_actions( $actions ) {
		$statuses = Orderable_Custom_Order_Status_Pro_Helper::get_custom_order_statuses();

		foreach ( $actions as $action_slug => $action_title ) {

			if ( false !== strpos( $action_slug, 'mark_' ) ) {
				$status_slug = str_replace( 'mark_', '', $action_slug );

				if ( isset( $statuses[ $status_slug ] ) ) {
					$title = $statuses[ $status_slug ]->data['title'];
					// Translators: %s is the order status title.
					$actions[ $action_slug ] = sprintf( esc_html__( 'Change status to %s', 'orderable-pro' ), $title );
				}
			}
		}

		return $actions;
	}

	/**
	 * Add dynamic CSS.
	 *
	 * @return void
	 */
	public static function add_css() {
		$current_screen            = get_current_screen();
		$shop_order_page_screen_id = OrderUtil::custom_orders_table_usage_is_enabled() ? wc_get_page_screen_id( 'shop-order' ) : 'edit-shop_order';

		if ( $shop_order_page_screen_id !== $current_screen->id ) {
			return;
		}

		$custom_statuses = Orderable_Custom_Order_Status_Pro_Helper::get_custom_order_statuses();
		$core_statuses   = Orderable_Custom_Order_Status_Pro_Icons::get_core_status_icons()
		?>
		<style>
			<?php
			foreach ( $core_statuses as $status_key => $status ) {
				?>
				.widefat .column-wc_actions .button.<?php echo esc_html( $status_key ); ?>:after {
					font-family: "<?php echo esc_html( $status['family'] ); ?>";
					content: "<?php echo esc_html( $status['char'] ); ?>";
				}
				<?php
			}
			foreach ( $custom_statuses as $status ) {
				$charcode = Orderable_Custom_Order_Status_Pro_Icons::get_charcode( $status->data['icon'] );
				?>
				.widefat .column-wc_actions  .button.wc-action-button-<?php echo esc_html( $status->data['slug'] ); ?>:after {
					font-family: <?php echo esc_html( $status->data['icon_family'] ); ?> !important;
					content: "<?php echo esc_html( $charcode ); ?>" !important;
					color: <?php echo esc_html( $status->data['color'] ); ?>;
				}

				.order-status.status-<?php echo esc_html( $status->data['slug'] ); ?> {
					background-color: <?php echo esc_html( $status->data['color'] ); ?>;
					color: <?php echo wc_hex_is_light( $status->data['color'] ) ? '#000' : '#fff'; ?>;
				}
				<?php
			}
			?>
		</style>
		<?php
	}

	/**
	 * Check if the given string is JSON.
	 *
	 * @param string $string String to check.
	 *
	 * @return bool
	 */
	public static function is_json( $string ) {
		json_decode( $string );
		return json_last_error() === JSON_ERROR_NONE;
	}

	/**
	 * Output notifications column.
	 *
	 * @param [type] $post_id Post ID.
	 *
	 * @return void
	 */
	public static function output_notifications_column_content( $post_id ) {
		$notifications = get_post_meta( $post_id, 'orderable_cos_notifications', true );

		if ( empty( $notifications ) || ! is_array( $notifications ) ) {
			return;
		}

		$icons = array(
			'email'    => 'dashicons dashicons-email-alt',
			'sms'      => 'fa fa-commenting-o',
			'whatsapp' => 'fa fa-whatsapp',
		);

		$type = array(
			'whatsapp' => 'WhatsApp',
			'sms'      => 'SMS',
			'email'    => 'Email',
		);

		foreach ( $notifications as $notification ) {
			$recipient      = 'custom' === $notification['recipient'] ? ( 'email' === $notification['type'] ? $notification['recipient_custom_email'] : $notification['recipient_custom_number'] ) : $notification['recipient'];
			$disabled_class = isset( $notification['enabled'] ) && ! $notification['enabled'] ? 'orderable-cos-table-icon-notification--disabled' : '';

			// Translators: %1$s is the notification type, %2$s is the recipient.
			$title = sprintf( esc_html__( '%1$s to %2$s', 'orderable-pro' ), $type[ $notification['type'] ], $recipient );
			printf( '<i class="orderable-cos-table-icon-notification %s %s" title="%s"></i>', esc_attr( $disabled_class ), esc_attr( $icons[ $notification['type'] ] ), esc_attr( $title ) );
		}
	}
}
