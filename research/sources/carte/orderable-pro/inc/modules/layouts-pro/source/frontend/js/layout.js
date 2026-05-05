( function ( $ ) {
	$( '.orderable-product-layout-ordering' ).on(
		'change',
		'select.orderable-product-layout-ordering__select',
		function () {
			$( this ).closest( 'form' ).trigger( 'submit' );
		}
	);
} )( jQuery );
