<div class="orderable-fields-options">
	<div class="orderable-fields-options__body">
		<draggable v-model="field.options" handle=".orderable-fields-options__row-handle">
			<div class="orderable-fields-options__row" v-for="( option, optionIndex ) in field.options" :class="'select' === field.type && 'orderable-fields-options__grid--select'">
				<div class="orderable-fields-options__row-drag">
					<span class="orderable-fields-options__row-handle dashicons dashicons-menu orderable-dashicons orderable-dashicons--menu"></span>
				</div>
				<div class="orderable-fields-options__row-fields">

					<div class="orderable-fields-options__row-fields-row">
						<div class="orderable-fields-options__row-field orderable-fields-options__row-label" :class="'select' === field.type && 'orderable-fields-options__row-field--full'">
							<label for="" class="orderable-fields-options__row-field-label"><?php esc_html_e( 'Label', 'orderable-pro' ); ?></label>
							<input type="text" v-model='option.label'>
						</div>
						<div class="orderable-fields-options__row-field orderable-fields-options__row-field--visual" v-show="'select' != field.type">
							<div class="orderable-fields-options__row-type">
								<label for="" class="orderable-fields-options__row-field-label"><?php esc_html_e( 'Visual', 'orderable-pro' ); ?></label>
								<select v-model='option.visual_type'>
									<option value="none"><?php esc_html_e( 'None', 'orderable-pro' ); ?></option>
									<option value="image"><?php esc_html_e( 'Image', 'orderable-pro' ); ?></option>
									<option value="color"><?php esc_html_e( 'Color', 'orderable-pro' ); ?></option>
								</select>
							</div>
							<div class="orderable-fields-options__row-visual" v-show="'select' != field.type">
								<div class='orderable-fields-options__row-visual-image' v-if='"image" === option.visual_type'>
									<div class="orderable-fields-option-img">
										<div v-if="option.image" class="orderable-fields-option-img__img-wrapper">
											<img class="orderable-fields-option-img__img" :src="option.image.thumbnail">
											<span class="dashicons dashicons-trash orderable-dashicons orderable-dashicons--trash orderable-fields-option-img__delete" @click="removeImage(option)"></span>
										</div>
										<span v-else class="dashicons dashicons-format-image orderable-dashicons orderable-dashicons--format-image orderable-fields-option-img__dummy" @click='addImage(option)'></span>
									</div>
								</div>
								<div class='orderable-fields-options__row-visual-color' v-else-if='"color" === option.visual_type'>
									<input class="orderable-fields-option-color" type="color" v-model='option.color' />
								</div>
								<div class='orderable-fields-options__row-visual-color' v-else>
									<span class="orderable-fields-option__empty"></span>
								</div>
							</div>
						</div>
					</div>

					<div class="orderable-fields-options__row-fields-row">
						<div class="orderable-fields-options__row-field orderable-fields-options__row-price">
							<label for="" class="orderable-fields-options__row-field-label"><?php esc_html_e( 'Price', 'orderable-pro' ); ?></label>
							<input type="number" step="0.01" v-model="option.price">
						</div>

						<?php
							/**
							 * Fires after price field on the Edit Product Addon page.
							 *
							 * @since 1.11.0
							 * @hook orderable_after_product_addons_price_field
							 */
							do_action( 'orderable_after_product_addons_price_field' );
						?>

						<div class="orderable-fields-options__row-field orderable-fields-options__row-selected">
							<label for="" class="orderable-fields-options__row-field-label"><?php esc_html_e( 'Selected', 'orderable-pro' ); ?></label>
							<div class="orderable-fields-options__row-field-spacer">
								<input :type="selected_input_type(field)" :name="'orderable_field_' + field.id" value="1" v-model="option.selected" @change='deselectOtherRadio( option, optionIndex, field )'>
							</div>
						</div>
					</div>

				</div>
				<div class="orderable-fields-options__row-action">
					<span class="dashicons dashicons-trash orderable-dashicons orderable-dashicons--trash" @click='deleteOption(optionIndex, field)'></span>
				</div>
			</div>
		</draggable>
	</div> <!-- .orderable-fields-options__body -->

	<div class="orderable-fields-options__btn_wrap">
		<button type="button" class="orderable-admin-button" @click='addOption( field, index )'><?php esc_html_e( 'Add Option', 'orderable-pro' ); ?></button>
	</div>

</div>
