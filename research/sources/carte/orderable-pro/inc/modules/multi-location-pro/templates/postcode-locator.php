<?php
/**
 * Template for the Postcode locator.
 *
 * @package Orderable_Pro
 **/

$location = Orderable_Multi_Location_Pro::get_selected_location_data_from_session();
$postcode = ! empty( $location['postcode'] ) ? $location['postcode'] : '';
?>
<div class="opml-postcode-locator">
	<div class="opml-postcode-locator__row">
		<?php wp_nonce_field( 'orderable_find_locations', '_wpnonce_orderable' ); ?>

		<div class="opml-store-locator-input">
			<label class="opml-store-locator-input__label"><?php esc_html_e( 'Enter your Postcode / Zip', 'orderable-pro' ); ?></label>
			<input class="opml-store-locator-input__input" type="text" placeholder="" value="<?php echo esc_attr( $postcode ); ?>">
		</div>
		<div class="opml-postcode-locator__button-wrap">
			<button class="opml-postcode-locator__button" type="button"><?php echo esc_html_x( 'Get Started', 'Postcode Locator', 'orderable-pro' ); ?></button>
		</div>
	</div>
</div>
