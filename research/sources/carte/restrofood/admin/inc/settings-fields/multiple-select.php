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

trait MultipleSelect {

	protected static $args;

	public function multiple_select( $args ) {

		$default = [
			'title' => '',
			'name'	=> '',
			'description'	=> '',
			'class'			=> '',
			'condition'		=> '',
			'options'		=> ''
		];

		self::$args = wp_parse_args( $args, $default );

		self::multiple_select_markup();
		
	}

	protected static function multiple_select_markup() {

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
		<div class="restrofood-admin-field" data-condition="<?php echo esc_html($conditionData); ?>">
			<h4><?php echo esc_html( $args['title'] ); ?></h4>
			<div class="fb-field-group">
			<select name="<?php echo esc_attr( $optionName ).'['.$fieldName.']'; ?>[]" multiple>
				<?php
                foreach( $args['options'] as  $key => $option ) {

                	$v = '';
					if( !empty( $value ) && in_array( $key , $value ) ) {
						$v = $key;
					}
					
                	echo '<option value="'.esc_attr( $key ).'" '.selected( $key,  $v, false ).'>'.esc_html( $option ).'</option>';
                }
                ?>
			</select>
			<?php 
			if( !empty( $args['description'] ) ) {
				echo '<p>'.esc_html( $args['description'] ).'</p>';
			}
			?>
			</div>
		</div>
		<?php
	}
}
