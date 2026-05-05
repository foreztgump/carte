function latepoint_is_timeframe_in_periods(timeframe_start, timeframe_end, periods_arr) {
  var is_inside = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  for (var i = 0; i < periods_arr.length; i++) {

    var period_start = 0;
    var period_end = 0;
    var buffer_before = 0;
    var buffer_after = 0;

    var period_info = periods_arr[i].split(':');
    if (period_info.length == 2) {
      period_start = period_info[0];
      period_end = period_info[1];
    } else {
      buffer_before = period_info[2];
      buffer_after = period_info[3];
      period_start = parseFloat(period_info[0]) - parseFloat(buffer_before);
      period_end = parseFloat(period_info[1]) + parseFloat(buffer_after);
    }
    if (is_inside) {
      if (latepoint_is_period_inside_another(timeframe_start, timeframe_end, period_start, period_end)) {
        return true;
      }
    } else {
      if (latepoint_is_period_overlapping(timeframe_start, timeframe_end, period_start, period_end)) {
        return true;
      }
    }
  }
  return false;
}

function latepoint_is_period_overlapping(period_one_start, period_one_end, period_two_start, period_two_end) {
  // https://stackoverflow.com/questions/325933/determine-whether-two-date-ranges-overlap/
  return period_one_start < period_two_end && period_two_start < period_one_end;
}

function latepoint_is_period_inside_another(period_one_start, period_one_end, period_two_start, period_two_end) {
  return period_one_start >= period_two_start && period_one_end <= period_two_end;
}


// Converts time in minutes to hours if possible, if minutes also exists - shows minutes too
function latepoint_minutes_to_hours_preferably(time) {
  var army_clock = latepoint_is_army_clock();

  var hours = Math.floor(time / 60);
  if (!army_clock && hours > 12) hours = hours - 12;

  var minutes = time % 60;
  if (minutes > 0) hours = hours + ':' + minutes;
  return hours;
}


function latepoint_minutes_to_hours(time) {
  var army_clock = latepoint_is_army_clock();

  var hours = Math.floor(time / 60);
  if (!army_clock && hours > 12) hours = hours - 12;
  return hours;
}


function latepoint_am_or_pm(minutes) {
  if (latepoint_is_army_clock()) return '';
  return (minutes < 720 || minutes == 1440) ? 'am' : 'pm';
}

function latepoint_hours_and_minutes_to_minutes(hours_and_minutes, ampm) {
  var hours_and_minutes_arr = hours_and_minutes.split(':');
  var hours = hours_and_minutes_arr[0];
  var minutes = hours_and_minutes_arr[1];
  if (ampm == "pm" && hours < 12) hours = parseInt(hours) + 12;
  if (ampm == "am" && hours == 12) hours = 0;
  minutes = parseInt(minutes) + (hours * 60);
  return minutes;
}

function latepoint_get_time_system() {
  return latepoint_helper.time_system;
}

function latepoint_is_army_clock() {
  return (latepoint_get_time_system() == '24');
}

function latepoint_minutes_to_hours_and_minutes(minutes) {
  var army_clock = latepoint_is_army_clock();
  var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '%02d:%02d';

  var hours = Math.floor(minutes / 60);
  if (!army_clock && (hours > 12)) hours = hours - 12;
  if (!army_clock && hours == 0) hours = 12;
  minutes = minutes % 60;
  return sprintf(format, hours, minutes);
}


function latepoint_timestamped_ajaxurl(){
    let url = latepoint_helper.ajaxurl;
    let timestamp = Date.now();

    // Check if the URL already has GET parameters
    if (url.includes('?')) {
        return `${url}&t=${timestamp}`;
    } else {
        return `${url}?t=${timestamp}`;
    }
}

function latepoint_random_generator() {
  var S4 = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

function latepoint_validate_form($form) {
  let errors = [];
  $form.find('select[data-os-validate], input[data-os-validate], textarea[data-os-validate]').each(function () {
    let validations = jQuery(this).data('os-validate').split(' ');
    let $input = jQuery(this);
    let label = $input.closest('.os-form-group').find('label').text();
    let field_has_errors = false;
    if (validations) {
      for (let i = 0; i < validations.length; i++) {
        switch (validations[i]) {
          case 'presence':
            if($input.is(':checkbox')){
              if (!$input.is(':checked')) {
                errors.push({message: label + ' ' + latepoint_helper.msg_validation_presence_checkbox});
                field_has_errors = true;
              }
            }else{
              if (!$input.val()) {
                errors.push({message: label + ' ' + latepoint_helper.msg_validation_presence});
                field_has_errors = true;
              }
            }
            break;
          case 'phone':
            if (!window.lp_intlTelInputGlobals.getInstance($input[0]).isValidNumber()) {
              errors.push({message: label + ' ' + latepoint_helper.msg_validation_invalid});
              field_has_errors = true;
            }
            break;
        }
      }
    }
    if (field_has_errors) {
      $input.closest('.os-form-group').addClass('os-invalid');
    } else {
      $input.closest('.os-form-group').removeClass('os-invalid');
    }
  });
  return errors;
}

function latepoint_create_form_data_from_non_form_element($elem) {
  let formData = new FormData();
  // create objecte from all input fields that are inside of the element
  let fields = $elem.find('select, input, textarea').serializeArray();
  if (fields) {
    fields.forEach(field => formData.append(field.name, field.value));
  }
  return formData;
}

function latepoint_create_form_data($form, route_name = false, extra_params = false) {
  let form_data = new FormData();
  let params = new FormData($form[0]);

  if (extra_params) {
    Object.keys(extra_params).forEach(key => {
      params.set(key, extra_params[key]);
    });
  }

  // get values from phone number fields
  if (('lp_intlTelInputGlobals' in window) && ('lp_intlTelInputUtils' in window)) {
    $form.find('input.os-mask-phone').each(function () {
      const phoneInputName = this.getAttribute('name');
      const phoneInputValue = window.lp_intlTelInputGlobals.getInstance(this).getNumber(window.lp_intlTelInputUtils.numberFormat.E164);
      // override value generated automatically by formdata with a formatted value of a phone field with country code
      params.set(phoneInputName, phoneInputValue);
    });
  }

  form_data.append('params', latepoint_formdata_to_url_encoded_string(params));
  form_data.append('action', latepoint_helper.route_action);
  form_data.append('route_name', route_name ? route_name : $form.data('route-name'));
  form_data.append('layout', 'none');
  form_data.append('return_format', 'json');

  let file_data;
  // put file data into main form_data object, since we can't send them in "params" string
  $form.find('input[type="file"]').each(function () {
    file_data = this.files; // get multiple files from input file
    let file_name = this.getAttribute("name");
    for (let i = 0; i < file_data.length; i++) {
      form_data.append(file_name + '[]', file_data[i]);
    }
  });
  return form_data;
}

function latepoint_mask_timefield($elem) {
  if (jQuery().inputmask) {
    $elem.inputmask({
      'mask': '99:99',
      'placeholder': 'HH:MM'
    });
  }
}

function latepoint_formdata_to_url_encoded_string(form_data) {
  let filtered_form_data = new FormData();
  // remove file fields from params, so we can serialize it into string,
  // !important, this will not include file fields into the form_data, so you have to include them manually, see latepoint_create_form_data() that does it
  // note: we don't use form_data.remove(key) on original object because we might want to preserve it
  for (const [key, value] of form_data) {
    if (value instanceof File) continue;
    if (key.slice(-2) === '[]') {
      // expecting array, append
      filtered_form_data.append(key, value);
    } else {
      filtered_form_data.set(key, value);
    }
  }
  return new URLSearchParams(filtered_form_data).toString();
}

function latepoint_mask_percent($elem) {
  if (jQuery().inputmask) {
    $elem.inputmask({
      'alias': 'decimal',
      'radixPoint': latepoint_helper.decimal_separator,
      'digits': 4,
      'digitsOptional': false,
      'suffix': '%',
      'placeholder': '0',
      'rightAlign': false
    });
  }
}

function latepoint_mask_minutes($elem) {
  if (jQuery().inputmask) {
    $elem.inputmask({
      'removeMaskOnSubmit': true,
      'alias': 'numeric',
      'digits': 0,
      'suffix': latepoint_helper.msg_minutes_suffix,
      'placeholder': '0',
      'rightAlign': false
    });
  }
}


function latepoint_mask_money($elem) {
  if (jQuery().inputmask) {
    $elem.inputmask({
      'alias': 'currency',
      'groupSeparator': latepoint_helper.thousand_separator,
      'radixPoint': latepoint_helper.decimal_separator,
      'digits': latepoint_helper.number_of_decimals,
      'digitsOptional': false,
      'prefix': latepoint_helper.currency_symbol_before ? latepoint_helper.currency_symbol_before + ' ' : '',
      'suffix': latepoint_helper.currency_symbol_after ? ' ' + latepoint_helper.currency_symbol_after : '',
      'placeholder': '0',
      'rightAlign': false
    });
  }
}

function latepoint_mask_date($elem) {
  if (jQuery().inputmask) {
    $elem.inputmask({
      'alias': 'datetime',
      'inputFormat': latepoint_helper.date_format_for_js
    });
  }
}

function latepoint_init_phone_masking_from_placeholder($input) {
  if (!latepoint_helper.mask_phone_number_fields) return;
  let format = $input.attr('placeholder');
  if (format && jQuery().inputmask) {
    $input.inputmask(format.replace(/[0-9]/g, 9));
  }
}

function latepoint_mask_phone($elem) {
  let jsElem = $elem[0];

  // First priority is to prevent duplicates (common in non-document.body contexts)
  if (jsElem && !window.lp_intlTelInputGlobals.getInstance(jsElem)) {
    let dropdownContainer = document.body;

    let onlyCountries = JSON.parse(latepoint_helper.included_phone_countries);
    // Remedy a quirk with json_encode(EMPTY_ARRAY)
    if (onlyCountries.length === 1 && onlyCountries[0] === "") {
      onlyCountries = [];
    }
    const preferredCountries = onlyCountries.length ? [] : window.lp_intlTelInputGlobals.defaults.preferredCountries;

    // remove country name in english and only use names in country language
    var countryData = window.lp_intlTelInputGlobals.getCountryData();

    for (var i = 0; i < countryData.length; i++) {
      var country = countryData[i];
      country.name = country.name.replace(/ *\([^)]*\) */g, "");
    }

    let defaultCountryCode = latepoint_helper.default_phone_country;
    if (onlyCountries.length && !onlyCountries.includes(defaultCountryCode)) {
      defaultCountryCode = onlyCountries[0];
    }


    let iti = window.lp_intlTelInput(jsElem, {
      dropdownContainer: dropdownContainer,
      formatOnDisplay: true,
      nationalMode: true,
      autoPlaceholder: 'aggressive',
      initialCountry: defaultCountryCode,
      geoIpLookup: function (callback) {
        const cookieName = 'latepoint_phone_country';

        if (latepoint_has_cookie(cookieName)) {
          callback(latepoint_get_cookie(cookieName));
        } else {
          jQuery.get('https://ipinfo.io', function () {
          }, 'jsonp').always(function (response) {
            // Sensible default
            let countryCode = defaultCountryCode;

            if (response && response.country) {
              countryCode = response.country.toLowerCase();
              latepoint_set_cookie(cookieName, countryCode);
            }
            callback(countryCode);
          })
        }
      },
      allowDropdown: onlyCountries.length != 1,
      onlyCountries: onlyCountries,
      preferredCountries: preferredCountries,
      separateDialCode: latepoint_helper.is_enabled_show_dial_code_with_flag
    });

    iti.promise.then(function () {
      latepoint_init_phone_masking_from_placeholder($elem);
    });


    $elem.on("countrychange", function (event) {
      latepoint_init_phone_masking_from_placeholder(jQuery(this));
    });
  }
}

function latepoint_show_booking_end_time() {
  return (latepoint_helper.show_booking_end_time == 'yes');
}

function latepoint_set_cookie(name, value, days) {
  let date = new Date;
  date.setTime(date.getTime() + 24 * 60 * 60 * 1000 * days);
  document.cookie = name + "=" + value + ";path=/;expires=" + date.toGMTString();
}

function latepoint_get_cookie(name) {
  let cookie = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
  return cookie ? cookie[2] : null;
}

function latepoint_has_cookie(name) {
  return latepoint_get_cookie(name) !== null;
}

function latepoint_delete_cookie(name) {
  latepoint_set_cookie(name, '', -1);
}

function latepoint_add_notification(message, message_type = 'success'){
	var wrapper = jQuery('body').find('.os-notifications');
	if(!wrapper.length){
		jQuery('body').append('<div class="os-notifications"></div>');
		wrapper = jQuery('body').find('.os-notifications');
	}
	if(wrapper.find('.item').length > 0) wrapper.find('.item:first-child').remove();
	wrapper.append('<div class="item item-type-'+ message_type +'">' + message + '<span class="os-notification-close"><i class="latepoint-icon latepoint-icon-x"></i></span></div>');
}

function latepoint_add_lightbox_notification(message, message_type = 'success'){
	var wrapper = jQuery('.latepoint-lightbox-content').find('.os-notifications');
	if(!wrapper.length){
		jQuery('.latepoint-lightbox-content').prepend('<div class="os-notifications"></div>');
		wrapper = jQuery('.latepoint-lightbox-content').find('.os-notifications');
	}
	if(wrapper.find('.item').length > 0) wrapper.find('.item:first-child').remove();
	wrapper.append('<div class="item item-type-'+ message_type +'">' + message + '<span class="os-notification-close"><i class="latepoint-icon latepoint-icon-x"></i></span></div>');
}

function latepoint_generate_form_message_html(messages, status){
  var message_html = '<div class="os-form-message-w status-' + status + '"><ul>';
  if(Array.isArray(messages)){
    messages.forEach(function(message){
      message_html+= '<li>' + message + '</li>';
    });
  }else{
    message_html+= '<li>' + messages + '</li>';
  }
  message_html+= '</ul></div>';
  return message_html;
}

function latepoint_display_in_side_sub_panel(html){
  if(!jQuery('.latepoint-side-panel-w').length) latepoint_show_data_in_side_panel('');
  jQuery('.latepoint-side-panel-w .latepoint-side-panels .side-sub-panel-wrapper').remove();
  jQuery('.latepoint-side-panel-w .latepoint-side-panels').append(html);
}

function latepoint_clear_form_messages($form){
  $form.find('.os-form-message-w').remove();
}

function latepoint_show_data_in_side_panel(message, extra_classes = '', close_btn = true){
  jQuery('.latepoint-side-panel-w').remove();
  jQuery('body').append('<div class="latepoint-side-panel-w ' + extra_classes + ' os-loading"><div class="latepoint-side-panel-shadow"></div><div class="latepoint-side-panels"><div class="latepoint-side-panel-i"></div></div></div>');
  jQuery('.latepoint-side-panel-i').html(message);
  if(close_btn){
    jQuery('.latepoint-side-panel-i').find('.os-form-header .latepoint-side-panel-close').remove();
    jQuery('.latepoint-side-panel-i').find('.os-form-header').append('<a href="#" class="latepoint-side-panel-close latepoint-side-panel-close-trigger"><i class="latepoint-icon latepoint-icon-x"></i></a>');
  }
  setTimeout(function(){
    jQuery('.latepoint-side-panel-w').removeClass('os-loading');
  }, 100);
}

function latepoint_show_data_in_lightbox(message, extra_classes = '', close_btn = true, tag = 'div', inner_extra_classes = '', inner_tag = 'div'){
  jQuery('.latepoint-lightbox-w').remove();
  let lightbox_css_classes = 'latepoint-lightbox-w latepoint-w latepoint-border-radius-' + latepoint_helper.style_border_radius+ ' ';
  if(extra_classes) lightbox_css_classes+= extra_classes;
  let lightbox_css_inner_classes = 'latepoint-lightbox-i ';
  if(inner_extra_classes) lightbox_css_inner_classes += inner_extra_classes;

  let close_btn_html = close_btn ? '<a href="#" class="latepoint-lightbox-close" tabindex="0"><i class="latepoint-icon latepoint-icon-x"></i></a>' : '';
  jQuery('body').append('<'+tag+' class="'+ lightbox_css_classes +'"><'+inner_tag+' class="'+ lightbox_css_inner_classes +'">' + message + close_btn_html + '</'+inner_tag+'><div class="latepoint-lightbox-shadow"></div></'+tag+'>');

  jQuery('body').addClass('latepoint-lightbox-active');
}



