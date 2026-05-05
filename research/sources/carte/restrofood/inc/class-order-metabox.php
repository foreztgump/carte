<?php
/**
 *
 * @package     RestroFood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 */

class Order_Metabox {

	private $order_status;

	function __construct() {
        
    	$this->order_status = restrofood_tracking_status();
		// Adding Meta container admin shop_order pages
		add_action( 'add_meta_boxes', [ $this, 'add_meta_boxes' ] );
		// Save the data of the Meta field
		add_action( 'save_post', [ $this, 'save_wc_order_meta' ], 10, 1 );
	}

    function add_meta_boxes() {
        add_meta_box( 'restrofood_order_tracking_meta', esc_html__('Order Tracking Status','restrofood'), [ $this, 'restrofood_add_other_fields_for_packaging' ], 'shop_order', 'side', 'core' );
    }

    function restrofood_add_other_fields_for_packaging() {
        global $post;

        $field_data = get_post_meta( $post->ID, '_order_tracking_status', true ) ? get_post_meta( $post->ID, '_order_tracking_status', true ) : '';

        echo '<input type="hidden" name="rb_order_tracking_nonce" value="' . wp_create_nonce() . '">';
        
        ?>
        <select name="order_tracking_status">
        	<option value=""><?php esc_html_e( 'Select Order Tracking Status', 'restrofood' ); ?></option>
        	<?php 
        	foreach( $this->order_status as $key => $opt ) {
        		echo '<option value="'.esc_attr( $key ).'" '.selected( $field_data, $key, false ).'>'.esc_html( $opt ).'</option>';
        	}
        	?>
        </select>
        <?php
    }

    function save_wc_order_meta( $post_id ) {

        // We need to verify this with the proper authorization (security stuff).

        // Check if our nonce is set.
        if ( ! isset( $_POST[ 'order_tracking_status' ] ) ) {
            return $post_id;
        }
        $nonce = $_REQUEST[ 'rb_order_tracking_nonce' ];

        //Verify that the nonce is valid.
        if ( ! wp_verify_nonce( $nonce ) ) {
            return $post_id;
        }

        // If this is an autosave, our form has not been submitted, so we don't want to do anything.
        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
            return $post_id;
        }

        // Check the user's permissions.
        if ( 'page' == $_POST[ 'post_type' ] ) {

            if ( ! current_user_can( 'edit_page', $post_id ) ) {
                return $post_id;
            }
        } else {

            if ( ! current_user_can( 'edit_post', $post_id ) ) {
                return $post_id;
            }
        }
        // --- Its safe for us to save the data ! --- //

        // Sanitize user input  and update the meta field in the database.
        update_post_meta( $post_id, '_order_tracking_status', sanitize_text_field( $_POST[ 'order_tracking_status' ] ) );
    }

}

add_action( 'init', 'restrofood_init_order_metabox' );
function restrofood_init_order_metabox() {
	new Order_Metabox();
}