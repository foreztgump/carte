<?php
/**
 * Integration with WooCommerce Points and Rewards plugin.
 *
 * @see https://woocommerce.com/products/woocommerce-points-and-rewards/
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Orderable_Integration_WooCommerce_Points_And_Rewards integration class.
 */
class Orderable_Pro_Integration_WooCommerce_Points_And_Rewards {

	/**
	 * Init.
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! class_exists( 'WC_Points_Rewards' ) ) {
			return;
		}

		// Assets.
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'frontend_assets' ) );

		// Product labels.
		add_action( 'saved_orderable_product_label', array( __CLASS__, 'save_product_label_rewards_fields' ) );
		add_action( 'orderable_product_label_add_form_fields', array( __CLASS__, 'output_product_label_rewards_form_fields' ), 5 );
		add_action( 'orderable_product_label_edit_form_fields', array( __CLASS__, 'output_edit_product_label_rewards_form_fields' ), 5 );

		add_filter( 'manage_edit-orderable_product_label_columns', array( __CLASS__, 'add_points_earned_column_to_product_label' ) );
		add_filter( 'manage_orderable_product_label_custom_column', array( __CLASS__, 'add_points_earned_column_content' ), 10, 3 );
		add_filter( 'orderable_loyalty_rewards_product_points', array( __CLASS__, 'check_product_label_points' ), 20, 2 );
		add_filter( 'woocommerce_points_earned_for_cart_item', array( __CLASS__, 'check_cart_item_product_label_points' ), 10, 2 );
		add_filter( 'woocommerce_points_earned_for_order_item', array( __CLASS__, 'check_order_item_product_label_points' ), 10, 2 );

		// Product add-ons.
		add_action( 'orderable_after_product_addons_price_field', array( __CLASS__, 'output_product_addons_points_earned_field' ) );
		add_action( 'orderable_before_product_option_price', array( __CLASS__, 'output_product_addon_option_points_earned' ) );
		add_action( 'woocommerce_add_cart_item_data', array( __CLASS__, 'add_addons_points_earned_to_cart_item_data' ) );

		add_filter( 'orderable_product_addon_option_label', array( __CLASS__, 'append_points_earned_to_product_addon_option_label' ), 10, 2 );
		add_filter( 'orderable_loyalty_rewards_product_points', array( __CLASS__, 'check_product_addons_points' ), 30, 2 );
		add_filter( 'orderable_product_fields_group_wrap_extra_html_attributes', array( __CLASS__, 'add_product_points_earned_data_attributes' ), 10, 2 );
		add_filter( 'woocommerce_points_earned_for_cart_item', array( __CLASS__, 'update_cart_item_points_earned_with_addons_points' ), 20, 3 );

		// Location edit page.
		add_action( 'orderable_location_save_data', array( __CLASS__, 'save_points_and_rewards_location_data' ), 15 );
		add_action( 'add_meta_boxes_' . Orderable_Multi_Location_Pro::$post_type_key, array( __CLASS__, 'add_points_and_rewards_meta_box' ), 15 );

		add_filter( 'option_wc_points_rewards_earn_points_ratio', array( __CLASS__, 'maybe_use_location_conversion_rate' ), 40 );
		add_filter( 'option_wc_points_rewards_redeem_points_ratio', array( __CLASS__, 'maybe_use_location_redemption_conversion_rate' ), 40 );

		// Checkout.
		add_filter( 'woocommerce_update_order_review_fragments', array( __CLASS__, 'add_points_rewards_earn_points_message_to_fragments' ) );
	}

	/**
	 * Enqueue frontend assets.
	 *
	 * @return void
	 */
	public static function frontend_assets() {
		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		wp_enqueue_script(
			'orderable-integration-woocommerce-points-and-rewards-pro',
			ORDERABLE_PRO_URL . 'inc/integrations/woocommerce-points-and-rewards/assets/frontend/js/main' . $suffix . '.js',
			array( 'jquery' ),
			ORDERABLE_PRO_VERSION,
			true
		);

		if ( ! Orderable_Checkout_Pro::is_checkout_page() ) {
			return;
		}

		$override_checkout = Orderable_Settings::get_setting( 'checkout_general_override_checkout' );

		if ( ! $override_checkout ) {
			return;
		}

		wp_enqueue_style(
			'orderable-integration-woocommerce-points-and-rewards-pro',
			ORDERABLE_PRO_URL . 'inc/integrations/woocommerce-points-and-rewards/assets/frontend/css/integration-woocommerce-points-and-rewards' . $suffix . '.css',
			array(),
			ORDERABLE_PRO_VERSION
		);
	}

