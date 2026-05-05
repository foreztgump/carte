<?php
/**
 * Checkout Pro Override Checkout.
 *
 * @package Orderable/Classes
 */
defined( 'ABSPATH' ) || exit;

/**
 * Checkout Pro override checkout class.
 */
class Orderable_Checkout_Pro_Override_Checkout {
	/**
	 * Init.
	 */
	public static function run() {
		if ( ! Orderable_Checkout_Pro_Settings::is_override_checkout() ) {
			return;
		}

		// Compatibility.
		$classes = array(
			'helpers'              => 'Iconic_Flux_Helpers',
			'compat-astra'         => 'Iconic_Flux_Compat_Astra',
			'compat-avada'         => 'Iconic_Flux_Compat_Avada',
			'compat-flatsome'      => 'Iconic_Flux_Compat_Flatsome',
			'compat-germanized'    => 'Iconic_Flux_Compat_Germanized',
			'compat-martfury'      => 'Iconic_Flux_Compat_Martfury',
			'compat-neve'          => 'Iconic_Flux_Compat_Neve',
			'compat-sales-booster' => 'Iconic_Flux_Compat_Sales_Booster',
			'compat-sendcloud'     => 'Iconic_Flux_Compat_Sendcloud',
			'compat-shopkeeper'    => 'Iconic_Flux_Compat_Shopkeeper',
			'compat-shoptimizer'   => 'Iconic_Flux_Compat_Shoptimizer',
			'compat-siteground'    => 'Iconic_Flux_Compat_Siteground',
			'compat-smart-coupon'  => 'Iconic_Flux_Compat_Smart_Coupon',
			'compat-social-login'  => 'Iconic_Flux_Compat_Social_Login',
			'compat-tokoo'         => 'Iconic_Flux_Compat_Tokoo',
			'compat-virtue'        => 'Iconic_Flux_Compat_Virtue',
			'compat-woodmart'      => 'Iconic_Flux_Compat_Woodmart',
		);

		Orderable_Helpers::load_classes( $classes, 'checkout-pro/flux-common', ORDERABLE_PRO_MODULES_PATH );

		add_filter( 'render_block_woocommerce/checkout', array( __CLASS__, 'replace_checkout_block_to_checkout_shortcode' ) );

		// Orderable: Load Custom Template.
		add_filter( 'page_template', array( __CLASS__, 'page_template' ), 10 );

		// Locate templates.
		add_filter( 'woocommerce_locate_template', array( __CLASS__, 'orderable_locate_template' ), 10, 3 );

		// Set priorities.
		add_filter( 'woocommerce_checkout_fields', array( __CLASS__, 'checkout_fields' ) );

		// Orderable: Render Custom Contact Form.
		add_action( 'woocommerce_checkout_contact', array( __CLASS__, 'checkout_form_contact' ) );

		// Unhook Default Coupon Form.
		remove_action( 'woocommerce_before_checkout_form', 'woocommerce_checkout_coupon_form', 10 );

		// Orderable: Add Custom Coupon Form.
		add_action( 'woocommerce_review_order_after_cart_contents', array( __CLASS__, 'checkout_add_coupon_form' ), 9 );

		// Orderable: Custom logo header display.
		add_action( 'orderable_checkout_header', array( __CLASS__, 'orderable_before_checkout_form' ), 0, 1 );

		// Orderable: Change position of checkout form.
		remove_action( 'woocommerce_checkout_order_review', 'woocommerce_checkout_payment', 20 );
		add_action( 'orderable_checkout_payment', 'woocommerce_checkout_payment', 20 );

		// Orderable: Custom classes on order button.
		add_filter( 'woocommerce_order_button_html', array( __CLASS__, 'order_button_html' ) );

		// add_filter( 'woocommerce_update_order_review_fragments', array( __CLASS__, 'order_review_fragments' ) );

		// Reposition login form.
		remove_action( 'woocommerce_before_checkout_form', 'woocommerce_checkout_login_form', 10 );
		add_action( 'woocommerce_checkout_before_customer_details', 'woocommerce_checkout_login_form', 10 );
	}

	/**
	 * Change checkout template.
	 *
	 * @param $template
	 * @param $type
	 * @param $templates
	 *
	 * @return mixed
	 */
	public static function page_template( $template ) {
		if ( is_admin() || ! Orderable_Checkout_Pro::is_checkout_page() || is_wc_endpoint_url( 'order-received' ) || is_wc_endpoint_url( 'order-pay' ) ) {
			return $template;
		}

		return ORDERABLE_PRO_PATH . 'woocommerce/orderable/checkout.php';
	}

	/**
	 * Add custom template support for woocommerce.
	 */
	public static function orderable_locate_template( $template, $template_name, $template_path ) {
		global $woocommerce;
		$plugin_path = ORDERABLE_PRO_PATH . 'woocommerce/';

		if ( file_exists( $plugin_path . $template_name ) ) {
			$template = $plugin_path . $template_name;
		}

		return $template;
	}

