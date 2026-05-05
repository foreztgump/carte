<?php
/**
 * Checkout Order Date Extend Store API.
 *
 * @package orderable
 */

/**
 * Class for extending the Store API.
 */
class Checkout_Pro_Order_Time_Extend_Store_API {
	/**
	 * Extend the cart schema.
	 *
	 * @return array
	 */
	public static function extend_cart_schema() {
		return array(
			'endpoint'        => Automattic\WooCommerce\StoreApi\Schemas\V1\CartSchema::IDENTIFIER,
			'namespace'       => 'orderable-pro/order-service-time',
			'data_callback'   => function () {
				$service       = Orderable_Services::get_selected_service();
				$data          = array(
					// Translators: %s Service type.
					'serviceTimeLabel' => sprintf( __( '%s Time', 'orderable' ), esc_html( $service ) ),
				);

				return $data;
			},
			'schema_callback' => function () {
				return array(
					'serviceTimeLabel'               => array(
						'description' => __( 'Service time label field', 'orderable-pro' ),
						'type'        => 'string',
						'readonly'    => true,
					),
					'shouldSelectFirstAvailableTime' => array(
						'description' => __( 'Service time label field', 'orderable-pro' ),
						'type'        => 'bool',
						'readonly'    => true,
					),
				);
			},
			'schema_type'     => ARRAY_A,
		);
	}

	/**
	 * Extend the checkout schema.
	 *
	 * @return array
	 */
	public static function extend_checkout_schema() {
		return array(
			'endpoint'        => Automattic\WooCommerce\StoreApi\Schemas\V1\CheckoutSchema::IDENTIFIER,
			'namespace'       => 'orderable-pro/order-service-time',
			'schema_callback' => function () {
				return array(
					'time'         => array(
						'description' => 'Order service time',
						'type'        => 'string',
						'context'     => array( 'view', 'edit' ),
						'readonly'    => true,
						'optional'    => true,
					),
					'time-slot-id' => array(
						'description' => 'Order service time slot ID',
						'type'        => 'integer',
						'context'     => array( 'view', 'edit' ),
						'readonly'    => true,
						'optional'    => true,
					),
				);
			},
			'schema_type'     => ARRAY_A,
		);
	}
}
