<?php
/**
 * Template for search result.
 *
 * @package Orderable_Pro
 *
 * @var Orderable_Location_Single_Pro[] $locations                      Locations.
 * @var array                           $locations_allowed_for_delivery Locations allowed for delivery.
 * @var array                           $locations_allowed_for_pickup   Locations allowed for pickup.
 **/

if ( empty( $locations_allowed_for_delivery ) && ! empty( $locations_allowed_for_pickup ) ) {
	?>
	<div class="opml-store-locator-notice"><?php esc_html_e( 'Delivery is not currently available for your postcode. Pickup is available from these locations.', 'orderable-pro' ); ?></div>
	<?php
}
?>

<div class="opml-store-results">
	<?php
	foreach ( $locations as $location ) {
		require Orderable_Helpers::get_template_path( 'templates/postcode-search-result-single-store.php', 'multi-location-pro', true );
	}
	?>
</div>
