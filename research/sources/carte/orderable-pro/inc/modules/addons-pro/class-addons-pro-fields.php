<?php
/**
 * Module: Addons.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Addons module Field Group class.
 */
class Orderable_Addons_Pro_Fields {
	/**
	 * Initialize.
	 */
	public static function run() {
		add_action( 'init', array( __CLASS__, 'hooks' ) );
		add_filter( 'woocommerce_add_cart_item_data', array( __CLASS__, 'save_fields_data_to_order_item_data' ), 10, 2 );
		add_filter( 'woocommerce_get_item_data', array( __CLASS__, 'display_field_value_on_cart' ), 10, 2 );
		add_action( 'woocommerce_checkout_create_order_line_item', array( __CLASS__, 'add_order_line_item_meta' ), 10, 4 );
	}

	/**
	 * Hooks.
	 */
	public static function hooks() {
		add_action( 'woocommerce_before_add_to_cart_button', array( __CLASS__, 'show_product_fields' ) );
		add_action( 'orderable_side_menu_before_product_options', array( __CLASS__, 'show_product_fields' ) );
		add_filter( 'orderable_add_to_cart_button_args', array( __CLASS__, 'maybe_modify_add_to_cart_args' ), 10, 2 );
	}

	/**
	 * Display fields.
	 *
	 * @param bool|WC_Product $product Product.
	 */
	public static function show_product_fields( $product = false, $context = 'hook' ) {
		if ( empty( $product ) ) {
			global $product;
		}

		if ( empty( $product ) || ! is_a( $product, 'WC_Product' ) ) {
			return;
		}

		$content = get_post_field( 'post_content', $product->get_id() );
		if ( 'hook' === $context && has_shortcode( $content, 'orderable_addons' ) ) {
			return;
		}

		$group_ids = Orderable_Pro_Conditions_Matcher::get_applicable_cpt( 'orderable_addons', $product );

		if ( empty( $group_ids ) ) {
			return;
		}

		/**
		 * Filter extra HTML attributes to be added to the `.orderable-product-fields-group-wrap` element.
		 *
		 * The HTML attributes should follow the pattern `array( 'attribute_name' => 'value' )`.
		 *
		 * @since 1.11.0
		 * @hook orderable_product_fields_group_wrap_extra_html_attributes
		 * @param  array $extra_html_attributes The HTML attributes.
		 * @param  WC_Product $product          The product.
		 * @return array New value
		 */
		$product_fields_group_wrap_extra_html_attributes = apply_filters( 'orderable_product_fields_group_wrap_extra_html_attributes', array(), $product );

		if ( ! is_array( $product_fields_group_wrap_extra_html_attributes ) ) {
			$product_fields_group_wrap_extra_html_attributes = array();
		}

		$product_fields_group_wrap_extra_html_attributes_string = '';
		foreach ( $product_fields_group_wrap_extra_html_attributes as $key => $value ) {
			if ( ! is_string( $key ) ) {
				continue;
			}

			$product_fields_group_wrap_extra_html_attributes_string .= sprintf( ' %1$s="%2$s"', esc_attr( $key ), esc_attr( $value ) );
		}

		?>
		<div
			class="orderable-product-fields-group-wrap"
			data-product-id="<?php echo esc_attr( $product->get_ID() ); ?>"
			data-price="<?php echo esc_attr( wc_get_price_to_display( $product ) ); ?>"
			data-regular-price="<?php echo esc_attr( wc_get_price_to_display( $product, array( 'price' => $product->get_regular_price() ) ) ); ?>"
			<?php echo $product_fields_group_wrap_extra_html_attributes_string; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		>
		<?php
		foreach ( $group_ids as $group_id ) {
			?>
			<div class="orderable-product-fields-group orderable-product__options">
				<?php
				$fields = Orderable_Addons_Pro_Field_Groups::get_group_data( $group_id );

				foreach ( $fields as $field ) {
					$is_visual      = ( 'visual_radio' === $field['type'] || 'visual_checkbox' === $field['type'] ) ? true : false;
					$visual_class   = $is_visual ? 'orderable-product-fields--visual' : '';
					$required_class = $field['required'] ? 'orderable-product-fields--required' : '';

					printf( '<div class="orderable-product-fields orderable-product-fields--%s %s %s" data-field-name="%s">', esc_attr( $field['type'] ), esc_attr( $visual_class ), esc_attr( $required_class ), esc_attr( $field['title'] ) );

					switch ( $field['type'] ) {
						case 'select':
							self::generate_field_select( $field, $group_id );
							break;
						case 'visual_checkbox':
						case 'visual_radio':
							self::generate_field_visual( $field, $group_id );
							break;
						case 'text':
							self::generate_field_text( $field, $group_id );
							break;
					}

					echo '</div>'; // .orderable-product-fields
				}
				?>
			</div>
			<?php
		}
		?>
		</div> <!-- /.orderable-product-fields-group-wrap -->
		<?php
	}

