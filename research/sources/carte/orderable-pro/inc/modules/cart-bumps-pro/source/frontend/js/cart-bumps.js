( function ( $, document ) {
	'use strict';

	var orderable_cart_bumps = {
		/**
		 * On ready.
		 */
		on_ready() {
			orderable_cart_bumps.init_slider();
			$( document.body ).on(
				'orderable-drawer.opened',
				orderable_cart_bumps.init_slider
			);
			$( document ).on(
				'orderable-drawer.quantity-updated',
				orderable_cart_bumps.init_slider
			);
			$( document.body ).on(
				'removed_from_cart',
				orderable_cart_bumps.init_slider
			);
		},

		/**
		 * Init bumps slider.
		 */
		init_slider() {
			$( '.orderable-cart-bumps' ).flexslider( {
				namespace: 'orderable-cart-bumps-slider-',
				selector:
					'.orderable-cart-bumps__contents > .orderable-cart-bumps__bump',
				animation: 'slide',
				directionNav: false,
				start() {
					$( window ).resize();
				},
			} );
		},
	};

	$( document ).ready( orderable_cart_bumps.on_ready );
} )( jQuery, document );
