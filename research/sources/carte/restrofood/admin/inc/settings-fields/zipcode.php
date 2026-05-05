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

trait Zipcode {

	protected static $args;

	public function zipcode( $args ) {

		$default = [
			'title' => '',
			'name'	=> '',
			'description'	=> '',
			'add_btn_text'	=> esc_html__( 'Add', 'restrofood' ),
			'wrap_class'	=> '',
			'condition'		=> '',
		];

		self::$args = wp_parse_args( $args, $default );

		self::zipcode_markup();
		
	}

	protected static function zipcode_markup() {

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
		<div class="restrofood-admin-field <?php echo esc_attr( $args['wrap_class'] ); ?>" data-condition="<?php echo esc_attr($conditionData); ?>">
			<h4><?php echo esc_html( $args['title'] ); ?></h4>
			<?php
			if( !empty( $args['description'] ) ) {
				echo '<p>'.esc_html( $args['description'] ).'</p>';
			}
			?>
			<div class="pickup-time-repeater">
                <div class="field-wrapper" data-name="<?php echo esc_attr($fieldName); ?>">
                <?php

                if( !empty( $value ) ):
                  foreach ( $value as $val ) :
                ?>
                  <div class="single-field">
                  <input type="text" name="<?php echo esc_attr( $optionName ).'['.$fieldName.']'; ?>[]" value="<?php echo esc_attr( $val ); ?>" />
                  <span class="removetime fb-admin-btn"><?php esc_html_e( 'Remove', 'restrofood' ); ?></span>
                  </div>
                <?php 
                endforeach;
                endif
                ?>
                </div>
                <span class="addtime fb-admin-btn"><?php echo esc_html( $args['add_btn_text'] ); ?></span>
            </div>
        </div>
		<?php
	}
}
