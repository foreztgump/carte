( function ( $, document ) {
	$( document.body ).on(
		'change',
		'.orderable-product-fields input, .orderable-product-fields select',
		function () {
			const $field = $( this );
			const $field_group_wrap = $field.closest(
				'.orderable-product-fields-group-wrap'
			);

			let productPointsEarned = parseInt(
				$field_group_wrap.attr( 'data-points-earned' ),
				10
			);

			let addonPointsEarned = 0;
			$field_group_wrap
				.find( '[data-product-option]' )
				.each( function () {
					const $option = $( this );

					const isSelected =
						$option.is( ':selected' ) ||
						$option.hasClass( 'orderable-product-option--checked' );

					if ( ! isSelected ) {
						return;
					}

					const pointsEarned = Number(
						$option.attr( 'data-points-earned' )
					);

					if ( Number.isNaN( pointsEarned ) ) {
						return;
					}

					addonPointsEarned += pointsEarned;
				} );

			productPointsEarned = productPointsEarned + addonPointsEarned;

			if ( 'number' !== typeof productPointsEarned ) {
				return;
			}

			const pointsEarnedMessage = $field_group_wrap.attr(
				'data-points-earned-message'
			);

			const message = pointsEarnedMessage?.replace(
				'{points}',
				productPointsEarned
			);

			if ( ! message ) {
				return;
			}

			$( '.orderable-points-to-be-earned' ).html( message );
		}
	);
} )( jQuery, document );