	/**
	 * Output product label rewards fields.
	 *
	 * @return void
	 */
	public static function output_product_label_rewards_form_fields() {
		?>
		<div class="form-field orderable-pro-product-labels__display-option">
			<label for="orderable_product_label_points_earned">
				<?php esc_html_e( 'Points earned', 'orderable-pro' ); ?>
			</label>

			<input
				type="text"
				id="orderable_product_label_points_earned"
				name="orderable_product_label_points_earned"
				style="width: 128px;"
			/>

			<p>
				<?php esc_html_e( 'The number of points earned for the purchase of any product assigned to this product label.', 'orderable-pro' ); ?>
			</p>
		</div>
		<?php
	}

	/**
	 * Output product label rewards fields on the edit page.
	 *
	 * @param WP_Term $term Current taxonomy term object.
	 * @return void
	 */
	public static function output_edit_product_label_rewards_form_fields( $term ) {
		$points_earned = get_term_meta( $term->term_id, '_orderable_product_label_points_earned', true );

		?>
		<tr class="form-field orderable-pro-product-labels__points_earned">
			<th scope="row">
				<label for="orderable_product_label_points_earned">
					<?php esc_html_e( 'Points earned', 'orderable-pro' ); ?>
				</label>
			</th>
			<td>
				<input
					type="text"
					id="orderable_product_label_points_earned"
					name="orderable_product_label_points_earned"
					value="<?php echo esc_attr( $points_earned ); ?>"
					style="width: 128px;"
				/>

				<p class="description">
					<?php esc_html_e( 'The number of points earned for the purchase of any product assigned to this product label.' ); ?>
				</p>
			</td>
		</tr>
		<?php
	}

	/**
	 * Save label point fields.
	 *
	 * @param int $term_id Term ID.
	 * @return void
	 */
	public static function save_product_label_rewards_fields( $term_id ) {
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

		$points_earned = $get_posted_value( 'orderable_product_label_points_earned', '' );

		update_term_meta( $term_id, '_orderable_product_label_points_earned', $points_earned );
	}

	/**
	 * Add the `points_earned` column after the slug column
	 *
	 * @param string[] $columns The column header labels keyed by column ID.
	 * @return string[]
	 */
	public static function add_points_earned_column_to_product_label( $columns ) {
		$updated_columns = array();

		foreach ( $columns as $key => $value ) {
			$updated_columns[ $key ] = $value;

			if ( 'slug' === $key ) {
				$updated_columns['points_earned'] = 'Points earned';
			}
		}

		return $updated_columns;
	}

	/**
	 * Add `points_earned` column content.
	 *
	 * @param string $string      Custom column output. Default empty.
	 * @param string $column_name Name of the column.
	 * @param int    $term_id     Term ID.
	 * @return string
	 */
	public static function add_points_earned_column_content( $string, $column_name, $term_id ) {
		if ( 'points_earned' !== $column_name ) {
			return $string;
		}

		$points_earned = get_term_meta( $term_id, '_orderable_product_label_points_earned', true );

		if ( empty( $points_earned ) || is_wp_error( $points_earned ) ) {
			return '';
		}

		return $points_earned;
	}

	/**
	 * Check if product label has points to earn.
	 *
	 * @param  int              $points  The product points.
	 * @param  WC_Product|mixed $product The product.
	 * @return int
	 */
	public static function check_product_label_points( $points, $product ) {
		if ( ! is_a( $product, 'WC_Product' ) ) {
			return $points;
		}

		$product_label_points = self::get_product_label_points( $product->get_id() );

		if ( empty( $product_label_points ) ) {
			return $points;
		}

		return $product_label_points;
	}

