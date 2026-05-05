<?php 
namespace RestroFood\Admin\Field;
 /**
  * 
  * @package    RestroFood 
  * @since      3.0.0
  * @version    3.0.0
  * @author     ThemeLooks
  * @Websites:  http://themelooks.com/
  *
  */

trait Product_Visibility_Time {

	protected static $args;

	public function product_visibility_time( $args ) {

		$default = [
			'title' => '',
			'name'	=> '',
			'description'	=> '',
			'class'			=> '',
			'condition'		=> '',
		];

		self::$args = wp_parse_args( $args, $default );
		self::product_visibility_time_markup();
	}

	protected static function product_visibility_time_markup() {

		$optionName = self::$optionName;
	    $args 		= self::$args;
	    $getData 	= self::$getOptionData;
	    $fieldName  = $args['name'];
	    $value 		= !empty( $getData[$fieldName] ) ? $getData[$fieldName] : '';

	    $conditionData = '';
	    if( !empty( $args['condition'] ) ) {
	      $conditionData = json_encode( $args['condition'] );
	    }


		?>
		<div class="restrofood-admin-field text-repeater fb-address-conditional-field" data-condition="<?php echo esc_html( $conditionData ); ?>">
			<h4><?php echo esc_html( $args['title'] ); ?></h4>
			<?php
			if( !empty( $args['description'] ) ) {
				echo '<p>'.esc_html( $args['description'] ).'</p>';
			}
			?>
			<div class="pickup-time-repeater product-visibility-time">
		        <div class="field-wrapper" data-name="<?php echo esc_attr( $optionName.'['.$fieldName.']' ); ?>">

		        <?php
		        if( !empty( $value ) ):
		          foreach ( $value as $key => $val ) :

		        ?>
		          <div class="single-field km-single-field">

		          <input type="text" class="tatCmf-input-control <?php echo esc_attr( $args['class'] ); ?>" name="<?php echo esc_attr( $optionName ); ?>[<?php echo esc_attr( $fieldName ); ?>][<?php echo esc_attr( $key ); ?>][type]" value="<?php echo esc_attr( $val['type'] ); ?>" placeholder="Type" />

		          <input type="text" class="tatCmf-input-control time-picker <?php echo esc_attr( $args['class'] ); ?>" name="<?php echo esc_attr( $optionName ); ?>[<?php echo esc_attr( $fieldName ); ?>][<?php echo esc_attr( $key ); ?>][starttime]" value="<?php echo esc_attr( $val['starttime'] ); ?>" placeholder="Start Time" />

		          <input type="text" class="tatCmf-input-control time-picker <?php echo esc_attr( $args['class'] ); ?>" name="<?php echo esc_attr( $optionName ); ?>[<?php echo esc_attr( $fieldName ); ?>][<?php echo esc_attr( $key ); ?>][endtime]" value="<?php echo esc_attr( $val['endtime'] ); ?>" placeholder="End Time" />

		          <span class="removeRepeaterField fb-admin-btn"><?php esc_html_e( 'Remove', 'restrofood' ); ?></span>

		          </div>
		        <?php 
		        endforeach;
		        endif
		        ?>
		        </div>
		        <span class="addProductVisibilityTime fb-admin-btn"><?php esc_html_e( 'Add Visibility Type', 'restrofood' ); ?></span>

		    </div>

		</div>
		<?php
	}
}
