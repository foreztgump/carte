( function ( $ ) {
	var OrderableMultistoreAdminSettings = {
		init() {
			const $multi_location_pages = jQuery(
				'#locations_multi_location_pages'
			);

			if ( $multi_location_pages.length ) {
				$multi_location_pages.attr( 'multiple', true );
				$multi_location_pages.select2( {
					multiple: true,
				} );
			}

			$( '.orderable-change-location-status__button' ).on(
				'click',
				OrderableMultistoreAdminSettings.on_click_change_location_status
			);
		},

		/**
		 * Handle on click change location status button.
		 */
		on_click_change_location_status() {
			$( this ).attr( 'disabled', true );
			$( this )
				.siblings( '.orderable-change-location-status__loading' )
				.removeClass(
					'orderable-change-location-status__loading-hidden'
				);
			$( '.orderable-change-location-status__error-message' )
				.addClass( 'orderable-change-location-status--hidden' )
				.text( '' );

			const status = $( this ).attr( 'data-change-to' );
			const locationId = parseInt(
				$( this ).attr( 'data-location-id' ),
				10
			);

			const data = {
				action: locationId
					? 'update_location_status'
					: 'update_status_for_all_locations',
				_nonce_update_location_status:
					orderable_pro_multi_location_list_table_admin.nonce,
				location_id: $( this ).attr( 'data-location-id' ),
				status,
			};

			switch ( status ) {
				case 'pause-delivery':
				case 'pause-pickup':
					OrderableMultistoreAdminSettings.pause_orders_for_today.bind(
						this
					)( data );

					break;

				case 'resume-delivery':
				case 'resume-pickup':
					OrderableMultistoreAdminSettings.resume_orders.bind( this )(
						data
					);

				default:
					break;
			}
		},

		/**
		 * Fires after requesting to change the status of the location.
		 */
		always_location_status_change() {
			$( this ).attr( 'disabled', false );
			$( this )
				.siblings( '.orderable-change-location-status__loading' )
				.addClass( 'orderable-change-location-status__loading-hidden' );
		},

		/**
		 * Send a request to pause orders for today.
		 *
		 * @param {Object} data The data sent in the request.
		 */
		pause_orders_for_today( data ) {
			function on_success( response ) {
				$( this ).text( response?.data?.button_label );
				$( this ).attr(
					'data-change-to',
					response?.data?.data_change_to_attribute
				);
				$( this )
					.parents( 'tr' )
					.find( '.orderable_store_status' )
					.text( response?.data?.status );
			}

			function on_error( response ) {
				const error_message =
					response?.responseJSON?.data ||
					orderable_pro_multi_location_list_table_admin?.i18n
						?.error_message;

				$( '.orderable-change-location-status__error-message' )
					.removeClass( 'orderable-change-location-status--hidden' )
					.text( error_message );
			}

			$.post(
				orderable_pro_multi_location_list_table_admin.ajax_url,
				data
			)
				.done( on_success.bind( this ) )
				.fail( on_error.bind( this ) )
				.always(
					OrderableMultistoreAdminSettings.always_location_status_change.bind(
						this
					)
				);
		},

		/**
		 * Send a request to resume orders.
		 *
		 * @param {Object} data The data sent in the request.
		 */
		resume_orders( data ) {
			function on_success( response ) {
				$( this ).text( response?.data?.button_label );
				$( this ).attr(
					'data-change-to',
					response?.data?.data_change_to_attribute
				);
				$( this )
					.parents( 'tr' )
					.find( '.orderable_store_status' )
					.text( response?.data?.status );
			}

			function on_error( response ) {
				const error_message =
					response?.responseJSON?.data ||
					orderable_pro_multi_location_list_table_admin?.i18n
						?.error_message;

				$( '.orderable-change-location-status__error-message' )
					.removeClass( 'orderable-change-location-status--hidden' )
					.text( error_message );
			}

			$.post(
				orderable_pro_multi_location_list_table_admin.ajax_url,
				data
			)
				.done( on_success.bind( this ) )
				.fail( on_error.bind( this ) )
				.always(
					OrderableMultistoreAdminSettings.always_location_status_change.bind(
						this
					)
				);
		},
	};

	$( document ).ready( OrderableMultistoreAdminSettings.init );
} )( jQuery );
