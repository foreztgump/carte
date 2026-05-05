<?php
/**
 * Template to display the HTML for Custom status setting meta box.
 *
 * @package Orderable_Pro
 */

?>
<div id="orderable-custom-status-settings" class='orderable-custom-status-settings'>

	<div class="orderable-fields-row orderable-fields-row--meta">
		<div class="orderable-fields-row__body">

			<!-- Enable/Disable row -->
			<div class="orderable-fields-row__body-row">
				<div class="orderable-fields-row__body-row-left">
					<h3><?php echo esc_html_x( 'Enabled', 'custom order status', 'orderable-pro' ); ?></h3>
					<p><?php echo esc_html_x( 'Whether to enable or disable this status. You can choose to disable the core order statuses too.', 'custom order status', 'orderable-pro' ); ?></p>
				</div>
				<div class="orderable-fields-row__body-row-right">
					<input type="checkbox" <?php checked( $settings['enable'], '1', true ); ?> id='orderable_cos_enable' name='orderable_cos_enable' value='1' >
				</div>
			</div>		

			<!-- Action row  -->
			<div class="orderable-fields-row__body-row">
				<div class="orderable-fields-row__body-row-left">
					<h3><?php echo esc_html_x( 'Status Type', 'custom order status', 'orderable-pro' ); ?></h3>
					<p><?php echo esc_html_x( 'Select a type for your status. You can modify a core order status or create a new custom order status.', 'custom order status', 'orderable-pro' ); ?></p>	
				</div>
				<div class="orderable-fields-row__body-row-right">
					<select name='orderable_cos_status_type' required id='orderable_cos_status_type' <?php echo ! empty( $settings['status_type'] ) ? 'disabled' : ''; ?>>
						<option value="custom" <?php selected( $settings['status_type'], 'custom' ); ?>><?php echo esc_html_x( 'Custom', 'custom order status', 'orderable-pro' ); ?></option>
						<?php
						foreach ( $core_statuses as $status_slug => $status_name ) {
							$selected = selected( $status_slug, $settings['status_type'], false );
							printf( "<option value='%s' %s>%s</option>", esc_attr( $status_slug ), esc_attr( $selected ), esc_html( $status_name ) );
						}
						?>
					</select>
				</div>
			</div>

			<!-- Slug row  -->
			<div class="orderable-fields-row__body-row">
				<div class="orderable-fields-row__body-row-left">
					<h3><?php echo esc_html_x( 'Slug', 'custom order status', 'orderable-pro' ); ?></h3>
					<p><?php echo esc_html_x( 'Slug is used for identifying the order status internally.', 'custom order status', 'orderable-pro' ); ?></p>	
					<p><?php echo esc_html_x( 'Max length: 17 characters.', 'custom order status', 'orderable-pro' ); ?></p>	
				</div>
				<div class="orderable-fields-row__body-row-right orderable-fields-row__body-row-right--slug">
					<input
						type="text"
						name='orderable_cos_slug'
						id='orderable_cos_slug'
						maxlength="17"
						value="<?php echo esc_attr( $settings['slug'] ); ?>"
						<?php echo esc_attr( $readonly_fields ); ?>
					/>
					<p class='orderable-field-error-message'></p>
				</div>
			</div>

			<!-- Color row  -->
			<div class="orderable-fields-row__body-row">
				<div class="orderable-fields-row__body-row-left">
					<h3><?php echo esc_html_x( 'Color', 'custom order status', 'orderable-pro' ); ?></h3>
					<p><?php echo esc_html_x( 'Select color to represent this order status.', 'custom order status', 'orderable-pro' ); ?></p>	
				</div>
				<div class="orderable-fields-row__body-row-right">
					<input type="text" name='orderable_cos_color' id='orderable_cos_color' value='<?php echo esc_attr( $settings['color'] ); ?>' data-default-color='#2271b1'>
				</div>
			</div>

			<!-- Icon row  -->
			<div class="orderable-fields-row__body-row orderable-fields-row__body-row--cos-icon">
				<div class="orderable-fields-row__body-row-left">
					<h3><?php echo esc_html_x( 'Icon', 'custom order status', 'orderable-pro' ); ?></h3>
					<p><?php echo esc_html_x( 'Select the icon.', 'custom order status', 'orderable-pro' ); ?></p>
				</div>
				<div class="orderable-fields-row__body-row-right">
						<!-- name="orderable_cos_icon" -->
						<?php Orderable_Custom_Order_Status_Pro_Icons::print_icons_field( $settings['icon'], $settings['icon_family'] ); ?>
				</div>
			</div>

			<!-- Next step row  -->
			<div class="orderable-fields-row__body-row orderable-fields-row__body-row--cos-nextstep">
				<div class="orderable-fields-row__body-row-left">
					<h3><?php echo esc_html_x( 'Next steps', 'orderable-pro' ); ?></h3>
					<p><?php echo esc_html_x( 'These statuses will display in the quick actions on the order page for orders with this order status.', 'custom order status', 'orderable-pro' ); ?></p>
				</div>
				<div class="orderable-fields-row__body-row-right">
					<select name="orderable_cos_nextstep[]" id="orderable_cos_nextstep" multiple>
						<?php
						foreach ( $all_statuses as $status_slug => $status_name ) {
							$selected = in_array( $status_slug, (array) $settings['nextstep'], true ) ? 'selected' : '';
							printf( "<option value='%s' %s>%s</option>", esc_attr( $status_slug ), esc_attr( $selected ), esc_html( $status_name ) );
						}
						?>
					</select>
				</div>
			</div>

			<!-- Include in reports  -->
			<div class="orderable-fields-row__body-row orderable-fields-row__body-row--include-reports">
				<div class="orderable-fields-row__body-row-left">
					<h3><?php echo esc_html_x( 'Include in reports', 'custom order status', 'orderable-pro' ); ?></h3>
					<p><?php echo esc_html_x( 'Whether to include the orders with this order status in the reports.', 'custom order status', 'orderable-pro' ); ?></p>
				</div>
				<div class="orderable-fields-row__body-row-right">
					<input type="checkbox" name='orderable_cos_include_in_reports' id='orderable_cos_include_in_reports' value='1' <?php checked( $settings['include_in_reports'], '1' ); ?>>
				</div>
			</div>
		</div>
	</div>
</div>
