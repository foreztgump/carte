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

trait ZipcodeMultiInput {

	protected static $args;

	public function zipcode_multiinput( $args ) {

		$default = [
			'title' => '',
			'name'	=> '',
			'description'	=> '',
			'class'			=> '',
			'condition'		=> '',
		];

		self::$args = wp_parse_args( $args, $default );

		self::zipcode_multiinput_markup();
		
	}

	protected static function zipcode_multiinput_markup() {

		$optionName = self::$optionName;
	    $args = self::$args;
	    $getData = self::$getOptionData;
	    $fieldName  = $args['name'];
	    $value = !empty( $getData[$fieldName] ) ? $getData[$fieldName] : '';

	    $conditionData = '';
	    if( !empty( $args['condition'] ) ) {
	      $conditionData = json_encode( $args['condition'] );
	    }
		?>
		<div class="restrofood-admin-field fb-zip-conditional-field" data-condition="<?php echo esc_html($conditionData); ?>">
			<h4><?php echo esc_html( $args['title'] ); ?></h4>
			<?php
			if( !empty( $args['description'] ) ) {
				echo '<p>'.esc_html( $args['description'] ).'</p>';
			}
			?>

			<div class="pickup-time-repeater">
		        <div class="field-wrapper" data-name="<?php echo esc_attr( $optionName ).'['.$fieldName.']'; ?>">
		        <?php
		        if( !empty( $value ) ):
		          foreach ( $value as $key => $val ) :
		          	$code = !empty( $val['code'] ) ? $val['code'] : '';
		          	$fee  = !empty( $val['fee'] ) ? $val['fee'] : '';
		        ?>
		          <div class="single-field">
		          <input type="text" class="tatCmf-input-control <?php echo esc_attr( $args['class'] ); ?>" name="<?php echo esc_attr( $optionName ).'['.$fieldName.']['.$key.']'; ?>[code]" value="<?php echo esc_attr( $code ); ?>" placeholder="Zip Code" />
		          <input type="text" class="tatCmf-input-control <?php echo esc_attr( $args['class'] ); ?>" name="<?php echo esc_attr( $optionName ).'['.$fieldName.']['.$key.']'; ?>[fee]" value="<?php echo esc_attr( $fee ); ?>" placeholder="fee" />
		          <span class="removeRepeaterField fb-admin-btn"><?php esc_html_e( 'Remove', 'restrofood' ); ?></span>
		          </div>
		        <?php 
		        endforeach;
		        endif
		        ?>
		        </div>
		        <span class="addRepeaterFieldMultiInput fb-admin-btn"><?php esc_html_e( 'Add Zip Code', 'restrofood' ); ?></span>
			</div>
        </div>
		<?php
	}
}
