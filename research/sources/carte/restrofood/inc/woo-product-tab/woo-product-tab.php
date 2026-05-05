<?php
namespace RestroFood;
/**
 *
 * @package     Restrofood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 *
 */

class Woo_Product_Tab{

	public $getText;

	function __construct() {

		$this->getText = \Restrofood\Inc\Text::getText();

		add_action( 'admin_enqueue_scripts', [ $this, 'restrofood_admin_scripts' ] );
		add_filter( 'woocommerce_product_data_tabs', [ $this, 'restrofood_custom_product_data_tab' ] );
		add_action( 'admin_head', [ $this, 'restrofood_woo_product_tab_custom_style' ] );
		add_action('woocommerce_product_data_panels', [ $this, 'restrofood_custom_product_data_fields' ] );
		add_action( 'woocommerce_process_product_meta', [ $this, 'restrofood_save_proddata_custom_fields' ]  );
	}

	public function restrofood_admin_scripts() {
		$getText = $this->getText;

		wp_enqueue_style( 'restrofood-woo-admin', plugin_dir_url( __FILE__ ).'css/woo-admin.css' , array(), '1.0.0', 'all' );
		wp_enqueue_script( 'restrofood-woo-admin', plugin_dir_url( __FILE__ ) .'js/woo-admin.js', array('jquery'), '1.0.0', true );

		wp_localize_script(
        'restrofood-woo-admin', 
        'restrofoodwooobj', 
        array(
        	'get_text' => $getText
        )
    	);
		
	}

	// First Register the Tab by hooking into the 'woocommerce_product_data_tabs' filter
	public function restrofood_custom_product_data_tab( $product_data_tabs ) {
		$getText = $this->getText;

	    $product_data_tabs['restrofood-flash-sale-tab'] = array(
	        'label' 	=> $getText['set_flash_sale'],
	        'target' 	=> 'restrofood_flash_sale_data',
	        'class'     => array( 'show_if_simple', 'show_if_variable' ),
	    );
	    $product_data_tabs['restrofood-custom-tab'] = array(
	        'label' 	=> $getText['add_features'],
	        'target' 	=> 'restrofood_custom_product_data',
	        'class'     => array( 'show_if_simple', 'show_if_variable' ),
	    );

	    $product_data_tabs['restrofood-custom-tab-nutrition-information'] = array(
	        'label' 	=> esc_html__( 'Add Nutrition', 'restrofood' ),
	        'target' 	=> 'restrofood_custom_product_nutrition_data',
	        'class'     => array( 'show_if_simple', 'show_if_variable' ),
	    );

	    return $product_data_tabs;
	}

	/** CSS To Add Custom tab Icon */
	public function restrofood_woo_product_tab_custom_style() {?>
	<style>
	#woocommerce-product-data ul.wc-tabs li.restrofood-custom-tab_options a:before { font-family: WooCommerce; content: '\e006'; }
	</style>
	<?php 
	}

	// functions you can call to output text boxes, select boxes, etc.

