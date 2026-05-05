var OrderableMultilocationPostcodeField = {
	init() {
		jQuery( document ).ready( function () {
			if (
				'1' !== orderable_multi_location_params.is_multi_location_mode
			) {
				return;
			}

			if (
				jQuery( '#ship-to-different-address-checkbox' ).is( ':checked' )
			) {
				OrderableMultilocationPostcodeField.prepareField( 'shipping' );
			} else {
				OrderableMultilocationPostcodeField.prepareField( 'billing' );
			}

			OrderableMultilocationPostcodeField.handleChangeOfDestination();

			jQuery( document ).on( 'click', '.opml-postcode-btn', function () {
				jQuery( document.body ).trigger( 'opml_open_popup' );
			} );
		} );
	},

	prepareField( destination ) {
		jQuery( `#${ destination }_postcode_field` )
			.append( `<span class='opml-postcode-btn'>
			<span class='opml-postcode-btn__icon'></span>
			<span class='opml-postcode-btn__edit'>${ orderable_multi_location_params.i18n.edit }</span>
			</span>` );
		jQuery( `#${ destination }_postcode` ).attr( 'readonly', true );

		if ( ! jQuery( `#${ destination }_postcode` ).is( ':visible' ) ) {
			return;
		}

		const parentOffset = jQuery(
			`#${ destination }_postcode_field`
		).offset();
		const fieldOffset = jQuery( `#${ destination }_postcode` ).offset();
		jQuery( '.opml-postcode-btn' ).css( {
			top: fieldOffset.top - parentOffset.top,
			height: jQuery( `#${ destination }_postcode` ).outerHeight(),
		} );
	},

	/**
	 * Remove readonly and edit icon from the postcode field.
	 *
	 * @param {string} destination billing or shipping.
	 */
	unprepareField( destination ) {
		jQuery( `#${ destination }_postcode_field ` )
			.find( '.opml-postcode-btn' )
			.remove();
		jQuery( `#${ destination }_postcode` ).attr( 'readonly', false );
	},

	/**
	 * Handle click on the "Ship to different address" checkbox.
	 * When checked, then the edit icon should appear on the shipping postcode, else on billing postcode.
	 */
	handleChangeOfDestination() {
		jQuery( '#ship-to-different-address-checkbox' ).change( function () {
			if ( jQuery( this ).is( ':checked' ) ) {
				OrderableMultilocationPostcodeField.unprepareField( 'billing' );
				setTimeout( function () {
					OrderableMultilocationPostcodeField.prepareField(
						'shipping'
					);
				}, 100 );
			} else {
				OrderableMultilocationPostcodeField.unprepareField(
					'shipping'
				);
				OrderableMultilocationPostcodeField.prepareField( 'billing' );
			}
		} );
	},
};

OrderableMultilocationPostcodeField.init();
