( function ( $, document ) {
	$( document ).ready( function () {
		/**
		 * Block the UI using the #orderable-tip element.
		 */
		function blockUI() {
			$( '#orderable-tip' ).block( {
				message: null,
				overlayCSS: {
					background: '#fff',
					opacity: 0.6,
				},
			} );
		}

		/**
		 * Unblock the UI using the #orderable-tip element.
		 */
		function unblockUI() {
			$( '#orderable-tip' ).unblock();
		}

		$( '.wp-block-woocommerce-checkout' ).on(
			'click',
			'.orderable-tip__button',
			function () {
				if ( 'custom_tip' === $( this ).attr( 'data-index' ) ) {
					return;
				}

				blockUI();

				wc.blocksCheckout // eslint-disable-line no-undef
					.extensionCartUpdate( {
						namespace: 'orderable-pro/tip',
						data: {
							index: $( this ).attr( 'data-index' ),
							amount: $( this ).attr( 'data-value' ),
						},
					} )
					.finally( () => {
						unblockUI();
					} );
			}
		);

		$( '.wp-block-woocommerce-checkout' ).on(
			'click',
			'.orderable-tip__custom-form-button',
			function () {
				const amount = $( this )
					.parents( '.orderable-tip__custom-form' )
					.find( '.orderable-tip__custom-form-field' )
					.val();

				blockUI();

				wc.blocksCheckout // eslint-disable-line no-undef
					.extensionCartUpdate( {
						namespace: 'orderable-pro/tip',
						data: {
							index: $( this ).attr( 'data-index' ),
							amount,
						},
					} )
					.finally( () => {
						unblockUI();
					} );
			}
		);
	} );
} )( jQuery, document ); // eslint-disable-line no-undef
