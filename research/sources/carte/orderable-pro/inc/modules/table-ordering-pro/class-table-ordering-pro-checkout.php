<?php
/**
 * Module: Table Ordering Pro Checkout
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Table ordering checkout class.
 */
class Orderable_Table_Ordering_Pro_Checkout {
	/**
	 * Init.
	 */
	public static function run() {
		add_action( 'woocommerce_checkout_order_processed', array( __CLASS__, 'add_table_to_order' ), 10, 3 );
		add_action( 'woocommerce_store_api_checkout_order_processed', array( __CLASS__, 'add_table_to_order' ), 10, 3 );
		add_action( 'woocommerce_review_order_after_order_total', array( __CLASS__, 'add_table_to_order_review' ) );
		add_action( 'woocommerce_checkout_process', array( __CLASS__, 'store_open_hours_validation' ) );

		add_filter( 'woocommerce_cart_needs_shipping', array( __CLASS__, 'cart_needs_shipping' ), 100 );
	}

	/**
	 * Add table to order on checkout.
	 *
	 * @param int|WC_Order $order The order ID or the order object.
	 */
	public static function add_table_to_order( $order ) {
		$table = Orderable_Table_Ordering_Pro::get_table_from_cookie();

		if ( ! $table ) {
			return;
		}

		if ( is_numeric( $order ) ) {
			$order = wc_get_order( $order );
		}

		if ( empty( $order ) ) {
			return;
		}

		$order->add_meta_data( Orderable_Table_Ordering_Pro_Order::$key_table_id, $table->get_table_id() );
		$order->add_meta_data( Orderable_Table_Ordering_Pro_Order::$key_table, $table->get_title() );
		$order->add_meta_data( Orderable_Table_Ordering_Pro_Order::$key_table_post_id, $table->post_id );

		$order->save();

		Orderable_Table_Ordering_Pro::unset_table_id_cookie();
	}

	/**
	 * Add table to order review.
	 */
	public static function add_table_to_order_review() {
		$table = Orderable_Table_Ordering_Pro::get_table_from_cookie();

		if ( ! $table ) {
			return;
		} ?>
		<tr class="orderable-table">
			<th><?php esc_html_e( 'Table', 'orderable-pro' ); ?></th>
			<td><?php echo wp_kses_post( $table->get_title() ); ?></td>
		</tr>
		<?php
	}

	/**
	 * If table cookie exists, shipping is not required.
	 *
	 * @param bool $needs_shipping Needs shipping.
	 *
	 * @return bool
	 */
	public static function cart_needs_shipping( $needs_shipping ) {
		if ( Orderable_Table_Ordering_Pro::get_table_id_cookie() ) {
			return false;
		}

		return $needs_shipping;
	}

	/**
	 * Check if the store is open to receive new orders from a table.
	 *
	 * @return void
	 */
	public static function store_open_hours_validation() {
		$table = Orderable_Table_Ordering_Pro::get_table_from_cookie();

		if ( ! $table ) {
			return;
		}

		$location = Orderable_Location::get_main_location();

		if ( ! $location || empty( $location->location_data['open_hours'] ) ) {
			return;
		}

		/**
		 * Filter the store open hours to be validated when an order is placed from a table.
		 *
		 * @since 1.13.0
		 * @hook orderable_pro_store_table_ordering_open_hours_to_validate
		 * @param  array                              $open_hours The store open hours.
		 * @param  Orderable_Table_Ordering_Pro_Table $table      The selected table object.
		 * @return array New value
		 */
		$open_hours = apply_filters( 'orderable_pro_store_table_ordering_open_hours_to_validate', maybe_unserialize( $location->location_data['open_hours'] ), $table );

		$now                     = new DateTime( 'now', wp_timezone() );
		$numeric_day_of_the_week = $now->format( 'w' );

		/**
		 * Filter the message to be shown when the store is closed and the customer tries to
		 * place an order from a table.
		 *
		 * @since 1.13.0
		 * @hook orderable_pro_table_ordering_store_closed_message
		 * @param  string                             $message    The message.
		 * @param  Orderable_Table_Ordering_Pro_Table $table      The selected table object.
		 * @param  array                              $open_hours The store open hours.
		 * @return $string New value
		 */
		$message = apply_filters( 'orderable_pro_table_ordering_store_closed_message', __( 'Sorry, we are unable to accept table orders outside of our opening hours.', 'orderable-pro' ), $table, $open_hours );

		if ( empty( $open_hours[ $numeric_day_of_the_week ]['enabled'] ) ) {
			wc_add_notice( $message, 'error' );

			return;
		}

		$day                 = $open_hours[ $numeric_day_of_the_week ];
		$from_12_hour_format = "{$day['from']['hour']}:{$day['from']['minute']} {$day['from']['period']}";
		$to_12_hour_format   = "{$day['to']['hour']}:{$day['to']['minute']} {$day['to']['period']}";

		$open_from = new DateTime( $from_12_hour_format, wp_timezone() );
		$open_to   = new DateTime( $to_12_hour_format, wp_timezone() );

		if ( $open_from > $now || $open_to < $now ) {
			wc_add_notice( $message, 'error' );

			return;
		}
	}
}
