<?php
/**
 * Module: Multi Location Pro.
 *
 * @since   1.18.0
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Orderable_Multi_Location_Pro class.
 */
class Orderable_Multi_Location_Pro {
	/**
	 * The post type key.
	 *
	 * @var string
	 */
	public static $post_type_key = 'orderable_locations';

	/**
	 * Init.
	 */
	public static function run() {
		self::load_classes();

		add_action( 'init', array( __CLASS__, 'register_post_type' ) );
		add_action( 'woocommerce_checkout_update_order_meta', array( __CLASS__, 'add_location_id_to_order_meta' ) );
		add_action( 'woocommerce_store_api_checkout_update_order_meta', array( __CLASS__, 'add_location_id_to_order_meta' ) );
		add_action( 'woocommerce_after_checkout_validation', array( __CLASS__, 'validate_location_before_checkout' ), 10, 2 );

		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'admin_assets' ) );

		add_filter( 'woocommerce_get_order_item_totals', array( __CLASS__, 'add_location_to_order_details' ), 5, 2 );
		add_filter( 'save_post', array( __CLASS__, 'clear_location_post_update_transient' ), 10, 2 );
		add_filter( 'orderable_location_get_selected_location', array( __CLASS__, 'get_selected_location' ) );
		add_filter( 'orderable_location_get_selected_location_id', array( __CLASS__, 'get_selected_location_id' ) );
		add_filter( 'orderable_date_available', array( __CLASS__, 'date_available' ), 10, 4 );
		add_filter( 'orderable_location_get_default_open_hours', array( __CLASS__, 'get_default_open_hours' ) );
	}

	/**
	 * Load classes
	 *
	 * @return void
	 */
	protected static function load_classes() {
		$classes = array(
			'admin'    => array(
				'multi-location-pro-admin'    => 'Orderable_Multi_Location_Pro_Admin',
				'multi-location-pro-settings' => 'Orderable_Multi_Location_Pro_Settings',
			),
			'frontend' => array(
				'multi-location-pro-frontend' => 'Orderable_Multi_Location_Pro_Frontend',
				'multi-location-pro-ajax'     => 'Orderable_Multi_Location_Pro_Ajax',
				'multi-location-pro-search'   => 'Orderable_Multi_Location_Pro_Search',
				'multi-location-pro-helper'   => 'Orderable_Multi_Location_Pro_Helper',
				'location-single-pro'         => 'Orderable_Location_Single_Pro',
			),
		);

		Orderable_Helpers::load_classes( $classes['admin'], 'multi-location-pro/admin', ORDERABLE_PRO_MODULES_PATH );
		Orderable_Helpers::load_classes( $classes['frontend'], 'multi-location-pro', ORDERABLE_PRO_MODULES_PATH );
	}

	/**
	 * Register post type.
	 */
	public static function register_post_type() {
		$labels = array(
			'plural'   => __( 'Locations', 'orderable-pro' ),
			'singular' => __( 'Location', 'orderable-pro' ),
		);

		$labels = Orderable_Helpers::prepare_post_type_labels( $labels );

		$labels['name'] = __( 'Locations', 'orderable-pro' );

		$args = array(
			'labels'              => $labels,
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

		register_post_type( self::$post_type_key, $args );
	}

	/**
	 * Check if location is available.
	 *
	 * @param int $location_id The Location ID.
	 * @return boolean
	 */
	protected static function is_location_available( $location_id ) {
		if ( empty( $location_id ) || ! is_numeric( $location_id ) ) {
			/**
			 * Filter if location is available.
			 *
			 * @since 1.8.0
			 * @see self::is_location_available
			 */
			return apply_filters( 'orderable_multi_location_is_location_available', false, $location_id );
		}

		if ( Orderable_Location::is_main_location( $location_id ) ) {
			/**
			 * Filter if location is available.
			 *
			 * @since 1.8.0
			 * @see self::is_location_available
			 */
			return apply_filters( 'orderable_multi_location_is_location_available', true, $location_id );
		}

		$location_post_id = Orderable_Location::get_location_post_id( $location_id );

		if ( ! $location_post_id ) {
			/**
			 * Filter if location is available.
			 *
			 * @since 1.8.0
			 * @see self::is_location_available
			 */
			return apply_filters( 'orderable_multi_location_is_location_available', false, $location_id );
		}

		$location_query = new WP_Query(
			array(
				'p'                      => $location_post_id,
				'post_type'              => self::$post_type_key,
				'post_status'            => 'publish',
				'posts_per_page'         => 1,
				'fields'                 => 'ids',
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);

		if ( 1 !== $location_query->post_count ) {
			return false;
		}

		/**
		 * Filter if location is available.
		 *
		 * @since 1.8.0
		 * @hook orderable_multi_location_is_location_available
		 * @param bool $is_available Default: true.
		 * @param int $location_id The location ID.
		 * @return bool New value
		 */
		return apply_filters( 'orderable_multi_location_is_location_available', true, $location_id );
	}

	/**
	 * Get the selected location, but turn it into a Pro instance.
	 *
	 * @param Orderable_Location_Single|Orderable_Location_Single_Pro $location Location instance
	 *
	 * @return Orderable_Location_Single_Pro
	 */
	public static function get_selected_location( $location ) {
		$selected_location_from_session = self::get_selected_location_data_from_session();

		if ( ! $selected_location_from_session ) {
			return new Orderable_Location_Single_Pro( $location );
		}

		return new Orderable_Location_Single_Pro( $selected_location_from_session['id'] );
	}

	/**
	 * Get the selected location ID.
	 *
	 * @param int $location_id The location ID.
	 *
	 * @return int
	 */
	public static function get_selected_location_id( $location_id ) {
		if ( is_admin() && ! wp_doing_ajax() ) {
			// If we're editing a location, then $_GET['post'] is set.
			// If we're saving a location, then $_POST['post_ID'] is set.
			$location_post_id = null;

			if ( ! empty( $_GET['post'] ) ) {
				$location_post_id = filter_input( INPUT_GET, 'post', FILTER_SANITIZE_NUMBER_INT );
			} elseif ( ! empty( $_POST['post_ID'] ) ) {
				$location_post_id = filter_input( INPUT_POST, 'post_ID', FILTER_SANITIZE_NUMBER_INT );
			}

			if ( ! empty( $location_post_id ) ) {
				$location_id_from_post_id = Orderable_Location::get_location_id( $location_post_id );

				if ( $location_id_from_post_id ) {
					return $location_id_from_post_id;
				}
			} else {
				// Otherwise, the location hasn't been created yet.
				return null;
			}
		}

		return $location_id;
	}

	/**
	 * Get the selected location.
	 *
	 * @return array
	 */
	public static function get_selected_location_data_from_session( $update_cache = false ) {
		static $selected_location_cache = null;

		if ( ! $update_cache && null !== $selected_location_cache ) {
			/**
			 * Filter the location data. It returns false if no location is selected.
			 *
			 * @since 1.8.0
			 * @hook orderable_multi_location_selected_location
			 * @param  array $location Location data.
			 * @return array New value
			 */
			return apply_filters( 'orderable_multi_location_selected_location', $selected_location_cache );
		}

		if ( empty( WC()->session ) ) {
			return apply_filters( 'orderable_multi_location_selected_location', false );
		}

		$location_id       = empty( WC()->session->get( 'orderable_multi_location_id' ) ) ? false : sanitize_text_field( WC()->session->get( 'orderable_multi_location_id' ) );
		$location_postcode = empty( WC()->session->get( 'orderable_multi_location_postcode' ) ) ? false : sanitize_text_field( WC()->session->get( 'orderable_multi_location_postcode' ) );
		$delivery_type     = empty( WC()->session->get( 'orderable_multi_location_delivery_type' ) ) ? false : sanitize_text_field( WC()->session->get( 'orderable_multi_location_delivery_type' ) );

		$location_data = array(
			'id'            => $location_id,
			'postcode'      => $location_postcode,
			'delivery_type' => $delivery_type,
		);

		if ( ! self::is_location_available( $location_id ) ) {
			$location_data = false;
		}

		$selected_location_cache = $location_data;

		/**
		 * Filter the location data. It returns false if no location is selected.
		 *
		 * @since 1.8.0
		 * @hook orderable_multi_location_selected_location
		 * @param  array $location Location data.
		 * @return array New value
		 */
		return apply_filters( 'orderable_multi_location_selected_location', $location_data );
	}

	/**
	 * Add location ID to order meta.
	 *
	 * @param int|WC_Order $order The order ID or WC_Order object.
	 * @return void
	 */
	public static function add_location_id_to_order_meta( $order ) {
		$location = self::get_selected_location_data_from_session();

		if ( empty( $location['id'] ) ) {
			return;
		}

		if ( Orderable_Location::is_main_location( $location['id'] ) ) {
			return;
		}

		if ( is_numeric( $order ) ) {
			$order = wc_get_order( $order );
		}

		if ( empty( $order ) ) {
			return;
		}

		$order->update_meta_data( '_orderable_location_id', $location['id'] );
		$order->update_meta_data( '_orderable_location_name', get_the_title( Orderable_Location::get_location_post_id( $location['id'] ) ) );

		$order->save();
	}

	/**
	 * Add location name to order details.
	 *
	 * @param array    $total_rows  Total rows.
	 * @param WC_Order $order       Order object.
	 *
	 * @return array
	 */
	public static function add_location_to_order_details( $total_rows, $order ) {
		if ( ! self::is_multi_location_active() ) {
			return $total_rows;
		}

		$location_name = $order->get_meta( '_orderable_location_name', true );

		if ( empty( $location_name ) ) {
			$main_location_id = Orderable_Multi_Location_Pro_Helper::get_main_location_id();

			$location_name = get_the_title( Orderable_Location::get_location_post_id( $main_location_id ) );
		}

		if ( empty( $location_name ) ) {
			return $total_rows;
		}

		$total_rows['orderable_location_name'] = array(
			'label' => __( 'Location', 'orderable-pro' ),
			'value' => $location_name,
		);

		return $total_rows;
	}

	/**
	 * Enqueue admin assets.
	 *
	 * @param string $hook Hook suffix for the current admin page.
	 */
	public static function admin_assets( $hook ) {
		$suffix     = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';
		$suffix_css = ( is_rtl() ? '-rtl' : '' ) . $suffix;

		// Styles.
		wp_enqueue_style(
			'orderable-multi-location-pro-admin-css',
			ORDERABLE_PRO_URL . 'inc/modules/multi-location-pro/assets/admin/css/multi-location' . $suffix_css . '.css',
			array(),
			ORDERABLE_PRO_VERSION
		);

		// Scripts.
		wp_enqueue_script(
			'orderable-multi-location-pro-admin-js',
			ORDERABLE_PRO_URL . 'inc/modules/multi-location-pro/assets/admin/js/main' . $suffix . '.js',
			array( 'jquery' ),
			ORDERABLE_PRO_VERSION,
			true
		);

		// Localize JS variables.
		wp_localize_script(
			'orderable-multi-location-pro-admin-js',
			'orderable_pro_multi_location_list_table_admin',
			array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'ajax-orderable-pro-update-location-status' ),
				'i18n'     => [
					'error_message' => __( 'Something went wrong', 'orderable-pro' ),
				],
			)
		);
	}

	/**
	 * Is popup closable?
	 *
	 * @return bool
	 */
	public static function is_popup_closable() {
		$require_location_selected = Orderable_Settings::get_setting( 'locations_multi_location_require_location' );
		$location                  = self::get_selected_location_data_from_session();

		/**
		 * Is multilocation location-finder popup closable?
		 *
		 * @since 1.8
		 */
		return apply_filters( 'orderable_multi_location_is_popup_closable', ! empty( $location['id'] ) || Orderable_Checkout_Pro::is_checkout_page() || '1' !== $require_location_selected );
	}

	/**
	 * Is popup closable?
	 *
	 * @return bool
	 */
	public static function open_popup_on_pageload() {
		$location = self::get_selected_location_data_from_session();

		if ( ! empty( $location['id'] ) ) {
			/**
			 * Open location finder popup on page load?
			 *
			 * @since 1.8
			 */
			return apply_filters( 'orderable_multi_location_open_popup', false );
		}

		$popup_condition = Orderable_Settings::get_setting( 'locations_multi_location_popup' );

		if ( 'dont_show' === $popup_condition ) {
			/**
			 * Open location finder popup on page load?
			 *
			 * @since 1.8
			 */
			return apply_filters( 'orderable_multi_location_open_popup', false );
		} elseif ( 'all_pages' === $popup_condition ) {
			/**
			 * Open location finder popup on page load?
			 *
			 * @since 1.8
			 */
			return apply_filters( 'orderable_multi_location_open_popup', true );
		} elseif ( 'specific_pages' === $popup_condition ) {
			if ( ! is_page() && ! is_shop() ) {
				/**
				 * Open location finder popup on page load?
				 *
				 * @since 1.8
				 */
				return apply_filters( 'orderable_multi_location_open_popup', false );
			}

			$id    = get_the_ID();
			$pages = (array) Orderable_Settings::get_setting( 'locations_multi_location_pages' );
			$pages = array_map( 'intval', $pages );

			// Need to explicitly add a check for shop page as it is an archive page.
			$shop_page_includes = ( is_shop() && in_array( wc_get_page_id( 'shop' ), $pages, true ) );
			$page_includes      = in_array( (int) $id, $pages, true );

			/**
			 * Open location finder popup on page load?
			 *
			 * @since 1.8
			 */
			return apply_filters( 'orderable_multi_location_open_popup', $page_includes || $shop_page_includes );
		}

		/**
		 * Open location finder popup on page load?
		 *
		 * @since 1.8
		 */
		return apply_filters( 'orderable_multi_location_open_popup', true );
	}

	/**
	 * Is geolocate enabled.
	 *
	 * @return bool
	 */
	public static function is_geolocate_enabled() {
		$apikey = Orderable_Settings::get_setting( 'integrations_integrations_google_api_key' );

		$enabled = ! empty( $apikey ) && is_ssl();

		/**
		 * Is geolocate enabled.
		 *
		 * @since 1.8
		 */
		return apply_filters( 'orderable_multi_location_is_geolocate_enabled', $enabled );
	}

	/**
	 * Clear transient data on location post update.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post.
	 *
	 * @return void
	 */
	public static function clear_location_post_update_transient( $post_id, $post ) {
		if ( empty( $post ) ) {
			return;
		}

		if ( self::$post_type_key === $post->post_type ) {
			delete_transient( 'orderable_multi_location_main_location_id' );
		}
	}

	/**
	 * Is Store in Multi-location mode.
	 *
	 * @return bool
	 */
	public static function is_multi_location_active() {
		$cache_key = 'orderable_locations_count';
		$count     = wp_cache_get( $cache_key );

		if ( false === $count ) {
			$count = count( Orderable_Multi_Location_Pro_Helper::get_all_locations() );

			wp_cache_set( $cache_key, $count );
		}

		/**
		 * Is Store in Multi-location mode.
		 *
		 * @since 1.8.0
		 */
		return apply_filters( 'orderable_multi_location_active', $count > 1 );
	}

	/**
	 * Validate locations before checkout.
	 *
	 * @param array    $fields Fields.
	 * @param WP_Error $errors Errors.
	 *
	 * @return void
	 */
	public static function validate_location_before_checkout( $fields, $errors ) {
		if ( ! self::is_multi_location_active() ) {
			return;
		}

		if ( empty( $_POST['_wpnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce'] ) ), 'validate_location' ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification, WordPress.Security.ValidatedSanitizedInput
		$postcode = empty( $_POST['ship_to_different_address'] ) ? ( $_POST['billing_postcode'] ?? '' ) : ( $_POST['shipping_postcode'] ?? '' );

		$postcode               = empty( $postcode ) ? '' : sanitize_text_field( wp_unslash( $postcode ) );
		$opml_selected_location = empty( $_POST['opml_selected_location'] ) ? '' : sanitize_text_field( wp_unslash( $_POST['opml_selected_location'] ) );
		$location_data          = Orderable_Multi_Location_Pro_Search::get_locations_for_postcode( $postcode );

		if ( empty( $opml_selected_location ) ) {
			if ( ! empty( $location_data['locations'] ) ) {
				$errors->add( 'validation', esc_html__( 'Please select a Location.', 'orderable-pro' ) );
			}

			return;
		}

		$service_type = Orderable_Services::is_pickup_method( $fields['shipping_method'][0] ) ? 'pickup' : 'delivery';

		if ( empty( $location_data[ $service_type ] ) ) {
			$errors->add( 'validation', esc_html__( 'This location is not available, please select another location.', 'orderable-pro' ) );

			return;
		}

		if ( 'pickup' !== $service_type && ! in_array( (int) $opml_selected_location, $location_data['matching_location_ids'], true ) ) {
			$errors->add( 'validation', esc_html__( 'This location is not available, please select another location.', 'orderable-pro' ) );

			return;
		}
	}

	/**
	 * Disable location if it is paused.
	 *
	 * @param bool                                                    $is_available Is available.
	 * @param int                                                     $timestamp    Timestamp.
	 * @param string                                                  $type         Type.
	 * @param Orderable_Location_Single|Orderable_Location_Single_Pro $location     Location.
	 *
	 * @return false|mixed
	 */
	public static function date_available( $is_available, $timestamp, $type, $location ) {
		if ( ! $location->is_paused( $type ) ) {
			return $is_available;
		}

		if ( ! Orderable_Timings::is_today( $timestamp ) ) {
			return $is_available;
		}

		return false;
	}

	/**
	 * Modify default open hours.
	 *
	 * @param array $default_open_hours Default open hours.
	 *
	 * @return array
	 */
	public static function get_default_open_hours( $default_open_hours ) {
		$setting = Orderable_Settings::get_setting( 'store_general_open_hours' );

		if ( empty( $setting ) ) {
			return $default_open_hours;
		}

		return $setting;
	}
}
