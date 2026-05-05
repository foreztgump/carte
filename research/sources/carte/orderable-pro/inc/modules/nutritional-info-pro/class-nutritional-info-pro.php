<?php
/**
 * Module: Nutritional Info Pro.
 *
 * @since   1.3.0
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Orderable_Pro_Nutritional_Info class.
 */
class Orderable_Nutritional_Info_Pro {
	/**
	 * Init.
	 *
	 * Add action and filters
	 */
	public static function run() {
		add_filter( 'woocommerce_product_data_tabs', array( __CLASS__, 'add_nutritional_info_tab' ) );
		add_filter( 'orderable_get_accordion_data', array( __CLASS__, 'add_product_accordion_item' ), 10, 2 );
		add_filter( 'orderable_show_info_product_button', array( __CLASS__, 'should_show_info_button' ), 10, 2 );
		add_filter( 'woocommerce_product_tabs', array( __CLASS__, 'add_nutritional_info_tab_on_product_page' ) );

		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'admin_assets' ) );
		add_action( 'woocommerce_product_data_panels', array( __CLASS__, 'add_nutritional_info_panel' ) );
		add_action( 'wp_ajax_save_nutritional_info', array( __CLASS__, 'save_nutritional_info' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'frontend_assets' ) );
		add_action( 'woocommerce_process_product_meta', array( __CLASS__, 'save_nutritional_fields' ) );
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
				'orderable-nutritional-info-pro',
				ORDERABLE_PRO_URL . 'inc/modules/nutritional-info-pro/assets/admin/css/nutritional-info' . $suffix . '.css',
				array(),
				ORDERABLE_PRO_VERSION
			);

			wp_enqueue_script(
				'orderable-nutritional-info-pro',
				ORDERABLE_PRO_URL . 'inc/modules/nutritional-info-pro/assets/admin/js/main' . $suffix . '.js',
				array( 'jquery' ),
				ORDERABLE_PRO_VERSION,
				true
			);

			wp_localize_script(
				'orderable-nutritional-info-pro',
				'orderable_pro_nutritional_info_params',
				array(
					'ajax_url' => admin_url( 'admin-ajax.php' ),
					'nonce'    => wp_create_nonce( 'ajax-orderable-pro-nutritional-info' ),
					'post_id'  => get_the_ID(),
				)
			);
		}
	}

	/**
	 * Enqueue frontend assets.
	 */
	public static function frontend_assets() {
		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		wp_enqueue_style(
			'orderable-nutritional-info-pro-style',
			ORDERABLE_PRO_URL . 'inc/modules/nutritional-info-pro/assets/frontend/css/nutritional-info' . $suffix . '.css',
			array(),
			ORDERABLE_PRO_VERSION
		);
	}

	/**
	 * Add the Nutritional Info tab to product tabs.
	 *
	 * @param array $tabs The product tabs.
	 *
	 * @return array The product tabs.
	 */
	public static function add_nutritional_info_tab( $tabs ) {
		$tab_data = array(
			'label'    => __( 'Nutritional Info', 'orderable-pro' ),
			'target'   => 'orderable_nutritional_info_panel',
			'priority' => 55,
		);

		/**
		 * The Nutritional Info tab data added to product tabs.
		 *
		 * @param array $tab_data The Nutritional Info tab data.
		 *
		 * @return array New value
		 * @since 1.3.0
		 * @hook  orderable_nutritional_info_tab_data
		 */
		$tabs['orderable_nutritional_info'] = apply_filters(
			'orderable_nutritional_info_tab_data',
			$tab_data
		);

		return $tabs;
	}

	/**
	 * Output the Nutritional Info table.
	 *
	 * @param int $product_id The product ID.
	 *
	 * @return string
	 */
	public static function get_nutritional_info_frontend_panel( $product_id ) {
		$fields = self::get_fields( $product_id );

		$serving_and_calories  = $fields['serving_and_calories'];
		$nutrients             = $fields['nutrients'];
		$vitamins_and_minerals = $fields['vitamins_and_minerals'];

		ob_start();
		?>
		<div id="orderable-pro-nutritional-info" class="orderable-pro-nutritional-info">
			<div class="orderable-pro-nutritional-info__title">
				<?php echo __( 'Nutrition Facts', 'orderable-pro' ); ?>
			</div>

			<?php if ( ! empty( $serving_and_calories['servings_per_container']['value'] ) ) : ?>
				<div class="orderable-pro-nutritional-info__servings">
					<?php
					printf(
						_n(
							'%s serving per container',
							'%s servings per container',
							$serving_and_calories['servings_per_container']['value'],
							'orderable-pro'
						),
						$serving_and_calories['servings_per_container']['value']
					);
					?>
				</div>
			<?php endif; ?>

			<?php if ( ! empty( $serving_and_calories['serving_size']['value'] ) ) : ?>
				<div class="orderable-pro-nutritional-info__serving-size">
					<?php printf( __( 'Serving size %s', 'orderable-pro' ), $serving_and_calories['serving_size']['value'] ); ?>
				</div>
			<?php endif; ?>

			<div class="orderable-pro-nutritional-info__calories-wrapper">
				<div class="orderable-pro-nutritional-info__calories-amount-per-serving">
					<?php echo __( 'Amount Per Serving', 'orderable-pro' ); ?>
				</div>

				<?php if ( ! empty( $serving_and_calories['calories']['value'] ) ) : ?>
					<div class="orderable-pro-nutritional-info__calories">
						<span class="orderable-pro-nutritional-info__calories-label">
							<?php echo __( 'Calories', 'orderable-pro' ); ?>
						</span>
						<span class="orderable-pro-nutritional-info__calories-amount">
							<?php echo esc_html( $serving_and_calories['calories']['value'] ); ?>
						</span>
					</div>
				<?php endif; ?>
			</div>

			<?php if ( ! empty( $nutrients ) ) : ?>
				<div class="orderable-pro-nutritional-info__nutrients">
					<div class="orderable-pro-nutritional-info__daily-value orderable-pro-nutritional-info__row orderable-pro-nutritional-info__font-weight_bold">
						<?php echo __( '% Daily Value*', 'orderable-pro' ); ?>
					</div>

					<?php
					foreach ( $nutrients as $field ) :
						$field = wp_parse_args(
							$field,
							array(
								'nested-level'  => 0,
								'wrapper_class' => '',
								'label'         => '',
								'value'         => '0',
								/* translators: grams */
								'amount_in'     => __( 'g', 'orderable-pro' ),
							)
						);
						?>
						<div class="orderable-pro-nutritional-info__row orderable-pro-nutritional-info__nutrient_nested-level_<?php echo esc_attr( $field['nested-level'] ); ?>">
							<div>
								<span class="<?php echo false !== strpos( $field['wrapper_class'], 'orderable-pro-nutritional-info__font-weight_bold' ) ? 'orderable-pro-nutritional-info__font-weight_bold' : ''; ?>">
									<?php echo esc_html( $field['label'] ); ?>
								</span>
								<span>
									<?php echo esc_html( $field['value'] . $field['amount_in'] ); ?>
								</span>
							</div>
							<?php if ( ! empty( $field['daily_value'] ) ) : ?>
								<span class="orderable-pro-nutritional-info__font-weight_bold">
									<?php echo esc_html( $field['daily_value'] . '%' ); ?>
								</span>
							<?php endif; ?>
						</div>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>

			<?php if ( ! empty( $vitamins_and_minerals ) ) : ?>
				<div class="orderable-pro-nutritional-info__vitamins-and-minerals">
					<?php foreach ( $vitamins_and_minerals as $field ) : ?>
						<div class="orderable-pro-nutritional-info__row">
							<div>
								<span class="orderable-pro-nutritional-info__vitamins-and-minerals-name">
									<?php echo esc_html( $field['vitamin_or_mineral'] ); ?>
								</span>
								<span class="orderable-pro-nutritional-info__vitamins-and-minerals-amount">
									<?php echo esc_html( $field['amount'] . $field['amount_in'] ); ?>
								</span>
							</div>
							<span class="orderable-pro-nutritional-info__vitamins-and-minerals-daily-value">
								<?php
									echo isset( $field['daily_value'] ) && '' !== trim( $field['daily_value'] )
										? esc_html( $field['daily_value'] . '%' )
										: '';
								?>
							</span>
						</div>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>

			<div class="orderable-pro-nutritional-info__daily-value-description">
				<?php echo __( 'The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.', 'orderable-pro' ); ?>
			</div>
		</div>
		<?php
		$nutritional_info_html = ob_get_clean();

		/**
		 * Filter the Nutritional Info HTML
		 *
		 * @param string $nutritional_info_html The Nutritional Info HTML.
		 *
		 * @return array New HTML.
		 * @since 1.3.0
		 * @hook  orderable_nutritional_info_html
		 */
		$nutritional_info_html = apply_filters( 'orderable_nutritional_info_html', $nutritional_info_html );

		return $nutritional_info_html;
	}

	/**
	 * Output a text input field
	 *
	 * @param array $field_data The field data.
	 *
	 * @return void
	 */
	protected static function text_input( $field_data ) {
		$field_data['desc_tip'] = true;

		if ( empty( $field_data['daily_value'] ) ) {
			$field_data['daily_value'] = '';
		}

		/**
		 * Let the WooCommerce render the input if the type is not 'number'
		 */
		if ( empty( $field_data['type'] ) || 'number' !== $field_data['type'] ) {
			woocommerce_wp_text_input( $field_data );

			return;
		}

		/**
		 * From here we reproduce the main behaviour of woocommerce_wp_text_input
		 * function but setting some defaults and adding new elements.
		 */
		$defaults = array(
			'wrapper_class'   => '',
			'style'           => '',
			'placeholder'     => '',
			'has_daily_value' => true,
			'value'           => '',
		);

		$field_data = wp_parse_args( $field_data, $defaults );

		if ( ! empty( $field_data['id'] ) && empty( $field_data['name'] ) ) {
			$field_data['name'] = $field_data['id'];
		}

		if ( ! isset( $field_data['amount_in'] ) ) {
			/* translators: grams */
			$field_data['amount_in'] = __( 'g', 'orderable-pro' );
		}

		if ( isset( $field_data['nested-level'] ) ) {
			$field_data['wrapper_class'] .= " orderable-pro-nutritional-info-panel_nested-level__{$field_data['nested-level']}";
		}

		$custom_attributes = array();
		if ( ! empty( $field_data['custom_attributes'] ) && is_array( $field_data['custom_attributes'] ) ) {
			foreach ( $field_data['custom_attributes'] as $attribute => $value ) {
				$custom_attributes[] = esc_attr( $attribute ) . '="' . esc_attr( $value ) . '"';
			}
		}

		?>

		<p class="form-field <?php echo esc_attr( $field_data['id'] ) . '_field ' . esc_attr( $field_data['wrapper_class'] ); ?>">
			<label for="<?php echo esc_attr( $field_data['id'] ); ?>">
				<?php echo wp_kses_post( $field_data['label'] ); ?>
			</label>

			<span class="orderable-pro-nutritional-info-panel__wrapper">
				<span class="orderable-pro-nutritional-info-panel__wrapper-values">
					<span class="orderable-pro-nutritional-info-panel__wrapper-amount-in">
						<input
							min="0"
							step="any"
							type="<?php echo esc_attr( $field_data['type'] ); ?>"
							class="<?php echo esc_attr( $field_data['class'] ); ?>"
							style="<?php echo esc_attr( $field_data['style'] ); ?>"
							name="<?php echo esc_attr( $field_data['name'] ); ?>"
							id="<?php echo esc_attr( $field_data['id'] ); ?>"
							value="<?php echo esc_attr( $field_data['value'] ); ?>"
							placeholder="<?php echo esc_attr( $field_data['placeholder'] ); ?>"
							<?php echo implode( ' ', $custom_attributes ); ?>
						/>

						<?php
						if ( false !== $field_data['amount_in'] ) {
							?>
							<span class="description orderable-pro-nutritional-info-panel__description orderable-pro-nutritional-info-panel__amount-in">
								(<?php echo esc_html( $field_data['amount_in'] ); ?>)
							</span>
							<?php
						}
						?>
					</span>

					<?php
					if ( false !== $field_data['has_daily_value'] && false !== $field_data['amount_in'] ) {
						?>
						<span class="orderable-pro-nutritional-info-panel__wrapper-daily-value">
							<input
								min="0"
								type="<?php echo esc_attr( $field_data['type'] ); ?>"
								class="orderable-pro-nutritional-info-panel__daily-value <?php echo esc_attr( $field_data['class'] ); ?>"
								style="<?php echo esc_attr( $field_data['style'] ); ?>"
								id="<?php echo esc_attr( $field_data['id'] ) . '-daily-value'; ?>"
								name="<?php echo esc_attr( $field_data['id'] ) . '-daily-value'; ?>"
								value="<?php echo esc_attr( $field_data['daily_value'] ); ?>"
								placeholder="<?php echo esc_attr( $field_data['placeholder'] ); ?>"
								<?php echo implode( ' ', $custom_attributes ); ?>
							/>
							<span class="description">
								<?php echo __( '% Daily Value', 'orderable-pro' ); ?>
							</span>
						</span>
						<?php
					}
					?>
				</span>
				<?php
				if ( ! empty( $field_data['description'] ) ) {
					echo wc_help_tip( $field_data['description'] );
				}
				?>
			</span>
		</p>

		<?php
	}

	/**
	 * Get vitamin options.
	 *
	 * @return array The vitamin options.
	 */
	protected static function get_vitamin_options() {
		$vitamin_options = array(
			__( 'Biotin', 'orderable-pro' ),
			__( 'Choline', 'orderable-pro' ),
			__( 'Folate', 'orderable-pro' ),
			__( 'Niacin', 'orderable-pro' ),
			__( 'Pantothenic acid', 'orderable-pro' ),
			__( 'Riboflavin', 'orderable-pro' ),
			__( 'Thiamin', 'orderable-pro' ),
			__( 'Vitamin A', 'orderable-pro' ),
			__( 'Vitamin B6', 'orderable-pro' ),
			__( 'Vitamin B12', 'orderable-pro' ),
			__( 'Vitamin C', 'orderable-pro' ),
			__( 'Vitamin D', 'orderable-pro' ),
			__( 'Vitamin E', 'orderable-pro' ),
			__( 'Vitamin K', 'orderable-pro' ),
		);

		/**
		 * The vitamin options.
		 *
		 * @param array $vitamin_options The vitamins available to be added.
		 *
		 * @return array New options.
		 * @since 1.3.0
		 * @hook  orderable_nutritional_info_vitamin_options
		 */
		return apply_filters( 'orderable_nutritional_info_vitamin_options', $vitamin_options );
	}

	/**
	 * Get mineral options.
	 *
	 * @return array The mineral options.
	 */
	protected static function get_mineral_options() {
		$mineral_options = array(
			__( 'Calcium', 'orderable-pro' ),
			__( 'Chloride', 'orderable-pro' ),
			__( 'Chromium', 'orderable-pro' ),
			__( 'Copper', 'orderable-pro' ),
			__( 'Iodine', 'orderable-pro' ),
			__( 'Iron', 'orderable-pro' ),
			__( 'Magnesium', 'orderable-pro' ),
			__( 'Manganese', 'orderable-pro' ),
			__( 'Molybdenum', 'orderable-pro' ),
			__( 'Phosphorus', 'orderable-pro' ),
			__( 'Potassium', 'orderable-pro' ),
			__( 'Selenium', 'orderable-pro' ),
			__( 'Sodium', 'orderable-pro' ),
			__( 'Zinc', 'orderable-pro' ),
		);

		/**
		 * The mineral options.
		 *
		 * @param array $mineral_options The minerals available to be added.
		 *
		 * @return array New options.
		 * @since 1.3.0
		 * @hook  orderable_nutritional_info_minerals_options
		 */
		return apply_filters( 'orderable_nutritional_info_minerals_options', $mineral_options );
	}

	/**
	 * Get amount options
	 *
	 * @return array The amount options.
	 */
	protected static function get_amount_in_options() {
		$amount_in_options = array(
			/* translators: milligrams */
			__( 'mg' ),
			/* translators: micrograms */
			__( 'mcg' ),
			/* translators: grams */
			__( 'g' ),
		);

		/**
		 * The amount options.
		 *
		 * @param array $amount_in_options The amounts available to be added.
		 *
		 * @return array New options.
		 * @since 1.3.0
		 * @hook  orderable_nutritional_info_amount_in_options
		 */
		return apply_filters( 'orderable_nutritional_info_amount_in_options', $amount_in_options );
	}

	/**
	 * Output the HTML for a vitamin or mineral field
	 *
	 * @param array $data The data used to fill the fields.
	 *
	 * @return void
	 */
	protected static function vitamins_and_minerals_field( $data = array() ) {
		$defaults = array(
			'vitamin_or_mineral' => '',
			'amount'             => '',
			'amount_in'          => '',
			'daily_value'        => '',
		);

		$data = wp_parse_args( $data, $defaults );

		$vitamin_options   = self::get_vitamin_options();
		$mineral_options   = self::get_mineral_options();
		$amount_in_options = self::get_amount_in_options();
		?>
		<div class="orderable-pro-vitamins-and-minerals-fields__field toolbar">
			<select class="vitamin-or-mineral" name="orderable_nutritional_field_vitamin_or_mineral[]">
				<option value=""><?php echo __( 'Select&hellip;', 'orderable-pro' ); ?></option>
				<optgroup label="<?php echo __( 'Vitamins', 'orderable-pro' ); ?>">
					<?php foreach ( $vitamin_options as $vitamin ) : ?>
						<option
							<?php selected( $data['vitamin_or_mineral'], $vitamin ); ?>
						>
							<?php echo esc_html( $vitamin ); ?>
						</option>
					<?php endforeach; ?>
				</optgroup>
				<optgroup label="<?php echo __( 'Minerals', 'orderable-pro' ); ?>">
					<?php foreach ( $mineral_options as $mineral ) : ?>
						<option
							<?php selected( $data['vitamin_or_mineral'], $mineral ); ?>
						>
							<?php echo esc_html( $mineral ); ?>
						</option>
					<?php endforeach; ?>
				</optgroup>
			</select>

			<div class="orderable-pro-vitamins-and-minerals-fields__values">
				<input
					name="orderable_nutritional_field_vitamin_or_mineral_amount[]"
					type="number"
					min="0"
					class="orderable-pro-nutritional-info-panel__width_small orderable-pro-vitamins-and-minerals-fields__amount"
					value="<?php echo esc_attr( $data['amount'] ); ?>"
				/>

				<select
					name="orderable_nutritional_field_vitamin_or_mineral_amount_in[]"
					class="orderable-pro-vitamins-and-minerals-fields__amount-in"
				>
					<?php foreach ( $amount_in_options as $amount_in ) : ?>
						<option
							<?php selected( $data['amount_in'], $amount_in ); ?>
						>
							<?php echo esc_html( $amount_in ); ?>
						</option>
					<?php endforeach; ?>
				</select>

				<input
					name="orderable_nutritional_field_vitamin_or_mineral_daily_value[]"
					type="number"
					min="0"
					class="orderable-pro-nutritional-info-panel__width_small orderable-pro-nutritional-info-panel__daily-value orderable-pro-vitamins-and-minerals-fields__daily-value"
					value="<?php echo esc_attr( $data['daily_value'] ); ?>"
				/>

				<span class="description orderable-pro-nutritional-info-panel__description orderable-pro-vitamins-and-minerals-fields__description">
					<?php echo __( '% Daily Value', 'orderable-pro' ); ?>
				</span>
			</div>

			<a href="#" role="button" class="orderable-pro-vitamins-and-minerals-fields__button-remove">
				<?php echo __( 'Remove', 'orderable-pro' ); ?>
			</a>
		</div>
		<?php
	}

	/**
	 * Group an array by a field name.
	 *
	 * @param string $field The field name to group by.
	 * @param array  $array The array.
	 *
	 * @return array|mixed
	 */
	protected static function group_by( $field, $array ) {
		if ( ! is_array( $array ) ) {
			return $array;
		}

		$result = array();

		foreach ( $array as $key => $value ) {
			if ( array_key_exists( $field, $value ) ) {
				$result[ $value[ $field ] ][ $key ] = $value;
			} else {
				$result[''][ $key ] = $value;
			}
		}

		return $result;
	}

	/**
	 * Load nutrient values into fields.
	 *
	 * @param array $fields The fields to be filled.
	 * @param array $values The values.
	 *
	 * @return array The fields with value filled.
	 */
	protected static function load_nutrient_values( $fields, $values ) {
		foreach ( $fields as $key => $field ) {
			// The value is not available for the field.
			if ( empty( $values['fields'][ $key ]['value'] ) ) {
				continue;
			}

			$fields[ $key ]['value'] = $values['fields'][ $key ]['value'];

			// The field doesn't have the daily value.
			if ( empty( $values['fields'][ $key ]['daily_value'] ) ) {
				continue;
			}

			$fields[ $key ]['daily_value'] = $values['fields'][ $key ]['daily_value'];
		}

		return $fields;
	}

	/**
	 * Get the vitamin and mineral fields
	 *
	 * The array structure is:
	 *        array(
	 *          'serving_and_calories'  => array( ... ),
	 *            'nutrients'             => array( ... ),
	 *            'vitamins_and_minerals' => array( ... ),
	 *        );
	 *
	 * @return array Array with vitamin and mineral fields
	 */
	protected static function get_fields( $product_id ) {
		/**
		 * Filter in fields in the group 'serving_and_calories'
		 *
		 * @param array $field The field to check
		 *
		 * @return bool
		 */
		$filter_in_serving_and_calories = function ( $field ) {
			return ! empty( $field['group'] ) && 'serving_and_calories' === $field['group'];
		};

		/**
		 * Filter out fields in the group 'serving_and_calories'
		 *
		 * @param array $field The field to check
		 *
		 * @return bool
		 */
		$filter_out_serving_and_calories = function ( $field ) {
			return empty( $field['group'] ) || 'serving_and_calories' !== $field['group'];
		};

		$nutrient_fields = array(
			'serving_size'           => array(
				'label'       => __( 'Serving size', 'orderable-pro' ),
				'description' => __( 'The amount of food that is customarily eaten at one time and is not a recommendation of how much to eat.', 'orderable-pro' ),
				'class'       => 'orderable-pro-nutritional-info-panel__width_large',
				'group'       => 'serving_and_calories',
			),
			'calories'               => array(
				'label'       => __( 'Calories', 'orderable-pro' ),
				'type'        => 'number',
				'amount_in'   => false,
				'description' => __( 'The total number of calories in a serving of the food.', 'orderable-pro' ),
				'class'       => 'orderable-pro-nutritional-info-panel__width_medium',
				'group'       => 'serving_and_calories',
			),
			'servings_per_container' => array(
				'label'       => __( 'Servings per container', 'orderable-pro' ),
				'type'        => 'number',
				'amount_in'   => false,
				'description' => __( 'The total number of servings in the entire food package or container.', 'orderable-pro' ),
				'class'       => 'orderable-pro-nutritional-info-panel__width_medium',
				'group'       => 'serving_and_calories',
			),
			'total_fat'              => array(
				'label'         => __( 'Total Fat', 'orderable-pro' ),
				'type'          => 'number',
				'description'   => __( 'Includes saturated, trans, monounsaturated and polyunsaturated fats.', 'orderable-pro' ),
				'class'         => 'orderable-pro-nutritional-info-panel__width_small',
				'wrapper_class' => 'orderable-pro-nutritional-info__font-weight_bold',
				'group'         => 'total_fat',
			),
			'saturated_fat'          => array(
				'label'        => __( 'Saturated Fat', 'orderable-pro' ),
				'type'         => 'number',
				'class'        => 'orderable-pro-nutritional-info-panel__width_small',
				'nested-level' => 1,
				'group'        => 'total_fat',
			),
			'trans_fat'              => array(
				'label'           => __( 'Trans Fat', 'orderable-pro' ),
				'type'            => 'number',
				'description'     => __( 'It is an unsaturated fat, but it is structurally different than unsaturated fat that occurs naturally in plant foods.', 'orderable-pro' ),
				'has_daily_value' => false,
				'class'           => 'orderable-pro-nutritional-info-panel__width_small',
				'nested-level'    => 1,
				'group'           => 'total_fat',
			),
			'cholesterol'            => array(
				'label'         => __( 'Cholesterol', 'orderable-pro' ),
				'type'          => 'number',
				'description'   => __( 'It is a waxy, fat-like substance found in all cells of the body.', 'orderable-pro' ),
				'class'         => 'orderable-pro-nutritional-info-panel__width_small',
				'wrapper_class' => 'orderable-pro-nutritional-info__font-weight_bold',
				'group'         => 'cholesterol',
			),
			'sodium'                 => array(
				'label'         => __( 'Sodium', 'orderable-pro' ),
				'type'          => 'number',
				'description'   => __( 'It is a mineral and one of the chemical elements found in salt.', 'orderable-pro' ),
				'class'         => 'orderable-pro-nutritional-info-panel__width_small',
				'wrapper_class' => 'orderable-pro-nutritional-info__font-weight_bold',
				/* translators: milligrams (mg) */
				'amount_in'     => __( 'mg', 'orderable-pro' ),
				'group'         => 'sodium',
			),
			'total_carbohydrate'     => array(
				'label'         => __( 'Total Carbohydrate', 'orderable-pro' ),
				'type'          => 'number',
				'class'         => 'orderable-pro-nutritional-info-panel__width_small',
				'wrapper_class' => 'orderable-pro-nutritional-info__font-weight_bold',
				'group'         => 'carbohydrate',
			),
			'dietary_fiber'          => array(
				'label'        => __( 'Dietary Fiber', 'orderable-pro' ),
				'type'         => 'number',
				'description'  => __( 'It is a type of carbohydrate made up of many sugar molecules linked together.', 'orderable-pro' ),
				'class'        => 'orderable-pro-nutritional-info-panel__width_small',
				'nested-level' => 1,
				'group'        => 'carbohydrate',
			),
			'total_sugars'           => array(
				'label'           => __( 'Total Sugars', 'orderable-pro' ),
				'type'            => 'number',
				'description'     => __( 'Sugars are the smallest and simplest type of carbohydrate.', 'orderable-pro' ),
				'has_daily_value' => false,
				'class'           => 'orderable-pro-nutritional-info-panel__width_small',
				'nested-level'    => 1,
				'group'           => 'carbohydrate',
			),
			'added_sugars'           => array(
				'label'        => __( 'Added Sugars', 'orderable-pro' ),
				'type'         => 'number',
				'class'        => 'orderable-pro-nutritional-info-panel__width_small',
				'nested-level' => 2,
				'group'        => 'carbohydrate',
			),
			'protein'                => array(
				'label'           => __( 'Protein', 'orderable-pro' ),
				'type'            => 'number',
				'has_daily_value' => false,
				'class'           => 'orderable-pro-nutritional-info-panel__width_small',
				'wrapper_class'   => 'orderable-pro-nutritional-info__font-weight_bold',
				'group'           => 'protein',
			),
		);

		$values = get_post_meta( $product_id, '_orderable_pro_nutritional_info', true );

		if ( empty( $values ) ) {
			return array(
				'serving_and_calories'  => array_filter( $nutrient_fields, $filter_in_serving_and_calories ),
				'nutrients'             => array_filter( $nutrient_fields, $filter_out_serving_and_calories ),
				'vitamins_and_minerals' => array(),
			);
		}

		$nutrient_fields              = self::load_nutrient_values( $nutrient_fields, $values );
		$vitamins_and_minerals_fields = empty( $values['vitamins_and_minerals'] ) ? array() : $values['vitamins_and_minerals'];

		$fields = array(
			'serving_and_calories'  => array_filter( $nutrient_fields, $filter_in_serving_and_calories ),
			'nutrients'             => array_filter( $nutrient_fields, $filter_out_serving_and_calories ),
			'vitamins_and_minerals' => $vitamins_and_minerals_fields,
		);

		return $fields;
	}

	/**
	 * Output the serving and calories fields.
	 *
	 * @param array $fields The nutrient fields.
	 *
	 * @return void
	 */
	protected static function serving_and_calories_fields( $fields ) {
		?>
		<div class="options_group fields_group">
			<?php
			foreach ( $fields as $key => $field ) {
				if ( empty( $field['id'] ) ) {
					$field['id'] = $key;
				}

				self::text_input( $field );
			}
			?>
		</div>
		<?php
	}

	/**
	 * Output the nutrient fields.
	 *
	 * @param array $fields The nutrient fields.
	 *
	 * @return void
	 */
	protected static function nutrient_fields( $fields ) {
		foreach ( $fields as $group ) {
			?>
			<div class="options_group fields_group">
				<?php
				foreach ( $group as $key => $field ) {
					if ( empty( $field['id'] ) ) {
						$field['id'] = $key;
					}

					self::text_input( $field );
				}
				?>
			</div>
			<?php
		}
	}

	/**
	 * Output the vitamin and mineral fields.
	 *
	 * @param array $fields The vitamin and mineral fields.
	 *
	 * @return void
	 */
	protected static function vitamin_and_mineral_fields( $fields ) {
		?>
		<div class="options_group">
			<p class="form-field orderable-pro-nutritional-info__font-weight_bold">
				<label>
					<?php echo __( 'Vitamins and Minerals', 'orderable-pro' ); ?>
				</label>
			</p>
			<div
				id="orderable_vitamins_and_minerals_fields"
				class="orderable-pro-vitamins-and-minerals-fields"
			>
				<?php
				if ( empty( $fields ) ) {
					self::vitamins_and_minerals_field();
				} else {
					foreach ( $fields as $data ) {
						self::vitamins_and_minerals_field( $data );
					}
				}
				?>
			</div>
			<div class="toolbar">
				<button id="orderable-add-vitamin-mineral-field" type="button" class="button">
					<?php echo __( 'Add vitamin or mineral', 'orderable-pro' ); ?>
				</button>
			</div>
		</div>
		<?php
	}

	/**
	 * Add the nutritional info panel
	 *
	 * @return void
	 */
	public static function add_nutritional_info_panel() {
		$fields = self::get_fields( get_the_ID() );

		/**
		 * The serving and calories fields.
		 *
		 * @param array $fields The serving and calories fields.
		 *
		 * @return array New fields.
		 * @since 1.3.0
		 * @hook  orderable_nutritional_info_serving_and_calories_fields
		 */
		$serving_and_calories = apply_filters( 'orderable_nutritional_info_serving_and_calories_fields', $fields['serving_and_calories'] );

		$nutrients = self::group_by(
			'group',
			/**
			 * The nutrient fields.
			 *
			 * @param array $fields The nutrient fields.
			 *
			 * @return array New fields.
			 * @since 1.3.0
			 * @hook  orderable_nutritional_info_nutrient_fields
			 */
			apply_filters( 'orderable_nutritional_info_nutrient_fields', $fields['nutrients'] )
		);

		/**
		 * The vitamin and mineral fields.
		 *
		 * @param array $fields The vitamin and mineral fields.
		 *
		 * @return array New fields.
		 * @since 1.3.0
		 * @hook  orderable_nutritional_info_vitamin_and_mineral_fields
		 */
		$vitamins_and_minerals = apply_filters( 'orderable_nutritional_info_vitamin_and_mineral_fields', $fields['vitamins_and_minerals'] );
		?>
		<div id="orderable_nutritional_info_panel" class="panel woocommerce_options_panel wc-metaboxes-wrapper orderable-pro-nutritional-info-panel">
			<?php
			self::serving_and_calories_fields( $serving_and_calories );
			self::nutrient_fields( $nutrients );
			self::vitamin_and_mineral_fields( $vitamins_and_minerals );
			?>

			<div class="toolbar form-control orderable-pro-nutritional-info-panel__form-control">
				<button type="button" class="button save_nutritional_info button-primary orderable-pro-nutritional-info-panel__button-save-nutritional-info">
					<?php esc_html_e( 'Save nutritional info', 'orderable-pro' ); ?>
				</button>
				<span class="message orderable-pro-nutritional-info-panel__form-message"><?php echo __( 'Something went wrong to save.', 'orderable-pro' ); ?></span>
			</div>
		</div>
		<?php
	}

	/**
	 * Save nutritional info data.
	 *
	 * @return void
	 */
	public static function save_nutritional_info() {
		if ( empty( $_POST['nonce'] ) || ! wp_verify_nonce( $_POST['nonce'], 'ajax-orderable-pro-nutritional-info' ) ) {
			wp_send_json_error( __( 'Invalid nonce', 'orderable-pro' ), 401 );
		}

		if ( empty( $_POST['post_id'] ) ) {
			wp_send_json_error( __( 'Invalid request', 'orderable-pro' ), 400 );
		}

		$post_id = is_numeric( $_POST['post_id'] ) ? absint( $_POST['post_id'] ) : false;

		if ( ! $post_id ) {
			wp_send_json_error( __( 'Invalid request', 'orderable-pro' ), 400 );
		}

		// Nothing to save.
		if ( empty( $_POST['data'] ) ) {
			delete_post_meta( $post_id, '_orderable_pro_nutritional_info' );
			wp_send_json_success();
		}

		$sanitized_data = map_deep( $_POST['data'], 'sanitize_text_field' );

		if ( empty( $sanitized_data ) ) {
			wp_send_json_error( __( 'Invalid request', 'orderable-pro' ), 400 );
		}

		update_post_meta( $post_id, '_orderable_pro_nutritional_info', $sanitized_data );

		wp_send_json_success();
	}

	/**
	 * Handle get_nutritional_info AJAX request.
	 *
	 * @return void
	 */
	public static function get_nutritional_info() {
		if ( empty( $_POST['nonce'] ) || ! wp_verify_nonce( $_POST['nonce'], 'ajax-orderable-pro-get-nutritional-info' ) ) {
			wp_send_json_error( 'Invalid nonce', 401 );
		}

		if ( empty( $_POST['product_id'] ) ) {
			wp_send_json_error( 'Invalid request', 400 );
		}

		add_action(
			'orderable_side_menu_after_product_options',
			function () {
				self::get_nutritional_info_frontend_panel( absint( $_POST['product_id'] ) );
			},
			15
		);

		$product = wc_get_product( $_POST['product_id'] );

		if ( 'variable' === $product->get_type() ) {
			// these variables are used inside options.php template.
			$available_variations = $product->get_available_variations();
			$attributes           = Orderable_Products::get_available_attributes( $product );
			$variations_json      = wp_json_encode( $available_variations );
		}

		ob_start();

		include ORDERABLE_TEMPLATES_PATH . 'product/options.php';

		$response['html'] = ob_get_clean();

		wp_send_json_success( $response );
	}

	/**
	 * Add nutritional info product tab.
	 *
	 * @param array      $data    Array of product tabs.
	 * @param WC_Product $product Product.
	 *
	 * @return array
	 */
	public static function add_product_accordion_item( $data, $product ) {
		if ( ! self::has_nutritional_info( $product->get_id() ) ) {
			return $data;
		}

		$data[] = array(
			'title'   => __( 'Nutritional Information', 'orderable-pro' ),
			'content' => self::get_nutritional_info_frontend_panel( $product->get_id() ),
			'id'      => 'accordion-nutritional-info',
		);

		return $data;
	}

	/**
	 * Check if the product has nutritional information to show the info button.
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

		return self::has_nutritional_info( $product->get_id() );
	}

	/**
	 * Check if the product has nutritional information
	 *
	 * @param int $product_id The product ID.
	 * @return boolean
	 */
	public static function has_nutritional_info( $product_id ) {
		return metadata_exists( 'post', $product_id, '_orderable_pro_nutritional_info' );
	}

	/**
	 * Add nutritional information tab on the product page.
	 *
	 * @param array $product_tabs The product tabs.
	 * @return array
	 */
	public static function add_nutritional_info_tab_on_product_page( $product_tabs ) {
		global $product;

		if ( empty( $product ) || ! self::has_nutritional_info( $product->get_id() ) ) {
			return $product_tabs;
		}

		/**
		 * The Nutritional Info tab data added to product tabs on the product page.
		 *
		 * @since 1.6.0
		 * @hook orderable_nutritional_info_tab_data_on_product_page
		 * @param  array $tab_data The Nutritional Info tab data.
		 * @return array New value
		 */
		$product_tabs['nutritional_info'] = apply_filters(
			'orderable_nutritional_info_tab_data_on_product_page',
			array(
				'title'    => __( 'Nutritional Info', 'orderable-pro' ),
				'priority' => 25,
				'callback' => function () use ( $product ) {
					echo wp_kses_post( self::get_nutritional_info_frontend_panel( $product->get_id() ) );
				},
			)
		);

		return $product_tabs;
	}

	/**
	 * Save nutritional fields.
	 *
	 * @param int $product_id The product ID.
	 * @return void
	 */
	public static function save_nutritional_fields( $product_id ) {
		$fields = self::get_fields( $product_id );

		/**
		 * Apply the filter `orderable_nutritional_info_serving_and_calories_fields`
		 * to get the custom fields.
		 *
		 * @see Orderable_Nutritional_Info_Pro::add_nutritional_info_panel()
		 * @since 1.3.0
		 */
		$serving_and_calories = apply_filters( 'orderable_nutritional_info_serving_and_calories_fields', $fields['serving_and_calories'] );
		/**
		 * Apply the filter `orderable_nutritional_info_nutrient_fields`
		 * to get the custom fields.
		 *
		 * @see Orderable_Nutritional_Info_Pro::add_nutritional_info_panel()
		 * @since 1.3.0
		 */
		$nutrients = apply_filters( 'orderable_nutritional_info_nutrient_fields', $fields['nutrients'] );
		$data      = self::get_posted_fields( array_merge( $serving_and_calories, $nutrients ) );

		if (
			// phpcs:disable WordPress.Security.NonceVerification.Missing
			! empty( $_POST['orderable_nutritional_field_vitamin_or_mineral'] ) &&
			is_array( $_POST['orderable_nutritional_field_vitamin_or_mineral'] )
			// phpcs:enable WordPress.Security.NonceVerification.Missing
		) {
			// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$vitamin_or_mineral_fields = wp_unslash( $_POST['orderable_nutritional_field_vitamin_or_mineral'] );

			foreach ( $vitamin_or_mineral_fields as $key => $value ) {
				$value = sanitize_text_field( wp_unslash( $value ) );

				if ( empty( $value ) ) {
					continue;
				}

				$data['vitamins_and_minerals'][] = array(
					'vitamin_or_mineral' => $value,
					'amount'             => self::get_vitamin_or_mineral_posted_value( 'amount', $key ),
					'amount_in'          => self::get_vitamin_or_mineral_posted_value( 'amount_in', $key ),
					'daily_value'        => self::get_vitamin_or_mineral_posted_value( 'daily_value', $key ),
				);
			}
		}

		if ( empty( $data ) ) {
			delete_post_meta( $product_id, '_orderable_pro_nutritional_info' );
		} else {
			update_post_meta( $product_id, '_orderable_pro_nutritional_info', $data );
		}
	}

	/**
	 * Get the nutritional fields sent via POST.
	 *
	 * @param array $fields The nutritional fields to try to match.
	 * @return array
	 */
	protected static function get_posted_fields( $fields ) {
		$fields_posted_data = array();

		foreach ( array_keys( $fields ) as $field_key ) {
			if ( empty( $_POST[ $field_key ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
				continue;
			}

			$field_values = array(
				'value' => sanitize_text_field( wp_unslash( $_POST[ $field_key ] ) ), // phpcs:ignore WordPress.Security.NonceVerification.Missing
			);

			if ( ! empty( $_POST[ $field_key . '-daily-value' ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
				// phpcs:ignore WordPress.Security.NonceVerification.Missing
				$field_values['daily_value'] = sanitize_text_field( wp_unslash( $_POST[ $field_key . '-daily-value' ] ) );
			}

			$fields_posted_data['fields'][ $field_key ] = $field_values;
		}

		return $fields_posted_data;
	}

	/**
	 * Get the Vitamin or Mineral field value sent via POST.
	 *
	 * We can have multiplie Vitamin/Mineral field sent via POST.
	 *
	 * @param string $field_name `amount`, `amount_in` or `daily_value`.
	 * @param string $field_key  The field key.
	 * @return string
	 */
	protected static function get_vitamin_or_mineral_posted_value( $field_name, $field_key ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		if ( ! is_string( $field_name ) || empty( $_POST[ 'orderable_nutritional_field_vitamin_or_mineral_' . $field_name ][ $field_key ] ) ) {
			return '';
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		return sanitize_text_field( wp_unslash( $_POST[ 'orderable_nutritional_field_vitamin_or_mineral_' . $field_name ][ $field_key ] ) );
	}
}
