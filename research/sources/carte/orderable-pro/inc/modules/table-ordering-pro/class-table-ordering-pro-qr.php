<?php

/**
 * Module: Table Ordering Pro - QR Codes.
 *
 * @package Orderable/Classes
 */
defined( 'ABSPATH' ) || exit;

/**
 * Tip module class.
 */
class Orderable_Table_Ordering_Pro_Qr {
	/**
	 * QR Generator API.
	 *
	 * @var string
	 */
	public static $api_url = 'https://image-charts.com/chart?cht=qr&chs=300x300';

	/**
	 * Generate QR code.
	 *
	 * @param string $url     URL to encode as a QR code.
	 * @param int    $post_id Post ID.
	 *
	 * @return array|bool
	 */
	public static function generate_qr( $url, $post_id = 0 ) {
		$api_url = add_query_arg(
			array(
				'chl'  => rawurlencode( $url ),
				'chof' => '.png',
			),
			self::$api_url
		);

		/**
		 * Filter the API URL to generate the QR Code image.
		 *
		 * @since 1.13.0
		 * @hook orderable_pro_qr_code_api_url
		 * @param  string $api_url The API URL to generate the QR Code image.
		 * @param  int    $post_id The post ID of table.
		 * @return string New value
		 */
		$api_url = apply_filters( 'orderable_pro_qr_code_api_url', $api_url, $post_id );

		$file_name = sprintf( 'qr-code-%d.png', $post_id );

		$upload = Orderable_Helpers::add_to_media( $api_url, $post_id, $file_name );

		if ( ! $upload ) {
			return false;
		}

		return array(
			'attachment_id' => $upload,
			'api_url'       => $api_url,
		);
	}
}
