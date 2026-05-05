<?php
/**
 * Render Orderable Tip block.
 *
 * @package orderable-pro
 */

if ( ! class_exists( 'Orderable_Settings' ) ) {
	return;
}

$enable_tip = Orderable_Settings::get_setting( 'tip_general_enable_tip' );

if ( empty( $enable_tip ) ) {
	return;
}

?>
<div class="orderable-tip-checkout-block wc-block-components-totals-wrapper">
	<div class="wc-block-components-totals-item">
		<?php Orderable_Tip_Pro::add_tip_section(); ?>
	</div>
</div>