	/**
	 * Get the product label points.
	 *
	 * @param int $product_id The product ID.
	 * @return int
	 */
	protected static function get_product_label_points( $product_id ) {
		if ( ! self::has_product_labels( $product_id ) ) {
			return 0;
		}

		$product_labels        = get_the_terms( $product_id, 'orderable_product_label' );
		$product_labels_points = array();

		foreach ( $product_labels as $product_label ) {
			$product_label_points = get_term_meta( $product_label->term_id, '_orderable_product_label_points_earned', true );

			if ( empty( $product_label_points ) || ! is_numeric( $product_label_points ) ) {
				continue;
			}

			$product_labels_points[] = $product_label_points;
		}

		if ( empty( $product_labels_points ) ) {
			return 0;
		}

		$points = max( $product_labels_points );

		return $points;
	}

	/**
	 * Check if the product has product labels.
	 *
	 * @param int $product_id The Product ID.
	 * @return boolean
	 */
	protected static function has_product_labels( $product_id ) {
		$product_labels = get_the_terms( $product_id, 'orderable_product_label' );

		return ! is_wp_error( $product_labels ) && ! empty( $product_labels );
	}

	/**
	 * Check if cart item has points associated with a product label.
	 *
	 * @param int    $points   The points earned when purchasing the product.
	 * @param string $item_key The cart item key.
	 * @return int
	 */
	public static function check_cart_item_product_label_points( $points, $item_key ) {
		$item_data = WC()->cart->get_cart_item( $item_key );

		if ( empty( $item_data['data'] ) || ! is_a( $item_data['data'], 'WC_Product' ) ) {
			return $points;
		}

		$product = $item_data['data'];

		if ( ! self::has_product_labels( $product->get_id() ) ) {
			return $points;
		}

		if ( self::has_product_points( $product ) ) {
			return $points;
		}

		return self::get_product_label_points( $product->get_id() );
	}

	/**
	 * Check if order item has points associated with a product label.
	 *
	 * @param int        $points  The points earned when purchasing the product.
	 * @param WC_Product $product The product.
	 * @return int
	 */
	public static function check_order_item_product_label_points( $points, $product ) {
		if ( ! self::has_product_labels( $product->get_id() ) ) {
			return $points;
		}

		if ( self::has_product_points( $product ) ) {
			return $points;
		}

		return self::get_product_label_points( $product->get_id() );
	}

