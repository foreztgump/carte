<?php
/**
 * Notifications Pro Twillio class.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Functions to communicate with Twillio.
 */
class Orderable_Notifications_Pro_Twillio {

	/**
	 * Send Message.
	 *
	 * @param string $to  To Number.
	 * @param string $msg Message to send.
	 *
	 * @return bool
	 */
	public static function send_message( $to, $msg ) {
		$account_id = Orderable_Settings::get_setting( 'notifications_twillio_account_sid' );
		$auth_token = Orderable_Settings::get_setting( 'notifications_twillio_auth_token' );
		$service_id = Orderable_Settings::get_setting( 'notifications_twillio_messaging_service_sid' );

		if ( empty( $account_id ) || empty( $auth_token ) ) {
			return false;
		}

		// $service_id is required for sms.
		if ( empty( $service_id ) ) {
			return false;
		}

		$url = sprintf( 'https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json', $account_id );

		$args = array(
			'body'    => array(
				'To'                  => $to,
				'Body'                => $msg,
				'MessagingServiceSid' => $service_id,
			),
			'headers' => array(
				// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Can't make basic authentication work without base64_encode.
				'Authorization' => 'Basic ' . base64_encode( $account_id . ':' . $auth_token ),
			),
		);

		$response      = wp_remote_post( $url, $args );
		$response_body = wp_remote_retrieve_body( $response );
		$response_code = wp_remote_retrieve_response_code( $response );

		if ( $response_code > 200 && $response_code < 300 ) {
			Orderable_Notifications_Pro_Helper::log( 'message sent' );
			Orderable_Notifications_Pro_Helper::log( $response_body );
			return true;
		} else {
			Orderable_Notifications_Pro_Helper::log( $response_body );
			return false;
		}
	}
}