	/**
	 * Maybe modify Add to Cart button args.
	 *
	 * @param array      $args The Add to Cart button args.
	 * @param WC_Product $product The product.
	 *
	 * @return array
	 */
	public static function maybe_modify_add_to_cart_args( $args, $product ) {
		$group_ids = Orderable_Pro_Conditions_Matcher::get_applicable_cpt( 'orderable_addons', $product );

		if ( empty( $group_ids ) ) {
			return $args;
		}

		global $orderable_single_product;

		$args['trigger'] = 'product-options';

		// When the product is out of stock, `$args['text']` holds `Out of Stock`.
		if ( ! $product->is_in_stock() ) {
			return $args;
		}

		$args['text'] = empty( $orderable_single_product ) ? __( 'Select', 'orderable-pro' ) : __( 'Add', 'orderable-pro' );

		return $args;
	}

	/**
	 * Save Fields data to WC order item data.
	 *
	 * @return array
	 */
	public static function save_fields_data_to_order_item_data( $item_data, $cart_item ) {
		$posted_field_group = filter_input( INPUT_POST, 'orderable_fields', FILTER_DEFAULT, FILTER_REQUIRE_ARRAY );

		if ( empty( $posted_field_group ) ) {
			return $item_data;
		}

		$orderable_item_data = array();
		foreach ( $posted_field_group as $group_id => $posted_fields ) {
			foreach ( $posted_fields as $field_id => $posted_field ) {
				$field_setting = Orderable_Addons_Pro_Field_Groups::get_field_data( $field_id, $group_id );
				$fees          = Orderable_Addons_Pro_Fees::calculate_fees( $posted_field, $field_id, $group_id );

				$orderable_item_data[ $field_id ] = array(
					'id'       => $field_id,
					'value'    => $posted_field,
					'label'    => $field_setting['title'],
					'group_id' => $group_id,
					'fees'     => $fees,
				);
			}
		}

		$item_data['orderable_fields'] = $orderable_item_data;

		return $item_data;
	}

	/**
	 * Add fields data to item data so it can appear in cart.
	 *
	 * @param array $item_data Item data.
	 * @param array $cart_item Cart Item.
	 *
	 * @return array
	 */
	public static function display_field_value_on_cart( $item_data, $cart_item ) {
		if ( empty( $cart_item['orderable_fields'] ) ) {
			return $item_data;
		}

		foreach ( $cart_item['orderable_fields'] as $field ) {
			if ( empty( $field['value'] ) ) {
				continue;
			}

			$value = is_array( $field['value'] ) ? implode( ', ', array_filter( $field['value'] ) ) : $field['value'];

			if ( empty( $value ) ) {
				continue;
			}

			if ( $field['fees'] ) {
				$value = sprintf( '%s (%s)', $value, wc_price( $field['fees'] ) );
			}

			$item_data[] = array(
				'key'   => $field['label'],
				'value' => $value,
			);
		}

		return $item_data;
	}

	/**
	 * Add fields data to order line item meta
	 * so it can appear in order completion page
	 * and admin order edit page.
	 *
	 * @param object $item          Order line item object.
	 * @param string $cart_item_key Cart item key.
	 * @param array  $values        Cart data.
	 * @param object $order         Order object.
	 */
	public static function add_order_line_item_meta( $item, $cart_item_key, $values, $order ) {
		if ( empty( $values['orderable_fields'] ) ) {
			return $item;
		}

		/**
		 * Filter whether the addons fees should be added alongside the label or skipped.
		 *
		 * Examples: with fees `Size: small ($1.00)`; without fees `Size: small`.
		 *
		 * @since 1.10.2
		 * @hook orderable_skip_fees_on_addons_order_line_item_meta
		 * @param  bool $skip_fees       Default: false.
		 * @param  bool $addons          The addons selected to the order item.
		 * @param  bool $order_line_item Order line item object.
		 * @param  bool $order           Order object.
		 * @return bool New value
		 */
		$skip_fees = apply_filters( 'orderable_skip_fees_on_addons_order_line_item_meta', false, $values['orderable_fields'], $item, $order );

		foreach ( $values['orderable_fields'] as $field ) {
			$value = is_array( $field['value'] ) ? implode( ', ', array_filter( $field['value'] ) ) : $field['value'];

			if ( ! $skip_fees && ! empty( $field['fees'] ) ) {
				$value .= ' (' . wc_price( (float) $field['fees'] ) . ')';
			}

			$item->add_meta_data( $field['label'], $value );
		}
	}

