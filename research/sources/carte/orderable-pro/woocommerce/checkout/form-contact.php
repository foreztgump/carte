<?php
/**
 * Checkout contact information form
 */

defined( 'ABSPATH' ) || exit; ?>

<div class="woocommerce-billing-fields">
	<div class="woocommerce-billing-fields__field-wrapper">
		<?php
		$fields = $checkout->get_checkout_fields( 'contact' );

		foreach ( $fields as $key => $field ) {
			woocommerce_form_field( $key, $field, $checkout->get_value( $key ) );
		}
		?>
	</div>
</div>