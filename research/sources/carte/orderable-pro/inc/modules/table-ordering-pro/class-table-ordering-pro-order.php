<?php
/**
 * Module: Table Ordering Pro order.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Timings order class.
 */
class Orderable_Table_Ordering_Pro_Order {
	/**
	 * Table number.
	 *
	 * @var string
	 */
	public static $key_table_id = '_orderable_table_id';
	/**
	 * Table name.
	 *
	 * @var string
	 */
	public static $key_table = '_orderable_table_name';
	/**
	 * Table post ID.
	 *
	 * @var string
	 */
	public static $key_table_post_id = '_orderable_table_post_id';

	/**
	 * Init.
	 */
	public static function run() {
		add_filter( 'woocommerce_get_order_item_totals', array( __CLASS__, 'add_to_order_details' ), 10, 3 );
		add_action( 'woocommerce_admin_order_data_after_shipping_address', array( __CLASS__, 'add_to_admin_order' ), 10, 1 );
		add_filter( 'manage_edit-shop_order_columns', array( __CLASS__, 'add_admin_order_columns' ), 20 );
		add_action( 'manage_shop_order_posts_custom_column', array( __CLASS__, 'add_admin_order_columns_content' ), 10, 2 );
		add_filter( 'woocommerce_admin_order_preview_line_item_column_orderable_table_name', array( __CLASS__, 'display_order_preview_line_item' ), 10, 3 );
		add_action( 'woocommerce_admin_order_preview_end', array( __CLASS__, 'add_to_order_preview_template' ) );
		add_filter( 'woocommerce_admin_order_preview_get_order_details', array( __CLASS__, 'add_to_order_preview_get_order_details' ), 10, 2 );
		add_filter( 'orderable_get_service_type', array( __CLASS__, 'modify_service_type' ), 10, 2 );
		add_filter( 'orderable_service_labels', array( __CLASS__, 'modify_service_labels' ), 10 );
		add_filter( 'orderable_service_type_column_background_color', array( __CLASS__, 'modify_service_type_column_background_color' ), 10, 5 );
		add_filter( 'orderable_service_type_column_text_color', array( __CLASS__, 'modify_service_type_column_text_color' ), 10, 5 );
		add_filter( 'orderable_services_filter_options', [ __CLASS__, 'add_table_to_services_filter_options' ] );
		add_filter( 'woocommerce_shop_order_list_table_prepare_items_query_args', [ __CLASS__, 'update_query_args_to_filter_in_table_orders' ], 101 );
		add_action( 'pre_get_posts', [ __CLASS__, 'update_query_to_filter_in_table_orders' ], 101 );

		// HPOS Compatibility.
		add_action( 'admin_init', array( __CLASS__, 'add_table_custom_column' ) );
	}

	/**
	 * Add date and time to order details.
	 *
	 * @param array    $total_rows  Total rows.
	 * @param WC_Order $order       Order object.
	 * @param bool     $tax_display Tax display.
	 *
	 * @return array
	 */
	public static function add_to_order_details( $total_rows, $order, $tax_display ) {
		$table_id = $order->get_meta( self::$key_table_id );

		if ( ! $table_id ) {
			return $total_rows;
		}

		$table = Orderable_Table_Ordering_Pro::get_table_by_id( $table_id );

		if ( ! $table ) {
			return $total_rows;
		}

		$order_total = $total_rows['order_total'];

		unset( $total_rows['order_total'] );

		$total_rows['orderable_table_id'] = array(
			'label' => __( 'Table', 'orderable-pro' ),
			'value' => $table->get_title(),
		);

		$total_rows['order_total'] = $order_total;

		return $total_rows;
	}

	/**
	 * @param WC_Order $order
	 */
	public static function add_to_admin_order( $order ) {
		if ( ! $order ) {
			return;
		}

		$table_name = $order->get_meta( self::$key_table );

		if ( ! $table_name ) {
			return;
		} ?>
		<h3><?php esc_attr_e( 'Table', 'orderable-pro' ); ?></h3>
		<p><?php echo wp_kses_post( $table_name ); ?></p>
		<?php
	}

	/**
	 * Add columns to admin orders screen.
	 *
	 * @param array $columns
	 *
	 * @return array
	 */
	public static function add_admin_order_columns( $columns ) {
		$columns['orderable_table'] = __( 'Table', 'orderable-pro' );

		return $columns;
	}

	/**
	 * Add columns content to admin orders screen.
	 *
	 * @param string $column_name Column name.
	 * @param int    $post_id     Post ID.
	 */
	public static function add_admin_order_columns_content( $column_name, $post_id ) {
		if ( 'orderable_table' === $column_name ) {
			$order      = wc_get_order( $post_id );
			$table_name = $order->get_meta( self::$key_table );
			$content    = '&mdash;';

			if ( $table_name ) {
				$content = $table_name;
			}

			echo wp_kses_post( '<p>' . $content . '</p>' );
		}
	}

	/**
	 * Add table name to order preview template.
	 */
	public static function add_to_order_preview_template() {
		?>
		{{ data.orderable_table_name }}
		<?php
	}

