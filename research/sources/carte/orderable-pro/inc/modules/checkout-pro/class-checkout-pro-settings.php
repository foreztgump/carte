<?php
/**
 * Checkout Pro settings.
 *
 * @package Orderable/Classes
 */
defined( 'ABSPATH' ) || exit;

/**
 * Checkout Pro settings class.
 */
class Orderable_Checkout_Pro_Settings {
	/**
	 * Init.
	 */
	public static function run() {
		add_filter( 'orderable_default_settings', array( __CLASS__, 'default_settings' ) );
		remove_filter( 'wpsf_register_settings_orderable', array( 'Orderable_Checkout', 'register_settings' ), 10 );
		add_filter( 'wpsf_register_settings_orderable', array( __CLASS__, 'register_settings' ), 20 );
	}

	/**
	 * Add default settings.
	 *
	 * @param array $default_settings
	 *
	 * @return array
	 */
	public static function default_settings( $default_settings = array() ) {
		$default_settings['checkout_general_override_checkout'] = '';
		$default_settings['checkout_general_enable_logo']       = '';
		$default_settings['checkout_general_checkout_logo']     = '';
		$default_settings['checkout_general_link_to_store']     = '';

		return $default_settings;
	}

	/**
	 * Register settings.
	 *
	 * @param array $settings
	 *
	 * @return array
	 */
	public static function register_settings( $settings = array() ) {
		$settings['tabs'][] = array(
			'id'       => 'checkout',
			'title'    => __( 'Checkout Settings', 'orderable-pro' ),
			'priority' => 20,
		);

		$settings['sections'][] = array(
			'tab_id'              => 'checkout',
			'section_id'          => 'general',
			'section_title'       => __( 'Checkout Settings', 'orderable-pro' ),
			'section_description' => '',
			'section_order'       => 0,
			'fields'              => array(
				array(
					'id'       => 'override_checkout',
					'title'    => __( 'Enable Custom Checkout', 'orderable-pro' ),
					'subtitle' => __( "When enabled, your theme's checkout will be replaced by Orderable's optimized checkout experience.", 'orderable-pro' ),
					'type'     => 'checkbox',
					'default'  => '',
				),
				array(
					'id'       => 'enable_logo',
					'title'    => __( 'Show Logo', 'orderable-pro' ),
					'subtitle' => __( 'Show logo on checkout page.', 'orderable-pro' ),
					'type'     => 'checkbox',
					'default'  => '',
				),
				array(
					'id'       => 'checkout_logo',
					'title'    => __( 'Logo Upload', 'orderable-pro' ),
					'subtitle' => __( 'Upload logo to display on checkout page.', 'orderable-pro' ),
					'type'     => 'file',
					'default'  => '',
				),
				array(
					'id'       => 'link_to_store',
					'title'    => __( 'Logo Link', 'orderable-pro' ),
					'subtitle' => __( 'Link the logo to a page on your website.', 'orderable-pro' ),
					'type'     => 'select',
					'default'  => '',
					'choices'  => self::get_page_options(),
				),
			),
		);

		return $settings;
	}

	/**
	 * Get page options.
	 *
	 * @return array
	 */
	public static function get_page_options() {
		$options = array(
			__( 'No Link', 'orderable-pro' ),
		);
		$pages   = get_pages();

		if ( empty( $pages ) ) {
			return $options;
		}

		foreach ( $pages as $page ) {
			$options[ $page->ID ] = $page->post_title;
		}

		return $options;
	}

	/**
	 * Check if override checkout option is enable.
	 */
	public static function is_override_checkout() {
		$override_checkout = Orderable_Settings::get_setting( 'checkout_general_override_checkout' );

		if ( $override_checkout ) {
			return true;
		}

		return false;
	}
}
