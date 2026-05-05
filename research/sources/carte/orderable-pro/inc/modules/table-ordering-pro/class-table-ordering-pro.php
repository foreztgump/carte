<?php

/**
 * Module: Table Ordering Pro.
 *
 * @package Orderable/Classes
 */
defined( 'ABSPATH' ) || exit;

/**
 * Tip module class.
 */
class Orderable_Table_Ordering_Pro {
	/**
	 * Table number cookie key.
	 *
	 * @var string
	 */
	public static $cookie_key_table_id = 'orderable_table_id';

	/**
	 * Init.
	 */
	public static function run() {
		add_action( 'init', array( __CLASS__, 'register_post_type' ) );
		add_action( 'load-post.php', array( __CLASS__, 'init_metabox' ) );
		add_action( 'load-post-new.php', array( __CLASS__, 'init_metabox' ) );
		add_filter( 'orderable_is_settings_page', array( __CLASS__, 'is_settings_page' ) );
		add_action( 'save_post_orderable_tables', array( __CLASS__, 'save_post' ), 10, 3 );
		add_action( 'init', array( __CLASS__, 'set_table_id_cookie' ) );
		remove_action( 'admin_menu', array( 'Orderable_Table_Ordering', 'add_settings_page' ) );

		self::load_classes();

		self::get_table_id_cookie();
	}

	/**
	 * Load classes.
	 */
	public static function load_classes() {
		$classes = array(
			'table-ordering-pro-qr'       => 'Orderable_Table_Ordering_Pro_Qr',
			'table-ordering-pro-table'    => 'Orderable_Table_Ordering_Pro_Table',
			'table-ordering-pro-order'    => 'Orderable_Table_Ordering_Pro_Order',
			'table-ordering-pro-checkout' => 'Orderable_Table_Ordering_Pro_Checkout',
		);

		Orderable_Helpers::load_classes( $classes, 'table-ordering-pro', ORDERABLE_PRO_MODULES_PATH );
	}

	/**
	 * Define settings page.
	 *
	 * @param bool $bool Whether it's a settings page.
	 *
	 * @return bool
	 */
	public static function is_settings_page( $bool = false ) {
		global $current_screen;

		if ( is_null( $current_screen ) || 'orderable_tables' !== $current_screen->id ) {
			return $bool;
		}

		return true;
	}

	/**
	 * Register post type.
	 */
	public static function register_post_type() {
		$labels = Orderable_Helpers::prepare_post_type_labels(
			array(
				'plural'   => __( 'Tables', 'orderable' ),
				'singular' => __( 'Table', 'orderable' ),
			)
		);

		$labels['all_items'] = __( 'Table Ordering', 'orderable' );

		$args = array(
			'labels'              => $labels,
			'supports'            => array( 'title' ),
			'hierarchical'        => false,
			'public'              => false,
			'show_ui'             => true,
			'show_in_menu'        => 'orderable',
			'show_in_rest'        => true,
			'menu_position'       => 20,
			'show_in_admin_bar'   => true,
			'show_in_nav_menus'   => false,
			'can_export'          => true,
			'has_archive'         => true,
			'exclude_from_search' => true,
			'publicly_queryable'  => false,
			'capability_type'     => 'page',
		);

		register_post_type( 'orderable_tables', $args );
	}

	/**
	 * Initialize meta boxes.
	 */
	public static function init_metabox() {
		add_meta_box(
			'orderable-table-metabox',
			__( 'Table Information', 'orderable-pro' ),
			array( __CLASS__, 'render_table_metabox' ),
			'orderable_tables',
			'normal',
			'default'
		);

		add_meta_box(
			'orderable-qr-code-metabox',
			__( 'QR Code', 'orderable-pro' ),
			array( __CLASS__, 'render_qr_code_metabox' ),
			'orderable_tables',
			'side',
			'default'
		);
	}

	/**
	 * Render table information metabox.
	 */
	public static function render_table_metabox() {
		global $post_id;

		$table = new Orderable_Table_Ordering_Pro_Table( $post_id );

		include Orderable_Helpers::get_template_path( 'admin/table-metabox.php', 'table-ordering-pro', true );
	}

