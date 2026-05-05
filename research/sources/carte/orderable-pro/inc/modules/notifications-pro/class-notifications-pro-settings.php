<?php
/**
 * Notifications Pro settings.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Notifications Pro settings class.
 */
class Orderable_Notifications_Pro_Settings {
	/**
	 * Init.
	 */
	public static function run() {
		remove_filter( 'wpsf_register_settings_orderable', array( 'Orderable_Notifications', 'register_settings' ), 10 );
		add_filter( 'wpsf_register_settings_orderable', array( __CLASS__, 'register_settings' ), 20 );
		add_action( 'update_option_orderable_settings', array( __CLASS__, 'on_save' ), 10, 3 );
	}

	/**
	 * Register settings.
	 *
	 * @param array $settings Settings.
	 *
	 * @return array
	 */
	public static function register_settings( $settings = array() ) {
		$settings['tabs'][] = array(
			'id'       => 'notifications',
			'title'    => __( 'Notifications', 'orderable-pro' ),
			'priority' => 50,
		);

		$settings['sections'][] = array(
			'tab_id'              => 'notifications',
			'section_id'          => 'notification',
			'section_title'       => __( 'Notification Settings', 'orderable-pro' ),
			'section_description' => '',
			'section_order'       => 0,
			'fields'              => array(
				array(
					'id'          => 'admin_number',
					'title'       => __( 'Admin phone number', 'orderable-pro' ),
					'type'        => 'text',
					'subtitle'    => __( 'Enter the number where you would like to receive admin notifications.', 'orderable-pro' ),
					'default'     => '',
					'placeholder' => '+' . Orderable_Notifications_Pro_Countries::get_phone_code_for_country( WC()->countries->get_base_country() ) . ' 1234567890',
				),
				array(
					'id'       => 'optin_field_label',
					'title'    => __( 'Optin Field label', 'orderable-pro' ),
					'type'     => 'text',
					'subtitle' => __( 'Label for the Optin field. If left empty, the optin checkbox will be disabled, and all customers will receive notifications.', 'orderable-pro' ),
					'default'  => 'Send me order updates via SMS/WhatsApp',
				),
				array(
					'id'       => 'optin_field_checked',
					'title'    => __( 'Optin checkbox checked by default', 'orderable-pro' ),
					'type'     => 'checkbox',
					'subtitle' => __( 'If enabled, the opt-in checkbox will be on checked state by default.', 'orderable-pro' ),
					'default'  => '1',
				),
				array(
					'id'       => 'enable_logging',
					'title'    => __( 'Enable Logging', 'orderable-pro' ),
					'subtitle' => __( 'Check to enable logging error messages to WooCommerce logs.', 'orderable-pro' ),
					'type'     => 'checkbox',
					'default'  => '',
				),
			),
		);

		$settings['sections'][] = array(
			'tab_id'              => 'notifications',
			'section_id'          => 'twillio',
			'section_title'       => __( 'Twillio Integration', 'orderable-pro' ),
			// translators: %s is the URL of the article.
			'section_description' => sprintf( __( 'To send SMS messages, follow our <a href="%s" target="_blank">Twilio integration guide</a>.', 'orderable-pro' ), 'https://orderable.com/docs/send-sms-order-notifications-via-twilio/' ),
			'section_order'       => 1,
			'fields'              => array(
				array(
					'id'       => 'account_sid',
					'title'    => __( 'Account SID', 'orderable-pro' ),
					'subtitle' => __( 'Can be found in Twillio at Messaging > Overview.', 'orderable-pro' ),
					'type'     => 'text',
					'default'  => '',
				),
				array(
					'id'       => 'auth_token',
					'title'    => __( 'Auth Token', 'orderable-pro' ),
					'subtitle' => __( 'Can be found at in Twillio at Messaging > Overview.', 'orderable-pro' ),
					'type'     => 'password',
					'default'  => '',
				),
				array(
					'id'       => 'messaging_service_sid',
					'title'    => __( 'Messaging Service SID', 'orderable-pro' ),
					'subtitle' => __( 'Can be found at in Twillio at Messaging > Services.', 'orderable-pro' ),
					'type'     => 'text',
					'default'  => '',
				),
			),
		);

		$settings['sections'][] = array(
			'tab_id'              => 'notifications',
			'section_id'          => 'whatsapp',
			'section_title'       => __( 'WhatsApp Integration', 'orderable-pro' ),
			// translators: %s is the URL of the article.
			'section_description' => sprintf( __( 'To send WhatsApp messages, follow our <a href="%s" target="_blank">WhatsApp integration guide</a>.', 'orderable-pro' ), 'https://orderable.com/docs/whatsapp-order-notifications/' ),
			'section_order'       => 1,
			'fields'              => array(
				array(
					'id'      => 'app_id',
					'title'   => __( 'Facebook APP ID', 'orderable-pro' ),
					'type'    => 'text',
					'default' => '',
				),
				array(
					'id'      => 'app_secret',
					'title'   => __( 'Facebook APP Secret', 'orderable-pro' ),
					'type'    => 'password',
					'default' => '',
				),
				array(
					'id'      => 'token',
					'title'   => __( 'Token', 'orderable-pro' ),
					'type'    => 'text',
					'default' => '',
				),
				array(
					'id'      => 'whatsapp_from_id',
					'title'   => __( 'WhatsApp From Number ID', 'orderable-pro' ),
					'type'    => 'text',
					'default' => '',
				),
				array(
					'id'      => 'business_id',
					'title'   => __( 'WhatsApp Business Account ID', 'orderable-pro' ),
					'type'    => 'text',
					'default' => '',
				),
			),
		);

		return $settings;
	}

	/**
	 * Delete cache when setting is saved.
	 *
	 * @param mixed  $old_value Old value.
	 * @param mixed  $new_value New value.
	 * @param string $option    Option.
	 */
	public static function on_save( $old_value, $new_value, $option ) {
		$watch = array( 'notifications_whatsapp_app_id', 'notifications_whatsapp_app_secret', 'notifications_whatsapp_token', 'notifications_whatsapp_whatsapp_from_id', 'notifications_whatsapp_business_id' );

		if ( ! is_array( $old_value ) || ! is_array( $new_value ) ) {
			return;
		}

		$clear_cache = false;

		foreach ( $watch as $key ) {
			if ( isset( $old_value[ $key ] ) && isset( $new_value[ $key ] ) && $old_value[ $key ] !== $new_value[ $key ] ) {
				$clear_cache = true;
				break;
			}
		}

		if ( $clear_cache ) {
			delete_option( 'orderable_fb_access_token' );
			delete_transient( 'orderable_whatsapp_templates' );
		}
	}
}
