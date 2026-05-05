<?php
/**
 * Module: Custom Order Status Pro.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Status class.
 */
class Orderable_Custom_Order_Status_Pro_Helper {
	/**
	 * Status data.
	 *
	 * @var array
	 */
	public static $statuses = array();

	/**
	 * Returns all the custom order statuses and their revelent data like slug, notification etc.
	 *
	 * @param bool $include_disabled Whether to include the disabled order statuses.
	 *
	 * @return array
	 */
	public static function get_custom_order_statuses( $include_disabled = false ) {
		$cache_key = sprintf( 'orderable_cos_custom_order_statuses_%s', $include_disabled ? '1' : '0' );
		$cache     = wp_cache_get( $cache_key );

		if ( false !== $cache ) {
			return apply_filters( 'orderable_cos_custom_order_statuses', $cache, $include_disabled );
		}

		$args = array(
			'post_type'      => Orderable_Custom_Order_Status_Pro::$cpt_key,
			'post_status'    => 'publish',
			'posts_per_page' => 500,
		);

		$status_posts = get_posts( $args );
		$statuses     = array();

		foreach ( $status_posts as &$status_post ) {
			$status_post->data = Orderable_Custom_Order_Status_Pro_Admin::get_order_settings( $status_post->ID );

			if ( '1' === $status_post->data['enable'] || $include_disabled ) {
				$statuses[ $status_post->data['slug'] ] = $status_post;
			}
		}

		wp_cache_set( $cache_key, $statuses );

		/**
		 * All custom order statuses and their revelent data like slug, notification etc.
		 *
		 * @param array $statuses
		 * @param bool  $include_disabled
		 */
		return apply_filters( 'orderable_cos_custom_order_statuses', $statuses, $include_disabled );
	}

	/**
	 * Get all order status.
	 *
	 * @return array
	 */
	public static function get_all_order_status() {
		$statuses       = wc_get_order_statuses();
		$clean_statuses = array();

		foreach ( $statuses as $status_key => $status ) {
			$status_key                    = str_replace( 'wc-', '', $status_key );
			$clean_statuses[ $status_key ] = $status;
		}

		return $clean_statuses;
	}

	/**
	 * Get core order statuses.
	 *
	 * @return array
	 */
	public static function get_core_order_statuses() {
		$core_statuses = array();

		foreach ( Orderable_Custom_Order_Status_Pro::$core_order_statuses as $key => $status ) {
			$key                   = str_replace( 'wc-', '', $key );
			$core_statuses[ $key ] = $status;
		}

		/**
		 * Core order statuses.
		 */
		return apply_filters( 'orderable_cos_get_core_order_statuses', $core_statuses );
	}

	/**
	 * Get order status by slug.
	 *
	 * @param string $slug Order status slug.
	 *
	 * @return object
	 */
	public static function get_custom_order_status_by_slug( $slug ) {
		$statuses = self::get_custom_order_statuses();

		if ( empty( $statuses ) ) {
			return false;
		}

		foreach ( $statuses as $status ) {
			if ( $slug === $status->data['slug'] ) {
				return $status;
			}
		}

		return false;
	}


	/**
	 * Replace shortcodes.
	 *
	 * @param string   $subject    Subject string.
	 * @param WC_Order $order      Order object.
	 * @param bool     $plain_text If it for a plain text email.
	 *
	 * @return string
	 */
	public static function replace_shortcodes( $subject, $order, $plain_text = false ) {
		if ( empty( $order ) ) {
			return $subject;
		}

		$status_title = $order->get_status();
		$status       = self::get_custom_order_status_by_slug( $order->get_status() );

		if ( ! empty( $status ) && ! empty( $status->data ) ) {
			$status_title = $status->data['title'];
		}

		$seperator  = $plain_text ? "\n" : '<br />';
		$shortcodes = array(
			'customer_fname'    => $order->get_billing_first_name(),
			'customer_lname'    => $order->get_billing_last_name(),
			'customer_fullname' => $order->get_formatted_billing_full_name(),
			'order_id'          => $order->get_id(),
			'order_date'        => $order->get_date_created()->date_i18n( wc_date_format() ),
			'order_status'      => $status_title,
			'order_details'     => Orderable_Notifications_Pro::get_order_summary( $order ),
			'billing_address'   => self::get_formatted_address( 'billing', $order, $seperator ),
			'shipping_address'  => self::get_formatted_address( 'shipping', $order, $seperator ),
			'service_date'      => $order->get_meta( 'orderable_order_date', true ),
			'service_time'      => $order->get_meta( 'orderable_order_time', true ),
		);

		foreach ( $shortcodes as $key => $value ) {
			$subject = str_replace( '{' . $key . '}', $value, $subject );
		}

		/**
		 * The string after replacing the shortcodes.
		 *
		 * @param string   $subject    Subject string.
		 * @param WC_Order $order      Order object.
		 * @param bool     $plain_text If it for a plain text email.
		 */
		return apply_filters( 'orderable_cos_replace_shortcodes', $subject, $order, $plain_text );
	}

	/**
	 * Get formatted address.
	 *
	 * @param string   $type      Address type i.e. billing or shipping.
	 * @param WC_Order $order     Order object.
	 * @param string   $seperator Seperator.
	 *
	 * @return string
	 */
	public static function get_formatted_address( $type, $order, $seperator ) {
		$raw_address = apply_filters( 'woocommerce_order_formatted_billing_address', $order->get_address( $type ), $order );
		$address     = WC()->countries->get_formatted_address( $raw_address, $seperator );

		/**
		 * Formatted address.
		 */
		return apply_filters( 'orderable_cos_get_formatted_address', $address );
	}
}
