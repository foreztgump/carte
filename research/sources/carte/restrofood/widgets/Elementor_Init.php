<?php
namespace RestroFood\widgets;
/**
 *
 * @package     Restrofood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 *
 */

 // Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Elementor_Init {

	public static function init() {
		add_action( 'elementor/elements/categories_registered', [ __CLASS__, 'categories' ] );
		add_action( 'elementor/widgets/register', [ __CLASS__, 'widgets' ] );
	}

	public static function categories( $elements_manager ) {

		$elements_manager->add_category(
			'restrofood-elements-category',
			[
				'title' => esc_html__( 'Restrofood Plugin', 'restrofood' ),
				'icon' => 'fa fa-plug',
			]
		);

	}

	public static function widgets( $widgets_manager ) {

		require_once( RESTROFOOD_DIR_PATH . 'widgets/Falsh_Sale_Products.php' );
		require_once( RESTROFOOD_DIR_PATH . 'widgets/Products_Card.php' );
		//
		$widgets_manager->register( new Products_Card());
		$widgets_manager->register( new Falsh_Sale_Products());

	}
	


}

Elementor_Init::init();