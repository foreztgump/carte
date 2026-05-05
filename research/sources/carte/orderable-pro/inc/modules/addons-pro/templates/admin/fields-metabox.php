<div id="orderable-fields-app" data-fields="<?php echo wc_esc_json( $fields_json ); ?>" v-cloak>
	<div v-if="fields.length" class="orderable-addon-fields orderable-addon-fields--have-fields">
		<draggable v-model="fields" @start="drag=true" @end="drag=false" handle=".orderable-fields-row__header-drag">
			<div :class="{ 'orderable-fields-row': true, 'orderable-fields-row--open': field.open }" v-for="( field, index ) in fields">

				<!-- Header Starts -->
				<div class="orderable-fields-row__header">
					<span class="orderable-fields-row__header-drag dashicons dashicons-menu orderable-dashicons orderable-dashicons--menu"></span>
					<div class="orderable-fields-row__header-title" @click="field.open = ! field.open">
						<h3>{{field.title}}</h3>
						<div class="orderable-fields-row__header-title-sub">
							<span>ID: {{field.id}}</span>
						</div>
					</div>
					<div class="orderable-fields-row__header-action">
						<span class="dashicons dashicons-admin-page orderable-dashicons orderable-dashicons--admin-page" @click='duplicateField( index, field )'></span>
						<span class="dashicons dashicons-trash orderable-dashicons orderable-dashicons--trash" @click='deleteField( index )'></span>
					</div>
				</div>
				<!-- Header ends -->

				<!-- Body starts -->
				<div class="orderable-fields-row__body">
					<div class="orderable-fields-row__body-row">
						<div class="orderable-fields-row__body-row-left">
							<h3><?php esc_html_e( 'Type', 'orderable-pro' ); ?></h3>
							<p><?php esc_html_e( 'What type of field should this be?', 'orderable-pro' ); ?></p>
						</div>
						<div class="orderable-fields-row__body-row-right">
							<select v-model='field.type'>
								<option value="text"><?php esc_html_e( 'Text', 'orderable-pro' ); ?></option>
								<option value="select"><?php esc_html_e( 'Dropdown', 'orderable-pro' ); ?></option>
								<option value="visual_checkbox"><?php esc_html_e( 'Checkbox', 'orderable-pro' ); ?></option>
								<option value="visual_radio"><?php esc_html_e( 'Radio', 'orderable-pro' ); ?></option>
							</select>
						</div>
					</div>

					<!-- Title row -->
					<div class="orderable-fields-row__body-row">
						<div class="orderable-fields-row__body-row-left">
							<h3><?php esc_html_e( 'Title/Label', 'orderable-pro' ); ?></h3>
							<p><?php esc_html_e( 'The front-facing title/label for the field.', 'orderable-pro' ); ?></p>
						</div>
						<div 
							:class="{
								'orderable-fields-row__body-row-right': true, 
								'form-invalid form-required': ! field.title 
							}"
						>
							<input
								type="text"
								v-model="field.title"
								required
							>
						</div>
					</div>

					<!-- Description Row -->
					<div class="orderable-fields-row__body-row">
						<div class="orderable-fields-row__body-row-left">
							<h3><?php esc_html_e( 'Description', 'orderable-pro' ); ?></h3>
							<p><?php esc_html_e( 'The front-facing description of this field.', 'orderable-pro' ); ?></p>
						</div>
						<div class="orderable-fields-row__body-row-right">
							<textarea type="text" v-model="field.description"></textarea>
						</div>
					</div>

					<!-- Required row -->
					<div class="orderable-fields-row__body-row">
						<div class="orderable-fields-row__body-row-left">
							<h3><?php esc_html_e( 'Required', 'orderable-pro' ); ?></h3>
							<p><?php esc_html_e( 'Is this field required?', 'orderable-pro' ); ?></p>
						</div>
						<div class="orderable-fields-row__body-row-right">
							<input type='checkbox' v-model="field.required"></input>
						</div>
					</div>

					<!-- Maxumum allowed selection -->
					<div class="orderable-fields-row__body-row" v-if="'visual_checkbox'===field.type" >
						<div class="orderable-fields-row__body-row-left">
							<h3><?php esc_html_e( 'Maximum Allowed Selections', 'orderable-pro' ); ?></h3>
							<p><?php esc_html_e( 'Limit the number of selections a user can make.', 'orderable-pro' ); ?></p>
						</div>
						<div class="orderable-fields-row__body-row-right">
							<input type="number" min="0" v-model="field.max_allowed_selection">
						</div>
					</div>		

					<!-- Options row -->
					<div class="orderable-fields-row__body-row" v-if='field.type !== "text"'>
						<div class="orderable-fields-row__body-row-left">
							<h3><?php esc_html_e( 'Options', 'orderable-pro' ); ?></h3>
							<p><?php esc_html_e( 'Enter the options for the field. Add new options by clicking "Add Option".', 'orderable-pro' ); ?></p>
						</div>
						<div class="orderable-fields-row__body-row-right">
							<?php
								require Orderable_Helpers::get_template_path( 'admin/fields-options.php', 'addons-pro', true );
							?>
						</div>
					</div>

					<div class="orderable-fields-row__body-row" v-if='field.type === "text"'>
						<div class="orderable-fields-row__body-row-left">
							<h3><?php esc_html_e( 'Multi-Line', 'orderable-pro' ); ?></h3>
							<p><?php esc_html_e( 'Enable to allow the user to enter multiple lines of text.', 'orderable-pro' ); ?></p>
						</div>
						<div class="orderable-fields-row__body-row-right">
							<input type='checkbox' v-model="field.is_multiline"></input>
						</div>
					</div>

					<div class="orderable-fields-row__body-row" v-if='field.type === "text"'>
						<div class="orderable-fields-row__body-row-left">
							<h3><?php esc_html_e( 'Placeholder', 'orderable-pro' ); ?></h3>
							<p><?php esc_html_e( 'Placeholder for the field.', 'orderable-pro' ); ?></p>
						</div>
						<div class="orderable-fields-row__body-row-right">
							<input type='text' v-model="field.placeholder"></input>
						</div>
					</div>

					<div class="orderable-fields-row__body-row" v-if='field.type === "text"'>
						<div class="orderable-fields-row__body-row-left">
							<h3><?php esc_html_e( 'Default value', 'orderable-pro' ); ?></h3>
							<p><?php esc_html_e( 'Default value for the field.', 'orderable-pro' ); ?></p>
						</div>
						<div class="orderable-fields-row__body-row-right">
							<input type='text' v-model="field.default"></input>
						</div>
					</div>
				</div>
				<!-- Body ends -->
			</div> <!-- .orderable-fields-row -->
		</draggable>

		<button type="button" class="orderable-admin-button" @click.prevent="newField()"><?php esc_html_e( 'Add Field', 'orderable-pro' ); ?></button>
	</div> <!-- .orderable-fields__have-fields -->

	<div v-else class="orderable-addon-fields orderable-addon-fields--no-fields">
		<button type="button" class="orderable-admin-button" @click.prevent="newField()"><?php esc_html_e( 'Add Your First Field', 'orderable-pro' ); ?></button>
		<p><?php esc_html_e( 'Start adding product addon fields for your products.', 'orderable-pro' ); ?></p>
	</div>

	<input type="hidden" v-model='fieldsJson' name='orderable-addon-fields' />
</div> <!-- app -->
