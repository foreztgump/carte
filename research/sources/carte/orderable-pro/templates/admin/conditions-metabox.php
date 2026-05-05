<div id="orderable-conditions-app" data-rules="<?php echo wc_esc_json( $conditions_json ); ?>" v-cloak>
	<div class="orderable-fields-row orderable-fields-row--meta" v-if="rules.length">
		<div class="orderable-fields-row__body">
			<div class="orderable-fields-row__body-row">
				<div class="orderable-fields-row__body-row-left">
					<h3><?php esc_html_e( 'Rules', 'orderable-pro' ); ?></h3>
					<p><?php echo esc_html( $messages['rules_description'] ); ?></p>
				</div>
				<div class="orderable-fields-row__body-row-right">
					<div class="orderable-conditions">
						<div class="orderable-conditions__row orderable-conditions__row--or" v-for="( orRule, orIndex ) in rules">
							<div v-if='0 != orIndex' class='orderable-conditions__row-label orderable-conditions__row-label--or'><?php esc_html_e( 'or', 'orderable-pro' ); ?></div>

							<div class="orderable-conditions__row orderable-conditions__row--and" v-for="( andRule, andIndex ) in orRule">
								<div class="orderable-conditions__row-item orderable-conditions__row-item--object-type">
									<select v-model='andRule.objectType' @change='resetConditions(andRule, orRule)'>
										<option value="product"><?php esc_html_e( 'Product', 'orderable-pro' ); ?></option>
										<option value="product_category"><?php esc_html_e( 'Product Category', 'orderable-pro' ); ?></option>
									</select>
								</div>
								<div class="orderable-conditions__row-item orderable-conditions__row-item--operator">
									<select v-model='andRule.operator' @change='resetConditions'>
										<option value="is_equal_to"><?php esc_html_e( 'Is equal to', 'orderable-pro' ); ?></option>
										<option value="not_equal_to"><?php esc_html_e( 'Is not equal to', 'orderable-pro' ); ?></option>
									</select>
								</div>
								<div class="orderable-conditions__row-item orderable-conditions__row-item--object">
									<v-select :placeholder="objectPlaceholder( andRule )" @search="fetchOptions" :options="conditionOptions" :filterable="false" v-model="andRule.objects">
										<template slot="no-options">
											<?php esc_html_e( 'Type to search...', 'orderable-pro' ); ?>
										</template>
									</v-select>
								</div>
								<div class="orderable-conditions__row-item orderable-conditions__row-item--action">
									<span class="dashicons dashicons-trash orderable-dashicons orderable-dashicons--trash" @click='deleteCondition( orIndex, andIndex )'></span>
								</div>
							</div>

							<!-- <button type='button' @click='addAndRule( orRule )' class='orderable-admin-button orderable-conditions__and-button'><?php esc_html_e( 'Add Rule', 'orderable-pro' ); ?></button> -->
						</div>

						<div class='orderable-conditions__row-label orderable-conditions__row-label--or'><?php esc_html_e( 'or', 'orderable-pro' ); ?></div>

						<button type='button' @click='addOrRule' class='orderable-admin-button orderable-conditions__or-button'><?php esc_html_e( 'Add Rule Group', 'orderable-pro' ); ?></button>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div v-else class="orderable-fields-row orderable-fields-row--meta orderable-fields-row--empty">
		<button type="button" @click="addOrRule" class="orderable-admin-button"><?php esc_html_e( 'Add Your First Rule', 'orderable-pro' ); ?></button>
		<p><?php echo esc_html( $messages['no_condition'] ); ?></p>
	</div>

	<input type="hidden" v-model="conditionJson" name='orderable-pro-conditions'>
</div>