// DOCUMENT READY
jQuery(function( $ ) {

  if($('.latepoint').find('[data-os-action-onload]').length){
    $('.latepoint').find('[data-os-action-onload]').each(function(){
      var $this = jQuery(this);
      $this.addClass('os-loading');
      var params = $this.data('os-params');
      var return_format = $this.data('os-return-format') ? $this.data('os-return-format') : 'json'
      var data = { action: 'latepoint_route_call', route_name: $this.data('os-action-onload'), params: params, return_format: return_format }
      jQuery.ajax({
        type : "post",
        dataType : "json",
        url : latepoint_timestamped_ajaxurl(),
        data : data,
        success: function(response) {
          $this.removeClass('os-loading');
          if (response.status === "success") {
            if($this.data('os-output-target') == 'self'){
              $this.html(response.message);
            }
          }
        }
      });
    });
  }

  /*
    Ajax buttons action
  */
  $('.latepoint').on('click', 'button[data-os-action], a[data-os-action], div[data-os-action], span[data-os-action], tr[data-os-action]', function(e){
    var $this = jQuery(this);
    if($this.data('os-prompt') && !confirm($this.data('os-prompt'))) return false;
    var params = $this.data('os-params');
    if($this.data('os-source-of-params')){
      var form_data = latepoint_create_form_data_from_non_form_element($($this.data('os-source-of-params')));
      params = latepoint_formdata_to_url_encoded_string(form_data);
    }
    var return_format = $this.data('os-return-format') ? $this.data('os-return-format') : 'json'
    var data = { action: 'latepoint_route_call', route_name: $this.data('os-action'), params: params, return_format: return_format }
    $this.addClass('os-loading');
    if($this.data('os-output-target') == 'side-panel'){
      $('.latepoint-side-panel-w').remove();
      let css_classes = $this.data('os-lightbox-classes') ? $this.data('os-lightbox-classes') : '';
      $('body').append('<div class="latepoint-side-panel-w ' + css_classes + ' os-loading"><div class="latepoint-side-panel-shadow"></div><div class="latepoint-side-panels"><div class="latepoint-side-panel-i"></div></div></div>');
    }
    $.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(response){
        if(response.status === "success"){
          if($this.data('os-output-target') == 'lightbox'){
            latepoint_show_data_in_lightbox(response.message, $this.data('os-lightbox-classes'), ($this.data('os-lightbox-no-close-button') !== 'yes'), $this.data('os-lightbox-tag'), $this.data('os-lightbox-inner-classes'), $this.data('os-lightbox-inner-tag'));
          }else if($this.data('os-output-target') == 'side-panel'){
            $('.latepoint-side-panel-i').html(response.message);
            jQuery('.latepoint-side-panel-i').find('.os-form-header .latepoint-side-panel-close').remove();
            jQuery('.latepoint-side-panel-i').find('.os-form-header').append('<a href="#" class="latepoint-side-panel-close latepoint-side-panel-close-trigger"><i class="latepoint-icon latepoint-icon-x"></i></a>');
            setTimeout(function(){
              $('.latepoint-side-panel-w').removeClass('os-loading');
            }, 100);
          }else if($this.data('os-success-action') == 'reload'){
            latepoint_add_notification(response.message);
            location.reload();
            return;
          }else if($this.data('os-success-action') == 'redirect'){
            if($this.data('os-redirect-to')){
              latepoint_add_notification(response.message);
              window.location.replace($this.data('os-redirect-to'));
            }else{
              window.location.replace(response.message); 
            }
            return;
          }else if($this.data('os-output-target') && $($this.data('os-output-target')).length){
            if($this.data('os-output-target-do') == 'append') {
              $($this.data('os-output-target')).append(response.message);
            }else if($this.data('os-output-target-do') == 'prepend'){
              $($this.data('os-output-target')).prepend(response.message);
            }else{
              $($this.data('os-output-target')).html(response.message);
            }
          }else{
            switch($this.data('os-before-after')){
              case 'before':
                $this.before(response.message);
                break;
              case 'after':
                $this.after(response.message);
                break;
              case 'replace':
                $this.replaceWith(response.message);
                break;
              case 'none':
                break;
              default:
                latepoint_add_notification(response.message);
            }
          }
          if($this.data('os-after-call')){
            var func_name = $this.data('os-after-call');
            var callback = false;
            if(func_name.includes('.')){
              var func_arr = func_name.split('.');
              if(typeof window[func_arr[0]][func_arr[1]] !== 'function'){
                console.log(func_name + ' is undefined');
              }
              if($this.data('os-pass-this') && $this.data('os-pass-response')){
                window[func_arr[0]][func_arr[1]]($this, response);
              }else if($this.data('os-pass-this')){
                window[func_arr[0]][func_arr[1]]($this);
              }else if($this.data('os-pass-response')){
                window[func_arr[0]][func_arr[1]](response);
              }else{
                window[func_arr[0]][func_arr[1]]();
              }
            }else{
              if(typeof window[func_name] !== 'function'){
                console.log(func_name + ' is undefined');
              }
              if($this.data('os-pass-this') && $this.data('os-pass-response')){
                window[func_name]($this, response);
              }else if($this.data('os-pass-this')){
                window[func_name]($this);
              }else if($this.data('os-pass-response')){
                window[func_name](response);
              }else{
                window[func_name]();
              }
            }
          }
          $this.removeClass('os-loading');
        }else{
          $this.removeClass('os-loading');
          if($this.data('os-output-target') && $($this.data('os-output-target')).length){
            $($this.data('os-output-target')).prepend(latepoint_generate_form_message_html(response.message, 'error'));
          }else{
            alert(response.message);
          }
          if($this.data('os-after-call-error')){
            var func_name = $this.data('os-after-call-error');
            var callback = false;
            if(func_name.includes('.')){
              var func_arr = func_name.split('.');
              if(typeof window[func_arr[0]][func_arr[1]] !== 'function'){
                console.log(func_name + ' is undefined');
              }
              if($this.data('os-pass-this') && $this.data('os-pass-response')){
                window[func_arr[0]][func_arr[1]]($this, response);
              }else if($this.data('os-pass-this')){
                window[func_arr[0]][func_arr[1]]($this);
              }else if($this.data('os-pass-response')){
                window[func_arr[0]][func_arr[1]](response);
              }else{
                window[func_arr[0]][func_arr[1]]();
              }
            }else{
              if(typeof window[func_name] !== 'function'){
                console.log(func_name + ' is undefined');
              }
              if($this.data('os-pass-this') && $this.data('os-pass-response')){
                window[func_name]($this, response);
              }else if($this.data('os-pass-this')){
                window[func_name]($this);
              }else if($this.data('os-pass-response')){
                window[func_name](response);
              }else{
                window[func_name]();
              }
            }
          }
        }
      }
    });
    return false;
  });


  $('.latepoint').on('click', 'form[data-os-action] button[type="submit"]', function(e){
    $(this).addClass('os-loading');
  });

















  /* 
    Form ajax submit action
  */
  $('.latepoint').on('submit', 'form[data-os-action]', function(e){
    e.preventDefault(); // prevent native submit
      var $form = $(this);
      var form_data = new FormData($form[0]);

    if (('lp_intlTelInputGlobals' in window) && ('lp_intlTelInputUtils' in window)) {
      // Get e164 formatted number from phone fields when form is submitted
      $form.find('input.os-mask-phone').each(function () {
        let telInstance = window.lp_intlTelInputGlobals.getInstance(this);
        if(telInstance){
          const phoneInputName = this.getAttribute('name');
          const phoneInputValue = window.lp_intlTelInputGlobals.getInstance(this).getNumber(window.lp_intlTelInputUtils.numberFormat.E164);
          form_data.set(phoneInputName, phoneInputValue);
        }
      });
    }

    let data = latepoint_create_form_data($form, $(this).data('os-action'));

    // var data = { action: 'latepoint_route_call', route_name: $(this).data('os-action'), params: latepoint_formdata_to_url_encoded_string(form_data), return_format: 'json' }
    $form.find('button[type="submit"]').addClass('os-loading');
    $.ajax({
      type : "post",
      dataType : "json",
      processData: false,
      contentType: false,
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(response){
        $form.find('button[type="submit"].os-loading').removeClass('os-loading');
        latepoint_clear_form_messages($form);
        if(response.status === "success"){
          if($form.data('os-success-action') == 'reload'){
            latepoint_add_notification(response.message);
            location.reload();
            return;
          }else if($form.data('os-success-action') == 'redirect'){
            if($form.data('os-redirect-to')){
              latepoint_add_notification(response.message);
              window.location.replace($form.data('os-redirect-to'));
            }else{
              window.location.replace(response.message);
            }
            return;
          }else if($form.data('os-output-target') && $($form.data('os-output-target')).length){
            $($form.data('os-output-target')).html(response.message);
          }else{
            if(response.message == 'redirect'){
              window.location.replace(response.url);
            }else{
              latepoint_add_notification(response.message);
            }
          }
          if($form.data('os-record-id-holder') && response.record_id){
            $form.find('[name="' + $form.data('os-record-id-holder') + '"]').val(response.record_id)
          }
          if($form.data('os-after-call')){

            var func_name = $form.data('os-after-call');
            var callback = false;
            if(func_name.includes('.')){
              var func_arr = func_name.split('.');
              if(typeof window[func_arr[0]][func_arr[1]] !== 'function'){
                console.log(func_name + ' is undefined');
              }
              if($form.data('os-pass-this') && $form.data('os-pass-response')){
                window[func_arr[0]][func_arr[1]]($form, response);
              }else if($form.data('os-pass-this')){
                window[func_arr[0]][func_arr[1]]($form);
              }else if($form.data('os-pass-response')){
                window[func_arr[0]][func_arr[1]](response);
              }else{
                window[func_arr[0]][func_arr[1]]();
              }
            }else{
              if(typeof window[func_name] !== 'function'){
                console.log(func_name + ' is undefined');
              }
              if($form.data('os-pass-this') && $form.data('os-pass-response')){
                window[func_name]($form, response);
              }else if($form.data('os-pass-this')){
                window[func_name]($form);
              }else if($form.data('os-pass-response')){
                window[func_name](response);
              }else{
                window[func_name]();
              }
            }
          }
          $('button.os-loading').removeClass('os-loading');
        }else{
          $('button.os-loading').removeClass('os-loading');
          if($form.data('os-show-errors-as-notification')){
            latepoint_add_notification(response.message, 'error');
          }else{
            latepoint_add_notification(response.message, 'error');
            $([document.documentElement, document.body]).animate({
                scrollTop: ($form.find(".os-form-message-w").offset().top - 30)
            }, 200);
          }
        }
        if(response.form_values_to_update){
          $.each(response.form_values_to_update, function(name, value){
            $form.find('[name="'+ name +'"]').val(value);
          });
        }
      }
    });
    return false;
  });
});

/*
 * Copyright (c) 2022 LatePoint LLC. All rights reserved.
 */


function latepoint_init_order_summary_lightbox() {

}

function latepoint_init_bundle_scheduling_summary() {

}


function latepoint_manage_by_key_reload_booking() {
    let $wrapper = jQuery('.manage-booking-wrapper');
    $wrapper.addClass('os-loading')
    let params = {
        key: $wrapper.data('key')
    }
    let data = {
        action: latepoint_helper.route_action,
        route_name: $wrapper.data('route-name'),
        params: params,
        layout: 'none',
        return_format: 'json'
    };

    jQuery.ajax({
        type: "post",
        dataType: "json",
        url: latepoint_timestamped_ajaxurl(),
        data: data,
        success: function (data) {
            $wrapper.removeClass('os-loading')
            if (data.status === "success") {
                $wrapper.replaceWith(data.message);
            } else {
                latepoint_show_message_inside_element(data.message, $wrapper, 'error');
            }
        }
    });
}

function latepoint_init_manage_booking_by_key() {
    let $wrapper = jQuery('.manage-booking-wrapper');
    if (!$wrapper.length) return;
    jQuery('.latepoint-w').on('change', '.change-booking-status-trigger', function () {
        $wrapper.addClass('os-loading')
        let params = {
            key: $wrapper.data('key'),
            status: jQuery(this).val()
        }
        let data = {
            action: latepoint_helper.route_action,
            route_name: jQuery(this).closest('.change-booking-status-trigger-wrapper').data('route-name'),
            params: params,
            layout: 'none',
            return_format: 'json'
        };

        jQuery.ajax({
            type: "post",
            dataType: "json",
            url: latepoint_timestamped_ajaxurl(),
            data: data,
            success: function (data) {
                $wrapper.removeClass('os-loading')
                if (data.status === "success") {
                    latepoint_manage_by_key_reload_booking();
                } else {
                    latepoint_show_message_inside_element(data.message, $wrapper, 'error');
                }
            }
        });
        return false;
    });


    $wrapper.on('click', '.qr-show-trigger', function () {
        jQuery(this).closest('.manage-booking-wrapper').find('.qr-code-on-full-summary').addClass('show-vevent-qr-code');
        return false;
    });
    $wrapper.on('click', '.os-item-details-popup-close', function () {
        var $wrapper = jQuery(this).closest('.manage-booking-wrapper');
        $wrapper.find('.os-item-details-popup.open').remove();
        $wrapper.find('.manage-booking-inner, .manage-booking-controls').show();
        return false;
    });

    $wrapper.on('click', '.os-trigger-item-details-popup', function () {
        var $wrapper = jQuery(this).closest('.manage-booking-wrapper');
        $wrapper.find('.manage-booking-inner, .manage-booking-controls').hide();
        $wrapper.find('.os-item-details-popup.open').remove();
        var $popup = $wrapper.find('#' + jQuery(this).data('item-details-popup-id')).clone();
        $popup.addClass('open').appendTo($wrapper);
        return false;
    });
}

function latepoint_init_form_masks() {
    if (('lp_intlTelInput' in window) && ('lp_intlTelInputGlobals' in window)) {
        jQuery('.os-mask-phone').each(function () {
            latepoint_mask_phone(jQuery(this));
        });
    }
}

function latepoint_scroll_to_top_of_booking_form($booking_form_element) {
    // if it's a form shortcode (not lightbox), scroll to top of the form
    if ($booking_form_element.parent().hasClass('latepoint-inline-form')) {
        $booking_form_element[0].scrollIntoView({block: "nearest", behavior: 'smooth'}); // SHOULD NOT BE FIRST!! Also need to FIX, scroll only if TOP of the booking form is above the viewport
    }
    // if lightbox - scroll body of lightbox to top
    if ($booking_form_element.parent().hasClass('latepoint-lightbox-i')) {
        $booking_form_element.find('.latepoint-body').scrollTop(0);
    }
}

async function latepoint_init_payment_method_actions($booking_form_element, payment_method) {
    let callbacks_list = [];
    let is_last_step = $booking_form_element.data('next-submit-is-last') == 'yes';
    $booking_form_element.trigger('latepoint:initPaymentMethod', [{
        payment_method: payment_method,
        callbacks_list: callbacks_list,
        is_last_step: is_last_step
    }]);
    $booking_form_element.removeClass('step-content-loaded').addClass('step-content-loading');


    try {
        for (const callback of callbacks_list) {
            await callback.action();
        }
        $booking_form_element.removeClass('step-content-loading').addClass('step-content-loaded').find('.lp-payment-method-content[data-payment-method="' + payment_method + '"]').show();
    } catch (error) {
        latepoint_show_error_and_stop_loading_booking_form(error, $booking_form_element);
    }
}

function latepoint_lightbox_close() {
    jQuery('body').removeClass('latepoint-lightbox-active');
    jQuery('.latepoint-lightbox-w').remove();
}

function latepoint_show_next_btn($booking_form_element) {
    $booking_form_element.find('.latepoint-next-btn').removeClass('disabled');
    $booking_form_element.removeClass('hidden-buttons');
}

function clear_step_services($booking_form_element) {
}

function clear_step_service_extras($booking_form_element) {
}

function clear_step_locations($booking_form_element) {
}

function clear_step_agents($booking_form_element) {
}

function clear_step_datepicker($booking_form_element) {
}

function latepoint_hide_next_btn($booking_form_element) {
    $booking_form_element.find('.latepoint-next-btn').addClass('disabled');
    if ($booking_form_element.find('.latepoint-prev-btn.disabled').length) $booking_form_element.addClass('hidden-buttons');
}


function latepoint_show_prev_btn($booking_form_element) {
    $booking_form_element.find('.latepoint-prev-btn').removeClass('disabled');
    $booking_form_element.removeClass('hidden-buttons');
}

function latepoint_hide_prev_btn($booking_form_element) {
    $booking_form_element.find('.latepoint-prev-btn').addClass('disabled');
    if ($booking_form_element.find('.latepoint-next-btn.disabled').length) $booking_form_element.addClass('hidden-buttons');
}


