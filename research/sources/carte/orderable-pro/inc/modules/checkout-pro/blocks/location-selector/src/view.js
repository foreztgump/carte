import { dispatch, select } from '@wordpress/data';

( function ( $, document ) {
	$( document ).ready( function () {
		$( document ).on(
			'click',
			'[opml-store-popup-open], [data-type="notset"] .opml-mini-locator__address-postcode',
			function ( event ) {
				event.preventDefault();

				$( '.opml-popup' ).addClass( 'opml-popup--open' );
				$( '.opml-store-locator-input' ).addClass( 'opml-is-active' );

				search( $( '.opml-store-locator-input__input' ) );
			}
		);

		$( document ).on( 'click', '[opml-store-popup-close]', closePopup );
		$( document ).on( 'click', '.opml-select-store-button', saveLocation );
		$( document ).on( 'click', '#shipping-postcode', function ( event ) {
			event.preventDefault();

			$( '.opml-popup' ).addClass( 'opml-popup--open' );
			$( '.opml-store-locator-input' ).addClass( 'opml-is-active' );

			search( $( '.opml-store-locator-input__input' ) );
		} );

		$( document ).on(
			'keyup',
			'.opml-store-locator .opml-store-locator-input__input',
			( event ) => {
				debounce( search, 1000 )( $( event.target ) );
			}
		);

		/**
		 * Create a debounced function.
		 *
		 * @param {Function} func      Funtion.
		 * @param {number}   wait      Wait time.
		 * @param {boolean}  immediate Immediate.
		 *
		 * @return {Function} debounced function.
		 */
		function debounce( func, wait, immediate ) {
			let timeout;
			return function () {
				const context = this,
					args = arguments;
				const later = function () {
					timeout = null;
					if ( ! immediate ) func.apply( context, args );
				};
				const callNow = immediate && ! timeout;
				clearTimeout( timeout );
				timeout = setTimeout( later, wait );
				if ( callNow ) func.apply( context, args );
			};
		}

		function search( $input ) {
			const postcode = getShippingAddress( 'postcode' );

			if ( postcode && '' === $input.val() ) {
				$input.val( postcode );
			}

			$input.trigger( 'focus' );

			const $row = $input.closest( '.opml-store-locator-input' ),
				$locator = $row.closest( '.opml-store-locator' ),
				$results = $locator.find( '.opml-store-locator__results' );

			$( '.opml-store-locator__geolocate' ).hide();

			$row.addClass( 'opml-is-loading' );

			// Set the AJAX data
			const data = {
				action: 'opml_search_location_by_postcode',
				postcode: $input.val(),
				order_date: $( '.orderable-order-timings__date' ).val(),
				_wpnonce_orderable: $( '#_wpnonce_orderable' ).val(),
			};

			// eslint-disable-next-line camelcase, no-undef
			$.post( orderable_vars.ajax_url, data, function ( response ) {
				if ( response.success ) {
					$results
						.html( response.data.html )
						.slideDown( 'fast', function () {} );
				} else if (
					response &&
					response.data &&
					response.data.message
				) {
					$results
						.html(
							`<div class='opml-store-locator-notice'>${ response.data.message }</div>`
						)
						.slideDown();
				} else {
					$results.slideUp( 'fast', function () {} );
					$( '.opml-store-locator__geolocate' ).slideDown();
				}

				$row.removeClass( 'opml-is-loading' );
			} );
		}

		function saveLocation( event ) {
			event.preventDefault();

			const $btn = $( this );

			if ( $btn.hasClass( 'opml-select-store-button--disabled' ) ) {
				return;
			}

			const $popup = $btn.closest( '.opml-popup' );
			const $store = $btn.closest( '.opml-search-single-store' );

			$popup.addClass( 'opml-popup--loading' );
			$btn.addClass( 'opml-is-loading' );

			const selectedLocationId = $store.data( 'location-id' );
			const postcode = $popup
				.find( '.opml-store-locator-input__input' )
				.val();

			const data = {
				action: 'opml_save_location',
				_nonce: orderable_multi_location_params.location_nonce, // eslint-disable-line camelcase, no-undef
				postcode,
				type: $btn.data( 'type' ),
				location_id: selectedLocationId,
			};

			// eslint-disable-next-line camelcase, no-undef
			$.post( orderable_vars.ajax_url, data, function ( response ) {
				if ( ! response.success ) {
					return;
				}

				$( '.opml-select-store-button' ).removeClass(
					'opml-select-store-button--selected'
				);
				$btn.addClass( 'opml-select-store-button--selected' );

				$popup.removeClass( 'opml-popup--loading' );
				$btn.removeClass( 'opml-is-loading' );

				const locationId = $btn
					.parents( '.opml-search-single-store' )
					.attr( 'data-location-id' );
				const locationName = $btn
					.parents( '.opml-search-single-store' )
					.find( '.opml-search-single-store-content__heading' )
					.text();

				$( '[name="opml_selected_location"]' ).val( locationId );
				$( '.opml-mini-locator__address-postcode' ).text(
					locationName
				);

				const shippingAddress = getShippingAddress();

				if ( shippingAddress ) {
					dispatch( 'wc/store/cart' ).updateCustomerData(
						{
							...shippingAddress,
							postcode,
						},
						false
					);
				}

				const cartData = select( 'wc/store/cart' )?.getCartData();

				dispatch( 'wc/store/cart' ).setCartData( {
					...cartData,
					extensions: {
						...cartData.extensions,
						'orderable/order-service-date': {
							...cartData.extensions[
								'orderable/order-service-date'
							],
							shouldSelectFirstAvailableDate: true,
						},
					},
				} );

				closePopup();
			} );
		}

		function closePopup() {
			$( '.opml-popup' )
				.not( '.opml-popup--loading' )
				.removeClass( 'opml-popup--open' );
		}

		function getShippingAddress( key ) {
			if ( ! key || 'string' !== typeof key ) {
				return select( 'wc/store/cart' )?.getCartData()
					?.shippingAddress;
			}

			return select( 'wc/store/cart' )?.getCartData()?.shippingAddress?.[
				key
			];
		}
	} );
} )( jQuery, document ); // eslint-disable-line no-undef
