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

class Custom_Hooks {

  function __construct() {
    // Delivery type html
    add_action( 'restrofood_delivery_types', [ $this, 'delivery_types_html' ] );
  }

  public function delivery_types_html() {
    $deliveryTime = get_option('restrofood_options');
    ?>
    <div class="rb_multiform">
          <!-- Form Selector Group -->  
      <label for="rb_delivery_type" class="rb_input_label rb_mb_0">
				<?php esc_html_e( 'Delivery Type', 'restrofood' ) ?><span class="fb-required">*</span>
			</label>        
      <ul class="rb_list_unstyled rb_form_selector_list rb_mt_5">
			<?php 

      $types = [
        [
          'title' => esc_html__( 'Delivery', 'restrofood' ),
          'class' => 'delivery-type-delivery',
          'value' => 'Delivery',
          'compare' => 'delivery'
        ],
        [
          'title' => esc_html__( 'Pickup by me', 'restrofood' ),
          'class' => 'delivery-type-pickup',
          'value' => 'Pickup',
          'compare' => 'pickup'
        ]

      ];

      $getTypes = apply_filters( 'restrofood_add_delivery_type', $types );

      foreach( $getTypes as $type ) {

        if( $deliveryTime['delivery-options'] == $type['compare'] || $deliveryTime['delivery-options'] == 'all' ) {

          $checked = $deliveryTime['delivery-options'] == $type['compare'] ? 'checked' : '';

          echo '<li class="rb_single_form_selector">
            <span class="rb_custom_checkbox">
              <label>
                <input type="radio" value="'.esc_attr( $type['value'] ).'" class="shipping_method '.esc_attr( $type['class'] ).'" name="rb_delivery_options" '.esc_attr( $checked ).'>
                <span class="rb_label_title">'.esc_html( $type['title'] ).'</span>
                <span class="rb_custom_checkmark"></span>
              </label>
            </span>
          </li>';
        }
        
      }
      ?>
      </ul>
          <!-- End Form Selector Group -->
    </div>
    <?php
  }

}

// Hooks class init
new Custom_Hooks();