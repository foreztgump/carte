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

trait LocationSearch {

	protected static $args;

	public function locationSearch( $args ) {

		$default = [
			'title' => '',
			'name'	=> '',
			'description'	=> '',
			'class'			=> '',
			'condition'		=> '',
		];

		self::$args = wp_parse_args( $args, $default );

		self::locationSearch_markup();
		
	}

	protected static function locationSearch_markup() {

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
		<div class="restrofood-admin-field fb-address-conditional-field" data-condition="<?php echo esc_html($conditionData); ?>">
			<h4><?php echo esc_html( $args['title'] ); ?></h4>
			<div class="field-group">
				<div class="pac-card" id="pac-card">
	                <div>
	                  <div id="title"> <?php esc_html_e( 'Search Shop Location', 'restrofood' ); ?> </div>
	                </div>
	                <div id="pac-container">
	                  <input id="pac-input" class="pac-input" style="width:340px" type="text" name="<?php echo esc_attr( $optionName ).'['.$fieldName.']'; ?>" placeholder="<?php esc_html_e( 'Enter a location', 'restrofood' ); ?>" value="<?php echo esc_html( $value ); ?>" />
	                </div>
              	</div>
				<div id="infowindow-content" class="infowindow-content">
					<img src="" width="16" height="16" id="place-icon" />
					<span id="place-name" class="title"></span><br />
					<span id="place-address"></span>
				</div>
			</div>
		</div>
		<?php
	}
}
