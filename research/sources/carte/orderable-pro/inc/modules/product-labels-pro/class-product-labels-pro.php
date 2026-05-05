<?php
/**
 * Module: Product Labels Pro.
 *
 * @since   1.3.0
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Orderable_Product_Labels_Pro class.
 */
class Orderable_Product_Labels_Pro {
	/**
	 * Init.
	 *
	 * Add action and filters
	 */
	public static function run() {
		remove_action( 'admin_menu', array( 'Orderable_Product_Labels', 'add_settings_page' ) );

		add_action( 'init', array( __CLASS__, 'register_taxonomy' ) );
		add_action( 'admin_menu', array( __CLASS__, 'add_taxonomy_menu_item' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'admin_assets' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'frontend_assets' ) );
		add_action( 'saved_orderable_product_label', array( __CLASS__, 'save_label_options' ) );
		add_action( 'orderable_product_label_add_form_fields', array( __CLASS__, 'add_form_fields' ) );
		add_action( 'orderable_product_label_edit_form_fields', array( __CLASS__, 'edit_form_fields' ) );
		add_action( 'orderable_before_product_card', array( __CLASS__, 'attach_show_labels_hook' ), 10, 2 );
		add_action( self::get_product_page_hook(), array( __CLASS__, 'show_labels_on_product_page' ) );
		add_action( self::get_side_drawer_hook(), array( __CLASS__, 'show_labels_on_side_drawer' ) );
		add_action( 'orderable_after_layout_settings_fields', array( __CLASS__, 'add_layout_settings_fields' ), 15 );

		add_filter( 'orderable_default_settings', array( __CLASS__, 'add_default_settings' ), 15 );
		add_filter( 'orderable_layout_defaults', array( __CLASS__, 'add_layout_defaults' ), 15 );
		add_filter( 'manage_edit-orderable_product_label_columns', array( __CLASS__, 'add_product_label_column' ) );
		add_filter( 'manage_orderable_product_label_custom_column', array( __CLASS__, 'add_product_label_column_content' ), 10, 3 );
		add_filter( 'list_table_primary_column', array( __CLASS__, 'set_product_label_as_primary_column' ), 10, 2 );
		add_filter( 'orderable_layout_settings_save_data', array( __CLASS__, 'save_product_labels_layout_setings' ) );
		add_filter( 'wpsf_register_settings_orderable', array( __CLASS__, 'add_fields_to_quickview_section' ), 30 );
		add_filter( 'parent_file', array( __CLASS__, 'set_orderable_as_active_menu' ) );
		add_filter( 'submenu_file', array( __CLASS__, 'set_product_labels_as_active_submenu' ), 10, 2 );
	}

	/**
	 * Register Product Labels taxonomy
	 *
	 * @return void
	 */
	public static function register_taxonomy() {
		$labels = array(
			'name'                   => __( 'Product Labels', 'orderable-pro' ),
			'singular_name'          => __( 'Product Label', 'orderable-pro' ),
			'search_items'           => __( 'Search Product Label', 'orderable-pro' ),
			'desc_field_description' => __( 'The description will be shown in the tooltip', 'orderable-pro' ),
			'edit_item'              => __( 'Edit Product Label', 'orderable-pro' ),
			'view_item'              => __( 'View Product Label', 'orderable-pro' ),
			'update_item'            => __( 'Update Product Label', 'orderable-pro' ),
			'add_new_item'           => __( 'Add New Product Label', 'orderable-pro' ),
			'not_found'              => __( 'No product labels found', 'orderable-pro' ),
			'back_to_items'          => __( 'Go to Product Labels', 'orderable-pro' ),
		);

		$args = array(
			'hierarchical'          => false,
			'labels'                => $labels,
			'show_ui'               => true,
			'show_admin_column'     => true,
			'show_in_menu'          => false,
			'update_count_callback' => '_update_post_term_count',
			'query_var'             => true,
			'rewrite'               => array( 'slug' => 'product-labels' ),
		);

		register_taxonomy( 'orderable_product_label', 'product', $args );
	}

	/**
	 * Add taxonomy page menu item
	 *
	 * @return void
	 */
	public static function add_taxonomy_menu_item() {
		add_submenu_page(
			'orderable',
			__( 'Product Labels', 'orderable' ),
			__( 'Product Labels', 'orderable' ),
			'manage_product_terms',
			'edit-tags.php?taxonomy=orderable_product_label&post_type=product',
			'',
			20
		);
	}

	/**
	 * Enqueue admin assets
	 *
	 * @return void
	 */
	public static function admin_assets() {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return;
		}

		$current_screen = get_current_screen();

		if ( empty( $current_screen->id ) ) {
			return;
		}

		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		if ( 'edit-orderable_product_label' === $current_screen->id ) {
			wp_enqueue_style( 'wp-color-picker' );

			wp_enqueue_style(
				'orderable-custom-order-fontawesome',
				ORDERABLE_PRO_URL . 'inc/modules/shared/fonts/fontawesome/css/font-awesome.min.css',
				array(),
				ORDERABLE_PRO_VERSION
			);

			wp_enqueue_style(
				'orderable-product-labels-css',
				ORDERABLE_PRO_URL . 'inc/modules/product-labels-pro/assets/admin/css/product-labels' . $suffix . '.css',
				array(),
				ORDERABLE_PRO_VERSION
			);

			wp_enqueue_script(
				'orderable-product-labels-pro',
				ORDERABLE_PRO_URL . 'inc/modules/product-labels-pro/assets/admin/js/main' . $suffix . '.js',
				array( 'jquery', 'wp-color-picker' ),
				ORDERABLE_PRO_VERSION,
				true
			);
		} elseif ( 'orderable_layouts' === $current_screen->id ) {
			wp_enqueue_script(
				'orderable-product-labels-pro',
				ORDERABLE_PRO_URL . 'inc/modules/product-labels-pro/assets/admin/js/main' . $suffix . '.js',
				array( 'jquery', 'wp-color-picker' ),
				ORDERABLE_PRO_VERSION,
				true
			);

			self::frontend_assets();
		}

