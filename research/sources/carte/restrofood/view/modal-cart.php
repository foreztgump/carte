<?php
global $restrofoodAttr;
$opt = get_option('restrofood_options');

//
if( !empty( $restrofoodAttr['mini_cart_type'] ) ) {
	$cartModalStyle = $restrofoodAttr['mini_cart_type'];
} else {
	$cartModalStyle = !empty( $opt['cart-modal-style'] ) ? $opt['cart-modal-style'] : '';
}

//
if( $cartModalStyle == 'beside-products' ) {
	return;
}

//
if( $cartModalStyle == 'canvas' ) {
	// Canvas modal
	include RESTROFOOD_DIR_PATH.'view/modal-canvas-cart.php';
} else {
	// Canvas footer fixed
	include RESTROFOOD_DIR_PATH.'view/modal-footer-fixed-cart.php';
}