function latepoint_remove_cart_item($trigger) {
    let $booking_form_element = $trigger.closest('.latepoint-booking-form-element');
    let cart_item_id = $trigger.data('cart-item-id');


    $trigger.addClass('os-loading');
    let data = {
        action: latepoint_helper.route_action,
        route_name: $trigger.data('route'),
        params: jQuery.param({cart_item_id: cart_item_id}),
        layout: 'none',
        return_format: 'json'
    }
    jQuery.ajax({
        type: "post",
        dataType: "json",
        url: latepoint_timestamped_ajaxurl(),
        data: data,
        success: function (data) {
            if (data.status === "success") {
                if(cart_item_id != $booking_form_element.find('input[name="active_cart_item[id]"]').val()){
                    // cart has other items - just reload the summary/step
                    if ($trigger.closest('.latepoint-summary-w').length) {
                        // removed by clicking on summary side panel
                        latepoint_reload_summary($booking_form_element);
                    } else {
                        // remove by clicking on cart item on verify step
                        latepoint_reload_step($booking_form_element);
                    }
                }else{
                    // this was a last item, need to go back to the start of a booking process
                    latepoint_restart_booking_process($booking_form_element);
                }
            } else {
                $trigger.removeClass('os-loading');
                latepoint_show_message_inside_element(data.message, $booking_form_element.find('.latepoint-body'), 'error');
            }
        }
    });
}

function latepoint_apply_coupon($elem) {
    var $booking_form_element = $elem.closest('.latepoint-booking-form-element');

    var $coupon_input = $elem;
    $coupon_input.closest('.coupon-code-input-w').addClass('os-loading');
    var form_data = new FormData($booking_form_element.find('.latepoint-form')[0]);
    var data = {
        action: latepoint_helper.route_action,
        route_name: $elem.data('route'),
        params: latepoint_formdata_to_url_encoded_string(form_data),
        layout: 'none',
        return_format: 'json'
    }
    jQuery.ajax({
        type: "post",
        dataType: "json",
        url: latepoint_timestamped_ajaxurl(),
        data: data,
        success: function (data) {
            $coupon_input.closest('.coupon-code-input-w').removeClass('os-loading');
            if (data.status === "success") {
                latepoint_show_message_inside_element(data.message, $booking_form_element.find('.latepoint-body'), 'success');
                $booking_form_element.find('.step-payment-w input[name="cart[payment_method]"]').val('');
                $booking_form_element.find('input[name="cart[payment_token]"]').val('');
                $booking_form_element.find('input[name="cart[payment_portion]"]').val('');
                latepoint_reload_step($booking_form_element);
            } else {
                latepoint_show_message_inside_element(data.message, $booking_form_element.find('.latepoint-body'), 'error');
            }
        }
    });
}

function latepoint_remove_coupon($elem) {
    $elem.closest('.applied-coupon-code-wrapper').fadeOut();
    var $booking_form_element = $elem.closest('.latepoint-booking-form-element');
    let $coupon_input = $booking_form_element.find('input[name="coupon_code"]');
    $coupon_input.val('');
    latepoint_apply_coupon($coupon_input);
}

function latepoint_restart_booking_process($booking_form_element) {
    // first first step
    let first_step_code = $booking_form_element.find('.latepoint-step-content').first().data('step-code');
    latepoint_reload_step($booking_form_element, first_step_code);
    return false;
}

function latepoint_reload_step($booking_form_element, step_code = false) {

    if (step_code) {
        $booking_form_element.find('.latepoint_current_step_code').val(step_code);
        $booking_form_element.removeClass(function (index, className) {
            return (className.match(/(^|\s)current-step-\S+/g) || []).join(' ');
        }).addClass('current-step-' + step_code);
        if ($booking_form_element.find('.latepoint-step-content[data-step-code="' + step_code + '"]')) {
            $booking_form_element.find('.latepoint-step-content[data-step-code="' + step_code + '"]').nextAll('.latepoint-step-content').remove();
            $booking_form_element.find('.latepoint-step-content[data-step-code="' + step_code + '"]').remove();
        }
    }

    $booking_form_element.find('.latepoint_step_direction').val('specific');
    latepoint_submit_booking_form($booking_form_element.find('.latepoint-form'));

    return false;
}


function latepoint_reset_password_from_booking_init() {
    jQuery('.os-step-existing-customer-login-w').hide();
    jQuery('.os-password-reset-form-holder').on('click', '.password-reset-back-to-login', function () {
        jQuery('.os-password-reset-form-holder').html('');
        jQuery('.os-step-existing-customer-login-w').show();
        return false;
    });
}

function latepoint_bundle_selected($item) {
    let $booking_form_element = $item.closest('.latepoint-booking-form-element');
    $booking_form_element.find('input[name="active_cart_item[variant]"]').val('bundle');
    $booking_form_element.find('input[name="booking[service_id]"]').val('');
}

function latepoint_service_selected($item) {
    let $booking_form_element = $item.closest('.latepoint-booking-form-element');
    $booking_form_element.find('input[name="active_cart_item[variant]"]').val('booking');
}

async function latepoint_reload_summary($booking_form_element) {
    let $summary_panel = $booking_form_element.closest('.latepoint-with-summary');
    if (!$summary_panel.length) return;

    let current_step = $booking_form_element.find('.latepoint_current_step_code').val();

    $booking_form_element.find('.latepoint-summary-w').addClass('os-loading');
    let $booking_form = $booking_form_element.find('.latepoint-form');
    let form_data = new FormData($booking_form[0]);
    let data = {
        action: latepoint_helper.route_action,
        route_name: latepoint_helper.reload_booking_form_summary_route,
        params: latepoint_formdata_to_url_encoded_string(form_data),
        layout: 'none',
        return_format: 'json'
    }

    let response = await jQuery.ajax({
        type: "post",
        dataType: "json",
        url: latepoint_timestamped_ajaxurl(),
        data: data
    });
    if(response.status === 'success'){
        $booking_form_element.find('.os-summary-contents').html(response.message);
        $booking_form_element.find('.latepoint-summary-w').removeClass('os-loading');
        // hide on verify and confirmation steps
        if (current_step && !['verify', 'confirmation'].includes(current_step) && response.message) {
            $summary_panel.addClass('latepoint-summary-is-open');
        } else {
            $summary_panel.removeClass('latepoint-summary-is-open');
        }
        latepoint_init_booking_summary_panel($booking_form_element);
    }else{
        throw new Error(response.message ? response.message : 'Error reloading summary');
    }
}

function latepoint_init_booking_summary_panel($booking_form_element) {
    let $summary_panel = $booking_form_element.find('.latepoint-summary-w');
    if (!$summary_panel.length) return;

    $summary_panel.find('.price-breakdown-unfold').on('click', function () {
        jQuery(this).closest('.summary-price-breakdown-wrapper').removeClass('compact-summary');
        return false;
    });

    $summary_panel.find('.os-remove-item-from-cart').on('click keydown', function (event) {
        if(event.type === 'keydown' && event.key !== ' ' &&  event.key !== 'Enter') return;
        latepoint_remove_cart_item(jQuery(this));
        return false;
    });

    $summary_panel.find('.latepoint-lightbox-summary-trigger').on('click', function () {
        var $wrapper = jQuery(this).closest('.latepoint-w');
        $wrapper.toggleClass('show-summary-on-mobile');
        return false;
    });
}

function latepoint_password_changed_show_login(response) {
    jQuery('.os-step-existing-customer-login-w').show();
    jQuery('.os-password-reset-form-holder').html('');
    latepoint_show_message_inside_element(response.message, jQuery('.os-step-existing-customer-login-w'), 'success');
}

function latepoint_hide_message_inside_element($elem = jQuery('.latepoint-body')) {
    if ($elem.length && $elem.find('.latepoint-message').length) {
        $elem.find('.latepoint-message').remove();
    }
}

function latepoint_show_message_inside_element(message, $elem = jQuery('.latepoint-body'), message_type = 'error') {
    message = message || 'Error. Please try again.';
    if ($elem.length) {
        if ($elem.find('.latepoint-message').length) {
            $elem.find('.latepoint-message').removeClass('latepoint-message-success').removeClass('latepoint-message-error').addClass('latepoint-message-' + message_type + '').html(message).show();
        } else {
            $elem.prepend('<div class="latepoint-message latepoint-message-' + message_type + '">' + message + '</div>');
        }
        // scroll errors into view
        if (message_type == 'error') $elem.find('.latepoint-message')[0].scrollIntoView();
    }
}

function latepoint_add_action(callbacks_list, action, priority = 10) {
    callbacks_list.push({priority: priority, action: action});
    callbacks_list.sort((a, b) => a.priority - b.priority);
    return callbacks_list;
}

function latepoint_update_next_btn_label($booking_form_element) {
    let btn_label = $booking_form_element.find('.latepoint-step-content').last().data('next-btn-label')
    if (btn_label) {
        $booking_form_element.find('.latepoint-next-btn span').text(btn_label);
    }
}

function latepoint_init_step(step_code, $booking_form_element) {
    latepoint_init_step_selectable_items($booking_form_element);
    latepoint_init_step_category_items(step_code);
    switch (step_code) {
        case 'customer':
            latepoint_init_step_contact();
            break;
        case 'booking__datepicker':
            latepoint_init_step_datepicker($booking_form_element);
            break;
        case 'booking__agents':
            latepoint_init_step_agents();
            break;
        case 'booking__locations':
            latepoint_init_step_locations();
            break;
        case 'booking__services':
            latepoint_init_step_services();
            break;
        case 'payment__methods':
            latepoint_init_step_payment__methods($booking_form_element);
            break;
        case 'payment__times':
            latepoint_init_step_payment__times($booking_form_element);
            break;
        case 'payment__portions':
            latepoint_init_step_payment__portions($booking_form_element);
            break;
        case 'payment__pay':
            latepoint_init_step_payment__pay($booking_form_element);
            break;
        case 'verify':
            latepoint_init_step_verify($booking_form_element);
            break;
        case 'confirmation':
            latepoint_init_step_confirmation($booking_form_element);
            break;
    }

    $booking_form_element.trigger("latepoint:initStep", [{step_code: step_code}]);
    $booking_form_element.trigger("latepoint:initStep:" + step_code);
}


function day_timeslots($day, $wrapper_element = false, $scrollable_wrapper = false) {
    if (!$wrapper_element) $wrapper_element = $day.closest('.latepoint-booking-form-element');
    $day.addClass('selected');

    var service_duration = $day.data('service-duration');
    var interval = $day.data('interval');
    var work_start_minutes = $day.data('work-start-time');
    var work_end_minutes = $day.data('work-end-time');
    var total_work_minutes = $day.data('total-work-minutes');
    var bookable_minutes = [];
    var available_capacities_of_bookable_minute = [];
    if ($day.attr('data-bookable-minutes')) {
        if ($day.data('bookable-minutes').toString().indexOf(':') > -1) {
            // has capacity information embedded into bookable minutes string
            let bookable_minutes_with_capacity = $day.data('bookable-minutes').toString().split(',');
            for (let i = 0; i < bookable_minutes_with_capacity.length; i++) {
                bookable_minutes.push(parseInt(bookable_minutes_with_capacity[i].split(':')[0]));
                available_capacities_of_bookable_minute.push(parseInt(bookable_minutes_with_capacity[i].split(':')[1]));
            }
        } else {
            bookable_minutes = $day.data('bookable-minutes').toString().split(',').map(Number);
        }
    }
    var work_minutes = $day.data('work-minutes').toString().split(',').map(Number);

    var $timeslots = $wrapper_element.find('.timeslots');
    $timeslots.html('');

    if (total_work_minutes > 0 && bookable_minutes.length && work_minutes.length) {
        var prev_minutes = false;
        work_minutes.forEach(function (current_minutes) {
            var ampm = latepoint_am_or_pm(current_minutes);

            var timeslot_class = 'dp-timepicker-trigger';
            var timeslot_available_capacity = 0;
            if (latepoint_helper.time_pick_style == 'timeline') {
                timeslot_class += ' dp-timeslot';
            } else {
                timeslot_class += ' dp-timebox';
            }

            if (prev_minutes !== false && ((current_minutes - prev_minutes) > service_duration)) {
                // show interval that is off between two work periods
                var off_label = latepoint_minutes_to_hours_and_minutes(prev_minutes + service_duration) + ' ' + latepoint_am_or_pm(prev_minutes + service_duration) + ' - ' + latepoint_minutes_to_hours_and_minutes(current_minutes) + ' ' + latepoint_am_or_pm(current_minutes);
                var off_width = (((current_minutes - prev_minutes - service_duration) / total_work_minutes) * 100);
                $timeslots.append('<div class="' + timeslot_class + ' is-off" style="max-width:' + off_width + '%; width:' + off_width + '%"><span class="dp-label">' + off_label + '</span></div>');
            }

            if (!bookable_minutes.includes(current_minutes)) {
                timeslot_class += ' is-booked';
            } else {
                if (available_capacities_of_bookable_minute.length) timeslot_available_capacity = available_capacities_of_bookable_minute[bookable_minutes.indexOf(current_minutes)];
            }
            var tick_html = '';
            var capacity_label = '';
            var capacity_label_html = '';
            var capacity_internal_label_html = '';

            if (((current_minutes % 60) == 0) || (interval >= 60)) {
                timeslot_class += ' with-tick';
                tick_html = '<span class="dp-tick"><strong>' + latepoint_minutes_to_hours_preferably(current_minutes) + '</strong>' + ' ' + ampm + '</span>';
            }
            var timeslot_label = latepoint_minutes_to_hours_and_minutes(current_minutes) + ' ' + ampm;
            if (latepoint_show_booking_end_time()) {
                var end_minutes = current_minutes + service_duration;
                if (end_minutes > 1440) end_minutes = end_minutes - 1440;
                var end_minutes_ampm = latepoint_am_or_pm(end_minutes);
                timeslot_label += ' - <span class="dp-label-end-time">' + latepoint_minutes_to_hours_and_minutes(end_minutes) + ' ' + end_minutes_ampm + '</span>';
            }
            if (timeslot_available_capacity) {
                var spaces_message = timeslot_available_capacity > 1 ? latepoint_helper.many_spaces_message : latepoint_helper.single_space_message;
                capacity_label = timeslot_available_capacity + ' ' + spaces_message;
                capacity_label_html = '<span class="dp-capacity">' + capacity_label + '</span>';
                capacity_internal_label_html = '<span class="dp-label-capacity">' + capacity_label + '</span>';
            }
            timeslot_label = timeslot_label.trim();
            $timeslots.removeClass('slots-not-available').append('<div tabindex="0" class="' + timeslot_class + '" data-minutes="' + current_minutes + '"><span class="dp-label">' + capacity_internal_label_html + '<span class="dp-label-time">' + timeslot_label + '</span>' + '</span>' + tick_html + capacity_label_html + '</div>');
            prev_minutes = current_minutes;
        });
    } else {
        // No working hours this day
        $timeslots.addClass('slots-not-available').append('<div class="not-working-message">' + latepoint_helper.msg_not_available + "</div>");
    }
    jQuery('.times-header-label span').text($day.data('nice-date'));
    $wrapper_element.find('.time-selector-w').slideDown(200, function () {
        if (!$scrollable_wrapper) $scrollable_wrapper = $wrapper_element.find('.latepoint-body');
        $scrollable_wrapper.stop();
        $wrapper_element.find('.time-selector-w')[0].scrollIntoView({block: "nearest", behavior: 'smooth'});
    });
}


function latepoint_timeslot_clicked(event) {
    if(event.type === 'keydown' && event.key !== ' ' &&  event.key !== 'Enter') return;
    let $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');
    if (jQuery(this).hasClass('is-booked') || jQuery(this).hasClass('is-off')) {
        // Show error message that you cant select a booked period
    } else {
        if (jQuery(this).hasClass('selected')) {
            jQuery(this).removeClass('selected');
            jQuery(this).find('.dp-success-label').remove();
            $booking_form_element.find('.latepoint_start_time').val('');
            latepoint_hide_next_btn($booking_form_element);
            latepoint_reload_summary($booking_form_element);
        } else {
            $booking_form_element.find('.dp-timepicker-trigger.selected').removeClass('selected').find('.dp-success-label').remove();
            var selected_timeslot_time = jQuery(this).find('.dp-label-time').html();
            jQuery(this).addClass('selected').find('.dp-label').prepend('<span class="dp-success-label">' + latepoint_helper.datepicker_timeslot_selected_label + '</span>');

            var minutes = parseInt(jQuery(this).data('minutes'));
            var timeshift_minutes = parseInt($booking_form_element.find('.latepoint_timeshift_minutes').val());
            // we substract timeshift minutes because its timeshift minutes that the business is running in, in opposite of what we do when we generate a calendar for a client
            if (timeshift_minutes) minutes = minutes - timeshift_minutes;
            var start_date = new Date($booking_form_element.find('.os-day.selected').data('date'));
            if (minutes < 0) {
                // business minutes are in previous day
                minutes = 24 * 60 + minutes;
                // move start date back 1 day
                start_date.setDate(start_date.getDate() - 1);
            } else if (minutes >= 24 * 60) {
                // business minutes are in next day
                minutes = minutes - 24 * 60;
                start_date.setDate(start_date.getDate() + 1);
            }
            $booking_form_element.find('.latepoint_start_date').val(start_date.toISOString().split('T')[0])
            $booking_form_element.find('.latepoint_start_time').val(minutes);
            latepoint_trigger_next_btn($booking_form_element);
        }
    }
    return false;
}