		$script_data = array(
			'i18n' => array(
				'select_icon' => __( 'Select icon...', 'orderable-pro' ),
				'change_icon' => __( 'Change icon...', 'orderable-pro' ),
			),
		);

		/**
		 * Filter the localized data used by the admin script.
		 *
		 * @since 1.7.0
		 * @hook orderable_product_labels_l10n_data_script
		 * @param  array name The localized data.
		 * @return array New value
		 */
		$script_data = apply_filters( 'orderable_product_labels_l10n_data_script', $script_data );

		wp_localize_script(
			'orderable-product-labels-pro',
			'orderable_pro_product_labels_params',
			$script_data
		);
	}

	/**
	 * Enqueue frontend assets.
	 *
	 * @return void
	 */
	public static function frontend_assets() {
		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		wp_enqueue_style(
			'orderable-fontawesome',
			ORDERABLE_PRO_URL . 'inc/modules/shared/fonts/fontawesome/css/font-awesome.min.css',
			array(),
			ORDERABLE_PRO_VERSION
		);

		wp_enqueue_style(
			'orderable-product-labels-pro-style',
			ORDERABLE_PRO_URL . 'inc/modules/product-labels-pro/assets/frontend/css/product-labels' . $suffix . '.css',
			array(),
			ORDERABLE_PRO_VERSION
		);
	}

	/**
	 * Save label options.
	 *
	 * @param int $term_id Term ID.
	 * @return void
	 */
	public static function save_label_options( $term_id ) {
		// skip when quick editing the product label.
		if (
			! empty( $_POST['_inline_edit'] ) &&
			wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_inline_edit'] ) ), 'taxinlineeditnonce' ) &&
			! empty( $_POST['action'] ) &&
			'inline-save-tax' === $_POST['action']
		) {
			return;
		}

		$get_posted_value = function ( $key, $default_value ) {
			$value = $default_value;

			// phpcs:ignore WordPress.Security.NonceVerification
			if ( empty( $_POST[ $key ] ) ) {
				return $value;
			}

			// phpcs:ignore WordPress.Security.NonceVerification
			$value = sanitize_text_field( wp_unslash( $_POST[ $key ] ) );

			if ( empty( $value ) ) {
				return $default_value;
			}

			return $value;
		};

		$value = array(
			'display_option'   => $get_posted_value( 'orderable_product_label_display_option', 'name' ),
			'foreground_color' => $get_posted_value( 'orderable_product_label_foreground_color', '#fafafa' ),
			'background_color' => $get_posted_value( 'orderable_product_label_background_color', '#171717' ),
			'icon'             => $get_posted_value( 'orderable_product_label_icon', '' ),
			'icon_family'      => $get_posted_value( 'orderable_product_label_icon_family', '' ),
		);

		update_term_meta( $term_id, 'orderable_product_label_options', $value );
	}

	/**
	 * Output the Display Option field
	 *
	 * @param string $selected_value The field value.
	 * @return void
	 */
	public static function display_option_field( $selected_value = '' ) {
		?>
			<select
				name="orderable_product_label_display_option"
				id="orderable_product_label_display_option"
			>
				<option
					value="name"
					<?php selected( $selected_value, 'name' ); ?>
				>
					<?php esc_html_e( 'Name', 'orderable-pro' ); ?>
				</option>
				<option
					value="icon"
					<?php selected( $selected_value, 'icon' ); ?>
				>
					<?php esc_html_e( 'Icon', 'orderable-pro' ); ?>
				</option>
				<option
					value="icon_name"
					<?php selected( $selected_value, 'icon_name' ); ?>
				>
					<?php esc_html_e( 'Icon and Name', 'orderable-pro' ); ?>
				</option>
				<option
					value="name_icon"
					<?php selected( $selected_value, 'name_icon' ); ?>
				>
					<?php esc_html_e( 'Name and Icon', 'orderable-pro' ); ?>
				</option>
			</select>
		<?php
	}

	/**
	 * Output the Foreground Color field.
	 *
	 * @param string $value The field value.
	 * @return void
	 */
	public static function foreground_color_field( $value = '' ) {
		?>
		<input
			type="text"
			name="orderable_product_label_foreground_color"
			id="orderable_product_label_foreground_color"
			value="<?php echo esc_attr( $value ); ?>"
			style="display: none;"
		>

		<?php
	}

	/**
	 * Output the Background Color field.
	 *
	 * @param string $value The field value.
	 * @return void
	 */
	public static function background_color_field( $value = '' ) {
		?>
		<input
			type="text"
			name="orderable_product_label_background_color"
			id="orderable_product_label_background_color"
			value="<?php echo esc_attr( $value ); ?>"
			style="display: none;"
		>
		<?php
	}

	/**
	 * Output the Icon field.
	 *
	 * @param string $icon        The icon value.
	 * @param string $icon_family The font family used by the icon.
	 * @return void
	 */
	public static function icon_field( $icon = '', $icon_family = '' ) {
		$icons['orderable-pro-icons'] = self::get_product_labels_icons();
		$icons                        = array_merge( $icons, Orderable_Custom_Order_Status_Pro_Icons::get_raw_icons() );

		?>
		<div>
			<input
				type="hidden"
				name='orderable_product_label_icon'
				value="<?php echo esc_attr( $icon ); ?>"
				class="orderable-pro-product-labels-icon__input"
			>

			<div class="orderable-pro-product-labels-icon__icon-actions">
				<button
					class="button orderable-pro-product-labels-icon__change-icon-action"
					type="button"
				>
					<?php
						printf(
							'<i class="orderable-pro-product-labels-icon__preview %1$s %2$s"></i>',
							esc_attr( self::get_icon_family_class( $icon_family ) ),
							esc_attr( $icon )
						);
					?>
					<span class="orderable-pro-product-labels-icon__change-icon-action-text">
						<?php esc_html_e( 'Select icon...', 'orderable-pro' ); ?>
					</span>
				</button>
				<button
					class="button-link orderable-pro-product-labels-icon__clear-icon-action"
					type="button"
				>
					<?php esc_html_e( 'Clear', 'orderable-pro' ); ?>
				</button>
			</div>

			<div class="orderable-pro-product-labels-icon-font-families">
				<div class="orderable-pro-product-labels-icon-font-families__heading">
					<div class="orderable-pro-product-labels-icon-font-families__search-field-wrapper">
						<span class="orderable-pro-product-labels-icon-font-families__search-field-icon dashicons dashicons-search"></span>
						<input
							class="orderable-pro-product-labels-icon-font-families__search-field"
							placeholder="<?php esc_attr_e( 'Search icons...', 'orderable-pro' ); ?>"
							value=""
							type="text"
						/>
					</div>
					<select
						name="orderable_product_label_icon_family"
						id="orderable_product_label_icon_family"
						class="orderable-pro-product-labels-icon-font-families__field"
					>
						<option
							<?php selected( $icon_family, 'orderable-pro-icons' ); ?>
							value="orderable-pro-icons"
						>
							<?php echo esc_html__( 'Orderable Icons', 'orderable-pro' ); ?>
						</option>
						<option
							<?php selected( $icon_family, 'fontawesome' ); ?>
							value="fontawesome"
						>
							<?php echo esc_html__( 'FontAwesome', 'orderable-pro' ); ?>
						</option>
						<option
							<?php selected( $icon_family, 'dashicons' ); ?>
							value="dashicons"
						>
							<?php echo esc_html__( 'Dashicons', 'orderable-pro' ); ?>
						</option>
						<option
							<?php selected( $icon_family, 'woocommerce' ); ?>
							value="woocommerce"
						>
							<?php echo esc_html__( 'Woocommerce', 'orderable-pro' ); ?>
						</option>
					</select>
				</div>
				<div class="orderable-pro-product-labels-font-families__wrap">
					<div class="orderable-pro-product-labels-font-families__font orderable-pro-product-labels-font-families__font--orderable-pro-icons" >
						<?php
						foreach ( $icons['orderable-pro-icons'] as $icon_class ) {
							$icon_content = file_get_contents( ORDERABLE_PRO_PATH . 'inc/modules/product-labels-pro/assets/svg/' . $icon_class . '.svg' );

							if ( ! $icon_content ) {
								continue;
							}

							$selected_class = ( 'orderable-pro-icons__' . $icon_class === $icon ) ? 'orderable-pro-product-labels-font-families__icon--selected' : '';

							printf(
								'<div class="orderable-pro-product-labels-font-families__icon %1$s" data-icon-family="orderable-pro-icons" data-icon="%2$s" data-icon-content="%3$s"><i class="orderable-pro-icons orderable-pro-icons__%4$s">%5$s</i></div>',
								esc_attr( $selected_class ),
								esc_attr( 'orderable-pro-icons__' . $icon_class ),
								esc_attr( wp_kses( $icon_content, self::get_svg_allowed_html_tags() ) ),
								wp_kses_post( $icon_content ),
								wp_kses( $icon_content, self::get_svg_allowed_html_tags() )
							);
						}
						?>
					</div>
					<div class="orderable-pro-product-labels-font-families__font orderable-pro-product-labels-font-families__font--fontawesome" >
						<?php
						foreach ( $icons['fontawesome'] as $icon_class ) {
							$selected_class = ( 'fa-' . $icon_class === $icon ) ? 'orderable-pro-product-labels-font-families__icon--selected' : '';
							printf( '<div class="orderable-pro-product-labels-font-families__icon %s" data-icon-family="fontawesome" data-icon="%s"><i class="fa fa-%s"></i></div>', esc_attr( $selected_class ), esc_attr( 'fa-' . $icon_class ), esc_attr( $icon_class ) );
						}
						?>
					</div>
					<div class="orderable-pro-product-labels-font-families__font orderable-pro-product-labels-font-families__font--dashicons">
						<?php
						foreach ( $icons['dashicons'] as $icon_class ) {
							$selected_class = ( 'dashicons-' . $icon_class === $icon ) ? 'orderable-pro-product-labels-font-families__icon--selected' : '';
							printf( '<div class="orderable-pro-product-labels-font-families__icon %s" data-icon-family="dashicons" data-icon="%s"><i class="dashicons dashicons-%s"></i></div>', esc_attr( $selected_class ), esc_attr( 'dashicons-' . $icon_class ), esc_attr( $icon_class ) );
						}
						?>
					</div>	
					<div class="orderable-pro-product-labels-font-families__font orderable-pro-product-labels-font-families__font--woocommerce">
						<?php
						foreach ( $icons['woocommerce'] as $icon_class ) {
							$selected_class = ( 'wooicon-' . $icon_class === $icon ) ? 'orderable-pro-product-labels-font-families__icon--selected' : '';
							printf( '<div class="orderable-pro-product-labels-font-families__icon %s" data-icon-family="woocommerce" data-icon="%s"><i class="wooicon wooicon-%s"></i></div>', esc_attr( $selected_class ), esc_attr( 'wooicon-' . $icon_class ), esc_attr( $icon_class ) );
						}
						?>
					</div>	
				</div>	
			</div>
		</div>
		<?php
	}

	/**
	 * Add the Product Label fields to the taxonomy page.
	 *
	 * @return void
	 */
	public static function add_form_fields() {
		?>
		<div class="form-field orderable-pro-product-labels__display-option">
			<label for="orderable_product_label_display_option">
				<?php esc_html_e( 'Display option', 'orderable-pro' ); ?>
			</label>

			<?php echo wp_kses_post( self::display_option_field() ); ?>
		</div>

		<div>
			<div class="form-field term-slug-wrap">
				<label for="orderable_product_label_foreground_color">
					<?php esc_html_e( 'Foreground color', 'orderable-pro' ); ?>
				</label>

				<?php echo wp_kses_post( self::foreground_color_field( '#fafafa' ) ); ?>
			</div>

			<div class="form-field term-slug-wrap">
				<label for="orderable_product_label_background_color">
					<?php esc_html_e( 'Background color', 'orderable-pro' ); ?>
				</label>

				<?php echo wp_kses_post( self::background_color_field( '#171717' ) ); ?>
			</div>
		</div>

		<div class="form-field orderable-pro-product-labels-icon orderable_product_label_icon" style="display: none;">
			<label for="orderable_product_label_icon">
				<?php esc_html_e( 'Icon', 'orderable-pro' ); ?>
			</label>

			<?php echo wp_kses_post( self::icon_field( '', 'orderable-pro-icons' ) ); ?>
		</div>

		<div class="form-field orderable-pro-product-labels__preview">
			<label>
				<?php esc_html_e( 'Preview', 'orderable-pro' ); ?>
			</label>
			<span class="orderable-pro-product-labels__preview-wrapper">
				<span
					class="<?php echo esc_attr( join( ' ', self::get_default_label_classes() ) ); ?>"
					style="color: #fafafa; background-color: #171717; display: none"
				>
					<i class="orderable-pro-product-labels__icon"></i>					
					<span class="orderable-pro-product-labels__text"></span>
				</span>
			</span>
		</div>
		<?php
	}

	/**
	 * Add the Product Label fields to the edit taxonomy page.
	 *
	 * @param WP_Term $term Current taxonomy term object.
	 * @return void
	 */
	public static function edit_form_fields( $term ) {
		$label_options = get_term_meta( $term->term_id, 'orderable_product_label_options', true );

		$default_values = array(
			'display_option'   => 'name',
			'foreground_color' => '#fafafa',
			'background_color' => '#171717',
			'icon'             => '',
			'icon_family'      => 'fontawesome',
		);

		$label_options = wp_parse_args(
			$label_options,
			$default_values
		);

		$label_style = join(
			';',
			array(
				'color:' . $label_options['foreground_color'],
				'background-color:' . $label_options['background_color'],
			)
		);

		?>
		<tr class="form-field orderable-pro-product-labels__display-option">
			<th scope="row">
				<label for="orderable_product_label_display_option">
					<?php esc_html_e( 'Display option', 'orderable-pro' ); ?>
				</label>
			</th>
			<td>
				<?php echo wp_kses_post( self::display_option_field( $label_options['display_option'] ) ); ?>
			</td>
		</tr>
		<tr class="form-field term-foreground-color-wrap">
			<th scope="row">
				<label for="orderable_product_label_foreground_color">
					<?php esc_html_e( 'Foreground color', 'orderable-pro' ); ?>
				</label>
			</th>
			<td>
				<?php echo wp_kses_post( self::foreground_color_field( $label_options['foreground_color'] ) ); ?>
			</td>
		</tr>
		<tr class="form-field term-background-color-wrap">
			<th scope="row">
				<label for="orderable_product_label_background_color">
					<?php esc_html_e( 'Background color', 'orderable-pro' ); ?>
				</label>
			</th>
			<td>
				<?php echo wp_kses_post( self::background_color_field( $label_options['background_color'] ) ); ?>
			</td>
		</tr>
		<tr class="form-field term-icon-wrap">
			<th scope="row">
				<label for="orderable_product_label_icon">
					<?php esc_html_e( 'Icon', 'orderable-pro' ); ?>
				</label>
			</th>
			<td>
				<div class="form-field orderable-pro-product-labels-icon">
					<?php echo wp_kses_post( self::icon_field( $label_options['icon'], $label_options['icon_family'] ) ); ?>
				</div>
			</td>
		</tr>
		<tr class="form-field term-preview-wrap">
			<th scope="row">
				<label for="orderable_product_label_icon">
					<?php esc_html_e( 'Preview', 'orderable-pro' ); ?>
				</label>
			</th>
			<td>
				<div class="orderable-pro-product-labels__preview">
					<span class="orderable-pro-product-labels__preview-wrapper">
						<span
							class="<?php echo esc_attr( join( ' ', self::get_default_label_classes() ) ); ?>"
							style=<?php echo esc_attr( $label_style ); ?>
						>
							<i class="orderable-pro-product-labels__icon"></i>					
							<span class="orderable-pro-product-labels__text"></span>
						</span>
					</span>
				</div>
			</td>
		</tr>
		<?php
	}

	/**
	 * Output product labels in the frontend.
	 *
	 * @param WC_Product $product The product.
	 * @param array      $args    The product args.
	 * @return void
	 */
	public static function show_labels( $product, $args ) {
		$product_labels = get_the_terms( $product->get_id(), 'orderable_product_label' );

		if ( empty( $product_labels ) || is_wp_error( $product_labels ) ) {
			return;
		}

		$position  = empty( $args['product_labels_position'] ) ? 'over-image' : $args['product_labels_position'];
		$alignment = empty( $args['product_labels_alignment'] ) ? 'top-left' : $args['product_labels_alignment'];
		$style     = Orderable_Settings::get_setting( 'style_style_buttons' );

		if ( 'over-image' === $position && 'bottom-right' === $alignment && Orderable_Nutritional_Info_Pro::has_nutritional_info( $product->get_id() ) ) {
			$has_nutritional_info_class = 'orderable-pro-product-labels__wrapper--has-nutritional-info';
		} else {
			$has_nutritional_info_class = '';
		}

		$wrapper_classes = join(
			' ',
			array(
				'orderable-pro-product-labels__wrapper',
				/**
				 * $position can be a hook name that contains `_` and since
				 * this is a class name and to keep consistency with BEM methodology
				 * we replace `_` for `-`.
				 *
				 * @see https://en.bem.info/methodology/
				 */
				'orderable-pro-product-labels__wrapper--position-' . str_replace( '_', '-', $position ),
				'orderable-pro-product-labels__wrapper--alignment-' . $alignment,
				$has_nutritional_info_class,
			)
		);

		?>
		<div
			class="<?php echo esc_attr( $wrapper_classes ); ?>"
		>
			<?php
			/**
			 * Fires before product labels elements.
			 *
			 * @since 1.7.0
			 * @hook orderable_product_labels_before_labels_elements
			 * @param WC_Product $product The product.
			 * @param array      $args    The product args.
			 */
			do_action( 'orderable_product_labels_before_labels_elements', $product, $args );

			foreach ( $product_labels as $product_label ) {
				self::show_label( $product_label );
			}

			/**
			 * Fires after product labels elements.
			 *
			 * @since 1.7.0
			 * @hook orderable_product_labels_after_labels_elements
			 * @param WC_Product $product The product.
			 * @param array      $args    The product args.
			 */
			do_action( 'orderable_product_labels_after_labels_elements', $product, $args );
			?>
		</div>
		<?php
	}

	/**
	 * Get the default label classes.
	 *
	 * @return string[]
	 */
	protected static function get_default_label_classes() {
		$style = Orderable_Settings::get_setting( 'style_style_buttons' );

		$default_label_classes = array(
			'orderable-pro-product-labels__label',
			'orderable-pro-product-labels__label--' . $style,
		);

		return $default_label_classes;
	}

	/**
	 * Output product label HTML.
	 *
	 * @param WP_Term $product_label_term The WP_Term object.
	 * @return void
	 */
	protected static function show_label( $product_label_term ) {
		$options = get_term_meta( $product_label_term->term_id, 'orderable_product_label_options', true );

		if ( empty( $options ) ) {
			return;
		}

		$label_style = join(
			';',
			array(
				'color:' . $options['foreground_color'],
				'background-color:' . $options['background_color'],
			)
		);

		$show_icon_name = 'icon_name' === $options['display_option'] || 'name_icon' === $options['display_option'];
		$show_icon      = $show_icon_name || 'icon' === $options['display_option'];
		$show_name      = $show_icon_name || 'name' === $options['display_option'];

		$label_classes = self::get_default_label_classes();

		$label_classes[] = 'orderable-pro-product-labels__label-' . $product_label_term->slug;

		if ( 'name_icon' === $options['display_option'] ) {
			$label_classes[] = 'orderable-pro-product-labels__label--direction-row-reverse';
		}

		$label_classes = join( ' ', $label_classes );

		$icon_content = '';

		if ( 'orderable-pro-icons' === $options['icon_family'] ) {
			$icon_name = str_replace( 'orderable-pro-icons__', '', $options['icon'] );

			if ( ! empty( $icon_name ) ) {
				$icon_content = (string) file_get_contents( ORDERABLE_PRO_PATH . 'inc/modules/product-labels-pro/assets/svg/' . $icon_name . '.svg' );
			}
		}

		ob_start();
		?>
		<span
			class="<?php echo esc_attr( $label_classes ); ?>"
			style="<?php echo esc_attr( $label_style ); ?>"
			title="<?php echo esc_attr( $product_label_term->description ); ?>"
		>
			<?php if ( $show_icon && ! empty( $options['icon'] ) ) : ?>
				<?php
				printf(
					'<i class="orderable-pro-product-labels__icon %1$s %2$s">%3$s</i>',
					esc_attr( self::get_icon_family_class( $options['icon_family'] ) ),
					esc_attr( $options['icon'] ),
					wp_kses( $icon_content, self::get_svg_allowed_html_tags() )
				);
				?>
			<?php endif; ?>

			<?php if ( $show_name ) : ?>
				<span class="orderable-pro-product-labels__text">
					<?php
						/**
						 * Filter the product label name shown on the frontend.
						 *
						 * @since 1.7.0
						 * @hook orderable_product_labels_product_label_name
						 * @param  string $name          The product label name.
						 * @param WP_Term $product_label The orderable_product_label term.
						 * @return string
						 */
						echo esc_html( apply_filters( 'orderable_product_labels_product_label_name', $product_label_term->name, $product_label_term ) );
					?>
				</span>
			<?php endif; ?>
		</span>

		<?php
		/**
		 * The product label HTML markup shown on the frontend.
		 *
		 * @since 1.7.0
		 * @hook orderable_product_labels_product_label_markup
		 * @param  string     $html          The HTML markup.
		 * @param  WP_Term    $product_label The orderable_product_label term.
		 * @return string New value
		 */
		$label_html = apply_filters( 'orderable_product_labels_product_label_markup', ob_get_clean(), $product_label_term );

		$allowed_html_tags = array_merge( wp_kses_allowed_html( 'post' ), self::get_svg_allowed_html_tags() );

		echo wp_kses( $label_html, $allowed_html_tags );
	}

	/**
	 * Get icon family CSS class.
	 *
	 * @param string $font_family The font family name.
	 * @return string
	 */
	protected static function get_icon_family_class( $font_family ) {
		switch ( $font_family ) {
			case 'dashicons':
				$class = 'dashicons';
				break;
			case 'fontawesome':
				$class = 'fa';
				break;
			case 'woocommerce':
				$class = 'wooicon';
				break;

			default:
				$class = '';
		}

		/**
		 * Filter description.
		 *
		 * @since 1.7.0
		 * @hook orderable_product_labels_icon_family_css_class
		 * @param  string $class       The font family CSS class.
		 * @param  string $font_family The font family.
		 * @return string New value
		 */
		return apply_filters( 'orderable_product_labels_icon_family_css_class', $class, $font_family );
	}

	/**
	 * Attach the self::show_labels to the position defined
	 * in the product layout settings.
	 *
	 * @param WC_Product $product The product.
	 * @param array      $args    The product args.
	 * @return void
	 */
	public static function attach_show_labels_hook( $product, $args ) {
		if ( empty( $args['product_labels_position'] ) || 'none' === $args['product_labels_position'] ) {
			return;
		}

		$position_hook = '';

		switch ( $args['product_labels_position'] ) {
			case 'over-image':
				$position_hook = 'orderable_after_product_hero';
				break;

			case 'before-title':
				$position_hook = 'orderable_before_product_title';
				break;

			case 'before-description':
				$position_hook = 'orderable_before_product_description';
				break;

			case 'before-price':
				$position_hook = 'orderable_before_product_actions';
				break;

			default:
				return;
		}

		add_action( $position_hook, array( __CLASS__, 'show_labels' ), 10, 2 );
	}

	/**
	 * Get the product page hook to show the product labels.
	 *
	 * Default: `woocommerce_before_add_to_cart_form`
	 *
	 * @return string
	 */
	public static function get_product_page_hook() {
		/**
		 * Filter product page hook to show the product labels.
		 *
		 * @since 1.7.0
		 * @hook orderable_product_labels_product_page_hook
		 * @param  string $hook The product page hook. Default: `woocommerce_before_add_to_cart_form`.
		 * @return string New value
		 */
		$hook = apply_filters( 'orderable_product_labels_product_page_hook', 'woocommerce_before_add_to_cart_form' );

		return $hook;
	}

	/**
	 * Get the side drawer hook to show the product labels.
	 *
	 * Default: `orderable_side_menu_before_product_options_wrapper`
	 *
	 * @return string
	 */
	public static function get_side_drawer_hook() {
		/**
		 * Filter side drawer hook to show the product labels.
		 *
		 * @since 1.7.0
		 * @hook orderable_product_labels_side_drawer_hook
		 * @param  string $hook The side drawer hook. Default: `orderable_side_menu_before_product_options_wrapper`.
		 * @return string New value
		 */
		$hook = apply_filters( 'orderable_product_labels_side_drawer_hook', Orderable_Settings::get_setting( 'drawer_quickview_labels' ) );

		return $hook;
	}

	/**
	 * Output the product labels on the product page.
	 *
	 * @return void
	 */
	public static function show_labels_on_product_page() {
		global $product;

		if ( empty( $product ) || ! is_a( $product, 'WC_Product' ) ) {
			return;
		}

		$args = array(
			'product_labels_position'  => 'product_page',
			'product_labels_alignment' => 'left',
		);

		self::show_labels( $product, $args );
	}

	/**
	 * Output the product labels on the side drawer.
	 *
	 * @param WC_Product $product The product.
	 * @return void
	 */
	public static function show_labels_on_side_drawer( $product ) {
		$drawer_quickview_labels = Orderable_Settings::get_setting( 'drawer_quickview_labels' );

		if ( ! $drawer_quickview_labels || ! is_string( $drawer_quickview_labels ) ) {
			return;
		}

		$args = array(
			'product_labels_position'  => 'side_drawer_' . str_replace( 'orderable_side_menu_', '', Orderable_Settings::get_setting( 'drawer_quickview_labels' ) ),
			'product_labels_alignment' => 'left',
		);

		self::show_labels( $product, $args );
	}

	/**
	 * Add the `product_label` column after the checkbox field
	 * to select the item.
	 *
	 * @param string[] $columns The column header labels keyed by column ID.
	 * @return string[]
	 */
	public static function add_product_label_column( $columns ) {
		$updated_columns = array();

		foreach ( $columns as $key => $value ) {
			$updated_columns[ $key ] = $value;

			if ( 'cb' === $key ) {
				$updated_columns['product_label'] = '';
			}
		}

		return $updated_columns;
	}

	/**
	 * Add the product label to the `product_label` column.
	 *
	 * @param string $string      Custom column output. Default empty.
	 * @param string $column_name Name of the column.
	 * @param int    $term_id     Term ID.
	 * @return string
	 */
	public static function add_product_label_column_content( $string, $column_name, $term_id ) {
		if ( 'product_label' !== $column_name ) {
			return $string;
		}

		$product_label = get_term( $term_id, 'orderable_product_label' );

		if ( empty( $product_label ) || is_wp_error( $product_label ) ) {
			return '';
		}

		ob_start();

		self::show_label( $product_label );

		return ob_get_clean();
	}

	/**
	 * Add Product Labels default settings to Orderable.
	 *
	 * @param array $default_settings The Orderable default settings.
	 * @return array
	 */
	public static function add_default_settings( $default_settings ) {
		$default_settings['drawer_quickview_labels'] = 'none';

		return $default_settings;
	}

	/**
	 * Add Product Labels layout defaults to Orderable.
	 *
	 * @param array $layout_defaults The Orderable layout defaults.
	 * @return array
	 */
	public static function add_layout_defaults( $layout_defaults ) {
		$layout_defaults['product_labels_position']  = 'none';
		$layout_defaults['product_labels_alignment'] = '';

		return $layout_defaults;
	}

	/**
	 * Add Product Labels layout settings fields.
	 *
	 * @param array $layout_settings The layout settings.
	 * @return void
	 */
	public static function add_layout_settings_fields( $layout_settings ) {
		?>
		<div class="orderable-fields-row__body-row">
			<div class="orderable-fields-row__body-row-left">
				<h3>
					<label for="product_labels_position"><?php esc_html_e( 'Labels', 'orderable' ); ?></label>
				</h3>
				<p><?php esc_html_e( 'Choose the position of product labels.', 'orderable' ); ?></p>
			</div>
			<div class="orderable-fields-row__body-row-right">
				<?php
				woocommerce_wp_select(
					array(
						'id'      => 'orderable_product_labels_position',
						'label'   => '',
						'options' => array(
							'none'               => __( 'None', 'orderable' ),
							'over-image'         => __( 'Over the image', 'orderable' ),
							'before-title'       => __( 'Before title', 'orderable' ),
							'before-description' => __( 'Before description', 'orderable' ),
							'before-price'       => __( 'Before price', 'orderable' ),
						),
						'value'   => esc_attr( $layout_settings['product_labels_position'] ),
					)
				);

				$show_vertical_horizontal_aligment = 'over-image' === $layout_settings['product_labels_position'];
				$show_horizontal_aligment          = ! in_array( $layout_settings['product_labels_position'], array( 'none', 'over-image' ), true );

				/**
				 * Select to choose the vertical and horizontal aligment.
				 *
				 * We show when the position is set to `over-image`.
				 */
				woocommerce_wp_select(
					array(
						'id'                => 'orderable_product_labels_alignment',
						'class'             => 'orderable_product_labels_alignment__select orderable_product_labels_alignment__select-vertical-horizontal-alignment',
						'label'             => '',
						'style'             => $show_vertical_horizontal_aligment ? '' : 'display:none',
						'custom_attributes' => $show_vertical_horizontal_aligment ? array() : array( 'disabled' => '' ),
						'options'           => array(
							'top-left'      => __( 'Top Left', 'orderable' ),
							'top-center'    => __( 'Top Center', 'orderable' ),
							'top-right'     => __( 'Top Right', 'orderable' ),
							'middle-left'   => __( 'Middle Left', 'orderable' ),
							'middle-center' => __( 'Middle Center', 'orderable' ),
							'middle-right'  => __( 'Middle Right', 'orderable' ),
							'bottom-left'   => __( 'Bottom Left', 'orderable' ),
							'bottom-center' => __( 'Bottom Center', 'orderable' ),
							'bottom-right'  => __( 'Bottom Right', 'orderable' ),
						),
						'value'             => esc_attr( $layout_settings['product_labels_alignment'] ),
					)
				);

				/**
				 * Select to choose the horizontal aligment.
				 *
				 * We hide when the position is set to `none` or `over-image`.
				 */
				woocommerce_wp_select(
					array(
						'id'                => 'orderable_product_labels_alignment',
						'class'             => 'orderable_product_labels_alignment__select orderable_product_labels_alignment__select-horizontal-alignment',
						'label'             => '',
						'style'             => $show_horizontal_aligment ? '' : 'display:none',
						'custom_attributes' => $show_horizontal_aligment ? array() : array( 'disabled' => '' ),
						'options'           => array(
							'left'   => __( 'Left', 'orderable' ),
							'center' => __( 'Center', 'orderable' ),
							'right'  => __( 'Right', 'orderable' ),
						),
						'value'             => esc_attr( $layout_settings['product_labels_alignment'] ),
					)
				);
				?>
			</div>
		</div>
		<?php
	}

	/**
	 * Save the Product Labels layout settings.
	 *
	 * @param array $layout_settings The layout settings.
	 * @return array
	 */
	public static function save_product_labels_layout_setings( $layout_settings ) {
		// phpcs:ignore WordPress.Security.NonceVerification
		$position = empty( $_POST['orderable_product_labels_position'] ) ? '' : sanitize_text_field( wp_unslash( $_POST['orderable_product_labels_position'] ) );
		// phpcs:ignore WordPress.Security.NonceVerification
		$alignment = empty( $_POST['orderable_product_labels_alignment'] ) ? '' : sanitize_text_field( wp_unslash( $_POST['orderable_product_labels_alignment'] ) );

		$layout_settings['product_labels_position']  = empty( $position ) ? 'none' : $position;
		$layout_settings['product_labels_alignment'] = empty( $alignment ) ? '' : $alignment;

		return $layout_settings;
	}

	/**
	 * Add fields to the Quickview section in the Orderable settings.
	 *
	 * @param array $settings The Orderable settings.
	 * @return array
	 */
	public static function add_fields_to_quickview_section( $settings ) {
		if ( empty( $settings['sections']['quickview']['fields'] ) || ! is_array( $settings['sections']['quickview']['fields'] ) ) {
			return $settings;
		}

		$settings['sections']['quickview']['fields']['labels'] = array(
			'id'       => 'labels',
			'title'    => __( 'Product Labels', 'orderable' ),
			'subtitle' => __( 'Where should the product labels be displayed in the side drawer.', 'orderable' ),
			'type'     => 'select',
			'choices'  => array(
				'none'                                     => __( 'None', 'orderable' ),
				'orderable_side_menu_before_product_title' => __( 'Before Product Title', 'orderable' ),
				'orderable_side_menu_before_product_options_wrapper' => __( 'Before Product Options', 'orderable' ),
				'orderable_side_menu_after_product_options_wrapper' => __( 'After Product Options', 'orderable' ),
			),
			'default'  => Orderable_Settings::get_setting_default( 'drawer_quickview_labels' ),
		);

		return $settings;
	}

	/**
	 * Get the Orderable icons.
	 *
	 * @return string[]
	 */
	protected static function get_product_labels_icons() {
		$transient_name = 'orderable_pro_product_labels_icons_list';

		$icons = get_transient( $transient_name );

		if ( ! empty( $icons ) ) {
			return $icons;
		}

		$icons = glob( ORDERABLE_PRO_PATH . 'inc/modules/product-labels-pro/assets/svg/*.svg' );

		if ( empty( $icons ) ) {
			return array();
		}

		$icons = array_map(
			function ( $icon ) {
				return basename( $icon, '.svg' );
			},
			$icons
		);

		set_transient( $transient_name, $icons );

		return $icons;
	}

	/**
	 * Get the allowed HTML tags to SVG.
	 *
	 * @return array
	 */
	protected static function get_svg_allowed_html_tags() {
		$allowed_html_tags['svg'] = array(
			'xmlns'   => array(),
			'fill'    => array(),
			'height'  => array(),
			'width'   => array(),
			'viewbox' => array(),
		);

		$allowed_html_tags['g'] = array();

		$allowed_html_tags['circle'] = array(
			'cx' => array(),
			'cy' => array(),
			'r'  => array(),
		);

		$allowed_html_tags['rect'] = array(
			'x'         => array(),
			'y'         => array(),
			'rx'        => array(),
			'height'    => array(),
			'width'     => array(),
			'transform' => array(),
		);

		$allowed_html_tags['path'] = array(
			'd'         => array(),
			'fill'      => array(),
			'fill-rule' => array(),
			'clip-rule' => array(),
		);

		return $allowed_html_tags;
	}

	/**
	 * Set the `product_label` column as primary column.
	 *
	 * This is important because we're using the `product_label`
	 * column in the first position and WordPress has CSS rules
	 * that are applied for columns after the primary column. By
	 * default, the primary column is `name`.
	 *
	 * Example of CSS rule used by WordPress:
	 *
	 * `.wp-list-table tr:not(.inline-edit-row):not(.no-items) td.column-primary~td:not(.check-column)`
	 *
	 * @param string $default   Column name default for the specific list table.
	 * @param string $screen_id Screen ID for specific list table.
	 * @return string
	 */
	public static function set_product_label_as_primary_column( $default, $screen_id ) {
		if ( 'edit-orderable_product_label' !== $screen_id ) {
			return $default;
		}

		return 'product_label';
	}

	/**
	 * Set Orderable as active menu when accessing Product Labels.
	 *
	 * Since Product Labels is a product taxonomy, by default WordPress
	 * opens the Products menu.
	 *
	 * @param string $parent_file The parent file.
	 * @return string
	 */
	public static function set_orderable_as_active_menu( $parent_file ) {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return $parent_file;
		}

		$current_screen = get_current_screen();

		if ( empty( $current_screen->id ) ) {
			return $parent_file;
		}

		if ( 'edit-orderable_product_label' !== $current_screen->id ) {
			return $parent_file;
		}

		return 'orderable';
	}

	/**
	 * Set Product Labels as active submenu when accessing Product Labels.
	 *
	 * Since Product Labels is a product taxonomy, by default WordPress
	 * opens the Products menu.
	 *
	 * @param string $submenu_file The submenu file.
	 * @param string $parent_file The submenu item's parent file.
	 * @return string
	 */
	public static function set_product_labels_as_active_submenu( $submenu_file, $parent_file ) {
		if ( 'orderable' !== $parent_file ) {
			return $submenu_file;
		}

		if ( ! function_exists( 'get_current_screen' ) ) {
			return $submenu_file;
		}

		$current_screen = get_current_screen();

		if ( empty( $current_screen->id ) ) {
			return $submenu_file;
		}

		if ( 'edit-orderable_product_label' !== $current_screen->id ) {
			return $submenu_file;
		}

		return 'edit-tags.php?taxonomy=orderable_product_label&post_type=product';
	}
}
