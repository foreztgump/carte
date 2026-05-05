<?php
/**
 * Mini locator template.
 *
 * @package Orderable_Pro
 *
 * @var bool                          $is_available   Is available.
 * @var string                        $delivery_type  Delivery type.
 * @var string                        $location_title Location title.
 * @var Orderable_Location_Single_Pro $location       Location object.
 **/

?>

<div class="opml-mini-locator" data-type="<?php echo esc_attr( $delivery_type ); ?>">
	<div class="opml-mini-locator__icon-wrap" opml-store-popup-open="1">
		<div class="opml-mini-locator__icon">
		</div>
	</div>
	<div class="opml-mini-locator__address <?php echo ! $is_available ? 'opml-mini-locator__address--not-available' : ''; ?>">
		<p class="opml-mini-locator__address-postcode"><?php echo esc_html( $location_title ); ?></p>
		<?php
		if ( ! $is_available ) {
			printf(
			/* translators: delivery type */
				esc_html__( 'Sorry, this location is unavailable for %s.', 'orderable-pro' ),
				esc_html( $delivery_type )
			);
		}
		?>

		<a class="opml-mini-locator__address-button" opml-store-popup-open="1" href="#"><?php echo esc_html_x( 'Edit Location', 'mini locator', 'orderable-pro' ); ?></a>
		<input type="hidden" name="opml_selected_location" value="<?php echo esc_attr( isset( $location ) && $is_available ? $location->get_location_id() : '' ); ?>">
		<?php wp_nonce_field( 'validate_location' ); ?>
	</div>
</div>
