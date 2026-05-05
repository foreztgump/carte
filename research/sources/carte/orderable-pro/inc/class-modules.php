<?php
/**
 * Pro Module methods.
 *
 * Load individual modules of Orderable plugin, if they exist.
 *
 * @package Orderable_Pro/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Pro Modules class.
 */
class Orderable_Pro_Modules {
	/**
	 * Init.
	 */
	public static function run() {
		self::load_modules();
	}

	/**
	 * Load pro modules.
	 */
	private static function load_modules() {
		$modules = array(
			'timings-pro',
			'addons-pro',
			'cart-bumps-pro',
			'layouts-pro',
			'tip-pro',
			'checkout-pro',
			'timed-products-pro',
			'custom-order-status-pro',
			'nutritional-info-pro',
			'table-ordering-pro',
			'allergen-info-pro',
			'notifications-pro',
			'product-labels-pro',
			'multi-location-pro',
		);

		foreach ( $modules as $module ) {
			$path = ORDERABLE_PRO_MODULES_PATH . $module . '/class-' . $module . '.php';

			if ( ! file_exists( $path ) ) {
				continue;
			}

			$class_name = Orderable_Modules::get_module_class_name( $module );

			require_once $path;

			if ( ! class_exists( $class_name ) ) {
				continue;
			}

			$class_name::run();
		}
	}
}