function latepoint_init_timeslots($booking_form_element = false) {
    if (!$booking_form_element) return;
    $booking_form_element.off('click', '.dp-timepicker-trigger', latepoint_timeslot_clicked);
    $booking_form_element.on('click', '.dp-timepicker-trigger', latepoint_timeslot_clicked);
    $booking_form_element.off('keydown', '.dp-timepicker-trigger', latepoint_timeslot_clicked);
    $booking_form_element.on('keydown', '.dp-timepicker-trigger', latepoint_timeslot_clicked);
}

async function latepoint_monthly_calendar_load_next_month($booking_form_element){
    try {

        if ($booking_form_element.find('.os-monthly-calendar-days-w.active + .os-monthly-calendar-days-w').length) {
            $booking_form_element.find('.os-monthly-calendar-days-w.active').removeClass('active').next('.os-monthly-calendar-days-w').addClass('active');
            latepoint_calendar_set_month_label($booking_form_element);
            return true;
        } else {
            let $btn = $booking_form_element.find('.os-month-next-btn');
            let next_month_route_name = $btn.data('route');
                $btn.addClass('os-loading');
                let $calendar_element = $booking_form_element.find('.os-monthly-calendar-days-w').last();
                let calendar_year = $calendar_element.data('calendar-year');
                let calendar_month = $calendar_element.data('calendar-month');
                if (calendar_month == 12) {
                    calendar_year = calendar_year + 1;
                    calendar_month = 1;
                } else {
                    calendar_month = calendar_month + 1;
                }
                let form_data = new FormData($booking_form_element.find('.latepoint-form')[0]);
                form_data.set('target_date_string', `${calendar_year}-${calendar_month}-1`);
                let params = latepoint_formdata_to_url_encoded_string(form_data);
                let data = {
                    action: latepoint_helper.route_action,
                    route_name: next_month_route_name,
                    params: params,
                    layout: 'none',
                    return_format: 'json'
                }
                let response = await jQuery.ajax({
                    type: "post",
                    dataType: "json",
                    url: latepoint_timestamped_ajaxurl(),
                    data: data,
                    success: function (data) {
                    }
                });
                $btn.removeClass('os-loading');
                if (response.status === "success") {
                    $booking_form_element.find('.os-months').append(response.message);
                    $booking_form_element.find('.os-monthly-calendar-days-w.active').removeClass('active').next('.os-monthly-calendar-days-w').addClass('active');
                    latepoint_calendar_set_month_label($booking_form_element);
                    latepoint_calendar_show_or_hide_prev_next_buttons($booking_form_element);
                    return true;
                } else {
                    console.log(response.message);
                    return false;
                }

        }
    } catch (e) {
        console.log(e);
        alert('Error:' + e);
        return false;
    }
}

function latepoint_init_monthly_calendar_navigation($booking_form_element = false) {
    if (!$booking_form_element) return;
    $booking_form_element.find('.os-month-next-btn').on('click', async function () {
        let $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');
        return latepoint_monthly_calendar_load_next_month($booking_form_element);
    });
    $booking_form_element.find('.os-month-prev-btn').on('click', function () {
        var $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');
        if ($booking_form_element.find('.os-monthly-calendar-days-w.active').prev('.os-monthly-calendar-days-w').length) {
            $booking_form_element.find('.os-monthly-calendar-days-w.active').removeClass('active').prev('.os-monthly-calendar-days-w').addClass('active');
            latepoint_calendar_set_month_label($booking_form_element);
        }
        latepoint_calendar_show_or_hide_prev_next_buttons($booking_form_element);
        return false;
    });
}

function latepoint_calendar_set_month_label($booking_form_element) {
    $booking_form_element.find('.os-current-month-label .current-year').text($booking_form_element.find('.os-monthly-calendar-days-w.active').data('calendar-year'));
    $booking_form_element.find('.os-current-month-label .current-month').text($booking_form_element.find('.os-monthly-calendar-days-w.active').data('calendar-month-label'));
}


function latepoint_calendar_show_or_hide_prev_next_buttons($booking_form_element) {
    $booking_form_element.find('.os-current-month-label .current-year').text($booking_form_element.find('.os-monthly-calendar-days-w.active .os-monthly-calendar-days').data('calendar-year'));
    $booking_form_element.find('.os-current-month-label .current-month').text($booking_form_element.find('.os-monthly-calendar-days-w.active .os-monthly-calendar-days').data('calendar-month-label'));

    if ($booking_form_element.find('.os-monthly-calendar-days-w.active').prev('.os-monthly-calendar-days-w').length) {
        $booking_form_element.find('.os-month-prev-btn').removeClass('disabled');
    } else {
        $booking_form_element.find('.os-month-prev-btn').addClass('disabled');
    }
}

function latepoint_format_minutes_to_time(minutes, service_duration) {
    var ampm = latepoint_am_or_pm(minutes);
    var formatted_time = latepoint_minutes_to_hours_and_minutes(minutes) + ' ' + ampm;
    if (latepoint_show_booking_end_time()) {
        var end_minutes = minutes + service_duration;
        var end_minutes_ampm = latepoint_am_or_pm(end_minutes);
        formatted_time += ' - ' + latepoint_minutes_to_hours_and_minutes(end_minutes) + ' ' + end_minutes_ampm;
    }
    formatted_time = formatted_time.trim();
    return formatted_time;
}

function latepoint_monthly_calendar_day_clicked(event) {
    if(event.type === 'keydown' && event.key !== ' ' &&  event.key !== 'Enter') return;
    if (jQuery(this).hasClass('os-day-passed')) return false;
    if (jQuery(this).hasClass('os-not-in-allowed-period')) return false;
    var $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');
    if (jQuery(this).closest('.os-monthly-calendar-days-w').hasClass('hide-if-single-slot')) {
        // HIDE TIMESLOT IF ONLY ONE TIMEPOINT
        if (jQuery(this).hasClass('os-not-available')) {
            // clicked on a day that has no available timeslots
            // do nothing
        } else {
            $booking_form_element.find('.os-day.selected').removeClass('selected');
            jQuery(this).addClass('selected');
            // set date
            $booking_form_element.find('.latepoint_start_date').val(jQuery(this).data('date'));
            if (jQuery(this).hasClass('os-one-slot-only')) {
                // clicked on a day that has only one slot available
                var bookable_minutes = jQuery(this).data('bookable-minutes').toString().split(':')[0];
                var selected_timeslot_time = latepoint_format_minutes_to_time(Number(bookable_minutes), Number(jQuery(this).data('service-duration')));
                $booking_form_element.find('.latepoint_start_time').val(jQuery(this).data('bookable-minutes'));
                latepoint_show_next_btn($booking_form_element);
                $booking_form_element.find('.time-selector-w').slideUp(200);
            } else {
                // regular day with more than 1 timeslots available
                // build timeslots
                day_timeslots(jQuery(this));
                // clear time and hide next btn
                $booking_form_element.find('.latepoint_start_time').val('');
                latepoint_hide_next_btn($booking_form_element);
            }
            latepoint_reload_summary($booking_form_element);
        }
    } else {

        // SHOW TIMESLOTS EVEN IF ONLY ONE TIMEPOINT
        $booking_form_element.find('.latepoint_start_date').val(jQuery(this).data('date'));
        $booking_form_element.find('.os-day.selected').removeClass('selected');
        jQuery(this).addClass('selected');

        // build timeslots
        day_timeslots(jQuery(this));
        // clear time and hide next btn
        latepoint_reload_summary($booking_form_element);
        $booking_form_element.find('.latepoint_start_time').val('');
        latepoint_hide_next_btn($booking_form_element);
    }


    return false;
}

async function latepoint_init_step_datepicker($booking_form_element = false) {
    if (!$booking_form_element) return true;
    latepoint_init_timeslots($booking_form_element);
    latepoint_init_monthly_calendar_navigation($booking_form_element);
    $booking_form_element.off('click', '.os-months .os-day', latepoint_monthly_calendar_day_clicked);
    $booking_form_element.on('click', '.os-months .os-day', latepoint_monthly_calendar_day_clicked);
    $booking_form_element.off('keydown', '.os-months .os-day', latepoint_monthly_calendar_day_clicked);
    $booking_form_element.on('keydown', '.os-months .os-day', latepoint_monthly_calendar_day_clicked);
    if ($booking_form_element.find('input[name="booking[start_date]"]').val()){
        $booking_form_element.find('.os-day[data-date="' + $booking_form_element.find('input[name="booking[start_date]"]').val() + '"]').trigger('click');
    }else{
        let max_number_of_months_to_check = 24;
        let current_year = new Date().getFullYear();
        for (let i = 0; i < max_number_of_months_to_check; i++){
            let $active_month = $booking_form_element.find('.os-monthly-calendar-days-w.active');
            let searching_month_label = $active_month.data('calendar-month-label');
            if($active_month.data('calendar-year') != current_year) searching_month_label+= ' '+$active_month.data('calendar-year');
            $booking_form_element.find('.os-calendar-searching-info span').text(searching_month_label);
            // check if active month has any days available for booking
            let $first_available = $active_month.find('.os-day').not('.os-not-available').first();
            if($first_available.length){
                break;
            }else{
                await latepoint_monthly_calendar_load_next_month($booking_form_element);
            }
        }
        $booking_form_element.find('.os-dates-w').removeClass('is-searching');
    }
    return true;
}


function latepoint_init_step_verify($booking_form_element = false) {
    if (!$booking_form_element) return;
    $booking_form_element.closest('.latepoint-summary-is-open').removeClass('latepoint-summary-is-open');

    $booking_form_element.find('.coupon-code-wrapper-on-verify .coupon-code-trigger-on-verify-w a').on('click', function (e) {
        jQuery(this).closest('.coupon-code-wrapper-on-verify').addClass('entering-coupon').find('.coupon-code-input').trigger('focus');
        return false;
    });
    $booking_form_element.find('.coupon-code-wrapper-on-verify .coupon-code-input-cancel').on('click', function (e) {
        jQuery(this).closest('.coupon-code-wrapper-on-verify').removeClass('entering-coupon');
        return false;
    });

    $booking_form_element.find('.coupon-code-wrapper-on-verify .coupon-code-input-submit').on('click', function (e) {
        latepoint_apply_coupon(jQuery(this).closest('.coupon-code-input-w').find('.coupon-code-input'));
        return false;
    });

    $booking_form_element.find('.os-remove-item-from-cart').on('click keydown', function (event) {
        if(event.type === 'keydown' && event.key !== ' ' &&  event.key !== 'Enter') return;
        //make sure to clear active cart item so it doesn't add it again on reload!
        if (confirm(jQuery(this).data('confirm-text'))) {
            latepoint_remove_cart_item(jQuery(this));
        }
        return false;
    });

    $booking_form_element.find('.coupon-code-wrapper-on-verify .coupon-code-clear').on('click', function (e) {
        latepoint_remove_coupon(jQuery(this));
        return false;
    });

    $booking_form_element.find('.coupon-code-wrapper-on-verify input.coupon-code-input').on('keyup', function (e) {
        if (e.which === 13) {
            latepoint_apply_coupon(jQuery(this));
            return false;
        }
    });
}


function latepoint_init_step_payment__pay($booking_form_element = false) {
    var selected_payment_method = $booking_form_element.find('input[name="cart[payment_method]"]').val();
    latepoint_init_payment_method_actions($booking_form_element, selected_payment_method);
}

function latepoint_init_step_payment__portions($booking_form_element = false) {
    // Selecting Payment Time
    $booking_form_element.find('.lp-payment-trigger-payment-portion-selector').on('click keydown', function (event) {
        if(event.type === 'keydown' && event.key !== ' ' &&  event.key !== 'Enter') return;
        var $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');
        $booking_form_element.find('input[name="' + jQuery(this).data('holder') + '"]').val(jQuery(this).data('value'));
        latepoint_show_prev_btn($booking_form_element);
        latepoint_trigger_next_btn($booking_form_element);
        return false;
    });
}

function latepoint_init_step_payment__times($booking_form_element = false) {
    // Selecting Payment Time
    $booking_form_element.find('.lp-payment-trigger-payment-time-selector').on('click keydown', function (event) {
        if(event.type === 'keydown' && event.key !== ' ' &&  event.key !== 'Enter') return;
        var $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');
        $booking_form_element.find('input[name="' + jQuery(this).data('holder') + '"]').val(jQuery(this).data('value'));
        latepoint_show_prev_btn($booking_form_element);
        latepoint_trigger_next_btn($booking_form_element);
        return false;
    });
}


function latepoint_init_step_payment__methods($booking_form_element = false) {
    // Selecting Payment Time
    $booking_form_element.find('.lp-payment-trigger-payment-method-selector').on('click', function (e) {
        var $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');
        $booking_form_element.find('input[name="' + jQuery(this).data('holder') + '"]').val(jQuery(this).data('value'));
        latepoint_show_prev_btn($booking_form_element);
        latepoint_trigger_next_btn($booking_form_element);
        return false;
    });
}

function latepoint_category_item_clicked(event){
    if(event.type === 'keydown' && event.key !== ' ' &&  event.key !== 'Enter') return;
    let $item = jQuery(event.target);

    let $booking_form_element = $item.closest('.latepoint-booking-form-element');
    latepoint_show_prev_btn($booking_form_element);
    $item.closest('.latepoint-step-content').addClass('selecting-item-category');
    let $category_wrapper = $item.closest('.os-item-category-w');
    let $main_parent = $item.closest('.os-item-categories-main-parent');
    if ($category_wrapper.hasClass('selected')) {
        $category_wrapper.removeClass('selected');
        if ($category_wrapper.parent().closest('.os-item-category-w').length) {
            $category_wrapper.parent().closest('.os-item-category-w').addClass('selected');
        } else {
            $main_parent.removeClass('show-selected-only');
        }
    } else {
        $main_parent.find('.os-item-category-w.selected').removeClass('selected');
        $main_parent.addClass('show-selected-only');
        $category_wrapper.addClass('selected');
    }
    return false;
}

function latepoint_init_step_category_items(step_code) {
    let $category_items = jQuery('.latepoint-step-content[data-step-code="' + step_code + '"] .os-item-category-info');
    $category_items.on('click', latepoint_category_item_clicked);
    $category_items.on('keydown', latepoint_category_item_clicked);
}


function latepoint_init_step_selectable_items($booking_form_element) {
    $booking_form_element.off('click', '.os-selectable-items .os-selectable-item', latepoint_selectable_item_clicked);
    $booking_form_element.on('click', '.os-selectable-items .os-selectable-item', latepoint_selectable_item_clicked);

    $booking_form_element.off('click', '.os-selectable-items .os-selectable-item .item-quantity-selector-input', latepoint_selectable_item_quantity_keyup);
    $booking_form_element.on('click', '.os-selectable-items .os-selectable-item .item-quantity-selector-input', latepoint_selectable_item_quantity_keyup);


    $booking_form_element.off('keydown', '.os-selectable-items .os-selectable-item', latepoint_selectable_item_clicked);
    $booking_form_element.on('keydown', '.os-selectable-items .os-selectable-item', latepoint_selectable_item_clicked);
}


function latepoint_update_quantity_for_selectable_items($item) {
    var ids = $item.closest('.os-selectable-items')
        .find('.os-selectable-item.selected')
        .map(function () {
            if (jQuery(this).hasClass('has-quantity')) {
                return jQuery(this).data('item-id') + ':' + jQuery(this).find('input.item-quantity-selector-input').val();
            } else {
                return jQuery(this).data('item-id');
            }
        }).get();
    $item.closest('.latepoint-booking-form-element').find($item.data('id-holder')).val(ids);
}

function latepoint_selectable_item_quantity_keyup(event) {
    var $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');
    var $item = jQuery(this).closest('.os-selectable-item');
    var new_value = jQuery(this).val();
    if (new_value && new_value.match(/^\d+$/)) {
        var max_quantity = $item.data('max-quantity');
        if (max_quantity && (new_value > max_quantity)) new_value = max_quantity;
    } else {
        new_value = 0;
    }
    jQuery(this).val(new_value);

    if (($item.hasClass('selected') && (new_value > 0)) || (!$item.hasClass('selected') && (new_value == 0))) {
        latepoint_update_quantity_for_selectable_items($item);
        latepoint_reload_summary($booking_form_element);
        return false;
    } else {
        $item.trigger('click');
    }
}

