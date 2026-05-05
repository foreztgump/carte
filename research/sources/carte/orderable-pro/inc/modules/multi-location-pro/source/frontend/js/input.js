var OrderableMultilocationInput = {
	init() {
		jQuery( document ).ready( () =>
			OrderableMultilocationInput.toggleActiveClass()
		);
		jQuery( document ).on(
			'change blur',
			'.opml-store-locator-input__input',
			function () {
				OrderableMultilocationInput.toggleActiveClass();
			}
		);

		// On focus, regardless of the value always add the active class.
		jQuery( document ).on(
			'focus',
			'.opml-store-locator-input__input',
			function () {
				const $row = jQuery( this ).closest(
					'.opml-store-locator-input'
				);
				$row.addClass( 'opml-is-active' );
			}
		);

		jQuery( document ).on(
			'click',
			'.opml-store-locator-input__label',
			function () {
				const $input = jQuery( this )
					.closest( '.opml-store-locator-input' )
					.find( '.opml-store-locator-input__input' );
				$input.focus();
			}
		);
	},

	toggleActiveClass( $el ) {
		if ( ! $el ) {
			$el = jQuery( '.opml-store-locator-input__input' );
		}

		$el.each( function () {
			const $row = jQuery( this ).closest( '.opml-store-locator-input' );
			if ( jQuery( this ).val() ) {
				$row.addClass( 'opml-is-active' );
			} else {
				$row.removeClass( 'opml-is-active' );
			}
		} );
	},
};

OrderableMultilocationInput.init();
