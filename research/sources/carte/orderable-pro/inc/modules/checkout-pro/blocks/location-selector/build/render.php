<?php
/**
 * Render Orderable Tip block.
 *
 * @package orderable-pro
 */

$table = false;

if ( class_exists( 'Orderable_Table_Ordering_Pro' ) ) {
	$table = Orderable_Table_Ordering_Pro::get_table_from_cookie();
}

if ( $table ) {
	return;
}

if ( ! Orderable_Multi_Location_Pro::is_multi_location_active() ) {
	return;
}

wp_dequeue_script( 'multi-location-pro-js' );

?>
<div class="orderable-location-selector-checkout-block wc-block-components-totals-wrapper">
	<div class="wc-block-components-totals-item">
		<span class="orderable-location-selector-checkout-block__title">
			<?php esc_html_e( 'Location', 'orderable-pro' ); ?>
		</span>

		<?php Orderable_Multi_Location_Pro_Frontend::mini_locator(); ?>
	</div>
</div>