function latepoint_selectable_item_clicked(event) {
    if(event.type === 'keydown' && event.key !== ' ' &&  event.key !== 'Enter') return;
    event.stopPropagation();
    event.stopImmediatePropagation();
    var $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');
    if (jQuery(this).hasClass('has-quantity')) {
        if (jQuery(event.target).hasClass('item-quantity-selector')) {
            var current_value = parseInt(jQuery(this).find('input.item-quantity-selector-input').val());
            var new_value = (jQuery(event.target).data('sign') == 'minus') ? current_value - 1 : current_value + 1;
            var max_quantity = jQuery(this).data('max-quantity');
            if (new_value < 0) new_value = 0;
            if (max_quantity && (new_value > max_quantity)) new_value = max_quantity;
            jQuery(this).find('input.item-quantity-selector-input').val(new_value);
            if ((jQuery(this).hasClass('selected') && (new_value > 0)) || (!jQuery(this).hasClass('selected') && (new_value == 0))) {
                latepoint_update_quantity_for_selectable_items(jQuery(this));
                latepoint_reload_summary($booking_form_element);
                return false;
            }
        }
        if (jQuery(event.target).hasClass('item-quantity-selector-input')) {
            latepoint_update_quantity_for_selectable_items(jQuery(this));
            latepoint_reload_summary($booking_form_element);
            return false;
        }
    }
    var summary_value = '';
    if (jQuery(this).hasClass('os-allow-multiselect')) {
        if (jQuery(this).hasClass('selected')) {
            jQuery(this).removeClass('selected');
            if (jQuery(this).hasClass('has-quantity')) jQuery(this).find('input.item-quantity-selector-input').val(0);
        } else {
            jQuery(this).addClass('selected');
            if (jQuery(this).hasClass('has-quantity') && !(jQuery(this).find('input.item-quantity-selector-input').val() > 0)) {
                jQuery(this).find('input.item-quantity-selector-input').val(1);
            }
        }
        latepoint_update_quantity_for_selectable_items(jQuery(this));
        summary_value = String(jQuery(this).closest('.os-selectable-items').find('.os-selectable-item.selected').map(function () {
            return (' ' + jQuery(this).data('summary-value'));
        }).get()).trim();
        latepoint_show_next_btn($booking_form_element);
    } else {
        if (!jQuery(this).hasClass('os-duration-item')) jQuery(this).closest('.os-item-categories-main-parent').find('.os-selectable-item.selected').removeClass('selected');
        jQuery(this).closest('.os-selectable-items').find('.os-selectable-item.selected').removeClass('selected');
        jQuery(this).addClass('selected');
        $booking_form_element.find(jQuery(this).data('id-holder')).val(jQuery(this).data('item-id'));
        summary_value = jQuery(this).data('summary-value');
        if (jQuery(this).data('cart-item-item-data-key')) {
            latepoint_update_active_cart_item_item_data($booking_form_element, jQuery(this).data('cart-item-item-data-key'), jQuery(this).data('item-id'));
        }
        if (jQuery(this).data('os-call-func')) {
            window[jQuery(this).data('os-call-func')](jQuery(this));
        }
        if (jQuery(this).data('activate-sub-step')) {
            window[jQuery(this).data('activate-sub-step')](jQuery(this));
        } else {
            latepoint_trigger_next_btn($booking_form_element);
        }
    }
    return false;
}

function latepoint_update_active_cart_item_item_data($booking_form_element, key, value) {
    let item_data_json = $booking_form_element.find('input[name="active_cart_item[item_data]"]').val();
    let item_data = item_data_json ? JSON.parse($booking_form_element.find('input[name="active_cart_item[item_data]"]').val()) : {};
    item_data[key] = value;
    $booking_form_element.find('input[name="active_cart_item[item_data]"]').val(JSON.stringify(item_data));
}

function latepoint_format_price(price) {
    // replace default decimal separator dot with comma if it's in settings
    if (latepoint_helper.decimal_separator == ',') price = String(price).replace('.', ',');
    return latepoint_helper.currency_symbol_before + String(price) + latepoint_helper.currency_symbol_after;
}


function latepoint_init_step_services() {
}


function latepoint_trigger_next_btn($booking_form_element) {
    $booking_form_element.find('.latepoint_step_direction').val('next');
    latepoint_submit_booking_form($booking_form_element.find('.latepoint-form'));
}

function latepoint_init_step_locations() {
}

function latepoint_init_agent_details_link($booking_form_element) {
    $booking_form_element.on('click', '.os-trigger-item-details-popup', function () {
        $booking_form_element.find('.os-item-details-popup.open').remove();
        var $popup = $booking_form_element.find('#' + jQuery(this).data('item-details-popup-id')).first().clone().attr('id', '');
        $booking_form_element.find('.latepoint-form-w').addClass('showing-item-details-popup');
        $popup.addClass('open').appendTo($booking_form_element.find('.latepoint-body'));
        return false;
    });
    $booking_form_element.on('click', '.os-item-details-popup.open .os-item-details-popup-close', function () {
        $booking_form_element.find('.latepoint-form-w').removeClass('showing-item-details-popup');
        jQuery(this).closest('.os-item-details-popup.open').remove();
        return false;
    });
}

function latepoint_init_step_agents() {
}


function latepoint_init_booking_summary_lightbox() {
    jQuery('.customer-dashboard-booking-summary-lightbox').on('click', '.qr-show-trigger', function () {
        jQuery(this).closest('.latepoint-lightbox-i').find('.qr-code-on-full-summary').addClass('show-vevent-qr-code');
        return false;
    });
    jQuery('.customer-dashboard-booking-summary-lightbox').on('click', '.os-item-details-popup-close', function () {
        var $ligthbox = jQuery(this).closest('.latepoint-lightbox-content');
        $ligthbox.find('.os-item-details-popup.open').remove();
        $ligthbox.find('.full-summary-wrapper').show();
        return false;
    });

    jQuery('.customer-dashboard-booking-summary-lightbox').on('click', '.os-trigger-item-details-popup', function () {
        var $ligthbox = jQuery(this).closest('.latepoint-lightbox-content');
        $ligthbox.find('.full-summary-wrapper').hide();
        $ligthbox.find('.os-item-details-popup.open').remove();
        var $popup = $ligthbox.find('#' + jQuery(this).data('item-details-popup-id')).clone();
        $popup.addClass('open').appendTo($ligthbox);
        return false;
    });
}

function latepoint_init_step_confirmation($booking_form_element = false) {
    if (!$booking_form_element) return;
    $booking_form_element.on('click', '.set-customer-password-btn', function () {
        var $btn = jQuery(this);
        var $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');

        $btn.addClass('os-loading');
        var params = {
            account_nonse: jQuery('input[name="account_nonse"]').val(),
            password: jQuery('input[name="customer[password]"]').val(),
            password_confirmation: jQuery('input[name="customer[password_confirmation]"]').val()
        }
        var data = {
            action: latepoint_helper.route_action,
            route_name: jQuery(this).data('btn-action'),
            params: jQuery.param(params),
            layout: 'none',
            return_format: 'json'
        }
        jQuery.ajax({
            type: "post",
            dataType: "json",
            url: latepoint_timestamped_ajaxurl(),
            data: data,
            success: function (data) {
                $btn.removeClass('os-loading');
                if (data.status === "success") {
                    $booking_form_element.find('.step-confirmation-set-password').html('').hide();
                    $booking_form_element.find('.confirmation-cabinet-info').show();
                } else {
                    latepoint_show_message_inside_element(data.message, $booking_form_element.find('.step-confirmation-set-password'), 'error');
                }
            }
        });
        return false;
    });

    $booking_form_element.on('click', '.qr-show-trigger', function () {
        var $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');
        $booking_form_element.find('.qr-code-on-full-summary').addClass('show-vevent-qr-code');
        return false;
    });

    $booking_form_element.on('click', '.show-set-password-fields', function () {
        var $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');

        $booking_form_element.find('.step-confirmation-set-password').show();
        $booking_form_element.find('#customer_password').trigger('focus');
        jQuery(this).closest('.info-box').hide();
        return false;
    });
}

function latepoint_init_customer_dashboard() {
    latepoint_init_form_masks();
    jQuery('.latepoint-customer-timezone-selector-w select').on('change', function (e) {
        var $select_box = jQuery(this);
        $select_box.closest('.latepoint-customer-timezone-selector-w').addClass('os-loading');
        var data = {
            action: latepoint_helper.route_action,
            route_name: jQuery(this).closest('.latepoint-customer-timezone-selector-w').data('route-name'),
            params: {timezone_name: jQuery(this).val()},
            layout: 'none',
            return_format: 'json'
        }
        jQuery.ajax({
            type: "post",
            dataType: "json",
            url: latepoint_timestamped_ajaxurl(),
            data: data,
            success: function (data) {
                $select_box.closest('.latepoint-customer-timezone-selector-w').removeClass('os-loading');
                if (data.status === "success") {
                    location.reload();
                } else {

                }
            }
        });
    });


    jQuery('.latepoint-request-booking-cancellation').on('click', function () {
        if (!confirm(latepoint_helper.cancel_booking_prompt)) return false;
        var $this = jQuery(this);
        var $booking_box = $this.closest('.customer-booking');

        var route = jQuery(this).data('route');
        var params = {id: $booking_box.data('id')};

        var data = {
            action: latepoint_helper.route_action,
            route_name: route,
            params: params,
            layout: 'none',
            return_format: 'json'
        }
        $this.addClass('os-loading');
        jQuery.ajax({
            type: "post",
            dataType: "json",
            url: latepoint_timestamped_ajaxurl(),
            data: data,
            success: function (data) {
                if (data.status === "success") {
                    $this.remove();
                    location.reload();
                } else {
                    $this.removeClass('os-loading');
                }
            }
        });
        return false;
    });

}


function get_customer_name($wrapper) {
    var customer_name = '';
    var first_name = $wrapper.find('input[name="customer[first_name]"]').val();
    var last_name = $wrapper.find('input[name="customer[last_name]"]').val();
    if (first_name) customer_name += first_name;
    if (last_name) customer_name += ' ' + last_name;
    return customer_name.trim();
}

function latepoint_init_step_contact() {
    latepoint_init_form_masks();

    // Init Logout button
    jQuery('.step-customer-logout-btn').on('click', function () {
        var $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');
        var data = {
            action: latepoint_helper.route_action,
            route_name: jQuery(this).data('btn-action'),
            layout: 'none',
            return_format: 'json'
        }
        latepoint_step_content_change_start($booking_form_element);
        jQuery.ajax({
            type: "post",
            dataType: "json",
            url: latepoint_timestamped_ajaxurl(),
            data: data,
            success: function (data) {
                latepoint_reload_step($booking_form_element);
            }
        });
        return false;
    });

    // Init Login Existing Customer Button
    jQuery('.step-login-existing-customer-btn').on('click', function () {
        var $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');
        var params = {
            email: $booking_form_element.find('.os-step-existing-customer-login-w input[name="customer_login[email]"]').val(),
            password: $booking_form_element.find('.os-step-existing-customer-login-w input[name="customer_login[password]"]').val()
        }
        var data = {
            action: latepoint_helper.route_action,
            route_name: jQuery(this).data('btn-action'),
            params: jQuery.param(params),
            layout: 'none',
            return_format: 'json'
        }
        latepoint_step_content_change_start($booking_form_element);
        jQuery.ajax({
            type: "post",
            dataType: "json",
            url: latepoint_timestamped_ajaxurl(),
            data: data,
            success: function (data) {
                if (data.status === "success") {
                    latepoint_reload_step($booking_form_element);
                } else {
                    latepoint_show_message_inside_element(data.message, $booking_form_element.find('.os-step-existing-customer-login-w'));
                    latepoint_step_content_change_end(false, $booking_form_element);
                }
            }
        });
        return false;
    });
}

function latepoint_step_content_change_start($booking_form_element) {
    $booking_form_element.removeClass('step-content-loaded').addClass('step-content-loading');
}

// TODO
function latepoint_step_content_change_end(new_content, $booking_form_element) {
    if (new_content) $booking_form_element.find('.latepoint-body .latepoint-step-content').replaceWith(new_content);
    $booking_form_element.removeClass('step-content-loading').addClass('step-content-mid-loading');
    setTimeout(function () {
        $booking_form_element.removeClass('step-content-mid-loading').addClass('step-content-loaded');
    }, 50);
}


function latepoint_change_step_desc($booking_form_element, step_code) {
    $booking_form_element.removeClass('step-changed').addClass('step-changing');
    setTimeout(function () {
        // Progress bar
        var $step_progress = $booking_form_element.find('.latepoint-progress li[data-step-code="' + step_code + '"]');
        $step_progress.addClass('active').addClass('complete').prevAll().addClass('complete').removeClass('active');
        $step_progress.nextAll().removeClass('complete').removeClass('active');
        // Side panel
        var side_panel_desc = $booking_form_element.find('.latepoint-step-desc-library[data-step-code="' + step_code + '"]').html();
        $booking_form_element.find('.latepoint-step-desc').html(side_panel_desc);

        // Top header
        var top_header_desc = $booking_form_element.find('.os-heading-text-library[data-step-code="' + step_code + '"]').html();
        $booking_form_element.find('.os-heading-text').html(top_header_desc);
        setTimeout(function () {
            $booking_form_element.removeClass('step-changing').addClass('step-changed');
        }, 50);
    }, 500);
}


function latepoint_progress_prev($booking_form_element, step_code) {
    var $step_progress = $booking_form_element.find('.latepoint-progress li[data-step-code="' + step_code + '"]');
    $step_progress.addClass('active').addClass('complete').prevAll().addClass('complete').removeClass('active');
    $step_progress.nextAll().removeClass('complete').removeClass('active');
}


function latepoint_progress_next($booking_form_element, step_code) {
    var $step_progress = $booking_form_element.find('.latepoint-progress li[data-step-code="' + step_code + '"]');
    $step_progress.addClass('active').addClass('complete').prevAll().addClass('complete').removeClass('active');
    $step_progress.nextAll().removeClass('complete').removeClass('active');
}


function latepoint_next_step_description($booking_form_element, step_code) {
    $booking_form_element.removeClass('step-changed').addClass('step-changing');
    setTimeout(function () {
        $booking_form_element.find('.latepoint-step-desc').html($booking_form_element.find('.latepoint-step-desc-library.active').removeClass('active').next('.latepoint-step-desc-library').addClass('active').html());
        $booking_form_element.find('.os-heading-text').html($booking_form_element.find('.os-heading-text-library.active').removeClass('active').next('.os-heading-text-library').addClass('active').html());
        setTimeout(function () {
            $booking_form_element.removeClass('step-changing').addClass('step-changed');
        }, 50);
    }, 500);
}

function latepoint_prev_step_description($booking_form_element, step_code) {
    $booking_form_element.removeClass('step-changed').addClass('step-changing');
    setTimeout(function () {
        $booking_form_element.find('.latepoint-step-desc').html($booking_form_element.find('.latepoint-step-desc-library.active').removeClass('active').prev('.latepoint-step-desc-library').addClass('active').html());
        $booking_form_element.find('.os-heading-text').html($booking_form_element.find('.os-heading-text-library.active').removeClass('active').prev('.os-heading-text-library').addClass('active').html());
        setTimeout(function () {
            $booking_form_element.removeClass('step-changing').addClass('step-changed');
        }, 50);
    }, 500);
}


function latepoint_validate_fields($fields) {
    var is_valid = true;
    $fields.each(function (index) {
        if (jQuery(this).val() == '') {
            is_valid = false;
            return false;
        }
    });
    return is_valid;
}


