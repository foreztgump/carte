<?php
/**
 * Code specific to creating and managing Blocks.
 *
 * @package Orderable/Classes
 */

/**
 * Blocks specific functions.
 */
class Orderable_Pro_Blocks {
	/**
	 * Initialize.
	 */
	public static function run() {
		add_action( 'init', array( __CLASS__, 'register_blocks' ) );
	}

	/**
	 * Register blocks.
	 *
	 * @return void
	 */
	public static function register_blocks() {
		if ( ! function_exists( 'register_block_type' ) ) {
			return;
		}

		register_block_type(
			ORDERABLE_PRO_PATH . '/assets/blocks/mini-locator',
			array(
				'render_callback' => array( 'Orderable_Multi_Location_Pro_Frontend', 'shortcode_store_mini_locator' ),
			)
		);

		register_block_type(
			ORDERABLE_PRO_PATH . '/assets/blocks/postcode-locator',
			array(
				'render_callback' => array( 'Orderable_Multi_Location_Pro_Frontend', 'shortcode_store_postcode_locator' ),
			)
		);

		register_block_type(
			ORDERABLE_PRO_PATH . '/assets/blocks/location-picker',
			array(
				'render_callback' => array( 'Orderable_Multi_Location_Pro_Frontend', 'shortcode_store_locator' ),
			)
		);
	}
}
