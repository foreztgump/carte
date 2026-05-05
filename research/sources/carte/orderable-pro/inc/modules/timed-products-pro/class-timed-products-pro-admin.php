<?php
/**
 * Module: Timed Products Pro.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Timed Products Pro Settings class.
 */
class Orderable_Timed_Products_Pro_Admin {
	/**
	 * Init.
	 */
	public static function run() {
		add_action( 'init', array( __CLASS__, 'register_cpt' ), 100 );
		add_action( 'load-post.php', array( __CLASS__, 'init_metaboxes' ) );
		add_action( 'load-post-new.php', array( __CLASS__, 'init_metaboxes' ) );
		add_action( 'save_post', array( __CLASS__, 'save_metabox' ) );
	}


	/**
	 * Register Custom Post Type.
	 */
	public static function register_cpt() {
		$labels = array(
			'plural'   => __( 'Timed Products', 'orderable-pro' ),
			'singular' => __( 'Timed Products Rule', 'orderable-pro' ),
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
			'has_archive'         => true,
			'exclude_from_search' => true,
			'publicly_queryable'  => false,
			'capability_type'     => 'product',
		);

		register_post_type( 'timed_prod_condition', $args );
	}

	/**
	 * Initialize meta boxes.
	 */
	public static function init_metaboxes() {
		add_meta_box(
			'orderable-timed-product-rules-metabox',
			__( 'Rules', 'orderable-pro' ),
			array( __CLASS__, 'output_time_rules_metabox' ),
			'timed_prod_condition',
			'advanced',
			'default'
		);

		add_meta_box(
			'orderable-timed-product-product-conditions',
			__( 'Conditions', 'orderable-pro' ),
			array( __CLASS__, 'render_conditions_metabox' ),
			'timed_prod_condition',
			'advanced',
			'default'
		);
	}

	/**
	 * Render date/time metabox.
	 *
	 * @param WP_Post $post Post object.
	 */
	public static function output_time_rules_metabox( $post ) {
		$rules_json = get_post_meta( $post->ID, '_orderable_time_rules', true );
		$rules_json = wp_json_encode( $rules_json );

		include Orderable_Helpers::get_template_path( 'admin/timed-products-rules-metabox.php', 'timed-products-pro', true );
	}

	/**
	 * Display Product/categories metabox.
	 *
	 * @param WP_Post $post Post object.
	 *
	 * @return void
	 */
	public static function render_conditions_metabox( $post ) {
		$conditions      = get_post_meta( $post->ID, '_orderable_timed_products_condition', true );
		$conditions_json = wp_json_encode( $conditions );

		$messages = array(
			'no_condition'      => __( 'If you do not add any conditions, this time rule will not apply for any product.', 'orderable-pro' ),
			'rules_description' => __( 'Add a set of rules to select the products for which these time rules will apply.', 'orderable-pro' ),
		);

		include ORDERABLE_PRO_PATH . 'templates/admin/conditions-metabox.php';
	}

	/**
	 * Save metabox data.
	 *
	 * @param int $post_id Post ID.
	 */
	public static function save_metabox( $post_id ) {
		// Bail out if post type is not 'timed_prod_condition'.
		if ( 'timed_prod_condition' !== get_post_type( $post_id ) ) {
			return;
		}

		// Save time rule metabox.
		$time_data = filter_input( INPUT_POST, 'orderable-timed-products-conditions' );

		if ( $time_data ) {
			$time_data = json_decode( $time_data, true );
			update_post_meta( $post_id, '_orderable_time_rules', $time_data );
		}

		// Save conditions metabox.
		$conditions_data = filter_input( INPUT_POST, 'orderable-pro-conditions' );

		if ( $conditions_data ) {
			$conditions_data = json_decode( $conditions_data, true );
			update_post_meta( $post_id, '_orderable_timed_products_condition', $conditions_data );
		}
	}
}
