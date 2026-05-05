( function ( $, document ) {
	'use strict';

	var orderable_tip_pro = {
		/**
		 * On ready.
		 */
		on_ready() {
			$( document.body ).on(
				'click',
				'.orderable-tip__button',
				orderable_tip_pro.calculate_tip
			);
			$( document.body ).on(
				'click',
				'.orderable-tip__custom-form-button',
				orderable_tip_pro.update_checkout
			);
			orderable_tip_pro.handle_multiple_amount_fields();

			const $orderable_tip_element = $( '#orderable-tip' );

			if ( $orderable_tip_element.parent( 'form.checkout' ).length ) {
				return;
			}

			$( document.body ).on( 'update_checkout', function () {
				$orderable_tip_element.block( {
					message: null,
					overlayCSS: {
						background: '#fff',
						opacity: 0.6,
					},
				} );
			} );

			jQuery( document.body ).on( 'updated_checkout', function () {
				$orderable_tip_element.unblock();
			} );
		},
		calculate_tip() {
			const amount = $( this ).val();
			const index = $( this ).attr( 'data-index' );
			const $tip_parent = $( this ).closest( '#orderable-tip' );

			$( '.orderable_tip_index' ).val( index );
			$( '.orderable-tip__button' ).removeClass(
				'orderable-button--active'
			);
			$( this ).addClass( 'orderable-button--active' );

			if ( $( this ).hasClass( 'orderable-tip__button--custom' ) ) {
				$( '.orderable-tip__custom-form' ).addClass(
					'orderable-tip__custom-form--active'
				);
				$tip_parent.find( '.orderable-tip__custom-form-field' ).focus();
			} else {
				$( '.orderable-tip__custom-form' ).removeClass(
					'orderable-tip__custom-form--active'
				);
				$( '.orderable-tip__custom-form-field' ).val( amount );
				orderable_tip_pro.update_checkout();
			}

			return false;
		},
		update_checkout() {
			jQuery( 'body' ).trigger( 'update_checkout' );
		},

		/**
		 * If multiple amount fields exist (in page builder/custom checkout plugin)
		 * then copy value of one field to other.
		 */
		handle_multiple_amount_fields() {
			if ( $( '[name=tip_amount]' ).length <= 1 ) {
				return;
			}

			jQuery( document ).on( 'keyup', '[name=tip_amount]', function () {
				jQuery( '[name=tip_amount]' )
					.not( this )
					.val( jQuery( this ).val() );
			} );
		},
	};

	$( document ).ready( orderable_tip_pro.on_ready );
} )( jQuery, document );
