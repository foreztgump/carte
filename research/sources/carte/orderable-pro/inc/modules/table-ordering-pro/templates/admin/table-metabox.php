<?php
/**
 * Table Metabox Template.
 *
 * This template can be overridden by copying it to yourtheme/orderable/table-ordering-pro/table-metabox.php
 *
 * HOWEVER, on occasion Orderable will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @package Orderable_Pro/Templates
 *
 * @var Orderable_Table_Ordering_Pro_Table $table Table instance.
 */

defined( 'ABSPATH' ) || exit; ?>

<div class="orderable-fields-row orderable-fields-row--meta">
	<div class="orderable-fields-row__body">

		<div class="orderable-fields-row__body-row">
			<div class="orderable-fields-row__body-row-left">
				<h3>
					<label for="orderable_table_id"><?php esc_html_e( 'Table ID', 'orderable' ); ?></label>
				</h3>
				<p><?php esc_html_e( 'Enter an ID for this table. One will be automatically generated if left blank.', 'orderable-pro' ); ?></p>
			</div>
			<div class="orderable-fields-row__body-row-right">
				<?php
				// Table ID.
				woocommerce_wp_text_input(
					array(
						'id'    => 'orderable_post_name',
						'name'  => 'post_name',
						'class' => '',
						'label' => '',
						'value' => $table->get_table_id(),
					)
				);
				?>
			</div>
		</div>

		<div class="orderable-fields-row__body-row">
			<div class="orderable-fields-row__body-row-left">
				<h3>
					<label for="orderable_base_url"><?php esc_html_e( 'URL', 'orderable-pro' ); ?></label>
				</h3>
				<p><?php esc_html_e( 'Enter a URL for where the QR code should direct your customers to. The table number will be added and tracked automatically.', 'orderable-pro' ); ?></p>
			</div>
			<div class="orderable-fields-row__body-row-right">
				<?php
				// Base URL.
				woocommerce_wp_text_input(
					array(
						'id'    => 'orderable_base_url',
						'name'  => 'orderable_base_url',
						'class' => '',
						'label' => '',
						'value' => $table->get_meta_base_url(),
						'type'  => 'url',
					)
				);
				?>
			</div>
		</div>

	</div>
</div>
