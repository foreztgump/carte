(function($) {
	"use strict";


$(document).on( 'click', '.remove-group', function() {
	$(this).parent().remove();
} )


let t = $(document).find('[data-count]'),
	gCount = t.length,
	text = restrofoodwooobj.get_text;


$('.add-group').on( 'click', function(e) {
e.preventDefault();

	let mka = [],
		s = $(document).find('[data-count]');
	// check is exists the count
	$(s).each( function( i, item ) {
		let c = $(item).data('count');
		mka.push(c);

	} )
	
	//
	if( $.inArray( gCount, mka ) != -1 ) {
		gCount = ++gCount;
		
	}

    // deep clone the targeted row
    let new_row = '';

	  	new_row += '<div class="restrofood-fields-group" data-count="'+gCount+'">';

			new_row += '<div class="group-title-wrapper group-title-wrapper-list-type form-field">';
				new_row +=	'<label>'+text.list_type+'</label>';
				new_row +=	'<div class="group-title-wrapper-list-type-inner">';
				new_row +=		'<div>';
				new_row +=			'<span>'+text.checkbox+'</span>';
				new_row +=			'<input type="radio" name="extra_featured['+gCount+'][list_type]" value="checkbox" class="group-title featured-list-type" checked />';
				new_row +=		'</div>';
				new_row +=		'<div>';
				new_row +=			'<span>'+text.radio+'</span>';
				new_row +=			'<input type="radio" name="extra_featured['+gCount+'][list_type]" value="radio" class="group-title featured-list-type" />';
				new_row +=		'</div>';
				new_row +=	'</div>';
			new_row += '</div>';
			new_row += '<p class="group-title-wrapper form-field">';
				new_row += '<label>'+text.feature_section_title+'</label>';
				new_row += '<input type="text" name="extra_featured['+gCount+'][group_title]" class="group-title" />';
			new_row += '</p>';
			new_row += '<p class="group-title-wrapper form-field">';
				new_row += '<label>'+text.min_required_number+'</label>';
				new_row += '<input type="number" name="extra_featured['+gCount+'][group_required_number]" class="group-title" />';
			new_row += '</p>';
			new_row += '<p class="group-title-wrapper restrofood-required-number-max form-field">';
				new_row += '<label>'+text.max_required_number+'</label>';
				new_row += '<input type="number" name="extra_featured['+gCount+'][group_required_number_max]" class="group-title" />';
			new_row += '</p>';
			new_row += '<div class="field-repeater-wrapper">';
				new_row += '<div class="field-repeater-inner">';
					new_row += '<div data-child-count="0" class="field-repeater">';
						new_row += '<input type="text" placeholder="'+text.frature_title+'" name="extra_featured['+gCount+'][group_feature][0][title]" class="group-title" />';
						new_row += '<input type="text" placeholder="'+text.price+'" name="extra_featured['+gCount+'][group_feature][0][price]" class="group-title" />';
						new_row += '<span class="remove-repeater-field fb-btn">'+text.remove+'</span>';
					new_row += '</div>';
				new_row += '</div>';
				new_row += '<button class="add-repeater-field fb-btn fb-btn-margin-top fb-btn-margin-bottom">'+text.add+'</button>';
			new_row += '</div>';
			new_row += '<span class="remove-group fb-btn fb-btn-margin-top">'+text.remove_group+'</span>';
		new_row += '</div>';
		gCount++;
    // append the new row to the table
    $('.restrofood-extra-featured-inner').append( new_row );


} )


// Add repeater field for extra  features

let gChildCount;

$(document).on( 'click', '.add-repeater-field', function(e) {

	e.preventDefault();

	var $this = $(this),
		$topParent = $this.parent().parent();

	gChildCount = $topParent.find( '.field-repeater:last-child' ).data('child-count');
	gChildCount = gChildCount ? gChildCount : 0;
	gChildCount++;

	var groupCount = $topParent.data('count');

	var inner = $this.parent().find('.field-repeater-inner');

	var $new_repeater = '';

	$new_repeater += '<div data-child-count="'+gChildCount+'" class="field-repeater">';
	$new_repeater +='<input type="text" placeholder="'+text.frature_title+'" name="extra_featured['+groupCount+'][group_feature]['+gChildCount+'][title]" class="group-title" />';
	$new_repeater +='<input type="text" placeholder="'+text.price+'" name="extra_featured['+groupCount+'][group_feature]['+gChildCount+'][price]" class="group-title" />';
	$new_repeater +='<span class="remove-repeater-field fb-btn">'+text.remove+'</span>';
	$new_repeater +='</div>';
	
	inner.append( $new_repeater );

} )


// Add repeater field for nutrition information

var $nCount = $( '.nutrition-repeater-field' ).length;

$(document).on( 'click', '.add-nutrition-repeater-field', function(e) {

	e.preventDefault();
	var $this = $(this);
	var inner = $this.parent().find('.nutrition-field-repeater-inner');

	var $new_repeater = '';

	$new_repeater += '<div class="field-repeater nutrition-repeater-field">';
	$new_repeater +='<input type="text" placeholder="'+text.nutrition_title+'" name="nutrition_information['+$nCount+'][title]" class="group-title" />';
	$new_repeater +='<input type="text" placeholder="'+text.quantity+'" name="nutrition_information['+$nCount+'][quantity]" class="group-title" />';
	$new_repeater +='<span class="remove-repeater-field fb-btn">'+text.remove+'</span>';
	$new_repeater +='</div>';

	$nCount++;

	inner.append( $new_repeater );

} )

// remove repeater field

$(document).on( 'click', '.remove-repeater-field', function() {

	var $this = $( this );
	$this.parent().remove();

} )

/**
 * [description]
 * @param  {[type]} ) {	let        $this [description]
 * @return {[type]}   [description]
 */

$(document).on( 'click', '.featured-list-type', function() {
	
	let $this = $(this),
		$t = $this.closest('.restrofood-fields-group').find('.restrofood-required-number-max');

	if( $this.val() == 'radio' ) {
		$t.hide();
	} else {
		$t.show();
	}

} )
//
$("input[value='radio']").each( function() {

	if( $(this).is(':checked') && $(this).val() == 'radio' ) {
		$(this).closest('.restrofood-fields-group').find('.restrofood-required-number-max').hide();
	}
	
} )



})(jQuery)