	/**
	 * Render QR code metabox.
	 */
	public static function render_qr_code_metabox() {
		global $post_id;

		$table = new Orderable_Table_Ordering_Pro_Table( $post_id );

		include ORDERABLE_PRO_PATH . 'inc/modules/table-ordering-pro/templates/admin/qr-code-metabox.php';
	}

	/**
	 * Get random table ID.
	 *
	 * @return string
	 */
	protected static function get_random_table_id() {
		$characters      = 'abcdefghijklmnopqrstuvwxyz0123456789';
		$random_table_id = substr( str_shuffle( $characters ), 0, 5 );

		return empty( $random_table_id ) ? '' : $random_table_id;
	}

	/**
	 * Update table ID.
	 *
	 * Note that we save the table ID in the post_name column.
	 *
	 * @param int    $post_id  Post ID.
	 * @param string $table_id Table ID.
	 */
	protected static function update_table_id( $post_id, $table_id ) {
		remove_action( 'save_post_orderable_tables', array( __CLASS__, 'save_post' ) );

		wp_update_post(
			array(
				'ID'        => $post_id,
				'post_name' => $table_id,
			),
			false,
			false
		);

		add_action( 'save_post_orderable_tables', array( __CLASS__, 'save_post' ), 10, 3 );
	}

	/**
	 * On save table.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post Object.
	 * @param bool    $update  Whether this is an updated post.
	 */
	public static function save_post( $post_id, $post, $update ) {
		if ( $update && empty( $_POST['post_name'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			self::update_table_id( $post_id, self::get_random_table_id() );
		}

		$table    = new Orderable_Table_Ordering_Pro_Table( $post_id );
		$table_id = $table->get_table_id();
		$qr_args  = array();

		// phpcs:ignore WordPress.Security.NonceVerification
		$base_url = empty( $_POST['orderable_base_url'] ) ? '' : esc_url_raw( wp_unslash( $_POST['orderable_base_url'] ) );

		if ( ! is_null( $table_id ) ) {
			$qr_args['table_id'] = $table_id;
		}

		if ( ! empty( $base_url ) ) {
			$table->update_meta_base_url( $base_url );
			$qr_args['base_url'] = $base_url;
		}

		if ( ! empty( $qr_args ) ) {
			$table->update_qr( $qr_args );
		}
	}

	/**
	 * Get table object by table id.
	 *
	 * @param string $table_id Table ID/Slug.
	 *
	 * @return false|Orderable_Table_Ordering_Pro_Table
	 */
	public static function get_table_by_id( $table_id ) {
		$posts = get_posts(
			array(
				'name'           => $table_id,
				'posts_per_page' => 1,
				'post_type'      => 'orderable_tables',
				'post_status'    => 'publish',
			)
		);

		if ( empty( $posts ) ) {
			return false;
		}

		return new Orderable_Table_Ordering_Pro_Table( $posts[0]->ID );
	}

	/**
	 * Get table ID cookie.
	 *
	 * @return bool|string
	 */
	public static function get_table_id_cookie() {
		if ( ! isset( $_COOKIE[ self::$cookie_key_table_id ] ) ) {
			return false;
		}

		return wp_kses( wp_unslash( $_COOKIE[ self::$cookie_key_table_id ] ), 'strip' );
	}

	/**
	 * Get table from cookie.
	 *
	 * @return false|Orderable_Table_Ordering_Pro_Table
	 */
	public static function get_table_from_cookie() {
		$table_id = self::get_table_id_cookie();

		if ( ! $table_id ) {
			return false;
		}

		$table = self::get_table_by_id( $table_id );

		if ( ! $table ) {
			return false;
		}

		return $table;
	}

	/**
	 * Set table ID cookie.
	 */
	public static function set_table_id_cookie() {
		if ( empty( $_GET['table'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}

		$table_id = sanitize_text_field( wp_unslash( $_GET['table'] ) ); // phpcs:ignore WordPress.Security.NonceVerification

		if ( ! $table_id ) {
			return;
		}

		$table = self::get_table_by_id( $table_id );

		if ( ! $table ) {
			return;
		}

		setcookie( self::$cookie_key_table_id, $table_id, strtotime( '+1 day' ), '/' );
	}

	/**
	 * Unset table ID cookie.
	 */
	public static function unset_table_id_cookie() {
		setcookie( self::$cookie_key_table_id, '', strtotime( '-1 day' ), '/' );
	}
}
