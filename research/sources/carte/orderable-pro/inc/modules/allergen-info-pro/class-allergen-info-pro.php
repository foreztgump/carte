<?php
/**
 * Module: Allergen Info Pro.
 *
 * @since   1.4.0
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Orderable_Allergen_Info_Pro class.
 */
class Orderable_Allergen_Info_Pro {
	/**
	 * Init.
	 *
	 * Add action and filters
	 */
	public static function run() {
		add_filter( 'woocommerce_product_data_tabs', array( __CLASS__, 'add_allergen_info_tab' ) );
		add_filter( 'orderable_get_accordion_data', array( __CLASS__, 'add_allergen_accordion_item' ), 10, 2 );
		add_filter( 'orderable_show_info_product_button', array( __CLASS__, 'should_show_info_button' ), 10, 2 );
		add_filter( 'orderable_info_button_attributes', array( __CLASS__, 'update_info_button_attributes' ), 10, 2 );
		add_filter( 'woocommerce_product_tabs', array( __CLASS__, 'add_allergens_tab_on_product_page' ) );

		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'admin_assets' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'frontend_assets' ) );
		add_action( 'woocommerce_product_data_panels', array( __CLASS__, 'add_allergen_info_panel' ) );
		add_action( 'woocommerce_process_product_meta', array( __CLASS__, 'save_allergen_fields' ) );
	}

	/**
	 * Enqueue admin assets.
	 */
	public static function admin_assets() {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return;
		}

		$current_screen = get_current_screen();

		if ( ! empty( $current_screen->id ) && 'product' === $current_screen->id ) {
			$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

			wp_enqueue_style(
				'orderable-allergen-info-pro',
				ORDERABLE_PRO_URL . 'inc/modules/allergen-info-pro/assets/admin/css/allergen-info' . $suffix . '.css',
				array(),
				ORDERABLE_PRO_VERSION
			);
		}
	}

	/**
	 * Enqueue frontend assets.
	 */
	public static function frontend_assets() {
		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		wp_enqueue_style(
			'orderable-allergen-info-pro-style',
			ORDERABLE_PRO_URL . 'inc/modules/allergen-info-pro/assets/frontend/css/allergen-info' . $suffix . '.css',
			array(),
			ORDERABLE_PRO_VERSION
		);
	}

	/**
	 * Add the Allergens Info tab to product tabs.
	 *
	 * @param array $tabs The product tabs.
	 *
	 * @return array The product tabs.
	 */
	public static function add_allergen_info_tab( $tabs ) {
		$tab_data = array(
			'label'    => __( 'Allergens', 'orderable-pro' ),
			'target'   => 'orderable_allergen_info_panel',
			'priority' => 55,
		);

		/**
		 * The Allergens Info tab data added to product tabs.
		 *
		 * @param array $tab_data The Allergens Info tab data.
		 *
		 * @return array New value
		 * @since 1.4.0
		 * @hook  orderable_allergen_info_tab_data
		 */
		$tabs['orderable_allergen_info'] = apply_filters(
			'orderable_allergen_info_tab_data',
			$tab_data
		);

		return $tabs;
	}

	/**
	 * Add the allergens info panel
	 *
	 * @return void
	 */
	public static function add_allergen_info_panel() {
		?>
		<div id="orderable_allergen_info_panel" class="panel woocommerce_options_panel wc-metaboxes-wrapper orderable-pro-allergen-info-panel">
			<?php self::allergen_fields(); ?>
		</div>
		<?php
	}

	/**
	 * Get the allergen fields.
	 *
	 * @return array
	 */
	public static function get_allergen_fields() {
		$fields = array(
			'contains'                         => array(
				'label'       => __( 'Contains', 'orderable-pro' ),
				'description' => __( 'Ingredients which are definitely present.', 'orderable-pro' ),
			),
			'may_contain'                      => array(
				'label'       => __( 'May contain', 'orderable-pro' ),
				'description' => __( 'There is a chance that these ingredients could be present.', 'orderable-pro' ),
			),
			'may_contain_via_shared_equipment' => array(
				'label'       => __( 'May contain via shared equipment', 'orderable-pro' ),
				'description' => __( 'There is a potential cross-contact through shared cooking equipment.', 'orderable-pro' ),
			),
		);

		/**
		 * Filter the allergen fields.
		 *
		 * @param array $fields The allergenfields.
		 *
		 * @return array New fields.
		 * @since 1.3.0
		 * @hook  orderable_allergen_info_fields
		 */
		$fields = apply_filters( 'orderable_allergen_info_fields', $fields );

		foreach ( array_keys( $fields ) as $key ) {
			$fields[ $key ]['id'] = 'orderable_allergen_field_' . $key;
		}

		return $fields;
	}

	/**
	 * Output the allergen fields on admin.
	 *
	 * @return void
	 */
	public static function allergen_fields() {
		$default_args = array(
			'desc_tip' => true,
		);

		do_action( 'orderable_before_allergen_info_fields' );

		$values = get_post_meta( get_the_ID(), '_orderable_pro_allergen_info', true );

		foreach ( self::get_allergen_fields() as $key => $args ) {
			if ( ! empty( $values[ $key ] ) ) {
				$args['value'] = $values[ $key ];
			}

			$args = wp_parse_args(
				$args,
				$default_args
			);

			woocommerce_wp_textarea_input( $args );
		}

		do_action( 'orderable_after_allergen_info_fields' );
	}

	/**
	 * Save allergen fields.
	 *
	 * @param int $product_id The product ID to save the fields.
	 * @return void
	 */
	public static function save_allergen_fields( $product_id ) {
		foreach ( self::get_allergen_fields() as $key => $field ) {
			if ( empty( $field['id'] ) ) {
				continue;
			}

			$id = $field['id'];

			if ( empty( $_POST[ $id ] ) ) {
				continue;
			}

			$data[ $key ] = sanitize_text_field( wp_unslash( $_POST[ $id ] ) );
		}

		if ( empty( $data ) ) {
			delete_post_meta( $product_id, '_orderable_pro_allergen_info' );
		} else {
			update_post_meta( $product_id, '_orderable_pro_allergen_info', $data );
		}
	}

	/**
	 * Add allergens info on Orderable accordion.
	 *
	 * @param array      $data    The items on Orderable accordion.
	 * @param WC_Product $product The product.
	 * @return array
	 */
	public static function add_allergen_accordion_item( $data, $product ) {
		if ( ! self::has_allergen_info( $product->get_id() ) ) {
			return $data;
		}

		$data[] = array(
			'title'   => __( 'Allergens', 'orderable-pro' ),
			'content' => self::get_allergen_info_frontend( $product->get_id() ),
			'id'      => 'accordion-allergen-info',
		);

		return $data;
	}

	/**
	 * Output the Allergens Info on frontend.
	 *
	 * @param int $product_id
	 * @return string
	 */
	public static function get_allergen_info_frontend( $product_id ) {
		$fields = self::get_allergen_fields();

		$values = get_post_meta( $product_id, '_orderable_pro_allergen_info', true );

		ob_start();
		?>
		<div class="orderable-pro-allergen-info">
			<?php
			foreach ( $fields as $key => $field ) {
				if ( empty( $values[ $key ] ) ) {
					continue;
				}
				?>
					<div class="orderable-pro-allergen-info__field">
						<span class="orderable-pro-allergen-info__label">
						<?php
							/* translators: %s - Field label for allergens info e.g.: Contains, May Contain. */
							printf( __( '%s:', 'orderable-pro' ), esc_html( $field['label'] ) );
						?>
						</span>
						<span class="orderable-pro-allergen-info__value">
						<?php echo esc_html( $values[ $key ] ); ?>
						</span>
					</div>
				<?php
			}
			?>
		</div>
		<?php
		$allergen_info_html = ob_get_clean();

		/**
		 * Filter the Allergens Info HTML
		 *
		 * @param string $allergen_info_html The Allergens Info HTML.
		 *
		 * @return array New HTML.
		 * @since 1.4.0
		 * @hook  orderable_allergen_info_html
		 */
		$allergen_info_html = apply_filters( 'orderable_allergen_info_html', $allergen_info_html );

		return $allergen_info_html;
	}

	/**
	 * Check if the product has allergens information to show the info button.
	 *
	 * @param array      $should_show_info_button Whether should show the info button.
	 * @param WC_Product $product                 The product.
	 *
	 * @return array
	 */
	public static function should_show_info_button( $should_show_info_button, $product ) {
		if ( $should_show_info_button ) {
			return $should_show_info_button;
		}

		return self::has_allergen_info( $product->get_id() );
	}

	/**
	 * Update info button attributes.
	 *
	 * If the product hasn't nutritional information,
	 * we update the attributes to open the allergen
	 * info tab.
	 *
	 * @param array      $attributes The button attributes.
	 * @param WC_Product $product    The product.
	 *
	 * @return array The new button attributes.
	 */
	public static function update_info_button_attributes( $attributes, $product ) {
		if ( ! self::has_allergen_info( $product->get_id() ) ) {
			return $attributes;
		}

		if ( Orderable_Nutritional_Info_Pro::has_nutritional_info( $product->get_id() ) ) {
			return $attributes;
		}

		$attributes['title']                = __( 'See allergens information.', 'orderable-pro' );
		$attributes['data-orderable-focus'] = 'accordion-allergen-info';

		return $attributes;
	}

	/**
	 * Check if the product has allergens information
	 *
	 * @param int $product_id The product ID.
	 * @return boolean
	 */
	public static function has_allergen_info( $product_id ) {
		return metadata_exists( 'post', $product_id, '_orderable_pro_allergen_info' );
	}

	/**
	 * Add allergens information tab on the product page.
	 *
	 * @param array $product_tabs The product tabs.
	 * @return array
	 */
	public static function add_allergens_tab_on_product_page( $product_tabs ) {
		global $product;

		if ( empty( $product ) || ! self::has_allergen_info( $product->get_id() ) ) {
			return $product_tabs;
		}

		/**
		 * The Allergens Info tab data added to product tabs on the product page.
		 *
		 * @since 1.6.0
		 * @hook orderable_allergens_tab_data_on_product_page
		 * @param  array $tab_data The Allergens Info tab data.
		 * @return array New value
		 */
		$product_tabs['allergen_info'] = apply_filters(
			'orderable_allergens_tab_data_on_product_page',
			array(
				'title'    => __( 'Allergens', 'orderable-pro' ),
				'priority' => 28,
				'callback' => function () use ( $product ) {
					echo wp_kses_post( self::get_allergen_info_frontend( $product->get_id() ) );
				},
			)
		);

		return $product_tabs;
	}
}