	public function restrofood_custom_product_data_fields() {
		$getText = $this->getText;

	    global $thepostid, $post;

	    $data = get_post_meta( $thepostid, '_extra_featured', true );
	    $decodedData = json_decode( $data, true );

	    // Note the 'id' attribute needs to match the 'target' parameter set above
	    ?> 
	    <div id="restrofood_custom_product_data" class="panel woocommerce_options_panel" > 
		    <div class = 'options_group'>
				<div class="restrofood-extra-featured">
					<div class="restrofood-extra-featured-inner">
						<?php
						if( !empty( $decodedData ) ):
							foreach ( $decodedData as $key => $value ):
								
							$checkValue = !empty( $value['list_type'] ) ? $value['list_type'] : '';
							$requiredNumber = !empty( $value['group_required_number'] ) ? $value['group_required_number'] : '';
							$requiredNumberMax = !empty( $value['group_required_number_max'] ) ? $value['group_required_number_max'] : '';

						?>
						<div class="restrofood-fields-group" data-count="<?php echo esc_attr( $key ); ?>">
							<div class="group-title-wrapper group-title-wrapper-list-type form-field">
								<label><?php echo esc_html( $getText['list_type'] ); ?></label>
								<div class="group-title-wrapper-list-type-inner">
									<div>
										<span><?php echo esc_html( $getText['checkbox'] ); ?></span>
										<input type="radio" name="extra_featured[<?php echo esc_attr( $key ); ?>][list_type]" value="checkbox" class="group-title featured-list-type" <?php echo checked( $checkValue, 'checkbox' ); echo !empty( $checkValue ) ? '' : 'checked'; ?>  />
									</div>
									<div>
										<span><?php echo esc_html( $getText['radio'] ); ?></span>
										<input type="radio" name="extra_featured[<?php echo esc_attr( $key ); ?>][list_type]" value="radio" class="group-title featured-list-type" <?php echo checked( $checkValue, 'radio' ); ?> />
									</div>
								</div>
							</div>
							<p class="group-title-wrapper form-field">
								<label><?php echo esc_html( $getText['feature_section_title'] ); ?></label>
								<input type="text" name="extra_featured[<?php echo esc_attr( $key ); ?>][group_title]" value="<?php echo esc_html( $value['group_title'] ); ?>" class="group-title" />
							</p>
							<p class="group-title-wrapper form-field">
								<label><?php echo esc_html( $getText['min_required_number'] ); ?></label>
								<input type="number" name="extra_featured[<?php echo esc_attr( $key ); ?>][group_required_number]" value="<?php echo esc_html( $requiredNumber ); ?>" class="group-title" />
							</p>
							<p class="group-title-wrapper restrofood-required-number-max form-field">
								<label><?php echo esc_html( $getText['max_required_number'] ); ?></label>
								<input type="number" name="extra_featured[<?php echo esc_attr( $key ); ?>][group_required_number_max]" value="<?php echo esc_html( $requiredNumberMax ); ?>" class="group-title" />
							</p>
							<div class="field-repeater-wrapper">
								<div class="field-repeater-inner">
								<?php
								if( !empty( $value['group_feature'] ) ):
									foreach ( $value['group_feature'] as $ckey => $value ):
								?>
									<div data-child-count="<?php echo esc_attr( $ckey ); ?>" class="field-repeater">
										<input type="text" name="extra_featured[<?php echo esc_attr( $key ); ?>][group_feature][<?php echo esc_attr( $ckey ); ?>][title]" placeholder="<?php echo esc_html( $getText['frature_title'] ); ?>" value="<?php echo esc_html( $value['title'] ); ?>" class="group-title" />
										<input type="text" name="extra_featured[<?php echo esc_attr( $key ); ?>][group_feature][<?php echo esc_attr( $ckey ); ?>][price]" placeholder="<?php echo esc_html( $getText['price'] ); ?>" value="<?php echo esc_html( $value['price'] ); ?>" class="group-title wc_input_price" />
										<span class="remove-repeater-field fb-btn"><?php echo esc_html( $getText['remove'] ); ?></span>
									</div>
								<?php 
									endforeach;
								endif;
								?>
								</div>
								<button class="add-repeater-field fb-btn fb-btn-margin-top fb-btn-margin-top fb-btn-margin-bottom"><?php echo esc_html( $getText['add'] ); ?></button>
							</div>
							<span class="remove-group fb-btn fb-btn-margin-top fb-btn-margin-top"><?php echo esc_html( $getText['remove_group'] ); ?></span>
						</div>
						<?php 
							endforeach;
						endif;
						?>
					</div>
					<span class="add-group fb-btn"><?php echo esc_html( $getText['add_group'] ); ?></span>
				</div>
		    </div>
	    </div>

	    <?php
	    // product Flash sale
	    $this->restrofood_product_meta_field();
	    // product nutrition html
	    $this->restrofood_product_nutrition_data_field();

	}

