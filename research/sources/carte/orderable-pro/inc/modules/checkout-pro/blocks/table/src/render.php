<?php
/**
 * Render Table block.
 *
 * @package orderable-pro
 */

if ( ! class_exists( 'Orderable_Table_Ordering_Pro' ) ) {
	return;
}

$table = Orderable_Table_Ordering_Pro::get_table_from_cookie();

if ( ! $table ) {
	return;
}

?>

<div class="orderable-table-checkout-block wc-block-components-totals-wrapper">
	<div class="wc-block-components-totals-item">
		<span class="wc-block-components-totals-item__label">
			<?php echo esc_html__( 'Table', 'orderable-pro' ); ?>
		</span>
		<span class="wc-block-components-totals-item__value">
			<?php echo esc_html( $table->get_title() ); ?>
		</span>
	</div>
</div>
