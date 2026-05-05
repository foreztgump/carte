<?php
/**
 * Checkout Order Date Blocks Integration.
 *
 * @package orderable
 */

use Automattic\WooCommerce\Blocks\Integrations\IntegrationInterface;

/**
 * Class for integrating with WooCommerce Blocks
 */
class Checkout_Pro_Order_Time_Blocks_Integration implements IntegrationInterface {

	/**
	 * The name of the integration.
	 *
	 * @return string
	 */
	public function get_name() {
		return 'orderable-pro';
	}

	/**
	 * When called invokes any initialization/setup for the integration.
	 */
	public function initialize() {
		$this->register_checkout_block_frontend_scripts();
		$this->register_checkout_block_editor_scripts();
		$this->register_main_integration();
	}

	/**
	 * Returns an array of script handles to enqueue in the frontend context.
	 *
	 * @return string[]
	 */
	public function get_script_handles() {
		return array( 'orderable-pro-order-time-blocks-integration', 'orderable-pro-order-time-block-frontend' );
	}

	/**
	 * Returns an array of script handles to enqueue in the editor context.
	 *
	 * @return string[]
	 */
	public function get_editor_script_handles() {
		return array( 'orderable-pro-order-time-blocks-integration', 'checkout-pro-order-time-block-editor' );
	}

	/**
	 * An array of key, value pairs of data made available to the block on the client side.
	 *
	 * @return array
	 */
	public function get_script_data() {
		$data = array();

		return $data;
	}

	/**
	 * Registers the frontend block scripts.
	 */
	public function register_checkout_block_frontend_scripts() {
		$script_path       = '/build/checkout-pro-order-time-block-frontend.js';
		$script_url        = plugins_url( $script_path, __FILE__ );
		$script_asset_path = __DIR__ . '/build/checkout-pro-order-time-block-frontend.asset.php';
		$script_asset      = file_exists( $script_asset_path )
			? require $script_asset_path
			: array(
				'dependencies' => array(),
				'version'      => ORDERABLE_PRO_VERSION,
			);

		wp_register_script(
			'orderable-pro-order-time-block-frontend',
			$script_url,
			$script_asset['dependencies'],
			$script_asset['version'],
			true
		);
	}

	/**
	 * Registers the editor block scripts.
	 */
	public function register_checkout_block_editor_scripts() {
		$script_path       = '/build/checkout-pro-order-time-block.js';
		$script_url        = plugins_url( $script_path, __FILE__ );
		$script_asset_path = __DIR__ . '/build/checkout-pro-order-time-block.asset.php';
		$script_asset      = file_exists( $script_asset_path )
			? require $script_asset_path
			: array(
				'dependencies' => array(),
				'version'      => ORDERABLE_PRO_VERSION,
			);

		wp_register_script(
			'checkout-pro-order-time-block-editor',
			$script_url,
			$script_asset['dependencies'],
			$script_asset['version'],
			true
		);
	}

	/**
	 * Registers the main integration JS files.
	 */
	private function register_main_integration() {
		$script_path = '/build/index.js';
		$script_url  = plugins_url( $script_path, __FILE__ );

		$script_asset_path = __DIR__ . '/build/index.asset.php';
		$script_asset      = file_exists( $script_asset_path )
			? require $script_asset_path
			: array(
				'dependencies' => array(),
				'version'      => ORDERABLE_PRO_VERSION,
			);

		wp_register_script(
			'orderable-pro-order-time-blocks-integration',
			$script_url,
			$script_asset['dependencies'],
			$script_asset['version'],
			true
		);
	}

	/**
	 * Save the order service date fields.
	 *
	 * @param WC_Order        $order The order object.
	 * @param WP_REST_Request $request The request object.
	 */
	public static function save_order_service_time_fields( $order, $request ) {
		$orderable_pro_request_data = $request['extensions']['orderable-pro/order-service-time'] ?? false;

		if ( empty( $orderable_pro_request_data['time'] ) || 'All Day' === $orderable_pro_request_data['time'] ) {
			return;
		}

		if ( 'asap' === $orderable_pro_request_data['time'] ) {
			$orderable_pro_request_data['time'] = __( 'As Soon As Possible', 'orderable-pro' );

			$order->update_meta_data( 'orderable_order_time', $orderable_pro_request_data['time'] );

			$order->save();

			return;
		}

		$order_time = $orderable_pro_request_data['time'];

		$hours       = substr( $order_time, 0, 2 );
		$minutes     = substr( $order_time, 2, 2 );
		$time_format = get_option( 'time_format' );

		$date_and_time = new DateTime( 'now', wp_timezone() );
		$date_and_time->setTime( $hours, $minutes );

		$order_time = $date_and_time->format( $time_format );

		$order->update_meta_data( 'orderable_order_time', $order_time );

		$order->save();
	}
}