async function latepoint_submit_booking_form($booking_form) {
    let $booking_form_element = $booking_form.closest('.latepoint-booking-form-element');

    let current_step = $booking_form_element.find('.latepoint_current_step_code').val();
    let callbacks_list = [];
    if (latepoint_check_if_booking_form_is_final_submit($booking_form_element)) {
        // check if order intent is still bookable
        latepoint_add_action(callbacks_list, async () => {
            return await latepoint_check_if_order_intent_still_bookable($booking_form_element);
        }, 1);
    }
    $booking_form_element.trigger('latepoint:submitBookingForm', [{
        current_step: current_step,
        callbacks_list: callbacks_list,
        is_final_submit: latepoint_check_if_booking_form_is_final_submit($booking_form_element),
        direction: $booking_form_element.find('.latepoint_step_direction').val()
    }]);
    try {
        latepoint_hide_prev_btn($booking_form_element);
        await latepoint_process_list_of_callbacks(callbacks_list, $booking_form_element, $booking_form);
    } catch (error) {
        latepoint_show_prev_btn($booking_form_element);
        latepoint_show_error_and_stop_loading_booking_form(error, $booking_form_element);
        return false;
    }



    $booking_form_element.removeClass('step-content-loaded').addClass('step-content-loading');
    latepoint_hide_prev_btn($booking_form_element);
    try{
        latepoint_hide_message_inside_element($booking_form_element.find('.latepoint-body'));
        let response = await jQuery.ajax({
            type: "post",
            dataType: "json",
            processData: false,
            contentType: false,
            url: latepoint_timestamped_ajaxurl(),
            data: latepoint_create_form_data($booking_form)
        });

        $booking_form.find('.latepoint_step_direction').val('next');
        if(response.status === 'success'){
            if (response.fields_to_update) {
                for (const [key, value] of Object.entries(response.fields_to_update)) {
                    $booking_form_element.find('input[name="' + key + '"]').val(value)
                }
            }
            if ($booking_form_element.data('flash-error')) {
                latepoint_show_message_inside_element($booking_form_element.data('flash-error'), $booking_form_element.find('.latepoint-body'));
                $booking_form_element.data('flash-error', '');
            }
            $booking_form_element.find('.latepoint_current_step_code').val(response.step_code);
            $booking_form_element.removeClass(function (index, className) {
                return (className.match(/(^|\s)current-step-\S+/g) || []).join(' ');
            }).addClass('current-step-' + response.step_code);
            setTimeout(function () {
                $booking_form_element.removeClass('step-content-loading').addClass('step-content-mid-loading');
                $booking_form_element.find('.latepoint-body').find('.latepoint-step-content').addClass('is-hidden');
                if ($booking_form_element.find('.latepoint-step-content[data-step-code="' + response.step_code + '"]')) {
                    $booking_form_element.find('.latepoint-step-content[data-step-code="' + response.step_code + '"]').remove();
                }
                $booking_form_element.find('.latepoint-body').append(response.message);


                latepoint_update_next_btn_label($booking_form_element);
                latepoint_init_step(response.step_code, $booking_form_element);
                setTimeout(function () {
                    $booking_form_element.removeClass('step-content-mid-loading').addClass('step-content-loaded');
                    $booking_form_element.find('.latepoint-next-btn, .latepoint-prev-btn').removeClass('os-loading');
                    latepoint_scroll_to_top_of_booking_form($booking_form_element);
                }, 50);
            }, 500);

            if (response.is_pre_last_step) {
                $booking_form_element.data('next-submit-is-last', 'yes');
            } else {
                $booking_form_element.data('next-submit-is-last', 'no');
            }
            if (response.is_last_step) {
                $booking_form_element.addClass('hidden-buttons').find('.latepoint-footer').remove();
                $booking_form_element.find('.latepoint-progress').css('opacity', 0);
                $booking_form_element.closest('.latepoint-summary-is-open').removeClass('latepoint-summary-is-open');
                $booking_form_element.closest('.latepoint-show-side-panel').removeClass('latepoint-show-side-panel').addClass('latepoint-hide-side-panel');
                $booking_form_element.addClass('is-final-step');
            } else {
                if (response.show_next_btn === true) {
                    latepoint_show_next_btn($booking_form_element);
                } else {
                    latepoint_hide_next_btn($booking_form_element);
                }
                if (response.show_prev_btn === true) {
                    latepoint_show_prev_btn($booking_form_element);
                } else {
                    latepoint_hide_prev_btn($booking_form_element);
                }
            }
            latepoint_change_step_desc($booking_form_element, response.step_code);
            latepoint_reload_summary($booking_form_element);
        }else{
            if(response.send_to_step && response.send_to_step === 'resubmit'){
                let current_resubmit_count = parseInt($booking_form.data('resubmit-count')) ? parseInt($booking_form.data('resubmit-count')) : 1;
                $booking_form.data('resubmit-count', current_resubmit_count + 1);
                if(current_resubmit_count > 6){
                    latepoint_show_message_inside_element(response.message, $booking_form_element.find('.latepoint-body'));
                }else{
                    // resubmission probably caused by order intent still being processed, since
                    // order intent is still processing, give it a little more time and try again
                    await latepoint_sleep(2000);
                    return latepoint_submit_booking_form($booking_form);
                }
            }else{
                $booking_form_element.removeClass('step-content-loading').addClass('step-content-loaded');
                $booking_form_element.find('.latepoint-next-btn, .latepoint-prev-btn').removeClass('os-loading');
                if (response.send_to_step && $booking_form_element.find('.latepoint-step-content[data-step-code="' + response.send_to_step + '"]').length) {
                    $booking_form_element.data('flash-error', response.message);
                    latepoint_reload_step($booking_form_element, response.send_to_step);
                } else {
                    latepoint_show_message_inside_element(response.message, $booking_form_element.find('.latepoint-body'));
                    latepoint_show_prev_btn($booking_form_element);
                }
            }
        }
    }catch(e){
        console.log(e);
        alert('Error:' + e);
    }
}

function latepoint_sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function latepoint_show_error_and_stop_loading_booking_form(error, $booking_form_element) {
    if (error.send_to_step && $booking_form_element.find('.latepoint-step-content[data-step-code="' + error.send_to_step + '"]').length) {
        latepoint_reload_step($booking_form_element, error.send_to_step);
        $booking_form_element.data('flash-error', error.message);
    } else {
        latepoint_show_message_inside_element(error.message, $booking_form_element.find('.latepoint-body'), 'error');

        if ($booking_form_element.hasClass('step-content-loading')) $booking_form_element.removeClass('step-content-loading').addClass('step-content-loaded');
        $booking_form_element.find('.latepoint-next-btn').removeClass('os-loading');

        // if previous step exists - show prev button
        if ($booking_form_element.find('.latepoint-step-content:last-child').prev('.latepoint-step-content').length) latepoint_show_prev_btn($booking_form_element);
        latepoint_scroll_to_top_of_booking_form($booking_form_element);
    }
}

function latepoint_reset_active_cart_item($booking_form_element) {
    $booking_form_element.find('input[name="active_cart_item[id]"]').val('');
    $booking_form_element.find('input[name="active_cart_item[variant]"]').val('');
    $booking_form_element.find('input[name="active_cart_item[item_data]"]').val('');
}

function latepoint_check_if_booking_form_is_final_submit($booking_form_element) {
    return ($booking_form_element.data('next-submit-is-last') == 'yes');
}


async function latepoint_check_if_order_intent_still_bookable($booking_form_element) {
    let response = await jQuery.ajax({
        type: "post",
        dataType: "json",
        processData: false,
        contentType: false,
        url: latepoint_timestamped_ajaxurl(),
        data: latepoint_create_form_data($booking_form_element.find('.latepoint-form'), latepoint_helper.check_order_intent_bookable_route)
    });
    if(response.status === 'success'){
        return true;
    }else{
        throw new Error(response.message);
    }
}

async function latepoint_process_list_of_callbacks(callbacks, $booking_form_element, $booking_form) {
    for (const callback of callbacks) {
        await callback.action();
    }
}

function latepoint_clear_presets($booking_form_element){
    $booking_form_element.find('.clear_for_new_item').val('');
}

function latepoint_init_booking_form($booking_form_element) {
    $booking_form_element.on('click keydown', '.checkout-from-summary-panel-btn', function (event) {
        if(event.type === 'keydown' && event.key !== ' ' &&  event.key !== 'Enter') return;
        latepoint_reload_step($booking_form_element, jQuery(this).data('step'));
        jQuery(this).closest('.latepoint-w').removeClass('show-summary-on-mobile');
        return false;
    });

    $booking_form_element.on('click keydown', '.latepoint-add-another-item-trigger', function (event) {
        if(event.type === 'keydown' && event.key !== ' ' &&  event.key !== 'Enter') return;
        latepoint_clear_presets($booking_form_element);
        latepoint_reset_active_cart_item($booking_form_element);
        latepoint_reload_step($booking_form_element, jQuery(this).data('step'));
        return false;
    });
    $booking_form_element.find('.latepoint-form').on('submit', function (e) {
        e.preventDefault();
        let $booking_form = jQuery(this);
        latepoint_submit_booking_form($booking_form);
    });

    latepoint_init_booking_summary_panel($booking_form_element);

    $booking_form_element.find('.latepoint-heading-w .latepoint-lightbox-summary-trigger').on('click', function () {
        var $wrapper = jQuery(this).closest('.latepoint-w');
        $wrapper.toggleClass('show-summary-on-mobile');
        return false;
    });

    $booking_form_element.find('.latepoint-lightbox-close').on('click', function () {

        let params = new URLSearchParams(location.search);
        if (params.has('latepoint_order_intent_key')) {
            params.delete('latepoint_order_intent_key');
            history.replaceState(null, '', '?' + params + location.hash);
        }

        jQuery('body').removeClass('latepoint-lightbox-active');
        jQuery('.latepoint-lightbox-w').remove();
        return false;
    });


    $booking_form_element.find('.latepoint-timezone-selector-w select').on('change', function (e) {
        var $select_box = jQuery(this);
        $select_box.closest('.latepoint-timezone-selector-w').addClass('os-loading');
        var data = {
            action: latepoint_helper.route_action,
            route_name: jQuery(this).closest('.latepoint-timezone-selector-w').data('route-name'),
            params: {timezone_name: jQuery(this).val()},
            layout: 'none',
            return_format: 'json'
        }
        $booking_form_element.removeClass('step-content-loaded').addClass('step-content-loading');
        jQuery.ajax({
            type: "post",
            dataType: "json",
            url: latepoint_timestamped_ajaxurl(),
            data: data,
            success: function (data) {
                $select_box.closest('.latepoint-timezone-selector-w').removeClass('os-loading');
                $booking_form_element.removeClass('step-content-loading');
                if (data.status === "success") {
                    // reload datepicker if its the step
                    if ($select_box.closest('.latepoint-booking-form-element').hasClass('current-step-booking__datepicker')) {
                        latepoint_reload_step($select_box.closest('.latepoint-booking-form-element'));
                    }
                } else {

                }
            }
        });
    });

    if (!latepoint_helper.is_timezone_selected) {
        const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tzid) {
            if (tzid != $booking_form_element.find('.latepoint-timezone-selector-w select').val()) $booking_form_element.find('.latepoint-timezone-selector-w select').val(tzid).trigger('change');
        }
    }


    $booking_form_element.on('click keydown', '.lp-option', function (event) {
        if(event.type === 'keydown' && event.key !== ' ' &&  event.key !== 'Enter') return;
        jQuery(this).closest('.lp-options').find('.lp-option.selected').removeClass('selected');
        jQuery(this).addClass('selected');
    });


    // Next Step button Click
    $booking_form_element.find('.latepoint-next-btn').on('click', async function (e) {
        e.preventDefault();
        if (jQuery(this).hasClass('disabled') || jQuery(this).hasClass('os-loading')) return false;
        var $next_btn = jQuery(this);
        $next_btn.addClass('os-loading');
        var $booking_form = jQuery(this).closest('.latepoint-form');

        var current_step = $booking_form_element.find('.latepoint_current_step_code').val();

        $booking_form.find('.latepoint_step_direction').val('next');
        var callbacks_list = [];

        $booking_form_element.trigger('latepoint:nextStepClicked', [{
            current_step: current_step,
            callbacks_list: callbacks_list
        }]);
        latepoint_hide_prev_btn($booking_form_element);

        try{
            await latepoint_process_list_of_callbacks(callbacks_list, $booking_form_element, $booking_form );
            await latepoint_submit_booking_form($booking_form);
        }catch(error){
            latepoint_show_error_and_stop_loading_booking_form(error, $booking_form_element);
        }
        return false;
    });


    // Previous Step button Click
    $booking_form_element.find('.latepoint-prev-btn').on('click', function (e) {
        if (jQuery(this).hasClass('disabled') || jQuery(this).hasClass('os-loading')) return false;

        let $current_step = $booking_form_element.find('.latepoint-step-content:last-child');


        // handle categories
        if ($current_step.hasClass('selecting-item-category')) {
            if ($current_step.find('.os-item-category-w .os-item-category-w.selected').length) {
                $current_step.find('.os-item-category-w .os-item-category-w.selected').parents('.os-item-category-w').addClass('selected').find('.os-item-category-w.selected').removeClass('selected');
            } else {
                $current_step.removeClass('selecting-item-category').find('.os-item-category-w.selected').removeClass('selected');
                $current_step.removeClass('selecting-item-category').find('.os-item-categories-holder.show-selected-only').removeClass('show-selected-only');
            }
            if (($booking_form_element.find('.latepoint-step-content').length <= 1) && !$current_step.hasClass('selecting-item-category')) {
                latepoint_hide_prev_btn($booking_form_element);
            }
            latepoint_reload_summary($booking_form_element);
            return false;
        }

        if ($current_step.data('clear-action')) {
            window[$current_step.data('clear-action')]($booking_form_element);
        }

        let $back_btn = jQuery(this);
        $back_btn.addClass('os-loading');
        $booking_form_element.removeClass('step-content-loaded').addClass('step-content-loading');
        let $new_current_step = $booking_form_element.find('.latepoint-step-content.is-hidden').last();
        let new_current_step_code = $new_current_step.data('step-code');
        let current_step_code = $current_step.data('step-code');


        let current_parent_code_name = current_step_code.split('__')[0];
        let new_parent_code_name = new_current_step_code.split('__')[0];

        let active_cart_item_id = $booking_form_element.find('input[name="active_cart_item[id]"]').val();

        latepoint_change_step_desc($booking_form_element, new_current_step_code);
        setTimeout(function () {
            $new_current_step.removeClass('is-hidden');
            $current_step.remove();
            $booking_form_element.find('.latepoint_current_step_code').val(new_current_step_code);
            $booking_form_element.removeClass(function (index, className) {
                return (className.match(/(^|\s)current-step-\S+/g) || []).join(' ');
            }).addClass('current-step-' + new_current_step_code);
            $booking_form_element.find('.latepoint-next-btn span').text($booking_form_element.find('.latepoint-next-btn').data('label'));
            $booking_form_element.data('next-submit-is-last', 'no');

            latepoint_update_next_btn_label($booking_form_element);
            latepoint_show_next_btn($booking_form_element);
            $back_btn.removeClass('os-loading');
            if ($booking_form_element.find('.latepoint-step-content').length <= 1) {
                if ($new_current_step.hasClass('selecting-item-category')) {

                }
                if (new_current_step_code == 'booking__services') {
                    var $services_step = $booking_form_element.find('.step-services-w');
                    if ($services_step.hasClass('selecting-item-category')) {
                        if ($services_step.find('.os-services > .os-item.selected').hasClass('is-preselected')) {
                            // if service is preselected check if there are both multiple durations and quantity selector and only then show prev button
                        } else {
                            latepoint_show_prev_btn($booking_form_element);
                        }
                    } else {
                        latepoint_hide_prev_btn($booking_form_element);
                    }
                } else {
                    if (!$new_current_step.hasClass('selecting-item-category')) {
                        latepoint_hide_prev_btn($booking_form_element);
                    }
                }
            }
            $booking_form_element.removeClass('step-content-loading').addClass('step-content-mid-loading');


            if(new_parent_code_name == 'booking' && current_parent_code_name != 'booking' && active_cart_item_id){

                // we are going back to one of the steps of a booking process, we need to remove the item that was just added to the cart and start over
                $booking_form_element.find('.latepoint-summary-w').addClass('os-loading');
                let data = {
                    action: latepoint_helper.route_action,
                    route_name: latepoint_helper.remove_cart_item_route,
                    params: jQuery.param({cart_item_id: active_cart_item_id}),
                    layout: 'none',
                    return_format: 'json'
                }
                jQuery.ajax({
                    type: "post",
                    dataType: "json",
                    url: latepoint_timestamped_ajaxurl(),
                    data: data,
                    success: function (data) {
                        if (data.status === "success") {
                            $booking_form_element.find('input[name="active_cart_item[id]"]').val('');
                            if($booking_form_element.find('input[name="active_cart_item[variant]"]').val() == 'bundle'){
                                latepoint_update_active_cart_item_item_data($booking_form_element, 'bundle_id', '');
                                $booking_form_element.find('input[name="active_cart_item[variant]"]').val('');
                            }
                            latepoint_reload_summary($booking_form_element);
                        } else {
                            $booking_form_element.find('.latepoint-summary-w').removeClass('os-loading');
                            latepoint_show_message_inside_element(data.message, $booking_form_element.find('.latepoint-body'), 'error');
                        }
                    }
                });
            }else{
                latepoint_reload_summary($booking_form_element);
            }
            setTimeout(function () {
                $booking_form_element.removeClass('step-content-mid-loading').addClass('step-content-loaded');
                latepoint_hide_message_inside_element($booking_form_element.find('.latepoint-body'));
                latepoint_scroll_to_top_of_booking_form($booking_form_element);
            }, 150);
        }, 700);
        return false;
    });

    latepoint_init_agent_details_link($booking_form_element);
}


