<?php

/**
 * Module: Table Ordering Pro - Table.
 *
 * @package Orderable/Classes
 */
defined( 'ABSPATH' ) || exit;

/**
 * Tip module class.
 */
class Orderable_Table_Ordering_Pro_Table {
	/**
	 * Post ID.
	 *
	 * @var int
	 */
	public $post_id;
	/**
	 * Post Object.
	 *
	 * @var WP_Post
	 */
	public $post;
	/**
	 * QR Generator API URL Key.
	 *
	 * @var string
	 */
	public static $key_table_url = '_orderable_qr_api_url';
	/**
	 * QR Attachment ID Key.
	 *
	 * @var string
	 */
	public static $key_qr_id = '_orderable_qr_id';
	/**
	 * Table base URL.
	 *
	 * @var string
	 */
	public static $key_base_url = '_orderable_table_base_url';

	/**
	 * Orderable_Table_Ordering_Pro_Table constructor.
	 *
	 * @param int $post_id Table post ID.
	 */
	public function __construct( $post_id ) {
		$this->post_id = $post_id;
		$this->post    = get_post( $post_id );
	}

	/**
	 * Get table ID/slug.
	 *
	 * @return string
	 */
	public function get_table_id() {
		return empty( $this->post->post_name ) ? '' : $this->post->post_name;
	}

	/**
	 * Get table title.
	 *
	 * @return string
	 */
	public function get_title() {
		return $this->post ? $this->post->post_title : '';
	}

	/**
	 * Get base URL.
	 *
	 * @return int|string
	 */
	public function get_meta_base_url() {
		$base_url = get_post_meta( $this->post_id, self::$key_base_url, true );

		return empty( $base_url ) ? get_bloginfo( 'url' ) : $base_url;
	}

	/**
	 * Get Meta: URL used for table in the QR API.
	 *
	 * @return bool|int
	 */
	public function get_meta_qr_api_url() {
		return get_post_meta( $this->post_id, self::$key_table_url, true );
	}

	/**
	 * Get Meta: QR Image Attachment ID.
	 *
	 * @return bool|int
	 */
	public function get_meta_qr_id() {
		return get_post_meta( $this->post_id, self::$key_qr_id, true );
	}

	/**
	 * Update Meta: Base URL.
	 *
	 * @param string $value Base URL.
	 *
	 * @return bool|int
	 */
	public function update_meta_base_url( $value ) {
		return update_post_meta( $this->post_id, self::$key_base_url, $value );
	}

	/**
	 * Update Meta: URL used for table in the QR API.
	 *
	 * @param string $value URL used for table in the QR API.
	 *
	 * @return bool|int
	 */
	public function update_meta_qr_api_url( $value ) {
		return update_post_meta( $this->post_id, self::$key_table_url, $value );
	}

	/**
	 * Update Meta: QR Image Attachment ID.
	 *
	 * @param int $value QR Image Attachment ID.
	 *
	 * @return bool|int
	 */
	public function update_meta_qr_id( $value ) {
		return update_post_meta( $this->post_id, self::$key_qr_id, $value );
	}

	/**
	 * Update QR code for table.
	 *
	 * @param array $args Array of args.
	 */
	public function update_qr( $args = array() ) {
		$defaults = array(
			'table_id' => $this->get_table_id(),
			'base_url' => $this->get_meta_base_url(),
		);

		$args = wp_parse_args( $args, $defaults );

		$previous_qr_api_url = $this->get_meta_qr_api_url();

		$api_args = array(
			'table' => $args['table_id'],
		);

		$api_url = add_query_arg( $api_args, $args['base_url'] );

		if ( $previous_qr_api_url === $api_url ) {
			return;
		}

		$qr_code = Orderable_Table_Ordering_Pro_Qr::generate_qr( $api_url, $this->post_id );

		if ( ! $qr_code ) {
			// @todo Throw admin notice error
			return;
		}

		$this->update_meta_qr_api_url( $api_url );
		$this->update_meta_qr_id( $qr_code['attachment_id'] );
	}
}
