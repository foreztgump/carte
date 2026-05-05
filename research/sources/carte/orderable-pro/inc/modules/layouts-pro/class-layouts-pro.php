<?php
/**
 * Module: Layouts Pro.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Timings module class.
 */
class Orderable_Layouts_Pro {
	/**
	 * Init.
	 */
	public static function run() {
		add_filter( 'orderable_layout_sections_field', array( __CLASS__, 'layout_sections_field' ), 10, 3 );
		add_filter( 'orderable_layout_sort_field', array( __CLASS__, 'layout_sort_field' ), 10, 2 );
		add_filter( 'orderable_layout_sort_on_frontend_field', array( __CLASS__, 'layout_sort_on_frontend_field' ), 10, 2 );
		add_filter( 'orderable_layout_defaults', array( __CLASS__, 'layout_defaults' ), 10, 2 );
		add_filter( 'orderable_layout_settings_save_data', array( __CLASS__, 'layout_settings_save_data' ), 10, 2 );
		add_filter( 'orderable_main_class', array( __CLASS__, 'orderable_main_class' ), 10, 2 );
		add_action( 'orderable_main_before_sections', array( __CLASS__, 'add_tabs' ), 10, 2 );
		add_action( 'orderable_main_before_sections', array( __CLASS__, 'add_order_by' ), 5, 2 );
		add_action( 'orderable_main_before_products', array( __CLASS__, 'add_category_headings' ), 10, 3 );
		add_action( 'orderable_main_before_products_category_children', array( __CLASS__, 'add_child_category_headings' ), 10, 3 );
		add_filter( 'orderable_flatten_products_by_category_level', array( __CLASS__, 'maybe_flatten_products_by_category' ), 10, 2 );
		add_action( 'orderable_after_product_hero', array( 'Orderable_Pro_Helpers', 'add_info_button' ), 20, 2 );
		add_action( 'orderable_before_product_description', array( 'Orderable_Pro_Helpers', 'add_info_button' ), 20, 2 );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'frontend_assets' ) );
	}

	/**
	 * Layout sections field.
	 *
	 * @param string $field
	 * @param array  $layout_settings
	 */
	public static function layout_sections_field( $field, $layout_settings = array() ) {
		woocommerce_wp_select(
			array(
				'id'      => 'orderable_sections',
				'label'   => '',
				'options' => array(
					'no_titles'      => __( 'No Titles or Tabs', 'orderable-pro' ),
					'titles'         => __( 'All Category Titles', 'orderable-pro' ),
					'cat_titles'     => __( 'Main Category Titles Only', 'orderable-pro' ),
					'sub_cat_titles' => __( 'Subcategory Titles Only', 'orderable-pro' ),
					'top_tabs'       => __( 'Top Tabs', 'orderable-pro' ),
					'side_tabs'      => __( 'Side Tabs', 'orderable-pro' ),
				),
				'value'   => esc_attr( $layout_settings['sections'] ),
			)
		);
	}

	/**
	 * Output the Sort field
	 *
	 * @param string $html_markup     The HTML markup.
	 * @param array  $layout_settings The layout settings.
	 * @return void
	 */
	public static function layout_sort_field( $html_markup, $layout_settings ) {
		woocommerce_wp_select(
			array(
				'id'      => 'orderable_sort',
				'label'   => '',
				'options' => array(
					'menu_order' => __( 'Default', 'orderable' ),
					'title'      => __( 'Name', 'orderable' ),
					'date'       => __( 'Latest', 'orderable' ),
					'price'      => __( 'Price: low to high', 'orderable' ),
					'price-desc' => __( 'Price: high to low', 'orderable' ),
				),
				'value'   => esc_attr( $layout_settings['sort'] ),
			)
		);
	}

	/**
	 * Output the `Allow sorting on the frontend` field.
	 *
	 * @param string $html_markup     The HTML markup.
	 * @param array  $layout_settings The layout settings.
	 * @return void
	 */
	public static function layout_sort_on_frontend_field( $html_markup, $layout_settings ) {
		woocommerce_wp_checkbox(
			array(
				'id'    => 'orderable_sort_on_frontend',
				'label' => '',
				'value' => wc_bool_to_string( $layout_settings['sort_on_frontend'] ),
			)
		);
	}

	/**
	 * Add Orderable shortcode defaults.
	 *
	 * @param array $defaults
	 * @param int   $layout_id
	 *
	 * @return array
	 */
	public static function layout_defaults( $defaults = array(), $layout_id = null ) {
		$defaults['sections'] = 'no_titles';

		return $defaults;
	}

	/**
	 * Add fields to layout settings save data.
	 *
	 * @param array $save_data
	 *
	 * @return array
	 */
	public static function layout_settings_save_data( $save_data = array() ) {
		if ( empty( $_POST['orderable_sections'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return $save_data;
		}

		$save_data['sections'] = sanitize_text_field( wp_unslash( $_POST['orderable_sections'] ) ); // phpcs:ignore WordPress.Security.NonceVerification

		return $save_data;
	}

	/**
	 * Add classes to Orderable main layout.
	 *
	 * @param string $class
	 * @param array  $args
	 *
	 * @return string
	 */
	public static function orderable_main_class( $class = '', $args = array() ) {
		if ( empty( $args['sections'] ) ) {
			return $class;
		}

		if ( strpos( $args['sections'], 'tabs' ) !== false ) {
			$class .= ' orderable-main--sections-tabs';
		}

		$class .= ' orderable-main--sections-' . $args['sections'];

		return $class;
	}

	/**
	 * Add tabs to Orderable main layout.
	 *
	 * @param array $args     Arguments.
	 * @param array $products Products.
	 */
	public static function add_tabs( $args, $products ) {
		if ( empty( $args['sections'] ) ) {
			return;
		}

		include Orderable_Helpers::get_template_path( 'tabs.php', 'layouts-pro', true );
	}

	/**
	 * Add category headings to Orderable main layout.
	 */
	public static function add_category_headings( $args = array(), $category = array(), $products = array() ) {
		if ( empty( $args['sections'] ) ) {
			return;
		}

		if ( in_array( $args['sections'], array( 'titles', 'cat_titles' ), true ) ) {
			include Orderable_Helpers::get_template_path( 'category-heading.php', 'layouts-pro', true );
		}
	}

	/**
	 * Add child category headings to Orderable main layout.
	 */
	public static function add_child_category_headings( $args = array(), $category = array(), $products = array() ) {
		if ( empty( $args['sections'] ) ) {
			return;
		}

		if ( in_array( $args['sections'], array( 'titles', 'sub_cat_titles', 'top_tabs', 'side_tabs' ), true ) ) {
			include Orderable_Helpers::get_template_path( 'category-heading.php', 'layouts-pro', true );
		}
	}

	/**
	 * Maybe flatten products by category.
	 *
	 * @param string $flatten_level
	 * @param array  $args
	 *
	 * @return mixed
	 */
	public static function maybe_flatten_products_by_category( $flatten_level, $args = array() ) {
		$sections = isset( $args['sections'] ) ? $args['sections'] : null;

		if ( empty( $sections ) || 'no_titles' === $sections ) {
			return 'all';
		}

		if ( 'cat_titles' === $sections ) {
			return 'children';
		}

		return 'none';
	}

	/**
	 * Get tab item classes.
	 *
	 * @param int   $i
	 * @param array $category
	 *
	 * @return mixed|void
	 */
	public static function get_tab_item_classes( $i, $category = array() ) {
		$classes = array( 'orderable-tabs__item' );

		if ( 0 === $i ) {
			$classes[] = 'orderable-tabs__item--active';
		}

		if ( ! empty( $category['children'] ) ) {
			$classes[] = 'orderable-tabs__item--has-children';
		}

		if ( ! empty( $category['parent'] ) ) {
			$classes[] = 'orderable-tabs__item--has-parent';
		}

		return apply_filters( 'orderable-tab-item-classes', $classes, $i, $category );
	}

	/**
	 * Add element to change the sort of the products.
	 *
	 * @param array $args The layout settings.
	 * @return void
	 */
	public static function add_order_by( $args ) {
		if ( empty( $args['sort_on_frontend'] ) ) {
			return;
		}

		include Orderable_Helpers::get_template_path( 'order-by.php', 'layouts-pro', true );
	}

	/**
	 * Enqueue the frontend assets.
	 *
	 * @return void
	 */
	public static function frontend_assets() {
		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		// Styles.
		wp_enqueue_style( 'orderable-layouts', ORDERABLE_PRO_URL . 'inc/modules/layouts-pro/assets/frontend/css/layouts' . $suffix . '.css', array(), ORDERABLE_PRO_VERSION );

		// Scripts.
		wp_enqueue_script( 'orderable-layouts', ORDERABLE_PRO_URL . 'inc/modules/layouts-pro/assets/frontend/js/main' . $suffix . '.js', array( 'jquery' ), ORDERABLE_PRO_VERSION, true );
	}
}
