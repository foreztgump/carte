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

trait Switcher {

	protected static $args;

	public function switcher( $args ) {

		$default = [
			'title' => '',
			'name'	=> '',
			'description'	=> '',
			'class'			=> '',
			'condition'		=> ''
		];

		self::$args = wp_parse_args( $args, $default );

		self::switcher_markup();
		
	}

	protected static function switcher_markup() {

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
				
        <div class="fb-switcher-wrap">
          <input type="checkbox" class="switcher-checkbox" name="<?php echo esc_attr( $optionName ).'['.$fieldName.']'; ?>" value="yes" <?php checked( esc_html( $value ), 'yes'  ); ?>>
          <div class="switcher-knobs"></div>
          <div class="switcher-layer"></div>
        </div>

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
