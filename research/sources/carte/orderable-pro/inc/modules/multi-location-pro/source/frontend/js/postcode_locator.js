var OrderableMultiLocationPostcode = {
	init() {
		jQuery( document ).on(
			'click',
			'.opml-postcode-locator__button',
			OrderableMultiLocationPostcode.handle_button_click
		);
	},

	handle_button_click() {
		const $locator = jQuery( this ).closest( '.opml-postcode-locator' );

		if ( ! $locator.length ) {
			return;
		}

		const $input = $locator.find( '.opml-store-locator-input__input' );
		jQuery( '.opml-store-locator-input__input' ).val( $input.val().trim() );
		jQuery( document.body ).trigger( 'opml_open_popup' );
	},
};

OrderableMultiLocationPostcode.init();
