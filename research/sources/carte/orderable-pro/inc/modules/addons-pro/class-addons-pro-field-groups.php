<?php
/**
 * Module: Addons.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Addons module Field Group class.
 */
class Orderable_Addons_Pro_Field_Groups {
	/**
	 * Initialize.
	 */
	public static function run() {
		add_action( 'init', array( __CLASS__, 'register_post_type' ) );
		add_action( 'load-post.php', array( __CLASS__, 'init_metabox' ) );
		add_action( 'load-post-new.php', array( __CLASS__, 'init_metabox' ) );
		add_action( 'save_post', array( __CLASS__, 'save_metabox' ) );
	}

	/**
	 * Register post type.
	 */
	public static function register_post_type() {
		$labels = array(
			'plural'   => __( 'Product Addons', 'orderable-pro' ),
			'singular' => __( 'Product Addon', 'orderable-pro' ),
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

		register_post_type( 'orderable_addons', $args );
	}

	/**
	 * Initialize meta boxes.
	 */
	public static function init_metabox() {
		add_meta_box(
			'orderable-fields-metabox',
			__( 'Fields', 'orderable-pro' ),
			array( __CLASS__, 'render_fields_metabox' ),
			'orderable_addons',
			'advanced',
			'default'
		);

		add_meta_box(
			'orderable-conditions-metabox',
			__( 'Conditions', 'orderable-pro' ),
			array( __CLASS__, 'render_conditions_metabox' ),
			'orderable_addons',
			'advanced',
			'default'
		);
	}

	/**
	 * Render Fields metabox.
	 *
	 * @param WP_Post $post WP_Post object.
	 *
	 * @return void
	 */
	public static function render_fields_metabox( $post ) {
		$fields_json = self::get_group_data_json( $post->ID );

		include Orderable_Helpers::get_template_path( 'admin/fields-metabox.php', 'addons-pro', true );
	}

	/**
	 * Render Conditions Metabox.
	 *
	 * @param WP_Post $post WP_Post object.
	 *
	 * @return void
	 */
	public static function render_conditions_metabox( $post ) {
		$conditions_json = self::get_group_data_json( $post->ID, 'conditions' );

		$messages = array(
			'no_condition'      => __( 'If you do not add any conditions, this field group will appear for all products.', 'orderable-pro' ),
			'rules_description' => __( 'Add a set of rules to determine when this field group should appear.', 'orderable-pro' ),
		);

		include Orderable_Helpers::get_template_path( 'templates/admin/conditions-metabox.php', false, true );
	}

	/**
	 * Save metabox data.
	 *
	 * @param int $post_id Post ID.
	 *
	 * @return void
	 */
	public static function save_metabox( $post_id ) {
		// Only save if post type is 'orderable_addons'.
		if ( 'orderable_addons' !== get_post_type( $post_id ) ) {
			return;
		}

		$fields_data = filter_input( INPUT_POST, 'orderable-addon-fields' );
		if ( $fields_data ) {
			// Todo security.
			$fields_data = json_decode( $fields_data, true );
			update_post_meta( $post_id, '_orderable_addon_fields', $fields_data );
		}

		$conditions_data = filter_input( INPUT_POST, 'orderable-pro-conditions' );
		if ( $conditions_data ) {
			// Todo security.
			$conditions_data = json_decode( $conditions_data, true );
			update_post_meta( $post_id, '_orderable_addon_conditions', $conditions_data );
		}
	}

	/**
	 * Get group data for the given group ID.
	 *
	 * @param int    $group_id Field group post ID.
	 * @param string $type     Type of data to fetch (fields|conditions)
	 *
	 * @return array
	 */
	public static function get_group_data( $group_id, $type = 'fields' ) {
		$key  = sprintf( '_orderable_addon_%s', $type );
		$data = get_post_meta( $group_id, $key, true );

		if ( ! empty( $data ) ) {
			$data = is_string( $data ) ? json_decode( $data, true ) : $data;
		}

		return apply_filters( 'orderable_get_group_data', $data, $group_id, $type );
	}

	/**
	 * Get group data json for the given group ID.
	 *
	 * @param int    $group_id Field group post ID.
	 * @param string $type     Type of data to fetch (fields|conditions)
	 *
	 * @return string
	 */
	public static function get_group_data_json( $group_id, $type = 'fields' ) {
		$data = self::get_group_data( $group_id, $type );
		$json = json_encode( $data );

		return apply_filters( 'orderable_get_group_data_json', $json, $group_id, $data );
	}

	/**
	 * Get data of a particular field.
	 *
	 * @param int $field_id Field ID.
	 * @param int $group_id Group ID.
	 *
	 * @return array
	 */
	public static function get_field_data( $field_id, $group_id ) {
		$fields = self::get_group_data( $group_id );

		if ( ! is_array( $fields ) ) {
			return false;
		}

		foreach ( $fields as $field ) {
			if ( $field['id'] === (int) $field_id ) {
				return $field;
			}
		}

		return false;
	}
}