	/**
	 * Check if the product has points defined at the product or category level.
	 *
	 * @param WC_Product $product The product.
	 * @return boolean
	 */
	protected static function has_product_points( $product ) {
		if ( ! class_exists( 'WC_Points_Rewards_Product' ) ) {
			return false;
		}

		$points_at_product_level = WC_Points_Rewards_Product::get_product_points( $product );

		if ( is_numeric( $points_at_product_level ) ) {
			return true;
		}

		$points_at_category_level = WC_Points_Rewards_Product::get_category_points( $product );

		if ( is_numeric( $points_at_category_level ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Output product addons points earned field on the product addon new/edit page.
	 *
	 * @return void
	 */
	public static function output_product_addons_points_earned_field() {
		?>
			<div class="orderable-fields-options__row-field orderable-fields-options__row-points-earned">
				<label class="orderable-fields-options__row-field-label">
					<?php esc_html_e( 'Points earned', 'orderable-pro' ); ?>
				</label>
				<input
					type="number"
					step="1"
					v-model="option.points_earned"
				/>
			</div>
		<?php
	}

	/**
	 * Output points earned for a product addon option element.
	 *
	 * @param array $option The option data.
	 * @return void
	 */
	public static function output_product_addon_option_points_earned( $option ) {
		if ( empty( $option['points_earned'] ) ) {
			return;
		}
		?>
		<span class="orderable-product-option__label-points-earned">
			<?php printf( '+%s points', esc_html( $option['points_earned'] ) ); ?>
		</span>
		<?php
	}

	/**
	 * Append points earned to product addon option label
	 *
	 * @param  string $label    The option label.
	 * @param  array  $option   The option data.
	 * @return string
	 */
	public static function append_points_earned_to_product_addon_option_label( $label, $option ) {
		if ( empty( $option['points_earned'] ) ) {
			return $label;
		}

		return $label . " (+{$option['points_earned']} points)";
	}

	/**
	 * Add product points earned data attributes
	 *
	 * @param  array      $extra_html_attributes The HTML attributes.
	 * @param  WC_Product $product               The product.
	 * @return array
	 */
	public static function add_product_points_earned_data_attributes( $extra_html_attributes, $product ) {
		if ( ! class_exists( 'WC_Points_Rewards' ) ) {
			return $extra_html_attributes;
		}

		if ( $product->is_type( 'variable' ) ) {
			return $extra_html_attributes;
		}

		remove_filter( 'orderable_loyalty_rewards_product_points', array( __CLASS__, 'check_product_addons_points' ), 30 );

		$points_earned = Orderable_Integration_WooCommerce_Points_And_Rewards::get_product_points( $product );

		add_filter( 'orderable_loyalty_rewards_product_points', array( __CLASS__, 'check_product_addons_points' ), 30, 2 );

		$extra_html_attributes['data-points-earned'] = $points_earned;

		$message = get_option( 'wc_points_rewards_single_product_message' );
		$message = str_replace( '{points_label}', WC_Points_Rewards::instance()->get_points_label( $points_earned ), $message );

		$extra_html_attributes['data-points-earned-message'] = $message;

		return $extra_html_attributes;
	}

	/**
	 * Update the cart item points earned with the addons points.
	 *
	 * @param int    $points   The product points.
	 * @param string $item_key The cart item key.
	 * @param array  $item     The cart item.
	 * @return int
	 */
	public static function update_cart_item_points_earned_with_addons_points( $points, $item_key, $item ) {
		if ( empty( $item['orderable_fields'] ) || ! is_array( $item['orderable_fields'] ) ) {
			return $points;
		}

		if ( empty( $item['data'] ) || ! is_a( $item['data'], 'WC_Product' ) ) {
			return $points;
		}

		$product = $item['data'];

		// Since the price can be changed by addons, we retrive the product to get the price without addons.
		$original_product = wc_get_product( $product->get_id() );

		if ( empty( $original_product ) ) {
			return $points;
		}

		$points = WC_Points_Rewards_Product::get_points_earned_for_product_purchase( $original_product );

		$addons_points = array_reduce(
			$item['orderable_fields'],
			function ( $carry, $item ) {
				if ( empty( $item['points_earned'] ) || ! is_numeric( $item['points_earned'] ) ) {
					return $carry;
				}

				return $carry + $item['points_earned'];
			},
			0
		);

		return $points + $addons_points;
	}

	/**
	 * Add addons points_earned to the $item_data['orderable_fields'].
	 *
	 * @param array $item_data The cart item data.
	 * @return array
	 */
	public static function add_addons_points_earned_to_cart_item_data( $item_data ) {
		if ( empty( $item_data['orderable_fields'] ) || ! is_array( $item_data['orderable_fields'] ) ) {
			return $item_data;
		}

		$item_data['orderable_fields'] = array_map(
			function ( $orderable_field ) {
				$addon_settings = Orderable_Addons_Pro_Field_Groups::get_field_data( $orderable_field['id'], $orderable_field['group_id'] );

				if ( empty( $addon_settings['options'] ) || ! is_array( $addon_settings['options'] ) ) {
					return $orderable_field;
				}

				$points_earned = 0;
				foreach ( $addon_settings['options'] as $option ) {
					if ( empty( $option['points_earned'] ) ) {
						continue;
					}

					if ( empty( $option['label'] ) ) {
						continue;
					}

					if ( ! in_array( $option['label'], (array) $orderable_field['value'], true ) ) {
						continue;
					}

					$points_earned += $option['points_earned'];
				}

				if ( empty( $points_earned ) ) {
					return $orderable_field;
				}

				$orderable_field['points_earned'] = $points_earned;

				return $orderable_field;
			},
			$item_data['orderable_fields']
		);

		return $item_data;
	}

	/**
	 * Check if we should use the location conversion rate instead of default conversion rate.
	 *
	 * @param mixed $ratio Value of the option.
	 * @return mixed|string
	 */
	public static function maybe_use_location_conversion_rate( $ratio ) {
		if ( is_admin() && ! wp_doing_ajax() ) {
			return $ratio;
		}

		$location_ratio = self::should_use_location_rate( 'conversion_rate' );

		if ( empty( $location_ratio ) ) {
			return $ratio;
		}

		return $location_ratio;
	}

	/**
	 * Check if we should use the location redemption conversion rate instead of default redemption conversion rate.
	 *
	 * @param mixed $ratio Value of the option.
	 * @return mixed|string
	 */
	public static function maybe_use_location_redemption_conversion_rate( $ratio ) {
		if ( is_admin() && ! wp_doing_ajax() ) {
			return $ratio;
		}

		$location_ratio = self::should_use_location_rate( 'redemption_conversion_rate' );

		if ( empty( $location_ratio ) ) {
			return $ratio;
		}

		return $location_ratio;
	}

	/**
	 * Check if should use the location rate.
	 *
	 * @param string $type The rate type: `conversion_rate` or `redemption_conversion_rate`.
	 * @return boolean
	 */
	protected static function should_use_location_rate( $type ) {

		$allowed_types = array( 'conversion_rate', 'redemption_conversion_rate' );

		if ( ! in_array( $type, $allowed_types, true ) ) {
			return false;
		}

		if ( is_admin() && ! wp_doing_ajax() ) {
			return false;
		}

		$location = Orderable_Location::get_selected_location();

		if ( empty( $location ) ) {
			return false;
		}

		$location_post_id = Orderable_Location::get_location_post_id( $location->get_location_id() );

		if ( empty( $location_post_id ) ) {
			return false;
		}

		$use_default_rate = 'no' !== get_post_meta( $location_post_id, '_orderable_location_use_default_' . $type, true );

		if ( $use_default_rate ) {
			return false;
		}

		$location_ratio = get_post_meta( $location_post_id, '_orderable_location_' . $type, true );

		if ( empty( $location_ratio ) ) {
			return false;
		}

		return $location_ratio;
	}

	/**
	 * Save points and rewards location data.
	 *
	 * @return void
	 */
	public static function save_points_and_rewards_location_data() {
		global $post;

		if ( empty( $post->ID ) ) {
			return;
		}

		$post_id     = $post->ID;
		$location_id = Orderable_Location::get_location_id( $post_id );

		if ( empty( $location_id ) ) {
			return;
		}

		$nonce = empty( $_POST['_wpnonce_orderable_location'] ) ? false : sanitize_text_field( wp_unslash( $_POST['_wpnonce_orderable_location'] ) );

		if ( ! wp_verify_nonce( $nonce, 'orderable_location_save' ) ) {
			return;
		}

		if (
			empty( $_POST['orderable_location_use_default_conversion_rate'] )
		) {
			return;
		}

		$use_default_conversion_rate = sanitize_text_field( wp_unslash( $_POST['orderable_location_use_default_conversion_rate'] ) );

		if ( empty( $use_default_conversion_rate ) ) {
			return;
		}

		update_post_meta( $post_id, '_orderable_location_use_default_conversion_rate', $use_default_conversion_rate );

		if (
			empty( $_POST['orderable_location_conversion_rate_points'] ) ||
			empty( $_POST['orderable_location_conversion_rate_monetary_value'] )
		) {
			delete_post_meta( $post_id, '_orderable_location_conversion_rate' );
			return;
		}

		$conversion_rate_points         = sanitize_text_field( wp_unslash( $_POST['orderable_location_conversion_rate_points'] ) );
		$conversion_rate_monetary_value = sanitize_text_field( wp_unslash( $_POST['orderable_location_conversion_rate_monetary_value'] ) );

		if ( empty( $conversion_rate_points ) || empty( $conversion_rate_monetary_value ) ) {
			delete_post_meta( $post_id, '_orderable_location_conversion_rate' );
			return;
		}

		$conversion_rate = $conversion_rate_points . ':' . $conversion_rate_monetary_value;

		update_post_meta( $post_id, '_orderable_location_conversion_rate', $conversion_rate );

		if (
			empty( $_POST['orderable_location_use_default_redemption_conversion_rate'] )
		) {
			return;
		}

		$use_default_redemption_conversion_rate = sanitize_text_field( wp_unslash( $_POST['orderable_location_use_default_redemption_conversion_rate'] ) );

		if ( empty( $use_default_conversion_rate ) ) {
			return;
		}

		update_post_meta( $post_id, '_orderable_location_use_default_redemption_conversion_rate', $use_default_redemption_conversion_rate );

		if (
			empty( $_POST['orderable_location_redemption_conversion_rate_points'] ) ||
			empty( $_POST['orderable_location_redemption_conversion_rate_monetary_value'] )
		) {
			delete_post_meta( $post_id, '_orderable_location_redemption_conversion_rate' );
			return;
		}

		$redemption_conversion_rate_points         = sanitize_text_field( wp_unslash( $_POST['orderable_location_redemption_conversion_rate_points'] ) );
		$redemption_conversion_rate_monetary_value = sanitize_text_field( wp_unslash( $_POST['orderable_location_redemption_conversion_rate_monetary_value'] ) );

		if ( empty( $redemption_conversion_rate_points ) || empty( $redemption_conversion_rate_monetary_value ) ) {
			delete_post_meta( $post_id, '_orderable_location_redemption_conversion_rate' );
			return;
		}

		$redemption_conversion_rate = $redemption_conversion_rate_points . ':' . $redemption_conversion_rate_monetary_value;

		update_post_meta( $post_id, '_orderable_location_redemption_conversion_rate', $redemption_conversion_rate );
	}

	/**
	 * Add Points and Rewards meta box.
	 *
	 * @return void
	 */
	public static function add_points_and_rewards_meta_box() {
		add_meta_box(
			'orderable_multi_location_points_and_rewards_meta_box',
			'Points and Rewards',
			function () {
				global $post;

				if ( empty( $post->ID ) ) {
					return;
				}

				$settings = WC_Points_Rewards_Admin::get_settings();

				$wc_points_rewards_earn_points_ratio_field = array();
				foreach ( $settings as $key => $setting ) {
					if ( empty( $setting['id'] ) ) {
						continue;
					}

					switch ( $setting['id'] ) {
						case 'wc_points_rewards_earn_points_ratio':
							$wc_points_rewards_earn_points_ratio_field = $setting;
							break;

						case 'wc_points_rewards_redeem_points_ratio':
							$wc_points_rewards_redeem_points_ratio_field = $setting;
							break;

						default:
							break;
					}
				}

				if ( empty( $wc_points_rewards_earn_points_ratio_field ) || empty( $wc_points_rewards_redeem_points_ratio_field ) ) {
					return;
				}

				$use_default_conversion_rate = get_post_meta( $post->ID, '_orderable_location_use_default_conversion_rate', true );
				$class_toggle_field_value    = 'no' === $use_default_conversion_rate ? 'disabled' : 'enabled';

				$conversion_rate                 = get_post_meta( $post->ID, '_orderable_location_conversion_rate', true );
				$conversion_rate                 = explode( ':', $conversion_rate );
				list( $points, $monetary_value ) = empty( $conversion_rate ) || 2 > count( $conversion_rate ) ? array( '', '' ) : $conversion_rate;

				$use_default_redemption_conversion_rate = get_post_meta( $post->ID, '_orderable_location_use_default_redemption_conversion_rate', true );
				$redemption_class_toggle_field_value    = 'no' === $use_default_redemption_conversion_rate ? 'disabled' : 'enabled';

				$redemption_conversion_rate                            = get_post_meta( $post->ID, '_orderable_location_redemption_conversion_rate', true );
				$redemption_conversion_rate                            = explode( ':', $redemption_conversion_rate );
				list( $redemption_points, $redemption_monetary_value ) = empty( $redemption_conversion_rate ) || 2 > count( $redemption_conversion_rate ) ? array( '', '' ) : $redemption_conversion_rate;

				?>
				<div class="orderable-fields-row orderable-fields-row--meta">
					<div class="orderable-fields-row__body">
						<div class="orderable-fields-row__body-row">
							<div class="orderable-fields-row__body-row-left">
								<h3><?php echo esc_html__( 'Use default conversion rate', 'orderable-pro' ); ?></h3>
								<p>
									<?php
										echo wp_kses_post(
											sprintf(
												// translators: %s - Orderable settings URL.
												__( 'You can change the default conversion rate on the <a href="%s" target="_blank">WooCommerce Points and Rewards page</a>.', 'orderable-pro' ),
												esc_url( admin_url( 'admin.php?page=woocommerce-points-and-rewards&tab=settings' ) )
											)
										);
									?>
								</p>
							</div>

							<div class="orderable-fields-row__body-row-right">
								<div class="orderable-store-open-hours__enable-default_holidays">
									<span
										class="orderable-toggle-field orderable-enable-default_holidays-toggle-field woocommerce-input-toggle woocommerce-input-toggle--<?php echo esc_attr( $class_toggle_field_value ); ?>"
									>
										<?php echo esc_html( 'Yes' ); ?>
									</span>

									<input
										type="hidden"
										name="orderable_location_use_default_conversion_rate"
										value="<?php echo esc_attr( 'no' === $use_default_conversion_rate ? 'no' : 'yes' ); ?>"
										class="orderable-toggle-field__input"
									/>
								</div>
							</div>
						</div>

						<div class="orderable-fields-row__body-row">
							<div class="orderable-fields-row__body-row-left">
								<h3>
									<?php echo esc_html( $wc_points_rewards_earn_points_ratio_field['title'] ); ?>
								</h3>
								<p>
									<?php echo esc_html( $wc_points_rewards_earn_points_ratio_field['desc_tip'] ); ?>
								</p>
							</div>
							<div class="orderable-fields-row__body-row-right orderable-holidays__holidays">
								<fieldset>
									<input
										name="orderable_location_conversion_rate_points"
										type="number"
										style="max-width: 70px;"
										value="<?php echo esc_attr( $points ); ?>"
										min="0"
										step="0.01"
									/>

									&nbsp;<?php esc_html_e( 'Points', 'orderable-pro' ); ?>
									<span>&nbsp;&#61;&nbsp;</span>&nbsp;<?php echo esc_html( get_woocommerce_currency_symbol() ); ?>

									<input
										class="wc_input_price"
										name="orderable_location_conversion_rate_monetary_value"
										type="number"
										style="max-width: 70px;"
										value="<?php echo esc_attr( $monetary_value ); ?>"
										min="0"
										step="0.01"
									/>
								</fieldset>
							</div>
						</div>

						<div class="orderable-fields-row__body-row">
							<div class="orderable-fields-row__body-row-left">
								<h3><?php echo esc_html__( 'Use default redemption conversion rate', 'orderable-pro' ); ?></h3>
								<p>
									<?php
										echo wp_kses_post(
											sprintf(
												// translators: %s - Orderable settings URL.
												__( 'You can change the default redemption conversion rate on the <a href="%s" target="_blank">WooCommerce Points and Rewards page</a>.', 'orderable-pro' ),
												esc_url( admin_url( 'admin.php?page=woocommerce-points-and-rewards&tab=settings' ) )
											)
										);
									?>
								</p>
							</div>

							<div class="orderable-fields-row__body-row-right">
								<div class="orderable-store-open-hours__enable-default_holidays">
									<span
										class="orderable-toggle-field orderable-enable-default_holidays-toggle-field woocommerce-input-toggle woocommerce-input-toggle--<?php echo esc_attr( $redemption_class_toggle_field_value ); ?>"
									>
										<?php echo esc_html( 'Yes' ); ?>
									</span>

									<input
										type="hidden"
										name="orderable_location_use_default_redemption_conversion_rate"
										value="<?php echo esc_attr( 'no' === $use_default_redemption_conversion_rate ? 'no' : 'yes' ); ?>"
										class="orderable-toggle-field__input"
									/>
								</div>
							</div>
						</div>

						<div class="orderable-fields-row__body-row">
							<div class="orderable-fields-row__body-row-left">
								<h3>
									<?php echo esc_html( $wc_points_rewards_redeem_points_ratio_field['title'] ); ?>
								</h3>
								<p>
									<?php echo esc_html( $wc_points_rewards_redeem_points_ratio_field['desc_tip'] ); ?>
								</p>
							</div>
							<div class="orderable-fields-row__body-row-right orderable-holidays__holidays">
								<fieldset>
									<input
										name="orderable_location_redemption_conversion_rate_points"
										type="number"
										style="max-width: 70px;"
										value="<?php echo esc_attr( $redemption_points ); ?>"
										min="0"
										step="0.01"
									/>

									&nbsp;<?php esc_html_e( 'Points', 'orderable-pro' ); ?>
									<span>&nbsp;&#61;&nbsp;</span>&nbsp;<?php echo esc_html( get_woocommerce_currency_symbol() ); ?>

									<input
										class="wc_input_price"
										name="orderable_location_redemption_conversion_rate_monetary_value"
										type="number"
										style="max-width: 70px;"
										value="<?php echo esc_attr( $redemption_monetary_value ); ?>"
										min="0"
										step="0.01"
									/>
								</fieldset>
							</div>
						</div>
					</div>
				</div>
				<?php
			}
		);
	}

	/**
	 * Get product points earned with addons.
	 *
	 * @param WC_Product $product The product.
	 * @return int
	 */
	protected static function get_product_points_earned_with_addons( $product ) {
		$group_ids = Orderable_Pro_Conditions_Matcher::get_applicable_cpt( 'orderable_addons', $product );

		if ( empty( $group_ids ) ) {
			return 0;
		}

		$points_earned = 0;

		foreach ( $group_ids as $group_id ) {
			$fields = Orderable_Addons_Pro_Field_Groups::get_group_data( $group_id );

			if ( empty( $fields ) ) {
				continue;
			}

			foreach ( $fields as $field ) {
				if ( empty( $field['options'] ) ) {
					continue;
				}

				$options_points_earned = array();

				foreach ( $field['options'] as $option ) {
					if ( empty( $option['points_earned'] ) ) {
						continue;
					}

					$options_points_earned[] = (int) $option['points_earned'];
				}

				if ( empty( $options_points_earned ) ) {
					continue;
				}

				if ( 'visual_checkbox' === $field['type'] ) {
					$points_earned += array_sum( $options_points_earned );
				} else {
					$points_earned += max( $options_points_earned );
				}
			}
		}

		return $points_earned;
	}

	/**
	 * Check product addons points.
	 *
	 * @param int        $points  The points.
	 * @param WC_Product $product The product.
	 * @return int
	 */
	public static function check_product_addons_points( $points, $product ) {
		$points_earned = self::get_product_points_earned_with_addons( $product );

		if ( empty( $points_earned ) ) {
			return $points;
		}

		add_filter(
			'orderable_product_points_message',
			function () {
				// translators: %1$d - max number of points earned when purchasing the product.
				return __( 'Points: up to %1$d', 'orderable' );
			}
		);

		add_filter(
			'orderable_loyalty_rewards_product_message',
			function ( $message, $points ) {
				$variable_product_message = get_option( 'wc_points_rewards_variable_product_message' );

				if ( empty( $variable_product_message ) ) {
					return $message;
				}

				$variable_product_message = str_replace( '{points}', number_format_i18n( $points ), $variable_product_message );
				$variable_product_message = str_replace( '{points_label}', WC_Points_Rewards::instance()->get_points_label( $points ), $variable_product_message );

				return $variable_product_message;
			},
			10,
			2
		);

		add_action(
			'orderable_before_product_actions',
			function () {
				remove_all_filters( 'orderable_product_points_message' );
				remove_all_filters( 'orderable_loyalty_rewards_product_message' );
			},
			11
		);

		return $points + $points_earned;
	}

	/**
	 * Add earn points message to fragments.
	 *
	 * This is important to show the correct points since it
	 * can change based on the selected location.
	 *
	 * @param array $fragments Array of HTML fragments.
	 * @return array
	 */
	public static function add_points_rewards_earn_points_message_to_fragments( $fragments ) {
		if ( ! is_array( $fragments ) ) {
			return $fragments;
		}

		if ( ! class_exists( 'WC_Points_Rewards' ) ) {
			return $fragments;
		}

		$wc_points_rewards_cart_checkout = WC_Points_Rewards::instance()->get( 'cart' );

		if ( empty( $wc_points_rewards_cart_checkout ) ) {
			return $fragments;
		}

		$message = $wc_points_rewards_cart_checkout->generate_earn_points_message();

		if ( empty( $message ) ) {
			return $fragments;
		}

		ob_start();
		?>
		<div class="wc_points_rewards_earn_points">
			<?php wc_print_notice( $message, 'notice' ); ?>
		</div>
		<?php

		$fragments['.wc_points_rewards_earn_points'] = ob_get_clean();

		return $fragments;
	}
}
