( function ( $ ) {
	var orderable_cos = {
		/**
		 * Init.
		 */
		init() {
			if ( $( '#orderable_cos_nextstep' ).length ) {
				$( '#orderable_cos_nextstep' ).select2();
			}

			if ( $( '#orderable_cos_color' ).length ) {
				$( '#orderable_cos_color' ).wpColorPicker();
			}

			$( '#title' ).change( orderable_cos.set_slug_on_title_change );

			$( '#orderable_cos_status_type' ).change(
				orderable_cos.on_status_change
			);

			if (
				'orderable_status' === pagenow ||
				'edit-orderable_status' === pagenow
			) {
				$( document ).on(
					'click',
					'.submitdelete',
					orderable_cos.on_status_post_delete
				);
			}

			orderable_cos.check_if_slug_already_exists();
			orderable_cos.validate_form();
		},

		/**
		 * Set slug on title change.
		 */
		set_slug_on_title_change() {
			if (
				$( '#orderable_cos_slug' ).length &&
				! $( '#orderable_cos_slug' ).prop( 'readonly' )
			) {
				const title = $( '#title' ).val();
				const slug = title
					.toLowerCase()
					.replace( /[^a-z0-9 -]/g, '' )
					.replace( /\s+/g, '-' )
					.replace( /-+/g, '-' )
					.replace( /^-+/, '' )
					.replace( /-+$/, '' )
					.slice( 0, 17 );
				$( '#orderable_cos_slug' ).val( slug );
			}
		},

		/**
		 * On status type change.
		 */
		on_status_change() {
			const val = $( this ).val();

			if ( 'custom' === val ) {
				$( '#orderable_cos_slug' ).val( '' );
				$( '#orderable_cos_slug' ).prop( 'readonly', false );
			} else {
				$( '#orderable_cos_slug' ).val( val );
				$( '#orderable_cos_slug' ).prop( 'readonly', true );
				$( '#orderable_cos_slug' ).removeClass(
					'orderable-field-error'
				);
				$(
					'.orderable-fields-row__body-row-right--slug .orderable-field-error-message'
				).text( '' );
			}
		},

		/**
		 * When Status Post is deleted.
		 * @param {*} e
		 */
		on_status_post_delete( e ) {
			if (
				! confirm(
					orderable_pro_custom_order_status.i18n.move_to_trash
				)
			) {
				e.preventDefault();
			}
		},

		/**
		 * Check if slug already exists.
		 */
		check_if_slug_already_exists() {
			const debounced_keyup = orderable_cos.debounce( function () {
				if ( ! $( '#orderable_cos_slug' ).val() ) {
					return;
				}

				$.ajax( {
					url: ajaxurl,
					type: 'POST',
					data: {
						action: 'orderable_cos_check_slug_exists',
						slug: $( '#orderable_cos_slug' ).val(),
						nonce: orderable_pro_custom_order_status.nonce,
					},
				} ).done( function ( response ) {
					if ( ! response.success ) {
						$( '#orderable_cos_slug' ).addClass(
							'orderable-field-error'
						);
						$(
							'.orderable-fields-row__body-row-right--slug .orderable-field-error-message'
						).text( response.data.message );
					} else {
						$( '#orderable_cos_slug' ).removeClass(
							'orderable-field-error'
						);
						$(
							'.orderable-fields-row__body-row-right--slug .orderable-field-error-message'
						).text( '' );
					}
				} );
			} );

			$( '#orderable_cos_slug' ).keyup( debounced_keyup );
		},

		/**
		 * Debounce function.
		 *
		 * @param {Function} func
		 * @param {int}      timeout
		 * @return
		 */
		debounce( func, timeout = 300 ) {
			let timer;
			return ( ...args ) => {
				clearTimeout( timer );
				timer = setTimeout( () => {
					func.apply( this, args );
				}, timeout );
			};
		},

		validate_form() {
			$( '#post' ).submit( function () {
				if (
					$( '#orderable_cos_slug' ).hasClass(
						'orderable-field-error'
					)
				) {
					alert(
						orderable_pro_custom_order_status.i18n
							.slug_already_exists
					);
					return false;
				}

				const errors = wp.hooks.applyFilters(
					'orderable_cos_error_message',
					false
				);
			} );
		},
	};

	const orderable_icon_picker = {
		init() {
			$( '#orderable_cos_icon_family' )
				.change( function () {
					const icon_family = $( this ).val();
					$( '.orderable-cos-icons-field__list' ).hide();
					$(
						'.orderable-cos-icons-field__list--' + icon_family
					).show();
				} )
				.trigger( 'change' );

			$( '.orderable-cos-icons-field__icon' ).click( function () {
				const icon = $( this ).data( 'icon' );
				const icon_family = $( '#orderable_cos_icon_family' ).val();
				let icon_family_class = '';

				if ( 'fontawesome' === icon_family ) {
					icon_family_class = 'fa';
				} else if ( 'woocommerce' === icon_family ) {
					icon_family_class = 'wooicon';
				} else {
					icon_family_class = 'dashicons';
				}

				$( '#orderable_cos_icon' ).val( icon );
				$( '.orderable-cos-icons-field__icon' ).removeClass(
					'orderable-cos-icons-field__icon--selected'
				);
				$( this ).addClass(
					'orderable-cos-icons-field__icon--selected'
				);
				$( '#orderable-cos-icons-preview' )
					.removeClass()
					.addClass( icon_family_class )
					.addClass( icon );
			} );
		},
	};

	/**
	 * On ready.
	 */
	$( document ).ready( function () {
		orderable_cos.init();
		orderable_icon_picker.init();
	} );
} )( jQuery );
