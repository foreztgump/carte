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

trait Text {

	protected static $args;

	public function text( $args ) {

		$default = [
			'title' => '',
			'name'	=> '',
			'description'	=> '',
			'placeholder'	=> '',
			'wrapperclass'	=> '',
			'class'			=> '',
			'condition'		=> ''
		];

		self::$args = wp_parse_args( $args, $default );

		self::text_markup();
		
	}

	protected static function text_markup() {

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
		<div class="restrofood-admin-field <?php echo esc_attr( $args['wrapperclass'] ); ?>" data-condition="<?php echo esc_html($conditionData); ?>">
			<h4><?php echo esc_html( $args['title'] ); ?></h4>
			<div class="fb-field-group">
			<input type="text" class="<?php echo esc_attr( $args['class'] ); ?>" name="<?php echo esc_attr( $optionName ).'['.$fieldName.']'; ?>" placeholder="<?php echo esc_attr( $args['placeholder'] ); ?>" value="<?php echo esc_attr( $value ); ?>" />
			<?php
			if( !empty( $args['description'] ) ) {
				echo '<p>'. $args['description'] .'</p>';
			}
			?>
			</div>
		</div>
		<?php
	}
}
