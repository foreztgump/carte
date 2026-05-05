<?php
/**
 * Module: Multi Location Pro (Admin).
 *
 * @since   1.18.0
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

use Automattic\WooCommerce\Utilities\OrderUtil;

/**
 * Orderable_Multi_Location_Pro_Admin class.
 */
class Orderable_Multi_Location_Pro_Admin {
	/**
	 * Init.
	 */
	public static function run() {
		if ( ! is_admin() ) {
			return;
		}

		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'load_styles' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'load_scripts' ) );
		add_action( 'add_meta_boxes_' . Orderable_Multi_Location_Pro::$post_type_key, array( __CLASS__, 'add_meta_boxes' ) );
		add_action( 'save_post_' . Orderable_Multi_Location_Pro::$post_type_key, array( 'Orderable_Location_Admin', 'save_data' ) );
		add_action( 'orderable_location_save_data', array( __CLASS__, 'save_data' ), 100 );
		add_action( 'manage_orderable_locations_posts_custom_column', array( __CLASS__, 'add_content_to_custom_columns' ), 10, 2 );
		add_action( 'restrict_manage_posts', array( __CLASS__, 'locations_filter' ), 5, 2 );
		add_action( 'woocommerce_order_list_table_restrict_manage_orders', array( __CLASS__, 'locations_filter' ), 5, 2 );
		add_action( 'pre_get_posts', array( __CLASS__, 'update_query_to_filter_orders_by_location' ), 50 );
		add_action( 'edit_form_top', array( __CLASS__, 'nonce_field' ) );
		add_action( 'admin_init', array( __CLASS__, 'check_main_location_post' ) );
		add_action( 'trashed_post', array( __CLASS__, 'maybe_delete_is_main_location_transient' ) );
		add_action( 'after_delete_post', array( __CLASS__, 'remove_data_from_orderable_custom_tables' ), 10, 2 );
		add_action( 'manage_shop_order_posts_custom_column', array( __CLASS__, 'add_location_column_content' ), 10, 2 );
		add_action( 'wp_ajax_update_location_status', array( __CLASS__, 'update_location_status' ) );
		add_action( 'wp_ajax_update_status_for_all_locations', array( __CLASS__, 'update_status_for_all_locations' ) );
		// HPOS Compatibility.
		add_action( 'admin_init', array( __CLASS__, 'add_location_custom_column' ) );

		add_filter( 'enter_title_here', array( __CLASS__, 'update_title_placeholder' ), 10, 2 );
		add_filter( 'orderable_is_settings_page', array( __CLASS__, 'is_location_edit_page' ) );
		add_filter( 'manage_orderable_locations_posts_columns', array( __CLASS__, 'add_custom_columns' ) );
		add_filter( 'orderable_location_allowed_pages_to_load_assets', array( __CLASS__, 'append_location_pro_page_id' ) );
		add_filter( 'post_row_actions', array( __CLASS__, 'hide_trash_action_link_for_main_location' ), 10, 2 );
		add_filter( 'manage_edit-shop_order_columns', array( __CLASS__, 'add_location_column' ), 20 );
		add_filter( 'orderable_location_lead_time_period_field_options', array( __CLASS__, 'enable_minutes_and_hours_options_in_lead_time_period_field' ) );
		add_filter( 'woocommerce_shop_order_list_table_prepare_items_query_args', array( __CLASS__, 'update_query_args_to_filter_orders_by_location' ), 50 );
		add_action( 'admin_footer', [ __CLASS__, 'add_pause_and_resume_button_to_liver_order_view' ], 101 );

		remove_action( 'admin_menu', array( 'Orderable_Location_Admin', 'add_settings_page' ) );
	}

	/**
	 * Save post title to location.
	 *
	 * @return void
	 */
	public static function save_data( $data ) {
		global $post, $wpdb;

		if ( ! is_a( $post, 'WP_Post' ) ) {
			return;
		}

		$post_title = filter_input( INPUT_POST, 'post_title' );

		// Save the $post->post_title to the title field of the location.
		if ( ! empty( $post_title ) ) {
			// Check if the location exists in the database
			$location_exists = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT COUNT(*) FROM {$wpdb->prefix}orderable_locations WHERE post_id = %d",
					$post->ID
				)
			);

			// Update the location title in the database
			if ( $location_exists ) {
				$wpdb->update(
					"{$wpdb->prefix}orderable_locations",
					array( 'title' => $post_title ),
					array( 'post_id' => $post->ID ),
					array( '%s' ),
					array( '%d' )
				);
			}
		}
	}

	/**
	 * Check if is the location edit page.
	 *
	 * @param boolean $bool The default value.
	 * @return boolean
	 */
	public static function is_location_edit_page( $bool = false ) {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return $bool;
		}

		$screen = get_current_screen();

		if ( is_null( $screen ) || 'orderable_locations' !== $screen->id ) {
			return $bool;
		}

		return true;
	}

	/**
	 * Append Location Pro Admin page ID.
	 *
	 * @param array $allowed_pages The allowed pages to load Location assets.
	 * @return array
	 */
	public static function append_location_pro_page_id( $allowed_pages ) {
		if ( ! is_array( $allowed_pages ) ) {
			return $allowed_pages;
		}

		$allowed_pages[] = 'orderable_locations';
		$allowed_pages[] = 'edit-shop_order';
		$allowed_pages[] = 'woocommerce_page_wc-orders';

		return $allowed_pages;
	}

	/**
	 * Enqueue admin styles.
	 *
	 * @return void
	 */
	public static function load_styles() {
		Orderable_Location_Admin::load_styles();
	}

	/**
	 * Enqueue admin scripts.
	 *
	 * @return void
	 */
	public static function load_scripts() {
		Orderable_Location_Admin::load_scripts();
	}

	/**
	 * Update the placeholder of the Title field.
	 *
	 * @param string  $text Placeholder text. Default 'Add title'.
	 * @param WP_Post $post Post object.
	 * @return string
	 */
	public static function update_title_placeholder( $text, $post ) {
		if ( Orderable_Multi_Location_Pro::$post_type_key !== $post->post_type ) {
			return $text;
		}

		return __( 'Add location name', 'orderable-pro' );
	}

	/**
	 * Add meta boxes.
	 *
	 * @return void
	 */
	public static function add_meta_boxes() {
		Orderable_Location_Store_Address_Meta_Box::add();
		Orderable_Location_Open_Hours_Meta_Box::add();
		Orderable_Location_Store_Services_Meta_Box::add();
		Orderable_Location_Order_Options_Meta_Box::add();
		Orderable_Location_Holidays_Meta_Box::add();
	}

	/**
	 * Add custom columns.
	 *
	 * @param string[] $columns An associative array of column headings.
	 * @return string[]
	 */
	public static function add_custom_columns( $columns ) {
		$columns['title']                    = __( 'Name', 'orderable-pro' );
		$columns['orderable_address']        = __( 'Address', 'orderable-pro' );
		$columns['orderable_store_status']   = __( 'Status', 'orderable-pro' );
		$columns['orderable_store_services'] = __( 'Services', 'orderable-pro' );
		$columns['orderable_actions']        = '';

		unset( $columns['date'] );

		return $columns;
	}

	/**
	 * Add the content of the custom columns.
	 *
	 * @param string $column  The name of the column to display.
	 * @param int    $post_id The current post ID.
	 * @return void
	 */
	public static function add_content_to_custom_columns( $column, $post_id ) {
		$location = new Orderable_Location_Single_Pro( $post_id );

		switch ( $column ) {
			case 'orderable_address':
				echo esc_html( $location->get_formatted_address() );
				break;

			case 'orderable_store_status':
				echo esc_html( $location->get_status() );
				break;

			case 'orderable_store_services':
				echo esc_html( $location->get_formatted_services() );
				break;

			case 'orderable_actions':
				self::action_buttons( $post_id );
				break;

			default:
				break;
		}
	}

	/**
	 * Output the locations filters.
	 *
	 * @param string $post_type The post type slug.
	 * @return void
	 */
	public static function locations_filter( $post_type ) {
		if ( ! Orderable_Orders::is_orders_page() ) {
			return;
		}

		/**
		 * Filter the query args to retrieve the locations to be used
		 * in the locations filter.
		 *
		 * @since 1.8.0
		 * @hook orderable_multi_location_locations_filter_query_args
		 * @param  array $args The query args.
		 * @return array New value
		 */
		$args = apply_filters(
			'orderable_multi_location_locations_filter_query_args',
			array(
				'post_type'              => Orderable_Multi_Location_Pro::$post_type_key,
				'post_status'            => array( 'publish', 'draft' ),
				'posts_per_page'         => 100,
				'fields'                 => 'ids',
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);

		$locations_query = new WP_Query( $args );

		if ( ! $locations_query->have_posts() ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification
		$location_selected = empty( $_GET['orderable_location'] ) ? false : sanitize_text_field( wp_unslash( $_GET['orderable_location'] ) );

		?>
		<select name="orderable_location">
			<option value="">
				<?php echo esc_html__( 'All locations', 'orderable-pro' ); ?>
			</option>
			<?php while ( $locations_query->have_posts() ) : ?>
				<?php
					$locations_query->the_post();

					$value = Orderable_Location::get_location_id( get_the_ID() );
				?>
				<option
					value="<?php echo esc_attr( $value ); ?>"
					<?php selected( $location_selected, $value ); ?>
				>
					<?php the_title(); ?>
				</option>
			<?php endwhile; ?>
		</select>
		<?php
	}

	/**
	 * Update WP_Query object to filter orders by location.
	 *
	 * @param WP_Query $query The WP_Query instance (passed by reference).
	 * @return void
	 */
	public static function update_query_to_filter_orders_by_location( $query ) {
		if ( ! Orderable_Orders::is_orders_page() || 'shop_order' !== $query->get( 'post_type' ) ) {
			return;
		}

		if ( empty( $_GET['orderable_location'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}

		$location_id = sanitize_text_field( wp_unslash( $_GET['orderable_location'] ) ); // phpcs:ignore WordPress.Security.NonceVerification

		if ( empty( $location_id ) ) {
			return;
		}

		$meta_query_args = array(
			'key' => '_orderable_location_id',
		);

		if ( Orderable_Location::is_main_location( $location_id ) ) {
			$meta_query_args['compare'] = 'NOT EXISTS';
		} else {
			$meta_query_args['value'] = $location_id;
		}

		$meta_query = (array) $query->get( 'meta_query' );

		$meta_query[] = $meta_query_args;

		$query->set( 'meta_query', $meta_query );
	}

	/**
	 * Update query args to filter orders by location.
	 *
	 * @param array $query_args The query args used to retrieve the orders.
	 * @return array
	 */
	public static function update_query_args_to_filter_orders_by_location( $query_args ) {
		if ( ! Orderable_Orders::is_orders_page() ) {
			return $query_args;
		}

		if ( empty( $_GET['orderable_location'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return $query_args;
		}

		$location_id = sanitize_text_field( wp_unslash( $_GET['orderable_location'] ) ); // phpcs:ignore WordPress.Security.NonceVerification

		if ( empty( $location_id ) ) {
			return;
		}

		$meta_query_args = array(
			'key' => '_orderable_location_id',
		);

		if ( Orderable_Location::is_main_location( $location_id ) ) {
			$meta_query_args['compare'] = 'NOT EXISTS';
		} else {
			$meta_query_args['value'] = $location_id;
		}

		$query_args['meta_query'][] = $meta_query_args;

		return $query_args;
	}

	/**
	 * Output action buttons.
	 *
	 * @param int $post_id The post ID associated with a location.
	 * @return void
	 */
	protected static function action_buttons( $post_id ) {
		if ( empty( $post_id ) ) {
			return;
		}

		$location = new Orderable_Location_Single_Pro( $post_id );

		if ( empty( $location->location_data ) ) {
			return;
		}

		self::live_orders_button( $location->get_location_id() );
		self::resume_pause_orders_buttons( $location );
	}

	/**
	 * Check if the location is paused to receive orders.
	 *
	 * @param int|string $location_id The post ID associated with a location or `main-location`.
	 * @return boolean
	 */
	public static function is_location_orders_paused( $location_id ) {
		return self::is_location_delivery_orders_paused( $location_id ) && self::is_location_pickup_orders_paused( $location_id );
	}

	/**
	 * Check if the location is paused to receive delivery orders.
	 *
	 * @param int|string $location_id The post ID associated with a location or `main-location`.
	 * @return boolean
	 */
	public static function is_location_delivery_orders_paused( $location_id ) {
		return get_transient( self::get_status_location_transient_key( $location_id, 'delivery-paused' ) );
	}

	/**
	 * Check if the location is paused to receive pickup orders.
	 *
	 * @param int|string $location_id The post ID associated with a location or `main-location`.
	 * @return boolean
	 */
	public static function is_location_pickup_orders_paused( $location_id ) {
		return get_transient( self::get_status_location_transient_key( $location_id, 'pickup-paused' ) );
	}

	/**
	 * Output the Pause Orders for Today button.
	 *
	 * @param string     $service_type The service type (`delivery` or `pickup`).
	 * @param int|string $location_id  The post ID associated with a location or `main-location`.
	 * @return void
	 */
	protected static function pause_orders_button( $service_type, $location_id = 0 ) {
		$service_type_label = Orderable_Services::get_service_label( $service_type );

		// translators: %1$s - the service type (`delivery` or `pickup`).
		$button_label = empty( $location_id ) ? sprintf( __( 'Pause %1$s - All Locations', 'orderable-pro' ), $service_type_label ) : sprintf( __( 'Pause %1$s', 'orderable-pro' ), $service_type_label );

		?>
		<span class="orderable-change-location-status">
			<img
				class="orderable-change-location-status__loading orderable-change-location-status__loading-hidden"
				src="<?php echo esc_url( get_admin_url() . 'images/spinner.gif' ); ?>"
			/>
			<button
				class="button orderable-change-location-status__button"
				data-location-id="<?php echo esc_attr( $location_id ); ?>"
				data-change-to="pause-<?php echo esc_attr( $service_type ); ?>"
				title="
				<?php
					// translators: %1$s - the service type (`delivery` or `pickup`).
					printf( esc_attr__( 'Pause %1$s for Today', 'orderable-pro' ), esc_html( $service_type_label ) );
				?>
				"
				type="button"
			>
				<?php echo esc_html( $button_label ); ?>
			</button>
		</span>
		<?php
	}

	/**
	 * Output the Resume button.
	 *
	 * @param string     $service_type The service type (`delivery` or `pickup`).
	 * @param int|string $location_id  The post ID associated with a location or `main-location`.
	 * @return void
	 */
	protected static function resume_orders_button( $service_type, $location_id = 0 ) {
		$service_type_label = Orderable_Services::get_service_label( $service_type );

		// translators: %1$s - the service type (`delivery` or `pickup`).
		$button_label = empty( $location_id ) ? sprintf( __( 'Resume %1$s - All Locations', 'orderable-pro' ), $service_type_label ) : sprintf( __( 'Resume %1$s', 'orderable-pro' ), $service_type_label );

		?>
		<span class="orderable-change-location-status">
			<img
				class="orderable-change-location-status__loading orderable-change-location-status__loading-hidden"
				src="<?php echo esc_url( get_admin_url() . 'images/spinner.gif' ); ?>"
			/>
			<button
				class="button orderable-change-location-status__button"
				data-location-id="<?php echo esc_attr( $location_id ); ?>"
				data-change-to="resume-<?php echo esc_attr( $service_type ); ?>"
				type="button"
			>
				<?php echo esc_html( $button_label ); ?>
			</button>
		</span>
		<?php
	}

	/**
	 * Update location status
	 *
	 * @return void
	 */
	public static function update_location_status() {
		if (
			empty( $_POST['_nonce_update_location_status'] ) ||
			! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_nonce_update_location_status'] ) ), 'ajax-orderable-pro-update-location-status' )
		) {
			wp_send_json_error( __( 'Invalid nonce', 'orderable-pro' ), 401 );
		}

		$error_message = __( 'Something went wrong', 'orderable-pro' );

		if ( ! isset( $_POST['location_id'] ) || empty( $_POST['status'] ) ) {
			wp_send_json_error( $error_message, 400 ); // Bad Request.
		}

		$location_id = sanitize_text_field( wp_unslash( $_POST['location_id'] ) );
		$status      = sanitize_text_field( wp_unslash( $_POST['status'] ) );

		if ( is_numeric( $location_id ) ) {
			$location_id = (int) $location_id;
		}

		$location     = new Orderable_Location_Single_Pro( $location_id );
		$service_type = str_replace( [ 'pause-', 'resume-' ], '', $status );

		switch ( $status ) {
			case 'pause-delivery':
			case 'pause-pickup':
				$result = $location->pause_orders_for_today( $service_type );
				break;

			case 'resume-pickup':
			case 'resume-delivery':
				$result = $location->resume_orders( $service_type );
				break;

			default:
				wp_send_json_error( $error_message, 400 ); // Bad Request.
				break;
		}

		if ( ! $result ) {
			wp_send_json_error( __( 'It was not possible to change the location status', 'orderable-pro' ), 500 );
		}

		$new_status = $location->get_status();

		$service_type_label = Orderable_Services::get_service_label( $service_type );

		if ( $location->is_paused( $service_type ) ) {
			// translators: %1$s - the service type (`delivery` or `pickup`).
			$button_label             = sprintf( __( 'Resume %1$s', 'orderable-pro' ), $service_type_label );
			$data_change_to_attribute = 'resume-' . $service_type;
		} else {
			// translators: %1$s - the service type (`delivery` or `pickup`).
			$button_label             = sprintf( __( 'Pause %1$s', 'orderable-pro' ), $service_type_label );
			$data_change_to_attribute = 'pause-' . $service_type;
		}

		wp_send_json_success(
			[
				'status'                   => esc_html( $new_status ),
				'button_label'             => esc_html( $button_label ),
				'data_change_to_attribute' => esc_attr( $data_change_to_attribute ),
			]
		);
	}

	/**
	 * Update status for all locations.
	 *
	 * @return void
	 */
	public static function update_status_for_all_locations() {
		if (
			empty( $_POST['_nonce_update_location_status'] ) ||
			! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_nonce_update_location_status'] ) ), 'ajax-orderable-pro-update-location-status' )
		) {
			wp_send_json_error( __( 'Invalid nonce', 'orderable-pro' ), 401 );
		}

		$error_message = __( 'Something went wrong', 'orderable-pro' );

		if ( ! isset( $_POST['location_id'] ) || empty( $_POST['status'] ) ) {
			wp_send_json_error( $error_message, 400 ); // Bad Request.
		}

		$location_id = absint( wp_unslash( $_POST['location_id'] ) );
		$status      = sanitize_text_field( wp_unslash( $_POST['status'] ) );

		if ( 0 !== $location_id ) {
			wp_send_json_error( $error_message, 400 ); // Bad Request.
		}

		$service_type = str_replace( [ 'pause-', 'resume-' ], '', $status );

		switch ( $status ) {
			case 'pause-delivery':
			case 'pause-pickup':
				$result = Orderable_Multi_Location_Pro_Helper::pause_orders_all_locations_for_today( $service_type );
				break;

			case 'resume-pickup':
			case 'resume-delivery':
				$result = Orderable_Multi_Location_Pro_Helper::resume_orders_all_locations_for_today( $service_type );
				break;

			default:
				wp_send_json_error( $error_message, 400 ); // Bad Request.
				break;
		}

		if ( ! $result ) {
			wp_send_json_error( __( 'It was not possible to change the status for all locations', 'orderable-pro' ), 500 );
		}

		$new_status = '';

		$service_type_label = Orderable_Services::get_service_label( $service_type );

		if ( str_contains( $status, 'pause' ) ) {
			// translators: %1$s - the service type (`delivery` or `pickup`).
			$button_label             = sprintf( __( 'Resume %1$s - All Locations', 'orderable-pro' ), $service_type_label );
			$data_change_to_attribute = 'resume-' . $service_type;
		} else {
			// translators: %1$s - the service type (`delivery` or `pickup`).
			$button_label             = sprintf( __( 'Pause %1$s - All Locations', 'orderable-pro' ), $service_type_label );
			$data_change_to_attribute = 'pause-' . $service_type;
		}

		wp_send_json_success(
			[
				'status'                   => esc_html( $new_status ),
				'button_label'             => esc_html( $button_label ),
				'data_change_to_attribute' => esc_attr( $data_change_to_attribute ),
			]
		);
	}

	/**
	 * Get the transient key for location status.
	 *
	 * @param int    $location_id The location ID.
	 * @param string $status The location status.
	 * @return string
	 */
	protected static function get_status_location_transient_key( $location_id, $status ) {
		$transient_key = '';

		if ( empty( $location_id ) || empty( $status ) ) {
			return $transient_key;
		}

		return 'orderable_location_' . $location_id . '_status_orders_' . $status;
	}

	/**
	 * Output the Live Orders button.
	 *
	 * @param int $location_id The post ID associated with a location.
	 * @return void
	 */
	protected static function live_orders_button( $location_id ) {
		$order_page_url = OrderUtil::custom_orders_table_usage_is_enabled() ? 'admin.php?orderable_live_view&page=wc-orders' : 'edit.php?orderable_live_view&post_type=shop_order';

		?>
		<a
			href="<?php echo esc_url( admin_url( $order_page_url . '&orderable_location=' . $location_id ) ); ?>"
			class="button"
			target="_blank"
		>
			<?php echo esc_html__( 'Live Orders', 'orderable-pro' ); ?>
		</a>
		<?php
	}

	/**
	 * Output the nonce field to save the location data.
	 *
	 * @param WP_Post $post Post object.
	 * @return void
	 */
	public static function nonce_field( $post ) {
		if ( Orderable_Multi_Location_Pro::$post_type_key !== $post->post_type ) {
			return;
		}

		Orderable_Location_Admin::save_location_nonce_field();
	}

	/**
	 * Check if we have a `orderable_locations` post type for
	 * the main location. If not, we create it.
	 *
	 * @return void
	 */
	public static function check_main_location_post() {
		if ( wp_doing_ajax() ) {
			return;
		}

		$main_location_post_id = Orderable_Location::get_main_location_post_id();

		if ( $main_location_post_id ) {
			global $wpdb;

			$query = $wpdb->prepare(
				"SELECT COUNT(*) FROM {$wpdb->posts} WHERE ID = %d",
				$main_location_post_id
			);

			$result = $wpdb->get_var( $query );

			if ( $result <= 0 ) {
				// If the post doesn't exist, then we need to create it.
				$main_location_post_id = false;
			} else {
				// If the post did exist, we can escape here.
				return;
			}
		}

		if ( empty( $main_location_post_id ) ) {
			// If there is no post ID, let's insert a post.
			$main_location_post_id = self::insert_main_location_post();
		}

		if ( is_wp_error( $main_location_post_id ) ) {
			return;
		}

		self::update_main_location_post_id( $main_location_post_id );
	}

	/**
	 * Insert main location post.
	 *
	 * @return int|WP_Error
	 */
	protected static function insert_main_location_post() {
		return wp_insert_post(
			array(
				'post_title'  => __( 'Main Location', 'orderable-pro' ),
				'post_type'   => Orderable_Multi_Location_Pro::$post_type_key,
				'post_status' => 'publish',
			)
		);
	}

	/**
	 * Update the main location post ID.
	 *
	 * @param int $post_id The post ID.
	 * @return void
	 */
	protected static function update_main_location_post_id( $post_id ) {
		global $wpdb;

		$location_id = $wpdb->get_var(
			"SELECT
				location_id
			FROM
				{$wpdb->orderable_locations}
			WHERE
				is_main_location = 1
			ORDER BY
				location_id
			LIMIT
				1
			"
		);

		if ( empty( $location_id ) ) {
			$data = wp_parse_args(
				Orderable_Location_Locations_Table::get_default_main_location_data(),
				array(
					'post_id' => $post_id,
				)
			);

			$wpdb->insert(
				$wpdb->prefix . Orderable_Location_Locations_Table::get_table_name(),
				$data
			);

			return;
		}

		$wpdb->update(
			$wpdb->orderable_locations,
			array(
				'post_id' => $post_id,
			),
			array(
				'location_id' => $location_id,
			),
			array(
				'post_id' => '%d',
			),
			array(
				'location_id' => '%d',
			)
		);
	}

	/**
	 * Hide `trash` action link for the main location.
	 *
	 * To prevent the main location to be deleted, we hide
	 * the `trash` action link.
	 *
	 * @param string[] $actions An array of row action links.
	 * @param WP_Post  $post    The post object.
	 * @return string[]
	 */
	public static function hide_trash_action_link_for_main_location( $actions, $post ) {
		if ( Orderable_Multi_Location_Pro::$post_type_key !== $post->post_type ) {
			return $actions;
		}

		$is_main_location = Orderable_Location::is_main_location( Orderable_Location::get_location_id( $post->ID ) );

		if ( empty( $is_main_location ) ) {
			return $actions;
		}

		unset( $actions['trash'] );

		return $actions;
	}

	/**
	 * Remove the main location status if the post went to trash.
	 *
	 * @param int $post_id The post ID.
	 * @return void
	 */
	public static function maybe_delete_is_main_location_transient( $post_id ) {
		$post = get_post( $post_id );

		if ( Orderable_Multi_Location_Pro::$post_type_key !== $post->post_type ) {
			return;
		}

		$is_main_location = Orderable_Location::is_main_location( Orderable_Location::get_location_id( $post->ID ) );

		if ( empty( $is_main_location ) ) {
			return;
		}
	}

	/**
	 * Remove data from Orderable custom tables.
	 *
	 * When a `orderable_locations` post is deleted, we remove the
	 * data from the custom tables.
	 *
	 * @param int     $post_id The post ID.
	 * @param WP_Post $post    The post object.
	 * @return void
	 */
	public static function remove_data_from_orderable_custom_tables( $post_id, $post ) {
		global $wpdb;

		if ( Orderable_Multi_Location_Pro::$post_type_key !== $post->post_type ) {
			return;
		}

		$location_id = Orderable_Location::get_location_id( $post_id );

		if ( Orderable_Location::is_main_location( $location_id ) ) {
			return;
		}

		$wpdb->delete(
			$wpdb->orderable_locations,
			array(
				'location_id' => $location_id,
			),
			array( '%d' )
		);

		$wpdb->delete(
			$wpdb->orderable_location_time_slots,
			array(
				'location_id' => $location_id,
			),
			array( '%d' )
		);

		$wpdb->delete(
			$wpdb->orderable_location_holidays,
			array(
				'location_id' => $location_id,
			),
			array( '%d' )
		);
	}

	/**
	 * Add location column to admin orders screen.
	 *
	 * @param string[] $columns The column header labels keyed by column ID.
	 *
	 * @return string[]
	 */
	public static function add_location_column( $columns ) {
		if ( ! Orderable_Multi_Location_Pro::is_multi_location_active() ) {
			return $columns;
		}

		$columns['orderable_location'] = __( 'Location', 'orderable-pro' );

		return $columns;
	}

	/**
	 * Add location column content.
	 *
	 * @param string $column_name The name of the column to display.
	 * @param int    $post_id     The current post ID.
	 */
	public static function add_location_column_content( $column_name, $post_id ) {
		if ( 'orderable_location' === $column_name ) {
			$order       = wc_get_order( $post_id );
			$location_id = absint( $order->get_meta( '_orderable_location_id', true ) );

			if ( empty( $location_id ) ) {
				$main_location_id = Orderable_Multi_Location_Pro_Helper::get_main_location_id();

				$location_name = empty( $main_location_id ) ? '' : get_the_title( Orderable_Location::get_location_post_id( $main_location_id ) );

			} else {
				$location_name = get_the_title( Orderable_Location::get_location_post_id( $location_id ) );
				$location_name = empty( $location_name ) ? $order->get_meta( '_orderable_location_name', true ) : $location_name;
			}

			echo esc_html( $location_name );
		}
	}

	/**
	 * Enable the options `minutes` and `hours` in the Lead Time Period field.
	 *
	 * By default, `minutes` and `hours` options are disabled in Orderable
	 * Free.
	 *
	 * @param array $options The Lead Time Period field options.
	 * @return array
	 */
	public static function enable_minutes_and_hours_options_in_lead_time_period_field( $options ) {
		if ( ! is_array( $options ) ) {
			return $options;
		}

		return array_map(
			function ( $option ) {
				$option['label']    = str_replace( '(Pro)', '', $option['label'] );
				$option['disabled'] = false;

				return $option;
			},
			$options
		);
	}

	/**
	 * Add the Pause and Resume Orders buttons to the Live Order View.
	 *
	 * @return void
	 */
	public static function add_pause_and_resume_button_to_liver_order_view() {
		if ( ! Orderable_Live_View::is_live_view() ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification
		$location_id = empty( $_GET['orderable_location'] ) ? false : sanitize_text_field( wp_unslash( $_GET['orderable_location'] ) );

		if ( empty( $location_id ) ) {
			ob_start();

			self::resume_pause_orders_all_locations_buttons();

			$resume_pause_orders_buttons = ob_get_clean();

		} else {
			$location = new Orderable_Location_Single_Pro( $location_id );

			ob_start();

			self::resume_pause_orders_buttons( $location );

			$resume_pause_orders_buttons = ob_get_clean();
		}

		$resume_pause_orders_buttons .= '<span class="orderable-change-location-status__error-message orderable-change-location-status--hidden notice notice-error"></span>'

		?>
		<script>
			jQuery( document ).ready( function() {
				const $add_new_button = jQuery( '.page-title-action' ).filter(':last');

				if ( $add_new_button.length <= 0 ) {
					return;
				}

				$add_new_button.after( `<?php echo wp_kses_post( $resume_pause_orders_buttons ); ?>` );
			} );
		</script>
		<?php
	}

	/**
	 * Output the Resume and/or Resume buttons based on the location settings.
	 *
	 * @param Orderable_Location_Single_Pro $location The location.
	 * @return void
	 */
	protected static function resume_pause_orders_buttons( $location ) {
		$is_delivery_enabled = $location->is_service_enabled( 'delivery' );
		$is_pickup_enabled   = $location->is_service_enabled( 'pickup' );

		if ( $is_delivery_enabled && $location->is_paused( 'delivery' ) ) {
			self::resume_orders_button( 'delivery', $location->get_location_id() );
		}

		if ( $is_delivery_enabled && ! $location->is_paused( 'delivery' ) ) {
			self::pause_orders_button( 'delivery', $location->get_location_id() );
		}

		if ( $is_pickup_enabled && $location->is_paused( 'pickup' ) ) {
			self::resume_orders_button( 'pickup', $location->get_location_id() );
		}

		if ( $is_pickup_enabled && ! $location->is_paused( 'pickup' ) ) {
			self::pause_orders_button( 'pickup', $location->get_location_id() );
		}
	}

	/**
	 * Output Resume and Pause All Locations buttons
	 *
	 * @return void
	 */
	protected static function resume_pause_orders_all_locations_buttons() {
		$is_delivery_enabled = Orderable_Multi_Location_Pro_Helper::is_delivery_enable_at_any_location();
		$is_pickup_enabled   = Orderable_Multi_Location_Pro_Helper::is_pickup_enable_at_any_location();

		$is_delivery_paused = Orderable_Multi_Location_Pro_Helper::is_delivery_paused_at_any_location();
		$is_pickup_paused   = Orderable_Multi_Location_Pro_Helper::is_pickup_paused_at_any_location();

		if ( $is_delivery_enabled && $is_delivery_paused ) {
			self::resume_orders_button( 'delivery' );
		}

		if ( $is_delivery_enabled && ! $is_delivery_paused ) {
			self::pause_orders_button( 'delivery' );
		}

		if ( $is_pickup_enabled && $is_pickup_paused ) {
			self::resume_orders_button( 'pickup' );
		}

		if ( $is_pickup_enabled && ! $is_pickup_paused ) {
			self::pause_orders_button( 'pickup' );
		}
	}

	/**
	 * Add Location custom column.
	 *
	 * Compatible with HPOS.
	 *
	 * @return void
	 */
	public static function add_location_custom_column() {
		$shop_order_page_screen_id = wc_get_page_screen_id( 'shop-order' );

		add_filter( "manage_{$shop_order_page_screen_id}_columns", array( __CLASS__, 'add_location_column' ), 10 );
		add_action( "manage_{$shop_order_page_screen_id}_custom_column", array( __CLASS__, 'add_location_column_content' ), 10, 2 );
	}
}
