(function( $, document ) {
	"use strict";

	var orderable_addons = {
		/**
		 * On ready.
		 */
		on_ready: function () {
			orderable_addons.init_visual_fields();

			// Update Fees.
			$( '.orderable-product-fields input, .orderable-product-fields select' ).change( function () {
				orderable_addons.update_price( $( this ) );
			} );

			// Run update_price() on page load.
			$( '.orderable-product-fields-group' ).each( function () {
				var $input = $( this ).find( 'input,select' ).eq( 0 );
				orderable_addons.update_price( $input );
			} );
		},

		/**
		 * Initialise visual fields.
		 */
		init_visual_fields: function () {
			$( ".orderable-product-fields--visual .orderable-product-option" ).click( function () {
				var $input = $( this ).find( "input" );
				$input.prop( 'checked', !$input.prop( 'checked' ) );
				$input.trigger( 'change' );
			} );

			$( ".orderable-product-option__hidden-field" ).change( orderable_addons.select_deselect_visual_field );
			
			$( ".orderable-product-option__hidden-field" ).each( function() {
				orderable_addons.select_deselect_visual_field( this );
			} );
		},

		/**
		 * Select/Deselect visual fields.
		 *
		 * @param Element _this (Optional) HTML DOM element for checkbox or 
		 * radio input which was changed. If not passed, will get from $(this).
		 */
		select_deselect_visual_field: function ( _this ) {
			var this_field = _this instanceof Element ? $( _this ) : $( this );
			var $field_parent = this_field.closest( '.orderable-product-fields__field' );
			
			if ( ! $field_parent ) {
				return;
			}

			$field_parent.find( ".orderable-product-option" ).each( function () {
				var $option = $( this );
				var $input  = $option.find( ".orderable-product-option__hidden-field" );
				if ( $input.is( ":checked" ) ) {
					$option.addClass( 'orderable-product-option--checked' );
				} else {
					$option.removeClass( 'orderable-product-option--checked' );
				}

			} );
		},

		/**
		 * Update Price when a field is changed.
		 *
		 * @param {jQuery Object} $field jQuery instance of the Field which was changed.
		 */
		update_price: function ( $field ) {
			var $field_group = $field.closest( '.orderable-product-fields-group' ),
				$product = $field.closest( '.orderable-product, .product' ),
				$price = $product.find( '.orderable-product__actions-price, p.price' ),
				price = $field_group.data( 'price' ),
				regular_price = $field_group.data( 'regular-price' ),
				fees = orderable_addons.calculate_price( $field_group ),
				is_sale = price !== regular_price,
				new_sale_price = price + fees;

			price = accounting.formatMoney( new_sale_price, {
				symbol: '<span class="woocommerce-Price-currencySymbol">' + orderable_addons_pro_params.currency.format_symbol + '</span>',
				decimal: orderable_addons_pro_params.currency.format_decimal_sep,
				thousand: orderable_addons_pro_params.currency.format_thousand_sep,
				precision: orderable_addons_pro_params.currency.format_num_decimals,
				format: orderable_addons_pro_params.currency.format
			} );
			
			if ( is_sale ) {
				var new_regular_price = fees + regular_price;

				new_regular_price = accounting.formatMoney( new_regular_price, {
					symbol: '<span class="woocommerce-Price-currencySymbol">' + orderable_addons_pro_params.currency.format_symbol + '</span>',
					decimal: orderable_addons_pro_params.currency.format_decimal_sep,
					thousand: orderable_addons_pro_params.currency.format_thousand_sep,
					precision: orderable_addons_pro_params.currency.format_num_decimals,
					format: orderable_addons_pro_params.currency.format
				} );

				$price.find( 'del bdi' ).replaceWith( '<bdi>' + new_regular_price + '</bdi>' );
				$price.find( 'ins bdi' ).replaceWith( '<bdi>' + price + '</bdi>' );
			} else {
				$price.find( 'bdi' ).replaceWith( '<bdi>' + price + '</bdi>' );
			}
		},

		/**
		 * Calculate fees/price as per selected addons.
		 *
		 * @param {jQuery Object} $field_group jQuery Instance of '.orderable-product-fields-group'
		 * We pass this argument so we can handle conditions where we have multilpe field groups 
		 * on a same page. Example: Bundled products plugin.
		 */
		calculate_price: function ( $field_group ) {
			var fees_sum = 0;

			// Loop through all the field.
			$field_group.find( '.orderable-product-fields' ).each( function () {
				// Loop through all the options in field.
				$( this ).find( "[data-product-option]" ).each( function () {
					var $option = $( this );
					// Add fees to the sum if option is selected.
					if ( orderable_addons.is_option_selected( $option ) ) {
						var this_fees = $( this ).data( 'fees' );
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
		is_option_selected: function ( $option ) {
			if ( !$option ) {
				return false;
			}

			if ( $option.is( 'div' ) ) {
				return $option.hasClass( 'orderable-product-option--checked' );
			}
			else if ( $option.is( 'option' ) ) {
				return $option.is( ':selected' );
			}
		}

	};

	/**
	 * Field validation related functions.
	 */
	var field_validator = {
		/**
		 * On ready.
		 */
		 on_ready: function () {
			$( '.orderable-product-fields input, .orderable-product-fields select, .orderable-product-fields textarea' ).change( field_validator.validate );
			$( '.orderable-product-fields input, .orderable-product-fields select, .orderable-product-fields textarea' ).keyup( field_validator.validate );
			field_validator.validate();
		},

		/**
		 * Run validation.
		 */
		validate: function () {
			$( '.orderable-product-fields--required' ).each( function () {
				var $field_wrap = $( this ).hasClass( 'orderable-product-fields--visual' ) ? $( this ) : $( this ).find( 'select, input, textarea' );
				if ( !field_validator.validate_field( $( this ) ) ) {
					$field_wrap.addClass( 'orderable-field--invalid' );
				} else {
					$field_wrap.removeClass( 'orderable-field--invalid' );
				}
			} );
		},

		/**
		 * Check if the field is valid.
		 *
		 * @param {jQuery Object} $field_wrap jQuery Instance of .orderable-product-fields
		 */
		 validate_field: function ( $field_wrap ) {
			// If field is not 'required' then return true.
			if ( !$field_wrap.hasClass( 'orderable-product-fields--required' ) ) {
				return true;
			}
			
			if ( $field_wrap.hasClass( 'orderable-product-fields--visual_radio' ) || $field_wrap.hasClass( 'orderable-product-fields--visual_checkbox' ) ) {
				// If there is one checked input then this field is fine, else return false.
				return $field_wrap.find( 'input:checked' ).length;
			}

			if ( $field_wrap.hasClass( 'orderable-product-fields--select' ) ) {
				return '' === $field_wrap.find( 'select' ).val() ? false : true;
			}
		}
	};

	$( document.body ).on( 'orderable-drawer.opened', orderable_addons.on_ready );
	$( document.body ).on( 'orderable-drawer.opened', field_validator.on_ready );
	$( document ).ready( orderable_addons.on_ready );
	$( document ).ready( field_validator.on_ready );
}( jQuery, document ));
(function( $, document ) {
	"use strict";

	var orderable_cart_bumps = {
		/**
		 * On ready.
		 */
		on_ready: function() {
			orderable_cart_bumps.init_slider();
			$( document.body ).on( 'orderable-drawer.opened', orderable_cart_bumps.init_slider );
			// $( document ).on( 'wc_update_cart added_to_cart', orderable_cart_bumps.init_slider );
			$( document.body ).on( 'removed_from_cart', orderable_cart_bumps.init_slider );
		},

		/**
		 * Init bumps slider.
		 */
		init_slider: function() {
			$( '.orderable-cart-bumps' ).flexslider( {
				namespace: 'orderable-cart-bumps-slider-',
				selector: '.orderable-cart-bumps__contents > .orderable-cart-bumps__bump',
				animation: 'slide',
				directionNav: false,
				start: function() {
					$( window ).resize();
				}
			} );
		}
	};

	$( document ).ready( orderable_cart_bumps.on_ready );
}( jQuery, document ));