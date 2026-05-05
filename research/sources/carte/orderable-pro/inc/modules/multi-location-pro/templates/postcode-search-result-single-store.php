<?php
/**
 * Template for single store in the search results.
 *
 * @package Orderable_Pro
 * @var Orderable_Location_Single_Pro $location              location.
 * @var array                         $matching_location_ids Matching location IDs for shipping method.
 */

$selected_date_timestamp = false;
if (
	! empty( $_POST['_wpnonce_orderable'] ) &&
	wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce_orderable'] ) ), 'orderable_find_locations' ) &&
	! empty( $_POST['order_date'] ) ) {
	$selected_date_timestamp = absint( $_POST['order_date'] );
}

$delivery_eta           = $location->get_eta( 'delivery', $selected_date_timestamp );
$delivery_eta_formatted = empty( $delivery_eta['formatted'] ) ? false : $delivery_eta['formatted'];
$pickup_eta             = $location->get_eta( 'pickup', $selected_date_timestamp );
$pickup_eta_formatted   = empty( $pickup_eta['formatted'] ) ? false : $pickup_eta['formatted'];
$delivery_classes       = '';
$pickup_classes         = '';
$is_main_location       = Orderable_Location::is_main_location( $location->get_location_id() );

// We do not want to use the get_selected_location() function here, as its output is influenced by `orderable_multi_location_selected_location` filter.
$selected_location_id = empty( WC()->session->get( 'orderable_multi_location_id' ) ) ? false : sanitize_text_field( WC()->session->get( 'orderable_multi_location_id' ) );
$selected_service     = empty( WC()->session->get( 'orderable_multi_location_delivery_type' ) ) ? false : sanitize_text_field( WC()->session->get( 'orderable_multi_location_delivery_type' ) );

if ( ! is_string( $delivery_eta_formatted ) && ! is_string( $pickup_eta_formatted ) ) {
	return;
}

if ( ! is_string( $delivery_eta_formatted ) || ! in_array( $location->get_location_id(), $matching_location_ids ) ) {
	$delivery_classes       = 'opml-select-store-button--disabled';
	$delivery_eta_formatted = esc_html__( 'Not Available', 'orderable-pro' );
}

if ( ! is_string( $pickup_eta_formatted ) ) {
	$pickup_classes = 'opml-select-store-button--disabled';
}

if ( ( $location->get_location_id() == $selected_location_id ) && 'delivery' === $selected_service ) {
	$delivery_classes .= ' opml-select-store-button--selected';
}

if ( ( $location->get_location_id() == $selected_location_id ) && 'pickup' === $selected_service ) {
	$pickup_classes .= ' opml-select-store-button--selected';
}

/**
 * By default, Orderable keeps the date selected in the Date field
 * when you change the shipping method in the Checkout page. This
 * filter allows changing this behaviour by instructing
 * Orderable to try to select the date shown in the
 * button (.opml-select-store-button__eta element).
 *
 * @since 1.8.3
 * @hook orderable_should_select_eta_in_date_field
 * @param  bool                          $should_select_eta_in_date_field Default: false.
 * @param  Orderable_Location_Single_Pro $location                        The location.
 * @param  array                         $matching_location_ids           Matching location IDs for shipping method.
 *
 * @return bool New value
 */
$should_select_eta_in_date_field = apply_filters( 'orderable_should_select_eta_in_date_field', false, $location, $matching_location_ids );

?>
<div class="opml-search-single-store" data-location-id="<?php echo esc_attr( $location->get_location_id() ); ?>">
	<div class="opml-search-single-store__img">
	</div>
	<div class="opml-search-single-store-content">
		<h4 class="opml-search-single-store-content__heading"><?php echo esc_html( $location->get_title() ); ?></h4>
		<div class="opml-search-single-store-content__address"><?php echo esc_html( $location->get_formatted_address() ); ?></div>
		<div class="opml-search-single-store-content__buttons">
			<a
				href="#"
				class="opml-select-store-button opml-select-store-button--delivery <?php echo esc_attr( $delivery_classes ); ?>"
				data-type="delivery"

				<?php if ( $should_select_eta_in_date_field ) : ?>
					data-eta="<?php echo empty( $delivery_eta['timestamp'] ) ? '' : esc_attr( $delivery_eta['timestamp'] ); ?>"
				<?php endif; ?>
			>
				<span class="opml-select-store-button__text"><?php esc_html_e( 'Delivery', 'orderable-pro' ); ?></span>
				<span class="opml-select-store-button__eta"><?php echo is_string( $delivery_eta_formatted ) ? esc_html( $delivery_eta_formatted ) : esc_html__( 'Not Available', 'orderable-pro' ); ?></span>
			</a>
			<a
				href="#"
				class="opml-select-store-button opml-select-store-button--pickup <?php echo esc_attr( $pickup_classes ); ?>"
				data-type="pickup"

				<?php if ( $should_select_eta_in_date_field ) : ?>
					data-eta="<?php echo empty( $pickup_eta['timestamp'] ) ? '' : esc_attr( $pickup_eta['timestamp'] ); ?>"
				<?php endif; ?>
			>
				<span class="opml-select-store-button__text"><?php esc_html_e( 'Pickup', 'orderable-pro' ); ?></span>
				<span class="opml-select-store-button__eta"><?php echo is_string( $pickup_eta_formatted ) ? esc_html( $pickup_eta_formatted ) : esc_html__( 'Not Available', 'orderable-pro' ); ?></span>
			</a>
		</div>
	</div>
</div>
