<?php
/**
 * Notifications Pro Twillio class.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Functions to communicate with Facebook/WhatsApp API.
 */
class Orderable_Notifications_Pro_Whatsapp {

	/**
	 * API URL.
	 *
	 * @var string
	 */
	private static $fb_api_url = 'https://graph.facebook.com/v13.0/';


	/**
	 * Get messaing templates from WhatsApp.
	 *
	 * @param bool $invalidate_cache Invalidate Cache.
	 *
	 * @return false|array
	 */
	public static function get_templates( $invalidate_cache = false ) {
		$cache = get_transient( 'orderable_whatsapp_templates' );

		if ( false !== $cache && ! $invalidate_cache ) {
			return $cache;
		}

		$token = self::get_access_token();

		if ( empty( $token ) ) {
			return false;
		}

		$business_id = Orderable_Settings::get_setting( 'notifications_whatsapp_business_id' );
		$api_url     = sprintf( '%s%s/message_templates?limit=250', self::$fb_api_url, $business_id );

		$args = array(
			'headers' => array(
				'Authorization' => 'Bearer ' . $token,
			),
		);

		$response      = wp_remote_get( $api_url, $args );
		$response_code = wp_remote_retrieve_response_code( $response );

		if ( 200 === $response_code ) {
			$body      = wp_remote_retrieve_body( $response );
			$templates = json_decode( $body, true );
			set_transient( 'orderable_whatsapp_templates', $templates, DAY_IN_SECONDS );

			return $templates;
		}

		return false;
	}

	/**
	 * Returns the single given template.
	 *
	 * @param int $template_id Template ID.
	 *
	 * @return array|false
	 */
	public static function get_template( $template_id ) {
		$templates = self::get_templates();

		if ( empty( $templates ) || empty( $templates['data'] ) || ! is_array( $templates['data'] ) ) {
			return false;
		}

		foreach ( $templates['data'] as $loop_template ) {
			if ( strval( $loop_template['id'] ) === strval( $template_id ) ) {
				return $loop_template;
			}
		}

		return false;
	}

	/**
	 * Send whatsapp message.
	 *
	 * @param string $to          Recipient.
	 * @param int    $template_id Template ID.
	 * @param array  $variables   Variables.
	 *
	 * @return bool
	 */
	public static function send_message( $to, $template_id, $variables = false ) {
		$token    = self::get_access_token();
		$template = self::get_template( $template_id );

		if ( empty( $token ) || empty( $template ) ) {
			return false;
		}

		$from_num_id   = Orderable_Settings::get_setting( 'notifications_whatsapp_whatsapp_from_id' );
		$api_url       = sprintf( '%s%s/messages', self::$fb_api_url, $from_num_id );
		$template_lang = $template['language'];
		$template_name = $template['name'];

		$body = array(
			'messaging_product' => 'whatsapp',
			'to'                => $to,
			'type'              => 'template',
			'template'          => array(
				'name'     => $template_name,
				'language' => array(
					'code' => $template_lang,
				),
			),
		);

		if ( is_array( $variables ) ) {
			$body['template']['components'] = array(
				array(
					'type'       => 'body',
					'parameters' => $variables,
				),
			);
		}

		$args = array(
			'headers' => array(
				'Authorization' => 'Bearer ' . $token,
				'Content-Type'  => 'application/json',
			),
			'body'    => wp_json_encode( $body ),
		);

		$response      = wp_remote_post( $api_url, $args );
		$response_code = wp_remote_retrieve_response_code( $response );
		$response_body = wp_remote_retrieve_body( $response );
		$response_data = json_decode( $response_body, true );

		Orderable_Notifications_Pro_Helper::log(
			array(
				'to'          => $to,
				'template_id' => $template_id,
				'variables'   => $variables,
				'response'    => $response_data,
			)
		);

		return 200 === $response_code && empty( $response_data['error'] );
	}

	/**
	 * Prepare Variables.
	 *
	 * @param array    $notification Notifications.
	 * @param WC_Order $order        Order.
	 *
	 * @return array|false
	 */
	public static function prepare_variables( $notification, $order ) {
		if ( empty( $notification['wa_variables'] ) || empty( $notification['wa_variables'] ) ) {
			return false;
		}

		$return = array();
		foreach ( $notification['wa_variables'] as $variable ) {
			$variable = Orderable_Custom_Order_Status_Pro_Helper::replace_shortcodes( $variable, $order, true );
			$return[] = array(
				'type' => 'text',
				'text' => $variable,
			);
		}

		return $return;
	}

	/**
	 * Refresh the access token.
	 *
	 * @return bool
	 */
	public static function get_access_token() {
		$setting_access_token = Orderable_Settings::get_setting( 'notifications_whatsapp_token' );

		// If token is not present in the setting, we will just return false.
		if ( empty( $setting_access_token ) ) {
			return false;
		}

		$options_access_token_data = get_option( 'orderable_fb_access_token' );

		// Return the access token from options if it is valid.
		if ( is_array( $options_access_token_data ) && ! empty( $options_access_token_data ) && time() < $options_access_token_data['expire'] ) {
			return $options_access_token_data['access_token'];
		}

		// If option token is invalid or expired, fetch a new token.
		return self::refresh_token( $setting_access_token );
	}

	/**
	 * Refresh token.
	 *
	 * @param string $token Token.
	 *
	 * @return string|false
	 */
	public static function refresh_token( $token ) {
		$app_id    = Orderable_Settings::get_setting( 'notifications_whatsapp_app_id' );
		$secret    = Orderable_Settings::get_setting( 'notifications_whatsapp_app_secret' );
		$token_url = 'https://graph.facebook.com/oauth/access_token?client_id=' . sanitize_text_field( $app_id ) . '&client_secret=' . sanitize_text_field( $secret ) . '&grant_type=fb_exchange_token&fb_exchange_token=' . sanitize_text_field( $token );

		$response = wp_remote_get( $token_url );
		$body     = wp_remote_retrieve_body( $response );
		$data     = json_decode( $body, true );

		// If there is an error.
		if ( empty( $data['access_token'] ) ) {
			return false;
		}

		$data['expire'] = time() + intval( $data['expires_in'] );

		update_option( 'orderable_fb_access_token', $data );

		return $data['access_token'];
	}
}