	/**
	 * Generate Select field.
	 *
	 * @param array $field    Field's data.
	 * @param int   $group_id Field Group's post ID.
	 */
	public static function generate_field_select( $field, $group_id ) {
		$name     = sprintf( 'orderable_fields[%s][%s]', $group_id, $field['id'] );
		$required = $field['required'] ? 'required' : '';
		?>
		<label class="orderable-product-fields__title"><?php echo esc_html( $field['title'] ); ?></label>
		<?php if ( ! empty( $field['description'] ) ) { ?>
			<p class="orderable-product-fields__description"><?php echo wp_kses_post( $field['description'] ); ?></p>
		<?php } ?>
		<div class="orderable-product-fields__field">
			<select name="<?php echo esc_attr( $name ); ?>" class="orderable-input orderable-input--addon orderable-input--select" <?php echo esc_attr( $required ); ?>>
				<?php
				foreach ( $field['options'] as $option ) {
					$label = $option['label'];

					if ( ! empty( $option['price'] ) ) {
						$label .= sprintf( ' (+%s)', wp_strip_all_tags( wc_price( $option['price'] ) ) );
					}
					?>
					<option
						data-product-option
						data-fees="<?php echo esc_attr( $option['price'] ); ?>"
						data-points-earned="<?php echo empty( $option['points_earned'] ) ? '' : esc_attr( $option['points_earned'] ); ?>"
						value="<?php echo esc_attr( $option['label'] ); ?>"
						<?php selected( '1', $option['selected'] ); ?>
					>
						<?php
							echo esc_html(
								/**
								 * Filter the option product addon label.
								 *
								 * @since 1.11.0
								 * @hook orderable_product_addon_option_label
								 * @param  string $label    The option label.
								 * @param  array  $option   The option data.
								 * @param  array  $field    The field data.
								 * @param  int    $group_id Field Group's post ID.
								 * @return string New value
								 */
								apply_filters( 'orderable_product_addon_option_label', $label, $option, $field, $group_id )
							);
						?>
					</option>
					<?php
				}
				?>
			</select>
		</div>
		<?php
	}

	/**
	 * Generate Select field.
	 *
	 * @param array $field Field's data.
	 * @param int   $group_id Field Group's post ID.
	 */
	public static function generate_field_visual( $field, $group_id ) {
		$type                  = 'visual_checkbox' === $field['type'] ? 'checkbox' : 'radio';
		$name                  = sprintf( 'orderable_fields[%s][%s]', $group_id, $field['id'] );
		$max_allowed_selection = ! empty( $field['max_allowed_selection'] ) ? absint( $field['max_allowed_selection'] ) : '';
		$max_selection_class   = ! empty( $max_allowed_selection ) ? 'orderable-product-fields__field--has-max-selection' : '';

		if ( 'visual_checkbox' === $field['type'] ) {
			$name .= '[]';
		}
		?>
		<label class="orderable-product-fields__title">
			<?php echo esc_html( $field['title'] ); ?>
			<?php
			if ( ! empty( $max_allowed_selection ) && apply_filters( 'orderable_show_max_selection_label', true ) ) {
				// Translators: %d is the maximum allowed selection.
				echo esc_html( sprintf( _n( '(Select %d option)', '(Select up to %d options)', $max_allowed_selection, 'orderable-pro' ), $max_allowed_selection ) );
			}
			?>
		</label>
		<?php if ( ! empty( $field['description'] ) ) { ?>
			<p class="orderable-product-fields__description"><?php echo wp_kses_post( $field['description'] ); ?></p>
		<?php } ?>
		<div class="orderable-product-fields__field <?php printf( 'orderable-product-fields__field--%s %s', esc_attr( $field['type'] ), esc_attr( $max_selection_class ) ); ?>" data-max-selection="<?php echo esc_attr( $max_allowed_selection ); ?>">
			<?php
			foreach ( $field['options'] as $option ) {
				$fees_class = ( $option['price'] > 0 ) ? 'orderable-product-option__label-fee--positive' : 'orderable-product-option__label-fee--negative';
				?>
				<div
					class="orderable-product-option orderable-product-option--visual orderable-product-option--<?php echo esc_attr( $option['visual_type'] ); ?>" 
					data-product-option
					data-fees="<?php echo esc_attr( $option['price'] ); ?>"
					data-points-earned="<?php echo empty( $option['points_earned'] ) ? '' : esc_attr( $option['points_earned'] ); ?>"
				>
					<?php self::generate_visual_option( $option ); ?>
					<p class="orderable-product-option__label">
						<input
							type="<?php echo esc_attr( $type ); ?>"
							class="orderable-product-option__hidden-field orderable-input--addon"
							name='<?php echo esc_attr( $name ); ?>'
							value="<?php echo esc_attr( $option['label'] ); ?>"
							id='orderable_field_<?php echo esc_attr( $option['id'] ); ?>'
							<?php checked( '1', $option['selected'] ); ?>
						/>
						<span class="orderable-product-option__label-text"><?php echo esc_html( $option['label'] ); ?></span>
						<span class="orderable-product-option__label-data">
							<?php
								/**
								 * Fires before product option price.
								 *
								 * @since 1.11.0
								 * @hook orderable_before_product_option_price
								 * @param  array $option The option data.
								 */
								do_action( 'orderable_before_product_option_price', $option );
							?>

							<?php if ( ! empty( $option['price'] ) ) { ?>
								<span class="orderable-product-option__label-fee <?php echo esc_attr( $fees_class ); ?>">
								<?php echo wc_price( abs( $option['price'] ) ); ?>
								</span>
							<?php } ?>
							<span class="orderable-product-option__label-state"></span>
						</span>
					</p>
				</div>
				<?php
			}
			?>
		</div>
		<?php
		if ( ! empty( $max_allowed_selection ) ) {
			?>
			<div class="orderable-product-fields__max-selection-error">
				<?php
				// Translators: %d is the maximum allowed selection.
				echo esc_html( sprintf( _n( 'Please select %d option.', 'Please select up to %d options.', $max_allowed_selection, 'orderable-pro' ), $max_allowed_selection ) );
				?>
			</div>
			<?php
		}
		?>
		<?php
	}

