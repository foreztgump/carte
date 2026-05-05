<?php
/**
 * Template to display the HTML for Timed Products conditions meta box.
 *
 * @package Orderable_Pro
 */

?>
<div id="orderable-timed-products-app" v-cloak data-rules="<?php echo wc_esc_json( $rules_json ); ?>">

	<div class="orderable-fields-row orderable-fields-row--meta">
		<div class="orderable-fields-row__body">

			<!-- Action row  -->
			<div class="orderable-fields-row__body-row">
				<div class="orderable-fields-row__body-row-left">
					<h3><?php esc_html_e( 'Action', 'orderable-pro' ); ?></h3>
					<p><?php esc_html_e( 'Whether to show or hide product when these conditions are met.', 'orderable-pro' ); ?></p>	
				</div>
				<div class="orderable-fields-row__body-row-right">
					<select v-model='action'>
						<option value='set_visible'><?php esc_html_e( 'Set Visible', 'orderable-pro' ); ?></option>
						<option value='set_hidden'><?php esc_html_e( 'Set Hidden', 'orderable-pro' ); ?></option>
					</select>
				</div>
			</div>

			<!-- Rules row -->
			<div class="orderable-fields-row__body-row">
				<div class="orderable-fields-row__body-row-left">
					<h3><?php esc_html_e( 'Timed Product Rules', 'orderable-pro' ); ?></h3>
					<p><?php esc_html_e( 'Add a set of rules to determine the timing for products.', 'orderable-pro' ); ?></p>
				</div>
				<div class="orderable-fields-row__body-row-right" :class="{ 'orderable-fields-row__body-row-right--empty': ! rules.length }">
					<div class="orderable-time-conditions" v-if="rules.length">
						<div class="orderable-time-conditions__row" v-for="( rule, ruleIndex ) in rules" ref='conditionRows'>
							<div>
								<select v-model='rule.date_condition'>
									<option value="on_date"><?php esc_html_e( 'On date', 'orderable-pro' ); ?></option>
									<option value="before_date"><?php esc_html_e( 'Before Date', 'orderable-pro' ); ?></option>
									<option value="after_date"><?php esc_html_e( 'After Date', 'orderable-pro' ); ?></option>
									<option value="date_range"><?php esc_html_e( 'Date Range', 'orderable-pro' ); ?></option>
									<option value="day_of_week"><?php esc_html_e( 'Day of the Week', 'orderable-pro' ); ?></option>
									<option value="time_range"><?php esc_html_e( 'Time Range', 'orderable-pro' ); ?></option>
								</select>

								<date-picker 
									v-model="rule.date_from" 
									type="date" 
									:placeholder="fromPlaceholder( rule )"
									value-type="format" 
									format="YYYY-MM-DD" 
									v-if=' [ "date_range", "after_date", "on_date" ].includes( rule.date_condition ) '>
								</date-picker>

								<date-picker 
									v-model="rule.date_to"
									:placeholder="i18n.to"
									type="date"
									value-type="format"
									format="YYYY-MM-DD" 
									v-if=' [ "date_range", "before_date" ].includes( rule.date_condition )'
									v-tooltip.bottom="{
										content: i18n.date_validation,
										show: rule.date_from && rule.date_to && 'date_range' == rule.date_condition && ( new Date( rule.date_to ) <= new Date( rule.date_from ) ),
										trigger: 'manual',
									}"
									>
								</date-picker>

								<orderable-multiselect v-if='[ "day_of_week" ].includes( rule.date_condition )' :days='rule.days' :idx="ruleIndex"  @day_changed="dayChanged"></orderable-multiselect>

								<date-picker
									v-model="rule.time_from"
									v-if='"time_range" == rule.date_condition'
									:time-picker-options="{
										start: '00:00',
										step: '00:30',
										end: '23:30',
									}"
									format="HH:mm"
									value-type="format"
									:use12h="true"
									type="time"
									:placeholder="i18n.from"
									>
								</date-picker>

								<date-picker
									v-model="rule.time_to"
									v-if='"time_range" == rule.date_condition'
									:time-picker-options="{
										start: '00:00',
										step: '00:30',
										end: '23:30',
									}"
									format="HH:mm"
									value-type="format"
									type="time"
									:placeholder="i18n.to"
									:use12h="true"
									v-tooltip.bottom="{
										content: i18n.time_validation,
										show: rule.time_to && rule.time_from && ( rule.time_to <= rule.time_from ),
										trigger: 'manual',
									}"
									>
								</date-picker>
							</div>

							<div class="orderable-time-conditions__row__and_label"><?php esc_html_e( 'and', 'orderable-pro' ); ?></div>

							<div class="orderable-conditions__row-item orderable-conditions__row-item--action">
								<span class="dashicons dashicons-trash orderable-dashicons orderable-dashicons--trash" @click='deleteCondition( ruleIndex )'></span>
							</div>
						</div>

						<button type='button' @click='addRule' class='orderable-admin-button orderable-conditions__or-button'><?php esc_html_e( 'Add Time', 'orderable-pro' ); ?></button>
					</div>
					<div v-else class="orderable-fields-row orderable-fields-row--meta orderable-fields-row--empty">
						<button type="button" @click="addRule" class="orderable-admin-button"><?php esc_html_e( 'Add Your First Rule', 'orderable-pro' ); ?></button>
					</div>
				</div>
			</div>
			<!-- Rules row ends -->

			<div class="orderable-fields-row__body-row">
				<div class="orderable-fields-row__body-row-left">
					<h3><?php esc_html_e( 'Current Date/Time', 'orderable-pro' ); ?></h3>
					<p><?php esc_html_e( 'The current date and time of your store.', 'orderable-pro' ); ?></p>
				</div>
				<div class="orderable-fields-row__body-row-right">
					<code style="margin: 0 10px 0 0; border-radius: 4px;"><?php echo esc_html( date_i18n( 'l, j F Y' ) ); ?></code>
					<code style="margin: 0 10px 0 0; border-radius: 4px;"><?php echo esc_html( date_i18n( 'G:i' ) ); ?></code>
					<a href="<?php echo esc_url( admin_url( 'options-general.php#timezone_string' ) ); ?>" target="_blank"><?php esc_html_e( 'Date/time settings', 'orderable-pro' ); ?></a>
				</div>
			</div>
		</div> <!-- orderable-fields-row__body -->
	</div> <!-- orderable-fields-row -->

	<input type="hidden" v-model="rulesJson" name='orderable-timed-products-conditions'>
</div>
