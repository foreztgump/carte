<?php

/**
 * Module: Tip Pro.
 *
 * @package Orderable/Classes
 */
defined( 'ABSPATH' ) || exit;

/**
 * Tip module class.
 */
class Orderable_Tip_Pro {
	/**
	 * Init.
	 */
	public static function run() {
		self::load_classes();
		self::register_shortcodes();

		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'frontend_assets' ) );
	}

	/**
	 * Load classes.
	 */
	public static function load_classes() {
		$classes = array(
			'tip-pro-settings' => 'Orderable_Tip_Pro_Settings',
			'tip-pro-checkout' => 'Orderable_Tip_Pro_Checkout',
		);

		Orderable_Helpers::load_classes( $classes, 'tip-pro', ORDERABLE_PRO_MODULES_PATH );
	}

	/**
	 * Enqueue frontend assets.
	 */
	public static function frontend_assets() {
		$enable_tip = Orderable_Settings::get_setting( 'tip_general_enable_tip' );

		if ( is_admin() || ! $enable_tip ) {
			return;
		}

		if ( ! is_checkout() && ! has_block( 'orderable-pro/order-tip-block' ) ) {
			return;
		}

		$suffix     = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';
		$suffix_css = ( is_rtl() ? '-rtl' : '' ) . $suffix;

		// Styles.
		wp_enqueue_style( 'orderable-tip-pro', ORDERABLE_PRO_URL . 'inc/modules/tip-pro/assets/frontend/css/tip-pro' . $suffix_css . '.css', array(), ORDERABLE_PRO_VERSION );

		// Scripts.
		wp_enqueue_script( 'orderable-tip-pro', ORDERABLE_PRO_URL . 'inc/modules/tip-pro/assets/frontend/js/main' . $suffix . '.js', array( 'jquery' ), ORDERABLE_PRO_VERSION, true );
	}

	/**
	 * Display Tip options for checkout.
	 *
	 * @param bool $should_render_custom_form The custom form holds the tip data sent to the
	 *                                        request. In some cases, we don't want to render it
	 *                                        inside `#orderable-tip`. E.g.: tip section added via
	 *                                        shortcode.
	 */
	public static function add_tip_section( $should_render_custom_form = true ) {
		$enable_tip = Orderable_Settings::get_setting( 'tip_general_enable_tip' );

		if ( empty( $enable_tip ) ) {
			return;
		}

		$tip_options       = Orderable_Tip_Pro_Settings::get_tip_options_prepared();
		$active_tip_option = self::get_active_tip_index();
		$no_tip_label      = Orderable_Settings::get_setting( 'tip_general_no_tip_label' );
		$enable_custom_tip = Orderable_Settings::get_setting( 'tip_general_enable_custom_tip' );
		$custom_tip_label  = Orderable_Settings::get_setting( 'tip_general_custom_tip_label' );
		?>
		<div id="orderable-tip" class="orderable-tip">
			<strong class="orderable-tip__title"><?php _e( 'Tip Amount', 'orderable-pro' ); ?></strong>
			<?php if ( ! empty( $tip_options ) ) : ?>
				<div class="orderable-tip__row orderable-tip__row--predefined">
					<?php foreach ( $tip_options as $key => $tip_option ) : ?>
						<button
							type="button"
							class="orderable-button orderable-button--tip orderable-tip__button <?php echo $tip_option['active'] ? 'orderable-button--active' : ''; ?>"
							value="<?php echo esc_attr( $tip_option['amount'] ); ?>"
							data-value="<?php echo esc_attr( $tip_option['amount'] ); ?>"
							data-index="<?php echo esc_attr( $key ); ?>"
							tabindex="-1"
							role="radio"
							aria-checked="false"
						>
							<?php echo wp_kses_post( $tip_option['label'] ); ?>
						</button>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>
			<div class="orderable-tip__row orderable-tip__row--default">
				<button
					type="button"
					class="orderable-button orderable-button--tip orderable-tip__button orderable-tip__button--half orderable-tip__button--no-tip <?php echo ( 'no_tip' === $active_tip_option ) ? 'orderable-button--active' : ''; ?>"
					value="0"
					data-index="no_tip"
					tabindex="-1"
					role="radio"
					aria-checked="false"
				>
					<?php echo $no_tip_label; ?>
				</button>
				<?php if ( ! empty( $enable_custom_tip ) ) { ?>
					<button
						type="button"
						class="orderable-button orderable-button--tip orderable-tip__button orderable-tip__button--half orderable-tip__button--custom <?php echo ( 'custom_tip' === $active_tip_option ) ? 'orderable-button--active' : ''; ?>" 
						value="0"
						data-index="custom_tip"
						tabindex="-1"
						role="radio"
						aria-checked="false"
					>
						<?php echo wp_kses_post( $custom_tip_label ); ?>
					</button>
				<?php } ?>
			</div>
			<?php
			if ( $should_render_custom_form ) {
				self::tip_custom_form();
			}
			?>
		</div>
		<?php
	}

	/**
	 * Get active tip index.
	 *
	 * @return string|int
	 */
	public static function get_active_tip_index() {
		static $active_index = null;

		if ( is_null( $active_index ) ) {
			$session_tip_data = self::get_session_tip_data();
			$active_index     = Orderable_Settings::get_setting( 'default_tip_option' );

			if ( isset( $session_tip_data['index'] ) ) {
				$active_index = $session_tip_data['index'];
			}
		}

		$active_index = is_numeric( $active_index ) ? absint( $active_index ) : $active_index;

		return apply_filters( 'orderable_pro_get_active_tip_index', $active_index );
	}

	/**
	 * Get active tip amount.
	 *
	 * @return float
	 */
	public static function get_active_tip_amount() {
		static $active_amount = null;

		if ( is_null( $active_amount ) ) {
			$session_tip_data = self::get_session_tip_data();
			$active_amount    = 0;

			if ( isset( $session_tip_data['index'] ) ) {
				$active_amount = floatval( $session_tip_data['amount'] );
			}

			// Tip is not yet set in session, use default value.
			if ( empty( $session_tip_data ) ) {
				$tip_options   = Orderable_Tip_Pro_Settings::get_tip_options_prepared();
				$default_index = Orderable_Settings::get_setting( 'default_tip_option' );
				if ( isset( $tip_options[ $default_index ] ) ) {
					$active_amount = floatval( $tip_options[ $default_index ]['amount'] );
				}
			}
		}

		return apply_filters( 'orderable_pro_get_active_tip_amount', $active_amount );
	}

	/**
	 * Set session data for selected tip option.
	 *
	 * @param array $tip_data
	 */
	public static function set_session_tip_data( $tip_data = array() ) {
		if ( empty( $tip_data ) || isset( $_POST['tip_amount'] ) ) {
			$tip_data = array(
				'index'  => wc_clean( wp_unslash( $_POST['tip_index'] ) ),
				'amount' => wc_clean( wp_unslash( $_POST['tip_amount'] ) ),
			);
		}

		WC()->session->set( 'tip_data', $tip_data );
	}

	/**
	 * Get tip data form session.
	 *
	 * @return array
	 */
	public static function get_session_tip_data() {
		if ( empty( WC()->session ) ) {
			return array();
		}

		return WC()->session->get( 'tip_data' );
	}

	/**
	 * Register shortcodes.
	 *
	 * @return void
	 */
	public static function register_shortcodes() {
		add_shortcode( 'orderable_tip', array( __CLASS__, 'tip_shortcode' ) );
	}

	/**
	 * The [orderable_tip] shortcode callback.
	 *
	 * @return string
	 */
	public static function tip_shortcode() {

		/**
		 * Filter whether the Orderable Tip shortcode should be rendered or not.
		 *
		 * @since 1.5.0
		 * @hook orderable_should_render_tip_shortcode
		 * @param  string $orderable_tip_html The output of the shortcode.
		 * @return bool New value
		 */
		$render_orderable_tip_shortcode = apply_filters( 'orderable_should_render_tip_shortcode', Orderable_Checkout_Pro::is_checkout_page() );

		if ( ! $render_orderable_tip_shortcode ) {
			return;
		}

		ob_start();

		/**
		 * The .woocommerce wrapper is necessary to
		 * apply some CSS rules added by WooCommerce.
		 *
		 * E.g.: .woocommerce .blockUI.blockOverlay::before
		 */
		?>
		<div class="woocommerce">
			<?php self::add_tip_section( false ); ?>
		</div>

		<?php

		/**
		 * Filter the output of the Orderable Tip shortcode.
		 *
		 * @since 1.5.0
		 * @hook orderable_tip_shortcode_output
		 * @param  string $orderable_tip_html The output of the shortcode.
		 * @return string New value
		 */
		$orderable_tip_html = apply_filters( 'orderable_tip_shortcode_output', ob_get_clean() );

		return $orderable_tip_html;
	}

	/**
	 * The tip custom form that holds the data sent to the request.
	 *
	 * @return void
	 */
	public static function tip_custom_form() {
		$active_tip_option = self::get_active_tip_index();
		$tip_amount        = self::get_active_tip_amount();

		?>
		<div class="orderable-tip__custom-form">
			<input name="tip_index" class="orderable_tip_index" id="orderable_tip_index" value="<?php echo esc_attr( $active_tip_option ); ?>" type="hidden">

			<span class="orderable-tip__amount-wrap orderable-tip__amount-wrap--<?php echo esc_attr( get_option( 'woocommerce_currency_pos' ) ); ?>">
				<span class="orderable-tip__currency"><?php echo esc_html( get_woocommerce_currency_symbol() ); ?></span>
				<input name="tip_amount" id="orderable_tip_amount" class="orderable-tip__custom-form-field" value="<?php echo esc_attr( $tip_amount ); ?>" type="number" min="0">
			</span>

			<button
				type="button"
				class="orderable-button orderable-button--tip orderable-tip__custom-form-button"
				tabindex="-1"
				data-index="custom_tip"
			>
				<?php esc_html_e( 'Apply', 'orderable-pro' ); ?>
			</button>
		</div>
		<?php
	}
}