	/**
	 * Generate text field.
	 *
	 * @param array $field Field Data.
	 * @param int   $group_id Group ID.
	 */
	public static function generate_field_text( $field, $group_id ) {
		$name     = sprintf( 'orderable_fields[%s][%s]', $group_id, $field['id'] );
		$required = $field['required'] ? 'required' : '';

		?>
		<label class="orderable-product-fields__title"><?php echo esc_html( $field['title'] ); ?></label>
		<?php if ( ! empty( $field['description'] ) ) { ?>
			<p class="orderable-product-fields__description"><?php echo wp_kses_post( $field['description'] ); ?></p>
		<?php } ?>
		<div class="orderable-product-fields__field orderable-product-fields__field--<?php echo esc_attr( $field['type'] ); ?>">
			<?php

			if ( $field['is_multiline'] ) {
				printf( '<textarea %s class="orderable-input orderable-input--addon field orderable-input--text" name="%s" placeholder="%s">%s</textarea>', esc_attr( $required ), esc_attr( $name ), esc_attr( $field['placeholder'] ), esc_attr( $field['default'] ) );
			} else {
				printf( '<input %s type="text" class="orderable-input orderable-input--addon orderable-input--text" name="%s" placeholder="%s" value="%s" />', esc_attr( $required ), esc_attr( $name ), esc_attr( $field['placeholder'] ), esc_attr( $field['default'] ) );
			}
			?>
		</div>
		<?php
	}

	/**
	 * Generate visual part: Image or Color or an option in Chekbox or Radio field.
	 *
	 * @param array $option Option data.
	 *
	 * @return void
	 */
	public static function generate_visual_option( $option ) {
		if ( 'none' === $option['visual_type'] || ( empty( $option['color'] ) && empty( $option['image'] ) ) ) {
			return;
		}
		?>
		<div class="orderable-product-option__swatch">
			<?php if ( 'color' === $option['visual_type'] && $option['color'] ) { ?>
				<div class="orderable-product-option__swatch-graphic orderable-product-option__swatch-graphic--color" style="background-color:<?php echo esc_attr( $option['color'] ); ?>"></div>
				<?php
			} elseif ( 'image' === $option['visual_type'] && $option['image'] ) {
				echo wp_get_attachment_image(
					$option['image']['id'],
					/**
					 * Allows modifying the addon image size. Default size is 'thumbnail'.
					 *
					 * @param string $size   Size.
					 * @param array  $option Option data.
					 */
					apply_filters( 'orderable_product_addon_image_size', 'thumbnail', $option ),
					false,
					array(
						'class' => 'orderable-product-option__swatch-graphic orderable-product-option__swatch-graphic--image',
					)
				);
			}
			?>
		</div>
		<?php
	}
}
