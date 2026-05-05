var OrderableMultiLocation = {
	mouseDownCordinates: false,

	init() {
		const debounced_search = this.debounce( this.search, 1000 );

		jQuery( document ).on(
			'keyup',
			'.opml-store-locator .opml-store-locator-input__input',
			( event ) => {
				debounced_search( jQuery( event.target ) );
			}
		);

		// Open popup.
		jQuery( document ).on(
			'click',
			'[opml-store-popup-open]',
			this.openPopup
		);
		jQuery( document ).on(
			'click',
			'.opml-mini-locator[data-type=notset]',
			this.openPopup
		);
		jQuery( document.body ).on( 'opml_open_popup', this.openPopup );

		// Close popup.
		jQuery( document.body ).on( 'opml_close_popup', this.closePopup );
		jQuery( document ).on(
			'click',
			'[opml-store-popup-close]',
			this.closePopup
		);
		document.addEventListener( 'keydown', this.closePopupOnEscKey );
		// Close popup when clicked outside.
		jQuery( document ).on(
			'mousedown',
			'.opml-popup--closable',
			this.handleMouseDown
		);
		jQuery( document ).on(
			'mouseup',
			'.opml-popup--closable',
			this.handleMouseUp
		);

		// Select the store.
		jQuery( document ).on(
			'click',
			'.opml-select-store-button',
			this.saveLocation
		);

		// Open popup on page load.
		jQuery( document ).ready( function () {
			if ( jQuery( '.opml-popup--openonload' ).length ) {
				OrderableMultiLocation.openPopup();
			}
		} );

		// Popup result scroll indicator gradient.
		document.addEventListener( 'scroll', this.handleScroll, true );
	},

	/**
	 * Open popup.
	 *
	 * @param e
	 */
	openPopup( e ) {
		if ( e && e.preventDefault ) {
			e.preventDefault();
		}

		const $store_locator_input = jQuery(
				'.opml-popup .opml-store-locator-input__input'
			),
			$shipping_postcode = jQuery( '#shipping_postcode' ),
			$billing_postcode = jQuery( '#billing_postcode' ),
			isShipToDifferenteAddress = jQuery(
				'#ship-to-different-address-checkbox'
			).is( ':checked' );

		let postcode = '';

		if ( $shipping_postcode.length && isShipToDifferenteAddress ) {
			postcode = $shipping_postcode.val().trim();
		}

		if ( ! postcode && $billing_postcode.length ) {
			postcode = $billing_postcode.val().trim();
		}

		if ( OrderableMultiLocation.isCheckoutPage() && postcode ) {
			$store_locator_input.val( postcode );
		}

		jQuery( '.opml-popup' ).addClass( 'opml-popup--open' );

		OrderableMultilocationInput.toggleActiveClass();

		if ( $store_locator_input.val().trim() ) {
			OrderableMultiLocation.search( $store_locator_input );
		}
	},

	closePopup() {
		jQuery( '.opml-popup' )
			.not( '.opml-popup--loading' )
			.removeClass( 'opml-popup--open' );
	},

	/**
	 * Save the originalEvent to be used by handleMouseUp.
	 *
	 * @param {*} e
	 */
	handleMouseDown( e ) {
		OrderableMultiLocation.mouseDownCordinates = e.originalEvent;
	},

	/**
	 * Handle click outside of the popup.
	 *
	 * @param e
	 */
	handleMouseUp( e ) {
		/*
		Do not close the popup if the mousedown had happened within the bounds of the content.
		*/
		const bounds = jQuery(
			'.opml-popup__content'
		)[ 0 ].getBoundingClientRect();
		if (
			bounds &&
			OrderableMultiLocation.mouseDownCordinates &&
			OrderableMultiLocation.mouseDownCordinates.clientX > bounds.x &&
			OrderableMultiLocation.mouseDownCordinates.clientX <
				bounds.x + bounds.width
		) {
			return;
		}

		this.mouseDownCordinates = false;

		if ( e.target !== this ) {
			return;
		}

		OrderableMultiLocation.closePopup();
	},

	/**
	 * Search for the postcode.
	 *
	 * @param $input
	 */
	search( $input ) {
		const $row = $input.closest( '.opml-store-locator-input' ),
			$locator = $row.closest( '.opml-store-locator' ),
			$results = $locator.find( '.opml-store-locator__results' );

		jQuery( '.opml-store-locator__geolocate' ).hide();

		$row.addClass( 'opml-is-loading' );

		// Set the AJAX data
		const data = {
			action: 'opml_search_location_by_postcode',
			postcode: $input.val(),
			order_date: jQuery( '.orderable-order-timings__date' ).val(),
			_wpnonce_orderable: jQuery( '#_wpnonce_orderable' ).val(),
		};

		// Send the AJAX request
		jQuery.post( orderable_vars.ajax_url, data, function ( response ) {
			if ( response.success ) {
				$results
					.html( response.data.html )
					.slideDown( 'fast', function () {
						OrderableMultiLocation.handleScroll( {}, 1 );
					} );
			} else if ( response && response.data && response.data.message ) {
				$results
					.html(
						`<div class='opml-store-locator-notice'>${ response.data.message }</div>`
					)
					.slideDown();
			} else {
				$results.slideUp( 'fast', function () {
					OrderableMultiLocation.handleScroll( {}, 1 );
				} );
				jQuery( '.opml-store-locator__geolocate' ).slideDown();
			}

			$row.removeClass( 'opml-is-loading' );
		} );
	},

	/**
	 * Save the location in cookies.
	 *
	 * @param e
	 */
	saveLocation( e ) {
		e.preventDefault();

		const $btn = jQuery( this );
		const $popup = $btn.closest( '.opml-popup' );
		const $store = $btn.closest( '.opml-search-single-store' );

		if ( $btn.hasClass( 'opml-select-store-button--disabled' ) ) {
			return;
		}

		$popup.addClass( 'opml-popup--loading' );
		$btn.addClass( 'opml-is-loading' );

		const selected_location_id = $store.data( 'location-id' );

		const data = {
			action: 'opml_save_location',
			_nonce: orderable_multi_location_params.location_nonce,
			postcode: $popup.find( '.opml-store-locator-input__input' ).val(),
			type: $btn.data( 'type' ),
			location_id: selected_location_id,
		};

		jQuery.post( orderable_vars.ajax_url, data, function ( response ) {
			if ( response.success ) {
				jQuery( '.opml-select-store-button' ).removeClass(
					'opml-select-store-button--selected'
				);
				$btn.addClass( 'opml-select-store-button--selected' );

				// Update delivery/pickup date field.
				if ( $btn.data( 'eta' ) ) {
					jQuery( '.orderable-order-timings__date' )
						.val( $btn.data( 'eta' ) )
						.trigger( 'change' );
				}

				if (
					OrderableMultiLocation.isCheckoutPage() &&
					response &&
					response.data &&
					response.data.updated_shipping_method
				) {
					const current_location_id = parseInt(
						jQuery( '[name="opml_selected_location"]' ).val()
					);

					// If changing the location, uncheck the shipping method.
					// Otherise, this data is posted and overrides the selected method.
					// See: update_order_review() in class-wc-ajax.php.
					if ( current_location_id !== selected_location_id ) {
						// Uncheck the radio button, when multiple shipping methods are available.
						jQuery(
							'[type="radio"][name="shipping_method[0]"]'
						).prop( 'checked', false );

						// Remove the hidden input, when only one shipping method is available.
						jQuery(
							'[type="hidden"][name="shipping_method[0]"]'
						).remove();
					}

					// Select the shipping method.
					jQuery( '[name="shipping_method[0]"]' ).each( function () {
						jQuery( this ).prop(
							'checked',
							response.data.updated_shipping_method ===
								jQuery( this ).val()
						);
					} );
				}
				// trigger update_checkout.
				OrderableMultiLocation.updatePostcode(
					$popup.find( '.opml-store-locator-input__input' ).val()
				);
				jQuery( document.body ).trigger( 'update_checkout' );

				$popup.removeClass( 'opml-popup--loading' );
				$btn.removeClass( 'opml-is-loading' );

				OrderableMultiLocation.closePopup();
			} else {
				alert( 'Something went wrong' );
			}
		} );
	},

	/**
	 * Handle scroll.
	 *
	 * @param {event} e
	 * @param         force_run
	 * @return
	 */
	handleScroll( e, force_run ) {
		if (
			! force_run &&
			! (
				e.target &&
				e.target.classList &&
				e.target.classList.contains( 'opml-store-results' )
			)
		) {
			return;
		}

		$result = jQuery( '.opml-store-results' );

		if ( ! $result.length ) {
			return;
		}

		if (
			$result.scrollTop() + $result.innerHeight() >=
			$result[ 0 ].scrollHeight - 20
		) {
			jQuery( '.opml-store-locator__results' ).removeClass(
				'has-scroll-bottom'
			);
		} else {
			jQuery( '.opml-store-locator__results' ).addClass(
				'has-scroll-bottom'
			);
		}
	},

	/**
	 * Create a debounced function.
	 *
	 * @param {Function} func      Funtion.
	 * @param {int}      wait      Wait time.
	 * @param {bool}     immediate Immediate.
	 *
	 * @return debounced function.
	 */
	debounce( func, wait, immediate ) {
		let timeout;
		return function () {
			const context = this,
				args = arguments;
			const later = function () {
				timeout = null;
				if ( ! immediate ) {
					func.apply( context, args );
				}
			};
			const callNow = immediate && ! timeout;
			clearTimeout( timeout );
			timeout = setTimeout( later, wait );
			if ( callNow ) {
				func.apply( context, args );
			}
		};
	},

	/**
	 * Close popup on Esc key.
	 *
	 * @param e
	 */
	closePopupOnEscKey( e ) {
		if ( e.key !== 'Escape' && e.key !== 'Esc' && e.keyCode !== 27 ) {
			return;
		}

		if ( ! jQuery( '.opml-popup--closable' ).length ) {
			return;
		}

		OrderableMultiLocation.closePopup();
	},

	/**
	 * Is checkout page.
	 *
	 * @return bool
	 */
	isCheckoutPage() {
		return jQuery( 'body' ).hasClass( 'woocommerce-checkout' );
	},

	/**
	 * Updte postcode.
	 *
	 * @param {*} postcode
	 */
	updatePostcode( postcode ) {
		if (
			jQuery( '#ship-to-different-address-checkbox' ).is( ':checked' ) &&
			jQuery( '#shipping_postcode' ).length
		) {
			jQuery( '#shipping_postcode' ).val( postcode );
		} else {
			jQuery( '#billing_postcode' ).val( postcode );
		}
	},
};

OrderableMultiLocation.init();