	/**
	 * Add table name to order preview data.
	 *
	 * @param array    $data  Data array.
	 * @param WC_Order $order Order object.
	 *
	 * @return mixed
	 */
	public static function add_to_order_preview_get_order_details( $data, $order ) {
		$table_name = $order->get_meta( self::$key_table );

		if ( ! $table_name ) {
			return $data;
		}

		$data['item_html'] = sprintf( '<p style="padding: 0 1.5em;margin-top: 0;"><strong>%s:</strong> %s</p> %s', __( 'Table', 'orderable-pro' ), $table_name, $data['item_html'] );

		return $data;
	}

	/**
	 * Modify service type.
	 *
	 * @param string   $type  Service type.
	 * @param WC_Order $order Order object.
	 *
	 * @return string
	 */
	public static function modify_service_type( $type, $order ) {
		$table_name = $order->get_meta( self::$key_table );

		if ( ! $table_name ) {
			return $type;
		}

		return 'table-order';
	}

	/**
	 * Modify service labels.
	 *
	 * @param array $labels Service labels.
	 *
	 * @return array
	 */
	public static function modify_service_labels( $labels ) {
		$labels['table-order'] = __( 'Table Order', 'orderable-pro' );

		return $labels;
	}

	/**
	 * Change service type BG.
	 *
	 * @param string   $color       Color hex.
	 * @param string   $column_name Column name.
	 * @param int      $post_id     Post ID.
	 * @param WC_Order $order       order object.
	 * @param string   $type        Service type.
	 *
	 * @return string
	 */
	public static function modify_service_type_column_background_color( $color, $column_name, $post_id, $order, $type ) {
		if ( 'table-order' !== $type ) {
			return $color;
		}

		return '#D1DAE6';
	}

	/**
	 * Change service type text color.
	 *
	 * @param string   $color       Color hex.
	 * @param string   $column_name Column name.
	 * @param int      $post_id     Post ID.
	 * @param WC_Order $order       order object.
	 * @param string   $type        Service type.
	 *
	 * @return string
	 */
	public static function modify_service_type_column_text_color( $color, $column_name, $post_id, $order, $type ) {
		if ( 'table-order' !== $type ) {
			return $color;
		}

		return '#405877';
	}

	/**
	 * Add Table custom column.
	 *
	 * Compatible with HPOS.
	 *
	 * @return void
	 */
	public static function add_table_custom_column() {
		$shop_order_page_screen_id = wc_get_page_screen_id( 'shop-order' );

		add_filter( "manage_{$shop_order_page_screen_id}_columns", array( __CLASS__, 'add_admin_order_columns' ), 10 );
		add_action( "manage_{$shop_order_page_screen_id}_custom_column", array( __CLASS__, 'add_admin_order_columns_content' ), 10, 2 );
	}

	/**
	 * Add `table-order` as an option in the services filter options.
	 *
	 * @param array $options The service options.
	 * @return array
	 */
	public static function add_table_to_services_filter_options( $options ) {
		if ( ! is_array( $options ) ) {
			return $options;
		}

		$options[] = 'table-order';

		return $options;
	}

	/**
	 * Update the query object to filter in table orders.
	 *
	 * @param WP_Query $query The query to retrieve the orders.
	 */
	public static function update_query_to_filter_in_table_orders( WP_Query $query ) {
		if ( ! Orderable_Orders::is_orders_page() || 'shop_order' !== $query->get( 'post_type' ) ) {
			return;
		}

		$service = Orderable_Services_Order::get_filtered_service();

		if ( 'table' !== $service ) {
			return;
		}

		$meta_query = (array) $query->get( 'meta_query' );
		$meta_query = self::add_table_order_to_meta_query( $meta_query );

		$query->set( 'meta_query', $meta_query );
	}

	/**
	 * Update the query args to filter in table orders.
	 *
	 * @param array $query_args The query args used to retrieve the orders.
	 * @return array
	 */
	public static function update_query_args_to_filter_in_table_orders( $query_args ) {
		if ( ! Orderable_Orders::is_orders_page() ) {
			return $query_args;
		}

		$service = Orderable_Services_Order::get_filtered_service();

		if ( 'table' !== $service ) {
			return $query_args;
		}

		$meta_query = empty( $query_args['meta_query'] ) || ! is_array( $query_args['meta_query'] ) ? array() : $query_args['meta_query'];

		$meta_query = self::add_table_order_to_meta_query( $meta_query );

		$query_args['meta_query'] = $meta_query; // phpcs:ignore WordPress.DB.SlowDBQuery

		return $query_args;
	}

	/**
	 * Add table order key to the `meta_query` args.
	 *
	 * @param array $meta_query The meta query args.
	 * @return array
	 */
	protected static function add_table_order_to_meta_query( $meta_query ) {
		foreach ( $meta_query as $key => $value ) {
			if ( empty( $value['key'] ) ) {
				continue;
			}

			if ( '_orderable_service_type' !== $value['key'] ) {
				continue;
			}

			unset( $meta_query[ $key ] );
			break;
		}

		$meta_query[] = [
			'key' => self::$key_table,
		];

		return $meta_query;
	}
}
