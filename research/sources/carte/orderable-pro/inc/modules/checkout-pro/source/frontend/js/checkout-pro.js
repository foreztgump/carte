( function ( $, document ) {
	'use strict';
	var orderable_checkout_pro = {
		/**
		 * On ready.
		 */
		on_ready() {
			$( document.body ).on(
				'click',
				'.orderable-checkout-summary-toggle',
				orderable_checkout_pro.hide_show_order_summary
			);

			orderable_checkout_pro.mobile_view();
			orderable_checkout_pro.toggle_delivery_area();

			// Calculate the view panel when fragments are refreshed.
			$( document.body ).on( 'wc_fragments_refreshed', function () {
				orderable_checkout_pro.set_date_and_time();
				orderable_checkout_pro.mobile_view();
				orderable_checkout_pro.update_total();
			} );

			// Calculate the view panel when the checkout is updated (IE via tips)
			$( document.body ).on( 'updated_checkout', function () {
				orderable_checkout_pro.set_date_and_time();
				orderable_checkout_pro.mobile_view();
				orderable_checkout_pro.update_total();
			} );

			// Hide delivery options if this is a collection.
			$( document.body ).on(
				'change',
				'input.shipping_method',
				function () {
					orderable_checkout_pro.toggle_delivery_area();
					orderable_checkout_pro.mobile_view();
					orderable_checkout_pro.update_total();
				}
			);

			if ( orderable_checkout_pro_params ) {
				/**
				 * We add this event handle to prevent that the checkout page
				 * reloads when a coupon code is applied.
				 */
				$( '.orderable-checkout__form' ).on(
					'submit',
					'form.checkout_coupon',
					orderable_checkout_pro.on_submit_coupons_form
				);
			}
		},

		update_total() {
			const total = $( '.order-total td:last-of-type' ).html();
			$( '.orderable-checkout-summary-toggle_total' ).html( total );
		},

		/**
		 * Move elements around for the mobile view.
		 */
		mobile_view() {
			const width = $( window ).width();
			const payment_table = $( '#payment table.orderable-mobile-table' );
			if ( width <= 991 ) {
				var shipping_table = $(
					'#order_review .orderable-checkout__shipping-table'
				);
				const tip_form = $( '#order_review .orderable-tip' );
				const coupon_form = $( '#order_review .coupon-form' );

				if ( shipping_table.length ) {
					const additional_fields = $(
						'.woocommerce-additional-fields'
					);
					const title = $( '<h3></h3>' ).text(
						orderable_checkout_pro_params.i18n.shipping_title
					);
					title.addClass( 'orderable_shipping_title' );

					$(
						'#customer_details .orderable-checkout__shipping-table'
					).remove();
					$( '#customer_details .orderable_shipping_title' ).remove();

					if ( additional_fields.length ) {
						title.insertBefore( additional_fields );
						$(
							'#order_review .orderable-checkout__shipping-table'
						).insertBefore( additional_fields );
					} else {
						$( '#customer_details' ).prepend(
							$(
								'#order_review .orderable-checkout__shipping-table'
							)
						);
						$( '#customer_details' ).prepend( title );
					}
				}

				if ( tip_form.length || coupon_form.length ) {
					if ( payment_table.length ) {
						payment_table.remove();
					}

					const table = $( '<table></table>' );
					table.addClass( 'orderable-mobile-table' );
					table.insertAfter( '#payment ul.wc_payment_methods' );
				}

				if ( tip_form.length ) {
					$( '#payment .orderable-tip-row' ).remove();
					$( '#payment table.orderable-mobile-table' ).prepend(
						$( '#order_review .orderable-tip-row' )
					);
				}

				if ( coupon_form.length ) {
					$( '#payment .coupon-form' ).remove();
					$( '#payment table.orderable-mobile-table' ).prepend(
						$( '#order_review .coupon-form' )
					);
				}
			} else {
				var shipping_table = $( '.orderable_shipping_title' );
				if ( shipping_table.length ) {
					shipping_table.remove();
				}

				$(
					'#order_review .orderable-checkout__order-review thead > tr > td'
				).prepend( $( '.orderable-checkout__shipping-table' ) );

				$(
					'#order_review .woocommerce-checkout-review-order-table > tbody'
				).append( $( '#payment .coupon-form' ) );

				$(
					'#order_review .woocommerce-checkout-review-order-table > tbody'
				).append( $( '#payment .orderable-tip-row' ) );

				if ( payment_table.length ) {
					payment_table.remove();
				}
			}
		},

		/**
		 * Hide Show Order Summary.
		 *
		 * Toggle for the checkout summary on mobile view.
		 */
		hide_show_order_summary() {
			if (
				$( '.orderable-checkout-summary-toggle_link--hide' ).is(
					':visible'
				)
			) {
				$( '.orderable-checkout-summary-toggle_link--show' ).show();
				$( '.orderable-checkout-summary-toggle_link--hide' ).hide();
			} else {
				$( '.orderable-checkout-summary-toggle_link--show' ).hide();
				$( '.orderable-checkout-summary-toggle_link--hide' ).show();
			}
			$( '.checkout_right_section' ).slideToggle( 'slow' );
			return false;
		},

		/**
		 * Set Date and Time.
		 *
		 * When the shipping preview panel loads, we don't want to have
		 * to edit it immediately to set the date and time, so instead
		 * pick the first available ones. The customer can change them if
		 * they need to.
		 */
		set_date_and_time() {
			if (
				wp.hooks.applyFilters(
					'orderable_pro_timing_disable_auto_select_date_time',
					false
				)
			) {
				return;
			}

			const date = document.querySelector( '#orderable-date' );
			let date_option = '';
			let date_value = '';
			if ( date ) {
				date_option = date.options[ date.selectedIndex ];
				if ( date_option ) {
					date_value = date_option.value;
					if (
						! date_value &&
						date.options[ date.selectedIndex + 1 ]
					) {
						date.options[ date.selectedIndex + 1 ].selected = true;
						$( date ).change();
					}
				}
			}

			if ( date_value === 'asap' ) {
				return;
			}

			const time = document.querySelector( '#orderable-time' );
			let time_option = '';
			if ( time ) {
				time_option = time.options[ time.selectedIndex ];
				if ( time_option && time.options[ time.selectedIndex + 1 ] ) {
					const time_value = time_option.value;
					if ( ! time_value ) {
						time.options[ time.selectedIndex + 1 ].selected = true;
						$( time ).change();
					}
				}
			}

			orderable_checkout_pro.toggle_delivery_area();
		},

		/**
		 * Toggle Delivery Area.
		 */
		toggle_delivery_area() {
			const shipping_method =
				document.querySelector( 'input.shipping_method:checked' ) ||
				document.querySelector( 'input.shipping_method' );
			const shipping_title = document.querySelector(
				'.orderable-checkout-section--shipping h3'
			);
			const shipping_fields = document.querySelector(
				'.orderable-checkout-section--shipping .woocommerce-shipping-fields'
			);
			const shipping_checkbox = document.getElementById(
				'ship-to-different-address-checkbox'
			);
			const shipping_wrapper =
				document.querySelector( '.shipping_address' );
			let value = [];

			// If the shipping method choices exist, set the value.
			if ( shipping_method ) {
				value = shipping_method.value;
			}

			// If there is no shipping information, return.
			if ( ! shipping_title ) {
				return;
			}

			// If there are no choices and the default is pickup, the style will be hard coded as none, so return.
			if (
				shipping_title.style.display === 'none' &&
				shipping_fields.style.display !== 'none'
			) {
				shipping_fields.style.display = 'none';
			}

			// If there are no shipping options, return.
			if ( value.length < 1 ) {
				return;
			}

			// If the choice is pickup, hide the delivery area.
			if (
				'shipping' !==
					orderable_checkout_pro_params.woocommerce_ship_to_destination &&
				value.includes( 'local_pickup:' )
			) {
				shipping_title.style.display = 'none';
				shipping_title.setAttribute( 'aria-hidden', 'true' );

				shipping_fields.style.display = 'none';
				shipping_fields.setAttribute( 'aria-hidden', 'true' );

				if ( shipping_wrapper ) {
					shipping_wrapper.style.display = 'none';
					shipping_wrapper.setAttribute( 'aria-hidden', 'true' );
				}

				if ( shipping_checkbox ) {
					shipping_checkbox.checked = false;
					jQuery( 'ship-to-different-address-checkbox' ).trigger(
						'change'
					);
				}
			} else {
				// If the choice is not pickup, show the delivery area.
				shipping_title.style.display = 'block';
				shipping_title.setAttribute( 'aria-hidden', 'false' );

				shipping_fields.style.display = 'block';
				shipping_fields.setAttribute( 'aria-hidden', 'false' );
			}
		},

		/**
		 * Handle coupons form submit.
		 *
		 * This function copies the behaviour of the WooCommerce function
		 * wc_checkout_coupons.submit() (woocommerce/assets/js/frontend/checkout.js) except
		 * that this function change from `$( $form ).before( code );`
		 * to `$( 'form.woocommerce-checkout' ).before( code );` to show the notice on the
		 * top of the checkout page.
		 */
		on_submit_coupons_form() {
			const $form = $( this );

			if ( $form.is( '.processing' ) ) {
				return false;
			}

			$form.addClass( 'processing' ).block( {
				message: null,
				overlayCSS: {
					background: '#fff',
					opacity: 0.6,
				},
			} );

			const data = {
				security: wc_checkout_params.apply_coupon_nonce,
				coupon_code: $form.find( 'input[name="coupon_code"]' ).val(),
			};

			$.ajax( {
				type: 'POST',
				url: wc_checkout_params.wc_ajax_url
					.toString()
					.replace( '%%endpoint%%', 'apply_coupon' ),
				data,
				success( code ) {
					$( '.woocommerce-error, .woocommerce-message' ).remove();
					$form.removeClass( 'processing' ).unblock();

					if ( code ) {
						$( 'form.woocommerce-checkout' ).before( code );

						$( document.body ).trigger(
							'applied_coupon_in_checkout',
							[ data.coupon_code ]
						);
						$( document.body ).trigger( 'update_checkout', {
							update_shipping_method: false,
						} );
					}
				},
				dataType: 'html',
			} );

			return false;
		},
	};

	$( document ).ready( orderable_checkout_pro.on_ready );

	let on_resize;
	$( window ).on( 'resize', function () {
		clearTimeout( on_resize );
		on_resize = setTimeout( orderable_checkout_pro.mobile_view, 250 );
	} );
} )( jQuery, document );
