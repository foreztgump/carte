var OrderableMultilocationGeolocate = {
	/**
	 * Run.
	 */
	init() {
		jQuery( document ).on(
			'click',
			'.opml-store-locator__geolocate',
			this.handleClick
		);
	},

	/**
	 * Handle click on the "Use your current location" button.
	 */
	handleClick() {
		$btn = jQuery( '.opml-store-locator__geolocate-btn' );
		$btn.addClass( 'opml-store-locator__geolocate-btn--loading' );

		if ( navigator.geolocation ) {
			navigator.geolocation.getCurrentPosition(
				OrderableMultilocationGeolocate.onLocationDetected,
				OrderableMultilocationGeolocate.handleGeolocateError
			);
		} else {
			$btn.removeClass( 'opml-store-locator__geolocate-btn--loading' );
		}
	},

	/**
	 * On location detetcted.
	 *
	 * @param {Object} position
	 */
	onLocationDetected( position ) {
		$btn = jQuery( '.opml-store-locator__geolocate-btn' );

		const data = {
			lat: position.coords.latitude,
			long: position.coords.longitude,
			action: 'opml_get_postcode_from_coords',
		};

		jQuery
			.post( orderable_vars.ajax_url, data )
			.done( function ( res ) {
				if ( res && res.success && res.data && res.data.postcode ) {
					jQuery( '.opml-store-locator-input__input' )
						.val( res.data.postcode )
						.trigger( 'change' );
					OrderableMultiLocation.search(
						jQuery( '.opml-store-locator-input__input' )
					);
				}
			} )
			.fail( function () {
				OrderableMultilocationGeolocate.handleGeolocateError();
			} )
			.always( function () {
				$btn.removeClass(
					'opml-store-locator__geolocate-btn--loading'
				);
			} );
	},

	/**
	 * Handle Geocode error.
	 */
	handleGeolocateError() {
		jQuery( '.opml-store-locator__geolocate' )
			.addClass( 'opml-store-locator__geolocate--error' )
			.html(
				`<p>${ orderable_multi_location_params.i18n.geolocate_error }</p>`
			);
	},
};

OrderableMultilocationGeolocate.init();
