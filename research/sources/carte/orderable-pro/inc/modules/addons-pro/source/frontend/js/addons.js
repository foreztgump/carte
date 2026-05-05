( function ( $, document ) {
	'use strict';

	var orderable_addons = {
		/**
		 * On ready.
		 */
		on_ready() {
			orderable_addons.init_visual_fields();

			// Update Fees.
			$(
				'.orderable-product-fields input, .orderable-product-fields select'
			).change( function () {
				orderable_addons.update_price( $( this ) );
			} );

			// Update fee when variation is selected/changed.
			$( document ).on(
				'orderable_variation_set',
				'.orderable-product__add-to-order',
				function ( e, variation_data ) {
					if ( ! variation_data.variation_id ) {
						return;
					}

					const $field_group = $( this )
						.closest( '.orderable-drawer' )
						.find( '.orderable-product-fields-group' );
					if ( ! $field_group.length ) {
						return;
					}

					const $field_group_wrap = $field_group.closest(
						'.orderable-product-fields-group-wrap'
					);
					$field_group_wrap.data(
						'regular-price',
						variation_data.variation.display_price
					);
					$field_group_wrap.data(
						'price',
						variation_data.variation.display_price
					);

					orderable_addons.update_price(
						$( '.orderable-product-fields' ).eq( 0 )
					);
				}
			);

			// Run update_price() on page load.
			$( '.orderable-product-fields-group' ).each( function () {
				const $input = $( this ).find( 'input,select' ).eq( 0 );
				orderable_addons.update_price( $input );
			} );
		},

		/**
		 * Initialise visual fields.
		 */
		init_visual_fields() {
			$(
				'.orderable-product-fields--visual .orderable-product-option'
			).click( function () {
				const $input = $( this ).find( 'input' );
				$input.prop( 'checked', ! $input.prop( 'checked' ) );
				$input.trigger( 'change' );
			} );

			$( '.orderable-product-option__hidden-field' ).change(
				orderable_addons.select_deselect_visual_field
			);

			$( '.orderable-product-option__hidden-field' ).each( function () {
				orderable_addons.select_deselect_visual_field( this );
			} );
		},

		/**
		 * Select/Deselect visual fields.
		 *
		 * @param Element _this (Optional) HTML DOM element for checkbox or
		 *                radio input which was changed. If not passed, will get from $(this).
		 * @param _this
		 */
		select_deselect_visual_field( _this ) {
			const this_field =
				_this instanceof Element ? $( _this ) : $( this );
			const $field_parent = this_field.closest(
				'.orderable-product-fields__field'
			);

			if ( ! $field_parent ) {
				return;
			}

			const is_max_selection_limit = $field_parent.hasClass(
					'orderable-product-fields__field--has-max-selection'
				),
				max_selection_limit = $field_parent.data( 'max-selection' );

			if ( is_max_selection_limit ) {
				const selections = $field_parent.find(
					'.orderable-product-option__hidden-field:checked'
				).length;
				if ( selections > max_selection_limit ) {
					this_field.prop( 'checked', false );
					jQuery(
						'.orderable-product-fields__max-selection-error'
					).show();
				} else {
					jQuery(
						'.orderable-product-fields__max-selection-error'
					).hide();
				}
			}

			$field_parent
				.find( '.orderable-product-option' )
				.each( function () {
					const $option = $( this );
					const $input = $option.find(
						'.orderable-product-option__hidden-field'
					);
					if ( $input.is( ':checked' ) ) {
						$option.addClass( 'orderable-product-option--checked' );
					} else {
						$option.removeClass(
							'orderable-product-option--checked'
						);
					}
				} );
		},

		/**
		 * Update Price when a field is changed.
		 *
		 * @param {jQuery Object} $field jQuery instance of the Field which was changed.
		 */
		update_price( $field ) {
			let $field_group_wrap = $field.closest(
					'.orderable-product-fields-group-wrap'
				),
				$product = $field.closest( '.orderable-product, .product' ),
				$price = $product.find(
					'.orderable-product__actions-price, p.price'
				),
				price = parseFloat( $field_group_wrap.data( 'price' ) ),
				regular_price = parseFloat(
					$field_group_wrap.data( 'regular-price' )
				),
				fees = orderable_addons.calculate_price( $field_group_wrap ),
				is_sale = price !== regular_price,
				new_sale_price = price + fees;

			price = accounting.formatMoney( new_sale_price, {
				symbol:
					'<span class="woocommerce-Price-currencySymbol">' +
					orderable_addons_pro_params.currency.format_symbol +
					'</span>',
				decimal:
					orderable_addons_pro_params.currency.format_decimal_sep,
				thousand:
					orderable_addons_pro_params.currency.format_thousand_sep,
				precision:
					orderable_addons_pro_params.currency.format_num_decimals,
				format: orderable_addons_pro_params.currency.format,
			} );

			if ( is_sale ) {
				let new_regular_price = fees + regular_price;

				new_regular_price = accounting.formatMoney( new_regular_price, {
					symbol:
						'<span class="woocommerce-Price-currencySymbol">' +
						orderable_addons_pro_params.currency.format_symbol +
						'</span>',
					decimal:
						orderable_addons_pro_params.currency.format_decimal_sep,
					thousand:
						orderable_addons_pro_params.currency
							.format_thousand_sep,
					precision:
						orderable_addons_pro_params.currency
							.format_num_decimals,
					format: orderable_addons_pro_params.currency.format,
				} );

				$price
					.find( 'del bdi' )
					.replaceWith( '<bdi>' + new_regular_price + '</bdi>' );
				$price
					.find( 'ins bdi' )
					.replaceWith( '<bdi>' + price + '</bdi>' );
			} else {
				$price.find( 'bdi' ).replaceWith( '<bdi>' + price + '</bdi>' );
			}
		},

		/**
		 * Calculate fees/price as per selected addons.
		 *
		 * @param {jQuery Object} $field_group jQuery Instance of '.orderable-product-fields-group-wrap'
		 *                                     We pass this argument so we can handle conditions where we have multilpe field groups
		 *                                     on a same page. Example: Bundled products plugin.
		 */
		calculate_price( $field_group ) {
			let fees_sum = 0;

			// Loop through all the field.
			$field_group.find( '.orderable-product-fields' ).each( function () {
				// Loop through all the options in field.
				$( this )
					.find( '[data-product-option]' )
					.each( function () {
						const $option = $( this );
						// Add fees to the sum if option is selected.
						if ( orderable_addons.is_option_selected( $option ) ) {
							const this_fees = $( this ).data( 'fees' );
							if ( this_fees && ! isNaN( this_fees ) ) {
								fees_sum += parseFloat( this_fees );
							}
						}
					} );
			} );

			return fees_sum;
		},

		/**
		 * Is option selected?
		 *
		 * @param {jQuery Object} $option Option can be <option> or .orderable-product-option
		 */
		is_option_selected( $option ) {
			if ( ! $option ) {
				return false;
			}

			if ( $option.is( 'div' ) ) {
				return $option.hasClass( 'orderable-product-option--checked' );
			} else if ( $option.is( 'option' ) ) {
				return $option.is( ':selected' );
			}
		},
	};

	/**
	 * Field validation related functions.
	 */
	var field_validator = {
		/**
		 * On ready.
		 */
		on_ready() {
			const debounced_validate = field_validator.debounce(
				field_validator.validate,
				300
			);
			$(
				'.orderable-product-fields input, .orderable-product-fields select, .orderable-product-fields textarea'
			).change( field_validator.validate );
			$(
				'.orderable-product-fields input, .orderable-product-fields select, .orderable-product-fields textarea'
			).keyup( debounced_validate );
			field_validator.validate();
			field_validator.validate_single_product_page();
		},

		/**
		 * Run validation.
		 */
		validate() {
			$( '.orderable-product-fields--required' ).each( function () {
				const $field_wrap = $( this ).hasClass(
					'orderable-product-fields--visual'
				)
					? $( this )
					: $( this ).find( 'select, input, textarea' );
				if ( ! field_validator.validate_field( $( this ) ) ) {
					$field_wrap.addClass( 'orderable-field--invalid' );
					$(
						'.orderable-drawer .orderable-product__add-to-order, .orderable-drawer .orderable-product__update-cart-item'
					).attr( 'disabled', 'disabled' );
				} else {
					$field_wrap.removeClass( 'orderable-field--invalid' );
				}
			} );
		},

		/**
		 * Run validation when Add to cart button is clicked on Single Product page.
		 */
		validate_single_product_page() {
			$( '.single-product form.cart' ).submit( function () {
				field_validator.validate();
				if ( $( this ).find( '.orderable-field--invalid' ).length ) {
					alert( orderable_addons_pro_params.i18n.make_a_selection );
					return false;
				}
			} );
		},

		/**
		 * Check if the field is valid.
		 *
		 * @param {jQuery Object} $field_wrap jQuery Instance of .orderable-product-fields
		 */
		validate_field( $field_wrap ) {
			// If field is not 'required' then return true.
			if (
				! $field_wrap.hasClass( 'orderable-product-fields--required' )
			) {
				return true;
			}

			if (
				$field_wrap.hasClass(
					'orderable-product-fields--visual_radio'
				) ||
				$field_wrap.hasClass(
					'orderable-product-fields--visual_checkbox'
				)
			) {
				// If there is one checked input then this field is fine, else return false.
				return $field_wrap.find( 'input:checked' ).length;
			}

			if ( $field_wrap.hasClass( 'orderable-product-fields--select' ) ) {
				return '' === $field_wrap.find( 'select' ).val() ? false : true;
			}

			if (
				$field_wrap.hasClass( 'orderable-product-fields--select' ) ||
				$field_wrap.hasClass( 'orderable-product-fields--text' )
			) {
				return '' ===
					$field_wrap.find( 'select, input, textarea' ).val()
					? false
					: true;
			}
		},

		/**
		 * Debounce function.
		 *
		 * @param function  func Function to debounce.
		 * @param int       wait Time to wait in milliseconds.
		 * @param boolean   immediate Trigger the function on the leading edge, instead of the trailing.
		 * @param func
		 * @param wait
		 * @param immediate
		 * @return
		 */
		debounce( func, wait, immediate ) {
			let timeout;
			return function () {
				const context = this,
					args = arguments;
				const later = function () {
					timeout = null;
					if ( ! immediate ) {
						func.apply( context, args );
					}
				};
				const callNow = immediate && ! timeout;
				clearTimeout( timeout );
				timeout = setTimeout( later, wait );
				if ( callNow ) {
					func.apply( context, args );
				}
			};
		},
	};

	$( document.body ).on(
		'orderable-drawer.opened',
		orderable_addons.on_ready
	);
	$( document.body ).on(
		'orderable-drawer.opened',
		field_validator.on_ready
	);
	$( document ).ready( orderable_addons.on_ready );
	$( document ).ready( field_validator.on_ready );
} )( jQuery, document );