	public function restrofood_product_meta_field() {
		$getText = $this->getText;
		global $thepostid, $post;

		$visibilityTime = get_option('restrofood_options');

	    $data = get_post_meta( $thepostid, '_set_flash_sale', true );
	    $preparingTime = get_post_meta( $thepostid, '_resf_preparing_time', true );
	    $preparingTimeText = get_post_meta( $thepostid, '_resf_preparing_time_text', true );
	    $deliveryTime = get_post_meta( $thepostid, '_resf_delivery_time', true );
	    $deliveryTimeText = get_post_meta( $thepostid, '_resf_delivery_time_text', true );
   

		?>
		<div id="restrofood_flash_sale_data" class="panel woocommerce_options_panel">
		    <div class="options_group">
				<p class="form-field">
					<label for="show_in_flash_sale"><?php esc_html_e( 'Show In Flash Sale', 'restrofood' ); ?></label>
					<input type="checkbox" class="checkbox" <?php echo checked( $data, 'yes' ); ?> name="show_in_flash_sale" id="show_in_flash_sale" value="yes">
					<span class="description"><?php esc_html_e( 'Enable this option to allow this product to show flash sale section', 'restrofood' ); ?></span>
				</p>
				<p class="form-field">
					<label><?php esc_html_e( 'Set Preparing time', 'restrofood' ); ?></label>
					<input type="text" name="resf_preparing_time" value="<?php echo esc_html( $preparingTime ); ?>" placeholder="e.g., 35MIN">
					<span class="description"></span>
				</p>
				<p class="form-field">
					<label><?php esc_html_e( 'Set Preparing time tool tip text', 'restrofood' ); ?></label>
					<input type="text" name="resf_preparing_time_text" value="<?php echo esc_html( $preparingTimeText ); ?>" placeholder="e.g., Preparing time">
					<span class="description"></span>
				</p>
				<p class="form-field">
					<label><?php esc_html_e( 'Set Delivery time', 'restrofood' ); ?></label>
					<input type="text" name="resf_delivery_time" value="<?php echo esc_html( $deliveryTime ); ?>" placeholder="e.g., 35MIN">
					<span class="description"></span>
				</p>
				<p class="form-field">
					<label><?php esc_html_e( 'Set Delivery time tool tip text', 'restrofood' ); ?></label>
					<input type="text" name="resf_delivery_time_text" value="<?php echo esc_html( $deliveryTimeText ); ?>" placeholder="e.g., Delivery time">
					<span class="description"></span>
				</p>	
			</div>
	    </div>
		<?php
	}
	public function restrofood_product_nutrition_data_field() {
		$getText = $this->getText;
		global $thepostid, $post;

	    $data = get_post_meta( $thepostid, '_nutrition_information', true );
	    $decodedData = json_decode( $data, true );
		?>
		<div id="restrofood_custom_product_nutrition_data" class="panel woocommerce_options_panel">
	    	<div class="options_group">
	    		<div class="field-repeater-wrapper restrofood-extra-featured ">
					<div class="field-repeater-inner nutrition-field-repeater-inner restrofood-fields-group">
					<?php
					if( !empty( $decodedData ) ):
						foreach ( $decodedData as $key => $value ):
					?>
						<div class="field-repeater nutrition-repeater-field">
							<input type="text" name="nutrition_information[<?php echo esc_attr( $key ); ?>][title]" placeholder="<?php echo esc_html( $getText['nutrition_title'] ); ?>" value="<?php echo esc_html( $value['title'] ); ?>" class="group-title" />
							<input type="text" name="nutrition_information[<?php echo esc_attr( $key ); ?>][quantity]" placeholder="<?php echo esc_html( $getText['quantity'] ); ?>" value="<?php echo esc_html( $value['quantity'] ); ?>" class="group-title" />
							<span class="remove-repeater-field fb-btn"><?php echo esc_html( $getText['remove'] ); ?></span>
						</div>
					<?php 
						endforeach;
					endif;
					?>
					</div>
					<button class="add-nutrition-repeater-field fb-btn fb-btn-margin-top fb-btn-margin-top fb-btn-margin-bottom"><?php echo esc_html( $getText['add'] ); ?></button>
				</div>
	    	</div>
	    </div>
		<?php
	}

	/** Hook callback function to save custom fields information */
	public function restrofood_save_proddata_custom_fields( $post_id ) {
	    
	    // Save Text Field
	    if (!empty( $_POST['extra_featured'] )) {
	    	$featured = json_encode( $_POST['extra_featured'], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES );
	    	update_post_meta ( $post_id, '_extra_featured',  $featured );
	    } else {
	    	update_post_meta ( $post_id, '_extra_featured',  '' );
	    }
	    // Save flash sale  
	    if (!empty( $_POST['show_in_flash_sale'] )) {
	    	update_post_meta ( $post_id, '_set_flash_sale', sanitize_text_field( $_POST['show_in_flash_sale'] ) );
	    } else {
	    	update_post_meta ( $post_id, '_set_flash_sale',  '' );
	    }
	    
	    // Save Nutrition
	    if ( !empty( $_POST['nutrition_information'] ) ) {
	    	$info = json_encode( $_POST['nutrition_information'], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES );
	    	update_post_meta ( $post_id, '_nutrition_information',  $info );
	    } else {
	    	update_post_meta ( $post_id, '_nutrition_information',  '' );
	    }

	    // Preparing time and delivery time
		$pTime = $ptext = $dTime = $dtext = '';

	    if ( !empty( $_POST['resf_preparing_time'] ) ) {
	    	$pTime = $_POST['resf_preparing_time'];
	    }

	    if ( !empty( $_POST['resf_preparing_time_text'] ) ) {
	    	$ptext = $_POST['resf_preparing_time_text'];
	    }

	    if ( !empty( $_POST['resf_delivery_time'] ) ) {
	    	$dTime = $_POST['resf_delivery_time'];
	    }

	    if ( !empty( $_POST['resf_delivery_time_text'] ) ) {
	    	$dtext = $_POST['resf_delivery_time_text'];
	    }

	    update_post_meta ( $post_id, '_resf_preparing_time',  sanitize_text_field($pTime) );
	    update_post_meta ( $post_id, '_resf_preparing_time_text',  sanitize_text_field($ptext) );
	    update_post_meta ( $post_id, '_resf_delivery_time',  sanitize_text_field($dTime) );
	    update_post_meta ( $post_id, '_resf_delivery_time_text',  sanitize_text_field($dtext) );


	}

}

new Woo_Product_Tab();