	/**
	 * Add coupon form inside order summary section.
	 */
	public static function checkout_add_coupon_form() {
		if ( ! wc_coupons_enabled() ) {
			return;
		}

		echo '<tr class="coupon-form"><td colspan="2">';
		wc_get_template(
			'checkout/form-coupon.php',
			array(
				'checkout' => WC()->checkout(),
			)
		);
		echo '</td></tr>';
	}

	/**
	 * Display logo in checkout page.
	 */
	public static function orderable_before_checkout_form( $checkout ) {
		$enable_logo = Orderable_Settings::get_setting( 'checkout_general_enable_logo' );

		if ( '1' !== $enable_logo ) {
			return;
		}

		$checkout_logo = Orderable_Settings::get_setting( 'checkout_general_checkout_logo' );

		if ( empty( $checkout_logo ) ) {
			return;
		}

		$logo_link = self::get_logo_link();

		?>
		<div class="orderable-checkout-logo">
			<?php
			if ( $logo_link ) {
				?>
				<a class="orderable-checkout-logo_link" href="<?php echo esc_url( $logo_link ); ?>"><?php } ?>
				<img class="orderable-checkout-logo_image" alt="" src="<?php echo esc_attr( $checkout_logo ); ?>">
			<?php
			if ( $logo_link ) {
				?>
				</a><?php } ?>
		</div>
		<?php
	}

	/**
	 * Get logo link.
	 *
	 * @return false|string
	 */
	public static function get_logo_link() {
		$link         = false;
		$link_setting = absint( Orderable_Settings::get_setting( 'checkout_general_link_to_store' ) );

		if ( 1 === $link_setting ) {
			$link = get_permalink( wc_get_page_id( 'shop' ) );
		} elseif ( $link_setting > 1 ) {
			$link = get_permalink( $link_setting );
		}

		return apply_filters( 'orderable_pro_get_logo_link', $link, $link_setting );
	}

	/**
	 * Get an array of checkout fields.
	 */
	public static function checkout_fields( $fields ) {
		$contact_fields = array();
		/**
		 * Filter Billing Fields
		 */
		foreach ( $fields['billing'] as $key => $field ) {
			if ( 'billing_company' == $key ) {
				unset( $fields['billing']['billing_company'] );
				continue;
			}

			if ( 'billing_country' == $key ) {
				$field['class'][] = 'orderable_hidden';
			}

			// Do not remove placeholder for the radio and checkbox fields.
			if ( empty( $field['type'] ) || ! in_array( $field['type'], array( 'radio', 'checkbox' ), true ) ) {
				$field['placeholder'] = isset( $field['label'] ) ? wp_strip_all_tags( $field['label'] ) : '';
				$field['label']       = '';
			}

			if ( in_array( $key, array( 'billing_first_name', 'billing_last_name', 'billing_phone', 'orderable_notification_optin', 'billing_email' ) ) ) {
				$contact_fields[ $key ] = $field;
				unset( $fields['billing'][ $key ] );
			} else {
				$fields['billing'][ $key ] = $field;
			}
		}

		/**
		 * Set Field priority
		 */
		$contact_fields['billing_email']['priority'] = 5;
		$contact_fields['billing_phone']['priority'] = 6;

		/**
		 * Set Contact Fields
		 */
		$fields['contact'] = array_reverse( $contact_fields, true );

		/**
		 * Filter Shipping Fields
		 */
		foreach ( $fields['shipping'] as $key => $field ) {
			if ( 'shipping_company' == $key ) {
				unset( $fields['shipping']['shipping_company'] );
				continue;
			}
			if ( 'shipping_country' == $key ) {
				$field['class'][] = 'orderable_hidden';
			}
			$field['placeholder']       = wp_strip_all_tags( $field['label'] );
			$field['label']             = '';
			$fields['shipping'][ $key ] = $field;
		}

		return $fields;
	}

	/**
	 * Output the contact form.
	 */
	public static function checkout_form_contact() {
		wc_get_template( 'checkout/form-contact.php', array( 'checkout' => new WC_Checkout() ) );
	}

	/**
	 * Update order review fragments.
	 *
	 * @param $fragments
	 *
	 * @return array
	 */
	public static function order_review_fragments( $fragments ) {
		ob_start();
		wc_get_template( 'orderable/checkout-shipping-fields.php' );
		$fragments['.checkout_shipping_section'] = ob_get_clean();

		return $fragments;
	}

	/**
	 * Add classes to place order button.
	 *
	 * @param $button_html
	 *
	 * @return string
	 */
	public static function order_button_html( $button_html ) {
		return preg_replace( '/ class="(.*?)"/m', 'class="orderable-button orderable-button--filled orderable-button--full orderable-button--place-order"', $button_html );
	}

	/**
	 * Replace checkout block to checkout shortcode if override
	 * checkout option is enabled.
	 *
	 * @param string $block_content The block content.
	 * @return string
	 */
	public static function replace_checkout_block_to_checkout_shortcode( $block_content ) {
		if ( ! is_checkout() ) {
			return $block_content;
		}

		if ( ! Orderable_Checkout_Pro_Settings::is_override_checkout() ) {
			return $block_content;
		}

		return do_shortcode( '[woocommerce_checkout]' );
	}
}
