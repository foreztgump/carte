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

trait kmFeeRepeater {

	protected static $args;

	public function kmfeerepeater( $args ) {

		$default = [
			'title' => '',
			'name'	=> '',
			'description'	=> '',
			'class'			=> '',
			'condition'		=> '',
		];

		self::$args = wp_parse_args( $args, $default );

		self::kmfeerepeater_markup();
		
	}

	protected static function kmfeerepeater_markup() {

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
		<div class="restrofood-admin-field text-repeater fb-address-conditional-field" data-condition="<?php echo esc_html( $conditionData ); ?>">
			<h4><?php echo esc_html( $args['title'] ); ?></h4>
			<?php
			if( !empty( $args['description'] ) ) {
				echo '<p>'.esc_html( $args['description'] ).'</p>';
			}
			?>
			<div class="pickup-time-repeater">
		        <div class="field-wrapper" data-name="<?php echo esc_attr( $optionName.'['.$fieldName.']' ); ?>">
		        <?php
		        if( !empty( $value ) ):
		          foreach ( $value as $key => $val ) :

		        ?>
		          <div class="single-field km-single-field">
		          <input type="number" class="tatCmf-input-control <?php echo esc_attr( $args['class'] ); ?>" name="<?php echo esc_attr( $optionName ); ?>[<?php echo esc_attr( $fieldName ); ?>][<?php echo esc_attr( $key ); ?>][km]" value="<?php echo esc_attr( $val['km'] ); ?>" step="0.1" placeholder="Kilometer" />
		          <input type="number" class="tatCmf-input-control <?php echo esc_attr( $args['class'] ); ?>" name="<?php echo esc_attr( $optionName ); ?>[<?php echo esc_attr( $fieldName ); ?>][<?php echo esc_attr( $key ); ?>][fee]" value="<?php echo esc_attr( $val['fee'] ); ?>" step="0.1" placeholder="Fee" />
		          <span class="removeRepeaterField fb-admin-btn"><?php esc_html_e( 'Remove', 'restrofood' ); ?></span>
		          </div>
		        <?php 
		        endforeach;
		        endif
		        ?>
		        </div>
		        <span class="addkmRepeaterField fb-admin-btn"><?php esc_html_e( 'Add Fee On KM', 'restrofood' ); ?></span>
		    </div>
		</div>
		<?php
	}
}
