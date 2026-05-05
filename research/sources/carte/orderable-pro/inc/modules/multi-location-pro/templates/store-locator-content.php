<?php
/**
 * Store locator popup content.
 *
 * @package Orderable_Pro
 **/

$location = Orderable_Multi_Location_Pro::get_selected_location_data_from_session();
$postcode = ! empty( $location['postcode'] ) ? $location['postcode'] : '';
?>
<div class="opml-store-locator">
	<div class="opml-store-locator__wrap">
		<h2 class="opml-store-locator__heading"><?php esc_html_e( 'Find locations near you', 'orderable-pro' ); ?></h2>
		<p class="opml-store-locator__content"><?php esc_html_e( 'Discover a location near you with delivery or pickup options available right now.', 'orderable-pro' ); ?></p>

		<?php wp_nonce_field( 'orderable_find_locations', '_wpnonce_orderable' ); ?>

		<div class="opml-store-locator__input">
			<div class="opml-store-locator-input">
				<label class="opml-store-locator-input__label"><?php esc_html_e( 'Enter your Postcode / Zip', 'orderable-pro' ); ?></label>
				<input class="opml-store-locator-input__input" type="text" placeholder="" value="<?php echo esc_attr( $postcode ); ?>" data-1p-ignore>
			</div>
		</div>

		<?php
		if ( Orderable_Multi_Location_Pro::is_geolocate_enabled() ) {
			?>
			<div class="opml-store-locator__geolocate">
				<button class="opml-store-locator__geolocate-btn"><?php esc_html_e( 'Use your current location', 'orderable-pro' ); ?></button>
			</div>
			<?php
		}
		?>

		<div class="opml-store-locator__results" style="display:none;"></div>
	</div>
</div>