function latepoint_init_booking_form_by_trigger($trigger) {
    let route = latepoint_helper.booking_button_route;
    let params = {};
    let restrictions = {};
    let presets = {};
    let booking_element_styles = {};
    if ($trigger.data('show-service-categories')) restrictions.show_service_categories = $trigger.data('show-service-categories');
    if ($trigger.data('show-locations')) restrictions.show_locations = $trigger.data('show-locations');
    if ($trigger.data('show-services')) restrictions.show_services = $trigger.data('show-services');
    if ($trigger.data('show-agents')) restrictions.show_agents = $trigger.data('show-agents');
    if ($trigger.data('calendar-start-date')) restrictions.calendar_start_date = $trigger.data('calendar-start-date');

    if ($trigger.data('selected-location')) presets.selected_location = $trigger.data('selected-location');
    if ($trigger.data('selected-agent')) presets.selected_agent = $trigger.data('selected-agent');
    if ($trigger.data('selected-service')) presets.selected_service = $trigger.data('selected-service');
    if ($trigger.data('selected-bundle')) presets.selected_bundle = $trigger.data('selected-bundle');
    if ($trigger.data('selected-duration')) presets.selected_duration = $trigger.data('selected-duration');
    if ($trigger.data('selected-total-attendees')) presets.selected_total_attendees = $trigger.data('selected-total-attendees');
    if ($trigger.data('selected-service-category')) presets.selected_service_category = $trigger.data('selected-service-category');
    if ($trigger.data('selected-start-date')) presets.selected_start_date = $trigger.data('selected-start-date');
    if ($trigger.data('selected-start-time')) presets.selected_start_time = $trigger.data('selected-start-time');
    if ($trigger.data('order-item-id')) presets.order_item_id = $trigger.data('order-item-id');
    if ($trigger.data('source-id')) presets.source_id = $trigger.data('source-id');

    if ($trigger.data('hide-summary') == 'yes') booking_element_styles.hide_summary = true;
    if ($trigger.data('hide-side-panel') == 'yes') booking_element_styles.hide_side_panel = true;


    if (jQuery.isEmptyObject(restrictions) == false) params.restrictions = restrictions;
    if (jQuery.isEmptyObject(presets) == false) params.presets = presets;
    if (jQuery.isEmptyObject(booking_element_styles) == false) params.booking_element_styles = booking_element_styles;

    let data = {
        action: latepoint_helper.route_action,
        route_name: route,
        params: params,
        layout: 'none',
        return_format: 'json'
    }

    let is_inline_form = $trigger.hasClass('latepoint-book-form-wrapper');
    if(is_inline_form){
        data.params.booking_element_type = 'inline_form';
    }

    $trigger.addClass('os-loading');
    jQuery.ajax({
        type: "post",
        dataType: "json",
        url: latepoint_timestamped_ajaxurl(),
        data: data,
        success: (data) => {
            if (data.status === "success") {
                let $booking_form_element = false;
                if(is_inline_form){
                    $trigger.html(data.message);
                    $booking_form_element = $trigger.find('.latepoint-booking-form-element');
                }else{
                    let lightbox_class = 'booking-form-in-lightbox';
                    latepoint_show_data_in_lightbox(data.message, lightbox_class, false);
                    $booking_form_element = jQuery('.latepoint-lightbox-w .latepoint-booking-form-element');
                    jQuery('body').addClass('latepoint-lightbox-active');
                }
                latepoint_init_booking_form($booking_form_element);
                latepoint_init_step(data.step, $booking_form_element);
                $trigger.removeClass('os-loading');
            } else {
                $trigger.removeClass('os-loading');
                // console.log(data.message);
            }
        }
    });
}


/*
 * Copyright (c) 2023 LatePoint LLC. All rights reserved.
 */

async function latepoint_init_transaction_payment_form() {
    let callbacks_list = [];
    let $transaction_payment_form = jQuery('.latepoint-transaction-payment-form');
    let current_step = $transaction_payment_form.find('input[name="current_step"]').val();

    $transaction_payment_form.on('click keydown', '.lp-option', (e) => {
        let $option = jQuery(e.currentTarget);
        if(e.type === 'keydown' && e.key !== ' ' &&  e.key !== 'Enter') return;
        $option.closest('.lp-options').find('.lp-option.selected').removeClass('selected');
        $option.addClass('selected');
        $transaction_payment_form.find('input[name="' + $option.data('holder') + '"]').val($option.data('value'));
        $transaction_payment_form.trigger('submit');
        return false;
    });


    switch (current_step) {
        case 'methods':
            break;
        case 'processors':
            break;
        case 'pay':
            $transaction_payment_form.trigger('latepoint:initOrderPaymentMethod', [{
                callbacks_list: callbacks_list,
                payment_method: $transaction_payment_form.find('input[name="payment_method"]').val(),
                payment_processor: $transaction_payment_form.find('input[name="payment_processor"]').val(),
            }]);
            $transaction_payment_form.addClass('os-loading');

            try {
                for (const callback of callbacks_list) {
                    await callback.action();
                }
                $transaction_payment_form.removeClass('os-loading');
            } catch (error) {
                latepoint_show_error_and_stop_loading_booking_form(error, $transaction_payment_form);
            }
            break;
        case 'confirmation':
            break;
    }

    $transaction_payment_form.on('submit', async function (e) {
        e.preventDefault();
        await latepoint_submit_transaction_payment_form(jQuery(e.target));
    });
}

async function latepoint_submit_transaction_payment_form($transaction_payment_form) {

    if($transaction_payment_form.hasClass('os-loading')) return false;
    let callbacks_list = [];

    $transaction_payment_form.find('.latepoint-message').remove();
    $transaction_payment_form.addClass('os-loading');
    $transaction_payment_form.find('.latepoint-btn').addClass('os-loading');

    $transaction_payment_form.trigger('latepoint:submitTransactionPaymentForm', [{
        callbacks_list: callbacks_list,
        payment_method: $transaction_payment_form.find('input[name="payment_method"]').val(),
        payment_processor: $transaction_payment_form.find('input[name="payment_processor"]').val(),
        current_step: $transaction_payment_form.find('input[name="current_step"]').val(),
    }]);

    try {
        for (const callback of callbacks_list) {
            await callback.action();
        }
    } catch (error) {
        $transaction_payment_form.removeClass('os-loading').find('.os-loading').removeClass('os-loading');
        latepoint_show_message_inside_element(error.message, $transaction_payment_form.find('.lp-payment-method-content'), 'error');
        return false;
    }


    try {
        let response = await jQuery.ajax({
            type: "post",
            dataType: "json",
            processData: false,
            contentType: false,
            url: latepoint_timestamped_ajaxurl(),
            data: latepoint_create_form_data($transaction_payment_form, latepoint_helper.invoices_payment_form_route)
        });

        $transaction_payment_form.removeClass('os-loading').find('.os-loading').removeClass('os-loading');

        if (response.status === 'success') {
            $transaction_payment_form.html(response.message);
            return await latepoint_init_transaction_payment_form();

        } else {
            latepoint_show_message_inside_element(response.message, $transaction_payment_form.find('.lp-payment-method-content'), 'error');
            return false;
        }
    } catch (e) {

        $transaction_payment_form.removeClass('os-loading').find('.os-loading').removeClass('os-loading');
        console.log(e);
        alert('Error:' + e);
    }

}

function latepoint_hide_reschedule_button() {
    jQuery('.reschedule-confirmation-button-wrapper').hide();
}

function latepoint_show_reschedule_button() {
    jQuery('.reschedule-confirmation-button-wrapper').show();
}

function latepoint_customer_cabinet_reload_booking_tile($booking_tile) {
    $booking_tile.addClass('os-loading');
    let params = {
        booking_id: $booking_tile.data('id'),
    }
    let data = {
        action: latepoint_helper.route_action,
        route_name: $booking_tile.data('route-name'),
        params: params,
        layout: 'none',
        return_format: 'json'
    };
    jQuery.ajax({
        type: "post",
        dataType: "json",
        url: latepoint_timestamped_ajaxurl(),
        data: data,
        success: function (data) {
            $booking_tile.removeClass('os-loading')
            if (data.status === "success") {
                $booking_tile.replaceWith(data.message);
            } else {
                alert(data.message);
            }
        }
    });
}


function latepoint_init_reschedule() {

    jQuery('.reschedule-calendar-wrapper').on('click', '.latepoint-request-reschedule-trigger', function () {
        let $trigger = jQuery(this)
        let $wrapper = $trigger.closest('.reschedule-calendar-wrapper')
        let booking_id = $wrapper.find('input[type="hidden"].latepoint_booking_id').val()

        $trigger.addClass('os-loading')
        let params = {
            booking_id: booking_id,
            key: $wrapper.find('input[type="hidden"].latepoint_manage_booking_key').val(),
            start_date: $wrapper.find('input[type="hidden"].latepoint_start_date').val(),
            start_time: $wrapper.find('input[type="hidden"].latepoint_start_time').val(),
        }
        let data = {
            action: latepoint_helper.route_action,
            route_name: $trigger.data('route-name'),
            params: params,
            layout: 'none',
            return_format: 'json'
        };
        jQuery.ajax({
            type: "post",
            dataType: "json",
            url: latepoint_timestamped_ajaxurl(),
            data: data,
            success: function (data) {
                $trigger.removeClass('os-loading')
                if (data.status === "success") {
                    jQuery('.latepoint-lightbox-content').html(data.message);
                    jQuery('.latepoint-lightbox-footer, .latepoint-lightbox-heading').remove();
                    if (jQuery('.customer-bookings-tiles').length) {
                        // called from customer cabinet
                        latepoint_customer_cabinet_reload_booking_tile(jQuery('.customer-bookings-tiles .customer-booking[data-id="' + booking_id + '"]'));
                    } else {
                        // called from manage by key
                        latepoint_manage_by_key_reload_booking();
                    }
                } else {
                    latepoint_show_message_inside_element(data.message, jQuery('.latepoint-lightbox-content'), 'error');
                    jQuery('.latepoint-lightbox-content').animate({scrollTop: 0}, 300);
                }
            }
        });
        return false;
    });

    jQuery('.reschedule-calendar-wrapper').on('click keydown', '.dp-timepicker-trigger', function (event) {
        if (event.type === 'keydown' && event.key !== ' ' && event.key !== 'Enter') return;
        var $reschedule_form_element = jQuery(this).closest('.reschedule-calendar-wrapper');
        if (jQuery(this).hasClass('is-booked') || jQuery(this).hasClass('is-off')) {
            // Show error message that you cant select a booked period
        } else {
            if (jQuery(this).hasClass('selected')) {
                jQuery(this).removeClass('selected');
                jQuery(this).find('.dp-success-label').remove();
                $reschedule_form_element.find('.latepoint_start_time').val('');
                latepoint_hide_reschedule_button();
            } else {
                $reschedule_form_element.find('.dp-timepicker-trigger.selected').removeClass('selected').find('.dp-success-label').remove();
                var selected_timeslot_time = jQuery(this).find('.dp-label-time').html();
                jQuery(this).addClass('selected').find('.dp-label').prepend('<span class="dp-success-label">' + latepoint_helper.datepicker_timeslot_selected_label + '</span>');

                var minutes = parseInt(jQuery(this).data('minutes'));
                var timeshift_minutes = parseInt($reschedule_form_element.find('.latepoint_timeshift_minutes').val());
                // we substract timeshift minutes because its timeshift minutes that the business is running in, in opposite of what we do when we generate a calendar for a client
                if (timeshift_minutes) minutes = minutes - timeshift_minutes;
                var start_date = new Date($reschedule_form_element.find('.os-day.selected').data('date'));
                if (minutes < 0) {
                    // business minutes are in previous day
                    minutes = 24 * 60 + minutes;
                    // move start date back 1 day
                    start_date.setDate(start_date.getDate() - 1);
                } else if (minutes >= 24 * 60) {
                    // business minutes are in next day
                    minutes = minutes - 24 * 60;
                    start_date.setDate(start_date.getDate() + 1);
                }
                $reschedule_form_element.find('.latepoint_start_date').val(start_date.toISOString().split('T')[0])
                $reschedule_form_element.find('.latepoint_start_time').val(minutes);
                latepoint_show_reschedule_button();
            }
        }
        return false;
    });


    jQuery('.reschedule-calendar-wrapper').on('click', '.os-month-next-btn', function () {
        var $reschedule_form_element = jQuery(this).closest('.reschedule-calendar-wrapper');
        var next_month_route_name = jQuery(this).data('route');
        if ($reschedule_form_element.find('.os-monthly-calendar-days-w.active + .os-monthly-calendar-days-w').length) {
            $reschedule_form_element.find('.os-monthly-calendar-days-w.active').removeClass('active').next('.os-monthly-calendar-days-w').addClass('active');
            latepoint_calendar_set_month_label($reschedule_form_element);
        } else {
            // TODO add condition to check maximum number months to call into the future
            if (true) {
                var $btn = jQuery(this);
                $btn.addClass('os-loading');
                var $calendar_element = $reschedule_form_element.find('.os-monthly-calendar-days-w').last();
                var calendar_year = $calendar_element.data('calendar-year');
                var calendar_month = $calendar_element.data('calendar-month');
                if (calendar_month == 12) {
                    calendar_year = calendar_year + 1;
                    calendar_month = 1;
                } else {
                    calendar_month = calendar_month + 1;
                }
                var data = {
                    action: latepoint_helper.route_action,
                    route_name: next_month_route_name,
                    params: {
                        timezone_name: $reschedule_form_element.find('input[type="hidden"].latepoint_timezone_name').val(),
                        key: $reschedule_form_element.find('input[type="hidden"].latepoint_manage_booking_key').val(),
                        target_date_string: `${calendar_year}-${calendar_month}-1`,
                        booking: {
                            id: $reschedule_form_element.find('input[type="hidden"].latepoint_booking_id').val()
                        }
                    },
                    layout: 'none',
                    return_format: 'json'
                }
                jQuery.ajax({
                    type: "post",
                    dataType: "json",
                    url: latepoint_timestamped_ajaxurl(),
                    data: data,
                    success: function (data) {
                        $btn.removeClass('os-loading');
                        if (data.status === "success") {
                            $reschedule_form_element.find('.os-months').append(data.message);
                            $reschedule_form_element.find('.os-monthly-calendar-days-w.active').removeClass('active').next('.os-monthly-calendar-days-w').addClass('active');
                            latepoint_calendar_set_month_label($reschedule_form_element);
                        } else {
                            // console.log(data.message);
                        }
                    }
                });
            }
        }
        latepoint_calendar_show_or_hide_prev_next_buttons($reschedule_form_element);
        return false;
    });

    jQuery('.reschedule-calendar-wrapper').on('click', '.os-month-prev-btn', function () {
        var $reschedule_form_element = jQuery(this).closest('.reschedule-calendar-wrapper');
        if ($reschedule_form_element.find('.os-monthly-calendar-days-w.active').prev('.os-monthly-calendar-days-w').length) {
            $reschedule_form_element.find('.os-monthly-calendar-days-w.active').removeClass('active').prev('.os-monthly-calendar-days-w').addClass('active');
            latepoint_calendar_set_month_label($reschedule_form_element);
        }
        latepoint_calendar_show_or_hide_prev_next_buttons($reschedule_form_element);
        return false;
    });

    jQuery('.reschedule-calendar-wrapper .os-months').on('click', '.os-day', function () {
        if (jQuery(this).hasClass('os-day-passed')) return false;
        if (jQuery(this).hasClass('os-not-in-allowed-period')) return false;
        var $reschedule_form_element = jQuery(this).closest('.reschedule-calendar-wrapper');
        if (jQuery(this).closest('.os-monthly-calendar-days-w').hasClass('hide-if-single-slot')) {

            // HIDE TIMESLOT IF ONLY ONE TIMEPOINT
            if (jQuery(this).hasClass('os-not-available')) {
                // clicked on a day that has no available timeslots
                // do nothing
            } else {
                $reschedule_form_element.find('.os-day.selected').removeClass('selected');
                jQuery(this).addClass('selected');
                // set date
                $reschedule_form_element.find('.latepoint_start_date').val(jQuery(this).data('date'));
                if (jQuery(this).hasClass('os-one-slot-only')) {
                    // clicked on a day that has only one slot available
                    var bookable_minutes = jQuery(this).data('bookable-minutes').toString().split(':')[0];
                    var selected_timeslot_time = latepoint_format_minutes_to_time(Number(bookable_minutes), Number(jQuery(this).data('service-duration')));
                    $reschedule_form_element.find('.latepoint_start_time').val(jQuery(this).data('bookable-minutes'));
                    $reschedule_form_element.find('.time-selector-w').slideUp(200);
                    latepoint_show_reschedule_button()
                } else {
                    // regular day with more than 1 timeslots available
                    // build timeslots
                    day_timeslots(jQuery(this), $reschedule_form_element, $reschedule_form_element.find('.latepoint-lightbox-content'));
                    // initialize timeslots events
                    // clear time and hide next btn
                    $reschedule_form_element.find('.latepoint_start_time').val('');
                }
            }
        } else {

            // SHOW TIMESLOTS EVEN IF ONLY ONE TIMEPOINT
            $reschedule_form_element.find('.latepoint_start_date').val(jQuery(this).data('date'));
            $reschedule_form_element.find('.os-day.selected').removeClass('selected');
            jQuery(this).addClass('selected');

            // build timeslots
            day_timeslots(jQuery(this), $reschedule_form_element, $reschedule_form_element.find('.latepoint-lightbox-content'));
            // initialize timeslots events
            // clear time and hide next btn
            let $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');
            if ($booking_form_element.length) latepoint_reload_summary($booking_form_element);
            $reschedule_form_element.find('.latepoint_start_time').val('');
            latepoint_hide_next_btn($reschedule_form_element);
        }

        return false;
    });
}


