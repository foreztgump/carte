<?php
/**
 * The template for displaying Orderable's checkout.
 *
 * @package    orderable-pro
 */

defined( 'ABSPATH' ) || exit;

wc_get_template( 'orderable/checkout/header.php' );

while ( have_posts() ) :
	the_post();

	the_content();
endwhile; // End of the loop.

wc_get_template( 'orderable/checkout/footer.php' );