/*
 * Copyright (c) 2024 LatePoint LLC. All rights reserved.
 */

function latepoint_reload_day_schedule($day_view){
  $day_view.addClass('os-loading');
  let data = {
    action: latepoint_helper.route_action,
    route_name: $day_view.data('route-name'),
    params: $day_view.find("select, textarea, input").serialize(),
    layout: 'none',
    return_format: 'json'
  }

  jQuery.ajax({
    type: "post",
    dataType: "json",
    url: latepoint_timestamped_ajaxurl(),
    data: data,
    success: function (data) {
      if (data.status === "success") {
        $day_view.replaceWith(data.message);
      }
    }
  });
}

function latepoint_reload_events_calendar($events_calendar){
  $events_calendar.addClass('os-loading');
  let data = {
    action: latepoint_helper.route_action,
    route_name: $events_calendar.data('route-name'),
    params: $events_calendar.find("select, textarea, input").serialize(),
    layout: 'none',
    return_format: 'json'
  }

  jQuery.ajax({
    type: "post",
    dataType: "json",
    url: latepoint_timestamped_ajaxurl(),
    data: data,
    success: function (data) {
      if (data.status === "success") {
        $events_calendar.replaceWith(data.message);
      }
    }
  });

}

/*
 * Copyright (c) 2024 LatePoint LLC. All rights reserved.
 */

class LatepointStripeConnectFront {

    // Init
    constructor(stripeKey) {
        this.stripeKey = stripeKey;
        this.stripeElements = null;
        this.stripeCore = null;
        this.stripePaymentMethod = null;
        this.stripeContinueOrderIntentURL = null;
        this.stripeContinueTransactionIntentURL = null;
        this.stripePaymentIntentSecret = null;
        this.stripePaymentElement = null;
        this.ready();
    }

    ready() {
        jQuery(document).ready(() => {
            jQuery('body').on('latepoint:submitBookingForm', '.latepoint-booking-form-element', (e, data) => {
                if (!latepoint_helper.demo_mode && data.is_final_submit && data.direction == 'next') {
                    let payment_method = jQuery(e.currentTarget).find('input[name="cart[payment_method]"]').val();
                    switch (payment_method) {
                        case 'payment_element':
                            latepoint_add_action(data.callbacks_list, async () => {
                                if (this.stripePaymentIntentSecret && this.stripeCore) {
                                    return await this.confirmPaymentElementPayment(jQuery(e.currentTarget));
                                }
                            });
                            break;
                    }
                }
            });
            jQuery('body').on('latepoint:submitTransactionPaymentForm', '.latepoint-transaction-payment-form', (e, data) => {
                if (data.current_step === 'pay' && data.payment_processor === 'stripe_connect' && data.payment_method === 'payment_element') {
                    latepoint_add_action(data.callbacks_list, async () => {
                        if (this.stripePaymentIntentSecret && this.stripeCore) {
                            return await this.confirmPaymentElementPaymentForTransaction(jQuery(e.currentTarget));
                        }
                    });
                }
            });

            // INITIALIZE PAYMENT METHOD
            jQuery('body').on('latepoint:initPaymentMethod', '.latepoint-booking-form-element', (e, data) => {
                if (!latepoint_helper.demo_mode) {
                    switch (data.payment_method) {
                        case 'payment_element':
                            latepoint_add_action(data.callbacks_list, async () => {
                                return await this.createPaymentIntent(jQuery(e.currentTarget), data.payment_method);
                            });
                            break;
                    }
                } else {
                    latepoint_show_next_btn(jQuery(e.currentTarget));
                }
            });
            // INITIALIZE PAYMENT METHOD on order payment form
            jQuery('body').on('latepoint:initOrderPaymentMethod', '.latepoint-transaction-payment-form', (e, data) => {
                if (data.payment_processor === 'stripe_connect') {
                    switch (data.payment_method) {
                        case 'payment_element':
                            latepoint_add_action(data.callbacks_list, async () => {
                                return await this.createPaymentIntentForTransaction(jQuery(e.currentTarget));
                            });
                            break;
                    }
                }
            });
        });
    }


    async createPaymentIntentForTransaction($transaction_intent_form) {

        try {
            this.stripeCore = Stripe(this.stripeKey, {stripeAccount: latepoint_helper.stripe_connected_account_id});
            this.stripeElements = this.stripeCore.elements();
        }catch(e){
            console.log(e);
            alert(e);
        }

        let data = latepoint_create_form_data($transaction_intent_form, latepoint_helper.stripe_connect_route_create_payment_intent_for_transaction_intent);

        let response = await jQuery.ajax({
            type: "post",
            dataType: "json",
            processData: false,
            contentType: false,
            url: latepoint_timestamped_ajaxurl(),
            data: data
        });

        if (response.status === "success") {
            $transaction_intent_form.find('input[name="payment_token"]').val(response.payment_intent_id);
            this.stripePaymentIntentSecret = response.payment_intent_secret;
            this.stripeContinueTransactionIntentURL = response.continue_transaction_intent_url;
            latepoint_show_next_btn($transaction_intent_form);

            if ($transaction_intent_form.find('.stripe-payment-element').length) {
                return this.initPaymentElement($transaction_intent_form);
            }
        } else {
            alert(response.message);
            throw new Error(response.message);
        }
    }

    async createPaymentIntent($booking_form_element, payment_method) {
        this.stripeCore = Stripe(this.stripeKey, {stripeAccount: latepoint_helper.stripe_connected_account_id});
        this.stripeElements = this.stripeCore.elements();

        let data = latepoint_create_form_data($booking_form_element.find('.latepoint-form'), latepoint_helper.stripe_connect_route_create_payment_intent, {booking_form_page_url: window.location.href});

        let response = await jQuery.ajax({
            type: "post",
            dataType: "json",
            processData: false,
            contentType: false,
            url: latepoint_timestamped_ajaxurl(),
            data: data
        });

        if (response.status === "success") {
            $booking_form_element.find('input[name="cart[payment_token]"]').val(response.payment_intent_id);
            this.stripePaymentIntentSecret = response.payment_intent_secret;
            this.stripeContinueOrderIntentURL = response.continue_order_intent_url;
            latepoint_show_next_btn($booking_form_element);

            if ($booking_form_element.find('.stripe-payment-element').length) {
                return this.initPaymentElement($booking_form_element);
            }
        } else {
            alert(response.message);
            throw new Error(response.message);
        }
    }

    async confirmPaymentElementPaymentForTransaction($transaction_intent_form) {
        let elements = this.stripeElements;
        let continue_transaction_intent_url = this.stripeContinueTransactionIntentURL;
        let result = await this.stripeCore.confirmPayment({
            elements,
            confirmParams: {
                // Return URL where the customer should be redirected after the PaymentIntent is confirmed.
                return_url: continue_transaction_intent_url,
            },
            redirect: "if_required",
        });
        if (result.error) {
            throw new Error(result.error.message);
        } else {
            $transaction_intent_form.find('input[name="payment_token"]').val(result.paymentIntent.id);
            return result.paymentIntent.id;
        }
    }

    async confirmPaymentElementPayment($booking_form_element) {
        let elements = this.stripeElements;
        let continue_order_intent_url = this.stripeContinueOrderIntentURL;
        let result = await this.stripeCore.confirmPayment({
            elements,
            confirmParams: {
                // Return URL where the customer should be redirected after the PaymentIntent is confirmed.
                return_url: continue_order_intent_url,
            },
            redirect: "if_required",
        });
        if (result.error) {
            throw new Error(result.error.message);
        } else {
            $booking_form_element.find('input[name="cart[payment_token]"]').val(result.paymentIntent.id);
            return result.paymentIntent.id;
        }
    }

    initPaymentElement($booking_form_element) {
        let appearance = {
            theme: 'stripe',
            variables: {
                fontFamily: 'Overpass',
                colorPrimary: '#1d7bff'
            },
            rules: {
                '.Tab': {
                    border: '1px solid #E0E6EB',
                    boxShadow: 'none',
                    borderRadius: '0',
                    marginBottom: '10px'
                },
                '.Input': {
                    boxShadow: 'none',
                    borderRadius: '0'
                },

                '.Tab:hover': {
                    color: 'var(--colorText)',
                },

                '.Tab--selected': {
                    borderColor: 'var(--colorPrimary)',
                    boxShadow: `0 0 0 1px var(--colorPrimary)`,
                },

                '.Input--invalid': {
                    boxShadow: '0 1px 1px 0 rgba(0, 0, 0, 0.07), 0 0 0 2px var(--colorPrimary)',
                },

                // See all supported class names and selector syntax below
            }
        };


        // Create an instance of the Payment Element
        this.stripeElements = this.stripeCore.elements({
            clientSecret: this.stripePaymentIntentSecret,
            appearance,
            fonts: [{cssSrc: 'https://fonts.googleapis.com/css2?family=Overpass&display=swap'}],
        });

        let options = {
            layout: {
                type: 'tabs',
                defaultCollapsed: false,
            },
        };
        this.stripePaymentElement = this.stripeElements.create('payment', options);

        return this.stripePaymentElement.mount($booking_form_element.find('.stripe-payment-element')[0]);
    }


}


if (latepoint_helper.is_stripe_connect_enabled) window.latepointStripeConnectFront = new LatepointStripeConnectFront(latepoint_helper.stripe_connect_key);

/*
 * Copyright (c) 2022 LatePoint LLC. All rights reserved.
 */
// @codekit-prepend "bin/time.js"
// @codekit-prepend "bin/shared.js"
// @codekit-prepend "bin/notifications.js";
// @codekit-prepend "bin/actions.js"
// @codekit-prepend "bin/front/main.js"
// @codekit-prepend "bin/front/_customer.js"
// @codekit-prepend "bin/front/_events.js"
// @codekit-prepend "bin/front/_stripe_connect.js"


// DOCUMENT READY
jQuery(document).ready(function ($) {

    latepoint_init_customer_dashboard();
    latepoint_init_manage_booking_by_key();


    jQuery('body').on('click', '.le-filter-trigger', function () {
        let $events_calendar = jQuery(this).closest('.latepoint-calendar-wrapper');
        if ($events_calendar.hasClass('show-filters')) {
            $events_calendar.removeClass('show-filters');
            $events_calendar.find('.latepoint-calendar-filters select').val('');
            latepoint_reload_events_calendar($events_calendar);
        } else {
            $events_calendar.addClass('show-filters');
        }
        return false;
    });

    jQuery('body').on('click', '.le-navigation-trigger', function () {
        let $trigger = jQuery(this);
        let $events_calendar = $trigger.closest('.latepoint-calendar-wrapper');
        $events_calendar.find('input[name="target_date_string"]').val($trigger.data('target-date'));
        $trigger.addClass('os-loading');
        latepoint_reload_events_calendar($events_calendar);
        return false;
    });

    jQuery('body').on('change', '.le-day-filters select', function () {
        let $trigger = jQuery(this);
        let $day_view = $trigger.closest('.le-day-view-wrapper');
        latepoint_reload_day_schedule($day_view);
        return false;
    });

    jQuery('body').on('change', '.latepoint-calendar-filters select, .le-range-selector select', function () {
        let $trigger = jQuery(this);
        let $events_calendar = $trigger.closest('.latepoint-calendar-wrapper');
        $events_calendar.find('.le-filter').addClass('os-loading');
        latepoint_reload_events_calendar($events_calendar);
        return false;
    });

    jQuery('body').on('click', '.close-calendar-types', function () {
        jQuery(this).closest('.add-to-calendar-wrapper').removeClass('show-types');
        return false;
    });
    jQuery('body').on('click', '.open-calendar-types', function () {
        jQuery(this).closest('.add-to-calendar-wrapper').addClass('show-types');
        return false;
    });

    jQuery('body').on('latepoint:nextStepClicked', '.latepoint-booking-form-element', (e, data) => {

        latepoint_add_action(data.callbacks_list, async () => {
            let $booking_form = jQuery(e.currentTarget).find('.latepoint-form');
            let errors = latepoint_validate_form($booking_form);
            if (errors.length) {
                let error_messages = errors.map(error => error.message).join(', ');
                throw new Error(error_messages);
            } else {
                return true;
            }
        }, 1);

    });

    if (latepoint_helper.start_from_order_intent_key) {
        $('body').append('<div class="latepoint-continue-intent-loading"></div>');

        var data = {
            action: latepoint_helper.route_action,
            route_name: latepoint_helper.start_from_order_intent_route,
            params: {order_intent_key: latepoint_helper.start_from_order_intent_key},
            layout: 'none',
            return_format: 'json'
        }

        $.ajax({
            type: "post",
            dataType: "json",
            url: latepoint_timestamped_ajaxurl(),
            data: data,
            success: function (data) {
                $('.latepoint-continue-intent-loading').remove();
                if (data.status === "success") {
                    var lightbox_class = '';
                    latepoint_show_data_in_lightbox(data.message, data.lightbox_class);
                    var $booking_form_element = jQuery('.latepoint-lightbox-w .latepoint-booking-form-element');
                    latepoint_init_booking_form($booking_form_element);
                    $booking_form_element.find('.latepoint-step-content').addClass('is-hidden').last().removeClass('is-hidden');
                    if ($booking_form_element.find('.latepoint-step-content').length > 1) latepoint_show_prev_btn($booking_form_element);
                    var $booking_form_element = jQuery('.latepoint-lightbox-w .latepoint-booking-form-element');
                    $booking_form_element.find('.latepoint-step-content').each(function () {
                        latepoint_init_step($(this).data('step-code'), $booking_form_element);
                    });
                    $('body').addClass('latepoint-lightbox-active');
                } else {
                    // console.log(data.message);
                }
            }
        });
    }

    if (jQuery('.latepoint-booking-form-element').length) {
        jQuery('.latepoint-booking-form-element').each(function () {
            latepoint_init_booking_form(jQuery(this));
            latepoint_init_step(jQuery(this).find('.latepoint_current_step_code').val(), jQuery(this));
        });
    }


    jQuery('body').on('click', '.latepoint-lightbox-close', function () {
        latepoint_lightbox_close();
        return false;
    });


    jQuery('body').on('click', '.os-step-tabs .os-step-tab', function () {
        jQuery(this).closest('.os-step-tabs').find('.os-step-tab').removeClass('active');
        jQuery(this).addClass('active');
        var target = jQuery(this).data('target');
        jQuery(this).closest('.os-step-tabs-w').find('.os-step-tab-content').hide();
        jQuery(target).show();
    });

    jQuery('body').on('keyup', '.os-form-group .os-form-control', function () {
        if (jQuery(this).val()) {
            jQuery(this).closest('.os-form-group').addClass('has-value');
        } else {
            jQuery(this).closest('.os-form-group').removeClass('has-value');
        }
    });

    jQuery('.latepoint-tab-triggers').on('click', '.latepoint-tab-trigger', function () {
        var $tabs_wrapper = jQuery(this).closest('.latepoint-tabs-w')
        $tabs_wrapper.find('.latepoint-tab-trigger.active').removeClass('active');
        $tabs_wrapper.find('.latepoint-tab-content').removeClass('active');
        jQuery(this).addClass('active');
        $tabs_wrapper.find('.latepoint-tab-content' + jQuery(this).data('tab-target')).addClass('active');
        return false;
    });


    // Main Button to trigger lightbox opening
    if(jQuery('.latepoint-book-form-wrapper').length){
        jQuery('.latepoint-book-form-wrapper').each(function(){
            latepoint_init_booking_form_by_trigger(jQuery(this));
        });
    }

    jQuery('body').on('click', '.latepoint-book-button, .os_trigger_booking', function () {
        latepoint_init_booking_form_by_trigger(jQuery(this));
        return false;
    });

});
