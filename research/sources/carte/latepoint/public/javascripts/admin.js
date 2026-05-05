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


(function($) {

    jQuery.fn.lateSelect = function() {

      function os_build_selected_item($option){
        var quantity_html = '';
        if($option.data('quantity')) quantity_html = '<span class="os-late-quantity-selector-w"><span class="os-late-quantity-selector minus" data-sign="minus"></span><input class="os-late-quantity-selector-input" type="text" data-max-quantity="'+ $option.data('max-quantity') +'" value="' + $option.data('quantity') + '"/><span class="os-late-quantity-selector plus" data-sign="plus"></span></span>';
        return '<div class="ls-item" data-value="' + $option.val() + '"><span class="latepoint-icon latepoint-icon-cross ls-item-remover"></span><span>' + $option.text() + '</span>' + quantity_html + '</div>'
      }

      this.each( function() {
          var lateselect_html = '';
          var all_items = '';
          var selected_items = '';
          var is_selected = '';
          if(jQuery(this).hasClass('os-late-select-active')) return;
          jQuery(this).hide().addClass('os-late-select-active');
          jQuery(this).find('option').each(function(){
              if(jQuery(this).is(':selected')) selected_items+= os_build_selected_item(jQuery(this));
              is_selected = jQuery(this).is(':selected') ? 'selected' : '';
              all_items+= '<div class="ls-item '+ is_selected +'" data-value="' + jQuery(this).val() + '">' + jQuery(this).text() + '</div>';
          });
          var placeholder = '<div class="ls-placeholder">' + jQuery(this).data('placeholder') + '</div>';
          lateselect_html = jQuery('<div class="lateselect-w"></div>');
          jQuery(this).wrap(lateselect_html);
          var $lateselect_wrapper = jQuery(this).closest('.lateselect-w');
          $lateselect_wrapper.append('<div class="ls-selected-items-w">' + placeholder + selected_items + '</div>');
          $lateselect_wrapper.append('<div class="ls-all-items-w">' + all_items + '</div>');


          // ADD ITEM
          $lateselect_wrapper.on('click', '.ls-all-items-w .ls-item:not(.selected)', function(){
              var selected_value = jQuery(this).data('value');
              $lateselect_wrapper.find('.ls-selected-items-w').append(os_build_selected_item($lateselect_wrapper.find('select option[value="'+ selected_value +'"]')));
              jQuery(this).addClass('selected');
              $lateselect_wrapper.removeClass('ls-selecting');
              $lateselect_wrapper.find('select option[value="'+ selected_value +'"]').prop('selected', true);
              $lateselect_wrapper.find('select').trigger('change');
              return false;
          });

          // REMOVE ITEM
          $lateselect_wrapper.on('click', '.ls-selected-items-w .ls-item-remover', function(){
              var selected_value = jQuery(this).closest('.ls-item').data('value');
              jQuery(this).closest('.ls-item').remove();
              $lateselect_wrapper.find('.ls-all-items-w .ls-item.selected[data-value="' + selected_value + '"]').removeClass('selected');
              $lateselect_wrapper.find('select option[value="'+ selected_value +'"]').prop('selected', false);
              $lateselect_wrapper.find('select').trigger('change');
              return false;
          });

          $lateselect_wrapper.on('click', '.ls-selected-items-w', function(){
              $lateselect_wrapper.toggleClass('ls-selecting');
              return false;
          });

          $lateselect_wrapper.on('click', '.os-late-quantity-selector', function(){
              var $input = jQuery(this).closest('.ls-item').find('input.os-late-quantity-selector-input');
              var current_value = parseInt($input.val());
              var new_quantity = (jQuery(this).data('sign') == 'minus') ? current_value - 1 : current_value + 1;
              var max_quantity = $input.data('max-quantity');
              if(new_quantity <= 0) new_quantity = 1;
              if(max_quantity && (new_quantity > max_quantity)) new_quantity = max_quantity;
              var selected_value = jQuery(this).closest('.ls-item').data('value');
              $lateselect_wrapper.find('select option[value="'+ selected_value +'"]').data('quantity', new_quantity);
              $input.val(new_quantity);
              $lateselect_wrapper.find('select').trigger('change');
              return false;
          });

          jQuery(this).on('change', function(){
              var $hidden_connection = false;
              if(jQuery(this).data('hidden-connection')){
                $hidden_connection = jQuery(jQuery(this).data('hidden-connection'));
              }else{
                $hidden_connection = jQuery(this).closest('.lateselect-w').next('input[type="hidden"]');
              }
              var formatted_ids = '';
              if(jQuery(this).find('option:selected').length){
                  jQuery(this).find('option:selected').each(function(){
                    if(jQuery(this).data('quantity')){
                      var quantity = jQuery(this).data('quantity') ? jQuery(this).data('quantity') : 1;
                      formatted_ids+= jQuery(this).val() + ':' + quantity + ',';
                    }else{
                      formatted_ids+= jQuery(this).val() + ',';
                    }
                  });
              }else{
                formatted_ids = '';
              }
              if(formatted_ids != '') formatted_ids = formatted_ids.slice(0, -1);
              $hidden_connection.val(formatted_ids);
          });
      });
    }
}(jQuery));

/*
 * Copyright (c) 2023 LatePoint LLC. All rights reserved.
 */

(function($) {

    jQuery.fn.lateCheckbox = function() {

      function applyChanges(id){
        let $wrapper = jQuery('.latecheckbox-w[data-latecheckbox-id="' + id + '"]');
        $wrapper.find('.latecheckbox-options-w').html(jQuery('.latecheckbox-options-w[data-latecheckbox-id="' + id + '"]').html());

        let $options = $wrapper.find('.latecheckbox-options');
        let total_checked = $options.find('.latecheckbox-option input[type="checkbox"]:checked').length;
        let total_available = $options.find('.latecheckbox-option input[type="checkbox"]').length;
        if(total_checked < total_available){
          $wrapper.find('.latecheckbox .filter-value').text(total_checked);
        }else{
          $wrapper.find('.latecheckbox .filter-value').text('All');
        }
        // set indeterminate, since it can only be set via JS
        $wrapper.find('input[type="checkbox"][indeterminate="indeterminate"]').prop('indeterminate', true).removeAttr('indeterminate');

        $wrapper.find('.latecheckbox').trigger('change');
      }

      this.each( function() {
        var $latecheckbox_wrapper = jQuery(this).closest('.latecheckbox-w');
        $latecheckbox_wrapper.attr('data-latecheckbox-id',  'latecheckbox-' + latepoint_random_generator());

        $latecheckbox_wrapper.on('click', '.latecheckbox', function(){
          let $latecheckbox = jQuery(this);
          jQuery('body > .latecheckbox-options-w').remove();
          if(jQuery(this).hasClass('is-active')){
            jQuery(this).removeClass('is-active');
          }else{
            jQuery('.latecheckbox.is-active').removeClass('is-active');
            jQuery(this).addClass('is-active');
            let position = jQuery(this).position();
            let left = position.left;
            let $options_wrapper = $latecheckbox_wrapper.find('.latecheckbox-options-w');
            let $options_wrapper_clone = $options_wrapper.clone();
            $options_wrapper_clone.attr('data-latecheckbox-id', jQuery(this).closest('.latecheckbox-w').attr('data-latecheckbox-id')).appendTo('body');
            if(true){
              // todo add ability to change position
              left = left + jQuery(this).outerWidth() - $options_wrapper_clone.outerWidth();
            }
            $options_wrapper_clone.css({"top": position.top + jQuery(this).outerHeight() +5 , "left": left});
            if($options_wrapper_clone.find('.latecheckbox-filter-input').length) $options_wrapper_clone.find('.latecheckbox-filter-input').trigger('focus');

            $options_wrapper_clone.on('change', '.latecheckbox-all-check', function(){
              if(jQuery(this).is(':checked')){
                jQuery(this).attr('checked', 'checked').removeAttr('indeterminate');
                jQuery(this).closest('.latecheckbox-options-w').find('.latecheckbox-options input[type="checkbox"]').prop('checked', true).prop('indeterminate', false).attr('checked', 'checked');
              }else{
                jQuery(this).removeAttr('checked').removeAttr('indeterminate');
                jQuery(this).closest('.latecheckbox-options-w').find('.latecheckbox-options input[type="checkbox"]').prop('checked', false).prop('indeterminate', false).removeAttr('checked');
              }
              applyChanges(jQuery(this).closest('.latecheckbox-options-w').attr('data-latecheckbox-id'));
            });
            $options_wrapper_clone.on('change', '.latecheckbox-group-check', function(){
              if(jQuery(this).is(':checked')){
                jQuery(this).attr('checked', 'checked').removeAttr('indeterminate');
                jQuery(this).closest('.latecheckbox-group').find('.latecheckbox-group-options input[type="checkbox"]').prop('checked', true).attr('checked', 'checked');
              }else{
                jQuery(this).removeAttr('checked').removeAttr('indeterminate');
                jQuery(this).closest('.latecheckbox-group').find('.latecheckbox-group-options input[type="checkbox"]').prop('checked', false).removeAttr('checked');
              }
              applyChanges(jQuery(this).closest('.latecheckbox-options-w').attr('data-latecheckbox-id'));
            });

            $options_wrapper_clone.on('keyup', '.latecheckbox-filter-input', function(){
              let q = jQuery(this).val().toLowerCase();
              if(q == ''){
                jQuery(this).closest('.latecheckbox-options-w').find('.latecheckbox-option.hidden').removeClass('hidden');
              }else{
                jQuery(this).closest('.latecheckbox-options-w').find('.latecheckbox-option').each(function(){
                  let text = jQuery(this).text().toLowerCase();
                  (text.indexOf(q) >= 0) ? jQuery(this).removeClass('hidden') : jQuery(this).addClass('hidden');
                });
              }
            });

            $options_wrapper_clone.on('change', '.latecheckbox-option input[type="checkbox"]', function(){
              if(jQuery(this).is(':checked')){
                jQuery(this).attr('checked', 'checked');
              }else{
                jQuery(this).removeAttr('checked');
              }

              // group checkbox
              if(jQuery(this).closest('.latecheckbox-group-options').length){
                let $group = jQuery(this).closest('.latecheckbox-group');
                let checked_count = $group.find('.latecheckbox-option input:checked').length;
                let unchecked_count = $group.find('.latecheckbox-option input:not(:checked)').length;

                if(checked_count && unchecked_count){
                  $group.find('.latecheckbox-group-check').prop('indeterminate', true).attr('indeterminate', 'indeterminate');
                  $group.find('.latecheckbox-group-check').prop('checked', false).removeAttr('checked');
                }else{
                  $group.find('.latecheckbox-group-check').prop('indeterminate', false).removeAttr('indeterminate');
                  if(!checked_count){
                    $group.find('.latecheckbox-group-check').prop('checked', false).removeAttr('checked');
                  }
                  if(!unchecked_count){
                    $group.find('.latecheckbox-group-check').prop('checked', true).attr('checked', 'checked');
                  }
                }
              }
              let checked_count = $options_wrapper_clone.find('.latecheckbox-option input:checked').length;
              let unchecked_count = $options_wrapper_clone.find('.latecheckbox-option input:not(:checked)').length;

              if(checked_count && unchecked_count){
                $options_wrapper_clone.find('.latecheckbox-all-check').prop('indeterminate', true).attr('indeterminate', 'indeterminate');
                $options_wrapper_clone.find('.latecheckbox-all-check').prop('checked', false).removeAttr('checked');
              }else{
                $options_wrapper_clone.find('.latecheckbox-all-check').prop('indeterminate', false).removeAttr('indeterminate');
                if(!checked_count){
                  $options_wrapper_clone.find('.latecheckbox-all-check').prop('checked', false).removeAttr('checked');
                }
                if(!unchecked_count){
                  $options_wrapper_clone.find('.latecheckbox-all-check').prop('checked', true).attr('checked', 'checked');
                }
              }
              applyChanges(jQuery(this).closest('.latecheckbox-options-w').attr('data-latecheckbox-id'));
            });
          }
          return false;
        });

      });
    }
}(jQuery));

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

function latepoint_load_addons_info(){
  var $addons_info_wrapper = jQuery('.addons-info-holder');
  $addons_info_wrapper.addClass('os-loading');
  var route = $addons_info_wrapper.data('route');

  var data = { action: 'latepoint_route_call', route_name: route, params: '', return_format: 'json' }
  jQuery.ajax({ type : "post", dataType : "json", url : latepoint_timestamped_ajaxurl(), data : data,
    success: function(response){
      $addons_info_wrapper.removeClass('os-loading');
      if(response.status === "success"){
        if(response.message){
          $addons_info_wrapper.html(response.message);
        }else{
          $addons_info_wrapper.html('Something is wrong. Try refreshing the page.')
        }
      }else{
        alert(response.message, 'error');
      }
    }
  });
}


function latepoint_dismiss_message($elem){
  $elem.closest('.addon-message').slideUp(300);
  return false;
}

function latepoint_check_for_updates(){
  if(jQuery('.version-log-w').length){
    var $log_wrapper = jQuery('.version-log-w');
    $log_wrapper.addClass('os-loading');
    var route = $log_wrapper.data('route');

    var data = { action: 'latepoint_route_call', route_name: route, params: '', return_format: 'json' }
    jQuery.ajax({ type : "post", dataType : "json", url : latepoint_timestamped_ajaxurl(), data : data,
      success: function(response){
        $log_wrapper.removeClass('os-loading');
        if(response.status === "success"){
          $log_wrapper.html(response.message);
        }else{
          alert(response.message, 'error');
        }
      }
    });
  }
  if(jQuery('.version-status-info').length){

    var $version_info_wrapper = jQuery('.version-status-info');
    $version_info_wrapper.addClass('os-loading');
    var route = $version_info_wrapper.data('route');

    var data = { action: 'latepoint_route_call', route_name: route, params: '', return_format: 'json' }
    jQuery.ajax({ type : "post", dataType : "json", url : latepoint_timestamped_ajaxurl(), data : data,
      success: function(response){
        $version_info_wrapper.removeClass('os-loading');
        if(response.status === "success"){
          $version_info_wrapper.html(response.message);
        }else{
          alert(response.message, 'error');
        }
      }
    });
  }
  if(jQuery('.addons-info-holder').length){
    latepoint_load_addons_info();
  }
}


// DOCUMENT READY
jQuery(document).ready(function( $ ) {
  latepoint_check_for_updates();


  jQuery('body').on('click', '.addon-category-filter-trigger', function(){
		jQuery('.addons-categories-wrapper .addon-category-filter-trigger.is-selected').removeClass('is-selected');
		if(jQuery(this).data('category')){
			let category = jQuery(this).data('category').toString();
			jQuery('.addon-box').addClass('hidden');
			jQuery('.addon-box').each(function(){
				if(jQuery(this).data('category').toString().split(',').includes(category)) jQuery(this).removeClass('hidden');
			})
		}else{
			jQuery('.addon-box').removeClass('hidden');
		}

		jQuery(this).addClass('is-selected');
    return false;
  })


  // Install addon button click
  jQuery('.addons-info-holder').on('click', '.os-addon-action-btn', function(){
    var $install_btn = jQuery(this);
    $install_btn.addClass('os-loading');

    var data = { action: 'latepoint_route_call', route_name: $install_btn.data('route-name'), params: { addon_name: $install_btn.data('addon-name'), addon_path: $install_btn.data('addon-path') }, layout: 'none', return_format: 'json'};
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(response){
        $install_btn.removeClass('os-loading');
        if(response.status === "success"){
          latepoint_add_notification(response.message);
          latepoint_load_addons_info();
        }else{
          if(response.code == '404'){
            latepoint_show_data_in_lightbox(response.message);
          }else{
            alert(response.message);
          }
        }
      }
    });
    return false;
  });
});

/*
 * Copyright (c) 2022 LatePoint LLC. All rights reserved.
 */

function latepoint_init_version5_intro(){
  if(jQuery('.improvement-install-pro').length){
    let $install_btn = jQuery('.improvement-install-pro');
    var data = {
      action: latepoint_helper.route_action,
      route_name: $install_btn.data('route-name'),
      params: {},
      return_format: 'json'
    }
    jQuery.ajax({
    type : "post",
    dataType : "json",
    url : latepoint_timestamped_ajaxurl(),
    data : data,
    success: function(response){
      $install_btn.removeClass('os-loading');
      if(response.status == 'success'){
        $install_btn.addClass('is-installed').find('span').html(response.message);
      }else{
        $install_btn.addClass('is-not-installed').find('span').html(response.message);
      }
    }
  });
  }
}

function latepoint_build_and_save_step_order(){
  var $steps_wrapper = jQuery('.os-ordered-steps');
  let steps_in_order = [];
  $steps_wrapper.find('.os-ordered-step').each(function(index){
    if(jQuery(this).find('.os-ordered-step-children').length){
      jQuery(this).find('.os-ordered-step-child').each(function(){
        steps_in_order.push(jQuery(this).data('step-code'));
      });
    }else{
      steps_in_order.push(jQuery(this).data('step-code'));
    }
  });
  var data = { action: latepoint_helper.route_action, route_name: $steps_wrapper.data('route-name'), params: {steps_order: steps_in_order.join(',')}, return_format: 'json' }
  jQuery('.latepoint-lightbox-heading').addClass('os-loading');
  jQuery.ajax({
    type : "post",
    dataType : "json",
    url : latepoint_timestamped_ajaxurl(),
    data : data,
    success: function(response){
      jQuery('.latepoint-lightbox-heading').removeClass('os-loading');
      latepoint_add_lightbox_notification(response.message, response.status);
    }
  });
}

function latepoint_init_step_reordering(){
  jQuery('.os-ordered-step-expand').on('click', function(){
    jQuery(this).closest('.os-ordered-step').toggleClass('is-expanded');
    return false;
  });


  // Steps Order Dragging
  dragula([jQuery('.os-ordered-steps')[0]], {
    moves: function (el, container, handle) {
      return handle.classList.contains('os-ordered-step-drag-handle');
    },
  }).on('drop', function(el){
    latepoint_build_and_save_step_order();
  });

  jQuery('.os-ordered-step-children').each(function(){
    let step_holder = jQuery(this)
    // Child steps Order Dragging
    dragula([step_holder[0]], {
      moves: function (el, container, handle) {
        return handle.classList.contains('os-ordered-step-child-drag-handle');
      },
    }).on('drop', function(el){
      latepoint_build_and_save_step_order();
    });
  });
}


function latepoint_init_json_view($pre_element = false){
  if(!$pre_element){
    // if pre is not provided -search for all unitialised ones
    $pre_element = jQuery('pre.format-json:not(.json-document)');
  }
  if($pre_element.length){
    $pre_element.each(function(){
      let json_data = JSON.parse(jQuery(this).html());
      jQuery(this).jsonViewer(json_data);
    });
  }
}

function latepoint_init_accordions(){
  jQuery('.latepoint-admin').on('click', '.os-accordion-title', function(){
    jQuery(this).closest('.os-accordion-wrapper').toggleClass('is-open');
    return false;
  });
}


function latepoint_init_sticky_side_menu(){
  jQuery('.os-sticky-side-menu a').on('click', function(){
    jQuery('.os-sticky-side-menu li.os-active').removeClass('os-active');
    jQuery(this).closest('li').addClass('os-active');
    let section_anchor = jQuery(this).data('section-anchor');
    let position = jQuery('.section-anchor#'+section_anchor).offset();
    jQuery('html').animate({ scrollTop: position.top }, 300);
    return false;
  });
}

function latepoint_init_template_library(){
  jQuery('.os-templates-wrapper .template-type-selector').on('click', function(){
    jQuery(this).toggleClass('is-selected');
    let user_type = jQuery(this).data('user-type');
    jQuery('.os-template-items[data-user-type="'+user_type+'"]').toggleClass('hidden');
    return false;
  });

  jQuery('.os-templates-wrapper .os-template-item').on('click', function(){
    let $this = jQuery(this);
    $this.closest('.os-templates-list').find('.os-template-item.selected').removeClass('selected');
    $this.addClass('selected');
    let templateId = $this.data('id');
    jQuery('.os-template-preview').hide();
    jQuery('.os-template-preview[data-id="'+ templateId+'"]').show();
    jQuery('.os-no-template-selected-message').hide();
    jQuery('.os-template-use-button-wrapper').removeClass('hidden');
    return false;
  });

  jQuery('.latepoint-select-template-btn').on('click', function(){
    let $btn = jQuery(this);
    let route_name = $btn.data('route');
    let action_id = $btn.data('action-id');
    let process_id = $btn.data('process-id');
    let action_type = $btn.data('action-type');
    $btn.addClass('os-loading');

    let data = {  action: latepoint_helper.route_action,
                  route_name: route_name,
                  params: {
                    template_id: jQuery('.os-template-item.selected').data('id'),
                    action_id: action_id,
                    process_id: process_id,
                    action_type: action_type
                  },
                  return_format: 'json' }
    jQuery.ajax({
      type: 'post',
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: (response) => {
        $btn.removeClass('os-loading');
        if(response.status === latepoint_helper.response_status.success){
          let $action_form = jQuery('.process-action-form[data-id="'+action_id+'"]');
          $action_form.find('.process-action-settings').html(response.message);
          latepoint_init_process_action_form($action_form);
          latepoint_close_side_panel();
        }else{
          alert("Error!");
        }
      }
    });

    return false;
  });
}

function latepoint_init_default_form_fields_settings(){

  if(jQuery('.os-default-fields').length){
    jQuery('.os-default-field input[type="checkbox"], .os-default-field select').on('change', (event) => {
      latepoint_update_default_form_fields_settings();
    });

    jQuery('.os-default-field .os-toggler').on('ostoggler:toggle', (event) => {
      if(jQuery(event.currentTarget).hasClass('off')){
        jQuery(event.currentTarget).closest('.os-default-field').addClass('is-disabled');
      }else{
        jQuery(event.currentTarget).closest('.os-default-field').removeClass('is-disabled');
      }
      latepoint_update_default_form_fields_settings();
    });
  }
}

function latepoint_update_default_form_fields_settings(){
  var $wrapper = jQuery('.os-default-fields');

  var form_data = new FormData($wrapper.find('form')[0]);
  var data = {  action: latepoint_helper.route_action,
    route_name: $wrapper.data('route'),
    params: latepoint_formdata_to_url_encoded_string(form_data),
    return_format: 'json' }

  jQuery.ajax({
    type : "post",
    dataType : "json",
    url : latepoint_timestamped_ajaxurl(),
    data : data,
    success: (response) => {
      latepoint_add_notification(response.message);
    }
  });
}

function latepoint_init_side_menu(){
  jQuery('.menu-toggler').on('click', function(){
    var layout_style = 'full';
    if(jQuery('.latepoint-side-menu-w').hasClass('side-menu-full')){
      layout_style = 'compact';
      jQuery('.latepoint-side-menu-w').addClass('side-menu-compact').removeClass('side-menu-full');
    }else{
      jQuery('.latepoint-side-menu-w').addClass('side-menu-full').removeClass('side-menu-compact');
    }
    var route_name = jQuery(this).data('route');
    var data = { action: latepoint_helper.route_action, route_name: route_name, params: { menu_layout_style: layout_style }, layout: 'none', return_format: 'json' }
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(data){
      }
    });
    return false;
  });
}

function latepoint_init_grouped_bookings_form(){

}

function latepoint_quick_order_customer_cleared(){
  latepoint_init_input_masks(jQuery('.quick-order-form-w .customer-quick-edit-form-w'));
}

function latepoint_quick_order_customer_selected(){
  latepoint_init_input_masks(jQuery('.quick-order-form-w .customer-quick-edit-form-w'));
  jQuery('.customer-info-w').removeClass('selecting').addClass('selected');
}

function latepoint_custom_day_removed($elem){
  $elem.closest('.custom-day-work-period').fadeOut(300, function(){ jQuery(this).remove()});
}


function latepoint_count_active_connections($connection_wrapper){
  var connected_services_count = $connection_wrapper.find('.connection-children-list li.active').length;
  var all_services_count = $connection_wrapper.find('.connection-children-list li').length;
  if(connected_services_count == all_services_count){
    connected_services_count = jQuery('.selected-connections').data('all-text');
    jQuery('.selected-connections').removeClass('not-all-selected');
  }else{
    connected_services_count = connected_services_count + '/' + all_services_count;
    jQuery('.selected-connections').addClass('not-all-selected');
    $connection_wrapper.closest('.white-box').find('.os-select-all-toggler').prop('checked', false);
  }
  $connection_wrapper.find('.selected-connections strong').text(connected_services_count);
}

function latepoint_custom_field_removed($elem){
  $elem.closest('.os-form-block').remove();
}

function latepoint_coupon_removed($elem){
  $elem.closest('.os-coupon-form').remove();
}

function latepoint_reminder_removed($elem){
  $elem.closest('.os-reminder-form').remove();
}

function latepoint_init_form_blocks(){
  jQuery('.latepoint-content-w').on('click', '.os-form-block-header', function(){
    jQuery(this).closest('.os-form-block').toggleClass('os-is-editing');
    return false;
  });
  jQuery('.latepoint-content-w').on('keyup', '.os-form-block-name-input', function(){
    jQuery(this).closest('.os-form-block').find('.os-form-block-name').text(jQuery(this).val());
  });
}


function latepoint_init_coupons_form(){
  jQuery('.latepoint-content-w').on('click', '.os-coupon-form-info', function(){
    jQuery(this).closest('.os-coupon-form').toggleClass('os-is-editing');
    return false;
  });
  jQuery('.latepoint-content-w').on('change', 'select.os-coupon-medium-select', function(){
    if(jQuery(this).val() == 'email'){
      jQuery(this).closest('.os-coupon-form').find('.os-coupon-email-subject').show();
    }else{
      jQuery(this).closest('.os-coupon-form').find('.os-coupon-email-subject').hide();
    }
  });
  jQuery('.latepoint-content-w').on('keyup', '.os-coupon-name-input', function(){
    jQuery(this).closest('.os-coupon-form').find('.os-coupon-name').text(jQuery(this).val());
  });
  jQuery('.latepoint-content-w').on('keyup', '.os-coupon-code-input', function(){
    jQuery(this).closest('.os-coupon-form').find('.os-coupon-code').text(jQuery(this).val());
  });
}

function latepoint_init_reminders_form(){
  jQuery('.latepoint-content-w').on('click', '.os-reminder-form-info', function(){
    jQuery(this).closest('.os-reminder-form').toggleClass('os-is-editing');
    return false;
  });
  jQuery('.latepoint-content-w').on('change', 'select.os-reminder-medium-select', function(){
    if(jQuery(this).val() == 'email'){
      jQuery(this).closest('.os-reminder-form').find('.os-reminder-email-subject').show();
    }else{
      jQuery(this).closest('.os-reminder-form').find('.os-reminder-email-subject').hide();
    }
  });
  jQuery('.latepoint-content-w').on('keyup', '.os-reminder-name-input', function(){
    jQuery(this).closest('.os-reminder-form').find('.os-reminder-name').text(jQuery(this).val());
  });
}

function latepoint_custom_field_saved($elem){
}

function latepoint_init_custom_day_schedule(){
  latepoint_init_input_masks(jQuery('.latepoint-lightbox-w .custom-day-schedule-w'));

  jQuery('.period-type-selector').on('change', function(){
    jQuery(this).closest('.custom-day-calendar').attr('data-period-type', jQuery(this).val());
    jQuery('.custom-day-calendar').attr('data-picking', 'start').data('picking', 'start');
    if(jQuery(this).val() == 'range'){
      jQuery('.custom-day-calendar-head .calendar-heading').text(jQuery('.custom-day-calendar-head .calendar-heading').data('label-start'));
      jQuery('.custom-day-calendar #start_custom_date').trigger('focus');
    }else{
      jQuery('.custom-day-calendar .os-day.selected').removeClass('selected');
      jQuery('.latepoint-lightbox-footer').hide();
      jQuery('.custom-day-calendar-head .calendar-heading').text(jQuery('.custom-day-calendar-head .calendar-heading').data('label-single'));
    }
  });


  jQuery('#custom_day_calendar_month, #custom_day_calendar_year').on('change', function(){
    var $calendar = jQuery('.custom-day-calendar-month');
    var route_name = $calendar.data('route');
    $calendar.addClass('os-loading');
    var target_date_string = jQuery('#custom_day_calendar_year').val() + '-' + jQuery('#custom_day_calendar_month').val() + '-01';
    var data = { action: latepoint_helper.route_action, route_name: route_name, params: { target_date_string: target_date_string }, layout: 'none', return_format: 'json' }
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(data){
        $calendar.removeClass('os-loading');
        if(data.status === "success"){
          $calendar.html(data.message);
        }else{
          // console.log(data.message);
        }
      }
    });
  });



  jQuery('.custom-day-calendar').on('focus', '#start_custom_date', function(){
    jQuery('.custom-day-calendar-head .calendar-heading').text(jQuery('.custom-day-calendar-head .calendar-heading').data('label-start'));
    jQuery('.custom-day-calendar').attr('data-picking', 'start').data('picking', 'start');
  });

  jQuery('.custom-day-calendar').on('focus', '#end_custom_date', function(){
    jQuery('.custom-day-calendar-head .calendar-heading').text(jQuery('.custom-day-calendar-head .calendar-heading').data('label-end'));
    jQuery('.custom-day-calendar').attr('data-picking', 'end').data('picking', 'end');
  });

  jQuery('.custom-day-calendar').on('click', '.os-day', function(){
    var $this = jQuery(this);
    $this.closest('.custom-day-calendar').find('.os-day.selected').removeClass('selected');
    $this.addClass('selected');

    if(jQuery('.custom-day-calendar').data('picking') == 'start'){
      jQuery('.custom-day-settings-w #start_custom_date').val($this.data('date')).trigger('keyup');
      if(jQuery('.period-type-selector').val() == 'range'){
        jQuery('.custom-day-calendar #end_custom_date').trigger('focus');
        if(!jQuery('.custom-day-calendar #end_custom_date').val()) return false;
      }
    }else{
      jQuery('.custom-day-settings-w #end_custom_date').val($this.data('date')).trigger('keyup');
    }
    jQuery('.latepoint-lightbox-footer').slideDown(200);
    if(jQuery('.custom-day-calendar').data('show-schedule') == 'yes') jQuery('.latepoint-lightbox-w').removeClass('hide-schedule');
    return false;
  });
}

function latepoint_init_updates_page(){

}

function latepoint_calendar_set_month_label(){
  jQuery('.os-current-month-label .current-month').text(jQuery('.os-monthly-calendar-days-w.active').data('calendar-month-label'));
  jQuery('.os-current-month-label .current-year').text(jQuery('.os-monthly-calendar-days-w.active').data('calendar-year'));
}


function latepoint_init_element_togglers(){
  jQuery('[data-toggle-element]').on('click', function(){
    var $this = jQuery(this);
    $this.closest('.os-form-checkbox-group').toggleClass('is-checked');
    jQuery($this.data('toggle-element')).toggle();
  });
}


function latepoint_init_color_picker(){
  if(jQuery('.latepoint-color-picker').length){
    jQuery('.latepoint-color-picker').each(function(){
      var color = jQuery(this).data('color');
      var picker = jQuery(this)[0];
      var $picker_wrapper = jQuery(this).closest('.latepoint-color-picker-w');
      Pickr.create({
        el: picker,
        default: color,
        comparison: false,
        useAsButton: true,
        components: {

            // Main components
            preview: false,
            opacity: false,
            hue: true,

            // Input / output Options
            interaction: {
                input: false,
                clear: false,
                save: true
            }
        },
        onChange(hsva, instance) {
          $picker_wrapper.find('.os-form-control').val(hsva.toHEX().toString());
        },
      });
    });
  }
}


function latepoint_lightbox_close(){
  jQuery('body').removeClass('latepoint-lightbox-active');
  jQuery('.latepoint-lightbox-w').remove();
}

function latepoint_reload_select_service_categories(){
  jQuery('.service-selector-adder-field-w').each(function(){
    var $trigger_elem = jQuery(this);
    var route = jQuery('.service-selector-adder-field-w').find('select').data('select-source');
    var data = { action: latepoint_helper.route_action, route_name: route, params: '', return_format: 'json' }
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(response){
        $trigger_elem.removeClass('os-loading');
        if(response.status === "success"){
          latepoint_lightbox_close();
          $trigger_elem.find('select').html(response.message);
          $trigger_elem.find('select option:last').attr('selected', 'selected');
        }else{
          alert(response.message, 'error');
        }
      }
    });
  });
}

function latepoint_wizard_item_editing_cancelled(response){
  jQuery('.os-wizard-setup-w').removeClass('is-sub-editing');
  jQuery('.os-wizard-footer').show();
  jQuery('.os-wizard-footer .os-wizard-next-btn').show();
  if(response.show_prev_btn){
    jQuery('.os-wizard-footer .os-wizard-prev-btn').show();
  }
}


function latepoint_reload_week_view_calendar(start_date = false){
  var service_id = (jQuery('.cc-availability-toggler #overlay_service_availability').val() == 'on') ? jQuery('.calendar-service-selector').val() : false;
  var agent_id = jQuery('.calendar-agent-selector').val();
  var location_id = jQuery('.calendar-location-selector').val();
  var calendar_start_date = (start_date) ? start_date : jQuery('.calendar-start-date').val();
  latepoint_load_calendar(calendar_start_date, agent_id, location_id, service_id);
}

function latepoint_init_work_period_form(){
  latepoint_mask_timefield(jQuery('.os-time-input-w .os-mask-time'));
}

function latepoint_close_side_panel(){
  latepoint_close_quick_availability_form();
  jQuery('.latepoint-side-panel-w').remove();
}

function reload_process_jobs_table(){
  if(jQuery('table.os-reload-on-booking-update').length) latepoint_filter_table(jQuery('table.os-reload-on-booking-update'), jQuery('table.os-reload-on-booking-update'));
}


function latepoint_transaction_removed($trigger){
  $trigger.closest('.quick-add-transaction-box-w').remove();
  latepoint_reload_balance_and_payments();
}

function latepoint_reload_widget($widget_elem){
  var form_data = $widget_elem.find('select, input').serialize();
  var data = { action: latepoint_helper.route_action, route_name: $widget_elem.data('os-reload-action'), params: form_data, return_format: 'json' }
  $widget_elem.addClass('os-loading');
  jQuery.ajax({
    type : "post",
    dataType : "json",
    url : latepoint_timestamped_ajaxurl(),
    data : data,
    success: function(response){
      $widget_elem.removeClass('os-loading');
      if(response.status === "success"){
        var $updated_widget_elem = jQuery(response.message);
        $updated_widget_elem.removeClass('os-widget-animated');
        $widget_elem = $widget_elem.replaceWith($updated_widget_elem);
        latepoint_init_daterangepicker($updated_widget_elem.find('.os-date-range-picker'));
        if($widget_elem.hasClass('os-widget-top-agents')) latepoint_init_circles_charts();
        if($widget_elem.hasClass('os-widget-daily-bookings')){
          latepoint_init_daily_bookings_chart();
          latepoint_init_donut_charts();
        }
      }else{
        alert(response.message);
      }
    }
  });
}

function latepoint_load_calendar(target_date, agent_id, location_id = false, service_id = false){
  var route_name = jQuery('.calendar-week-agent-w').data('calendar-action');
  jQuery('.calendar-week-agent-w').addClass('os-loading');
  var params_arr = {target_date: target_date, agent_id: agent_id};
  if(location_id) params_arr.location_id = location_id;
  if(service_id) params_arr.service_id = service_id;
  var data = { action: latepoint_helper.route_action, route_name: route_name, params: jQuery.param(params_arr), return_format: 'json' }
  jQuery.ajax({
    type : "post",
    dataType : "json",
    url : latepoint_timestamped_ajaxurl(),
    data : data,
    success: function(response){
      if(response.status === "success"){
        jQuery('.calendar-week-agent-w').html(response.message).removeClass('os-loading');
        jQuery('.calendar-load-target-date.os-loading').removeClass('os-loading');
      }else{
        alert(response.message);
      }
    }
  });
}

function latepoint_init_quick_transaction_form(){
  latepoint_mask_money(jQuery('.quick-add-transaction-box-w .os-mask-money'));
}

function latepoint_reload_price_breakdown(){
  var $trigger =  jQuery('.reload-price-breakdown');
  $trigger.addClass('os-loading');
  var $quick_edit_form = $trigger.closest('form.order-quick-edit-form');
  var form_data = new FormData($quick_edit_form[0]);
  var route = $trigger.data('route');

  var data = { action: latepoint_helper.route_action, route_name: route, params: latepoint_formdata_to_url_encoded_string(form_data), return_format: 'json' }
  jQuery.ajax({
    type : "post",
    dataType : "json",
    url : latepoint_timestamped_ajaxurl(),
    data : data,
    success: function(response){
      $trigger.removeClass('os-loading');
      if(response.status === "success"){
        jQuery('.price-breakdown-wrapper').html(response.message);
        latepoint_mask_money(jQuery('.price-breakdown-wrapper .os-mask-money'));
        latepoint_reload_balance_and_payments();
      }else{
        alert(response.message);
      }
    }
  });
}

function latepoint_complex_selector_select($connection_wrappers, qty = 1){
  $connection_wrappers.each(function(){
    jQuery(this).addClass('active');
    jQuery(this).find('.connection-children-list li').addClass('active');
    jQuery(this).find('.connection-child-is-connected').val('yes');
    jQuery(this).find('.item-quantity-selector-input').val(qty);
    latepoint_count_active_connections(jQuery(this));
  });
}

function latepoint_complex_selector_deselect($connection_wrappers){
  $connection_wrappers.each(function(){
    jQuery(this).removeClass('active');
    jQuery(this).removeClass('show-customize-box');
    jQuery(this).find('.connection-children-list li.active').removeClass('active');
    jQuery(this).find('.connection-child-is-connected').val('no');
    jQuery(this).find('.item-quantity-selector-input').val(0);
    latepoint_count_active_connections(jQuery(this));
  });
}



function latepoint_is_next_day($form){
  let field_base_name = 'order_items[' + $form.data('order-item-id') +'][bookings][' + $form.data('booking-id') +']';

  var start_time = $form.find('input[name="' + field_base_name + '[start_time][formatted_value]"]').val();
  var start_time_ampm = $form.find('input[name="' + field_base_name + '[start_time][ampm]"]').val();
  var start_time_minutes = latepoint_hours_and_minutes_to_minutes(start_time, start_time_ampm);
  var end_time = $form.find('input[name="' + field_base_name + '[end_time][formatted_value]"]').val();
  var end_time_ampm = $form.find('input[name="' + field_base_name + '[end_time][ampm]"]').val();
  var end_time_minutes = latepoint_hours_and_minutes_to_minutes(end_time, end_time_ampm);

  if(end_time_minutes && (end_time_minutes <= start_time_minutes)){
    $form.find('.quick-end-time-w').addClass('ending-next-day');
  }else{
    $form.find('.quick-end-time-w').removeClass('ending-next-day');
  }
}

function latepoint_set_booking_end_time($booking_data_form){
  var booking_duration = 0;
  var service_duration = Number($booking_data_form.find('.os-service-durations select').val());

  let field_base_name = 'order_items[' + $booking_data_form.data('order-item-id') +'][bookings][' + $booking_data_form.data('booking-id') +']';

  booking_duration = booking_duration + service_duration;
  if($booking_data_form.find('select[name="temp_service_extras_ids"] option:selected').length){
    $booking_data_form.find('select[name="temp_service_extras_ids"] option:selected').each(function(){
      var extra_duration = Number(jQuery(this).data('duration'));
      var $extra_quantity_input = jQuery(this).closest('.lateselect-w').find('.ls-item[data-value="' + jQuery(this).val() + '"]').find('.os-late-quantity-selector-input');
      if($extra_quantity_input.length) extra_duration = Number(extra_duration) * Number($extra_quantity_input.val());
      booking_duration = Number(booking_duration) + Number(extra_duration);
    });
  }

  var start_time = $booking_data_form.find('input[name="'+field_base_name+'[start_time][formatted_value]"]').val();

  if(start_time){
    var start_time_ampm = $booking_data_form.find('input[name="'+field_base_name+'[start_time][ampm]"]').val();
    var start_time_minutes = latepoint_hours_and_minutes_to_minutes(start_time, start_time_ampm);
    var end_time_minutes = parseInt(start_time_minutes) + parseInt(booking_duration);
    if(end_time_minutes >= (24 * 60)) end_time_minutes = (end_time_minutes - 24 * 60);
    var end_time_ampm = (end_time_minutes >= 720 && end_time_minutes < (24 * 60)) ? 'pm' : 'am';
    var end_hours_and_minutes = latepoint_minutes_to_hours_and_minutes(end_time_minutes);

    $booking_data_form.find('input[name="'+field_base_name+'[end_time][formatted_value]"]').val(end_hours_and_minutes);
    $booking_data_form.find('.quick-end-time-w .time-ampm-select.time-' + end_time_ampm).trigger('click');
    $booking_data_form.find('input[name="'+field_base_name+'[end_time][formatted_value]"]').closest('.os-form-group').addClass('has-value');
  }
  latepoint_is_next_day($booking_data_form);
}



function latepoint_init_sortable_columns(){
  jQuery('.os-sortable-column').on('click', function(){
    let current_direction = jQuery(this).hasClass('ordered-desc') ? 'desc' : 'asc';
    let new_direction = (current_direction == 'desc') ? 'asc' : 'desc';
    jQuery(this).closest('table').find('.os-sortable-column').removeClass('ordered-desc').removeClass('ordered-asc');
    jQuery(this).addClass('ordered-' + new_direction);

    jQuery(this).closest('table').find('.records-ordered-by-key').val(jQuery(this).data('order-key'));
    jQuery(this).closest('table').find('.records-ordered-by-direction').val(new_direction);
    latepoint_filter_table(jQuery(this).closest('table'), jQuery(this).closest('.os-form-group'));
    return false;
  });
}
function latepoint_random_text(length){
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function latepoint_get_order_for_service_categories(){

}


function latepoint_init_daterangepicker($elem){
  $elem.each(function(){
    // DATERANGEPICKER
    var picker_start_time = jQuery(this).find('input[name="date_from"], .os-datepicker-date-from').val();
    var picker_end_time = jQuery(this).find('input[name="date_to"], .os-datepicker-date-to').val();
    var locale = {};
    if(jQuery(this).data('can-be-cleared')) locale = { cancelLabel: jQuery(this).data('clear-btn-label')};


    moment.locale(latepoint_helper.wp_locale);

    jQuery(this).daterangepicker({
      opens: 'center',
      singleDatePicker: (jQuery(this).data('single-date') == 'yes'),
      startDate: (picker_start_time) ? moment(picker_start_time) : moment(),
      endDate: (picker_end_time) ? moment(picker_end_time) : moment(),
      locale: locale
    });
  });

  $elem.on('cancel.daterangepicker', function(ev, picker) {
    if(picker.element.data('can-be-cleared')){
      picker.element.find('input[name="date_from"], .os-datepicker-date-from').val('');
      picker.element.find('input[name="date_to"], .os-datepicker-date-to').val('');
      picker.element.find('span.range-picker-value').text(picker.element.data('no-value-label'));
      if(picker.element.hasClass('os-table-filter-datepicker')){
        latepoint_filter_table(picker.element.closest('table'), picker.element.closest('.os-form-group'));
      }
    }
  });

  $elem.on('apply.daterangepicker', function(ev, picker) {
    if(picker.element.data('single-date') == 'yes'){
      picker.element.find('.range-picker-value').text(picker.startDate.format('ll'));
    }else{
      picker.element.find('.range-picker-value').text(picker.startDate.format('ll') + ' - ' + picker.endDate.format('ll'));
    }
    picker.element.find('input[name="date_from"], .os-datepicker-date-from').attr('value', picker.startDate.format('YYYY-MM-DD'));
    picker.element.find('input[name="date_to"], .os-datepicker-date-to').attr('value', picker.endDate.format('YYYY-MM-DD'));
    if(picker.element.closest('.os-widget').length){
      latepoint_reload_widget(picker.element.closest('.os-widget'));
    }
    if(picker.element.hasClass('os-table-filter-datepicker')){
      latepoint_filter_table(picker.element.closest('table'), picker.element.closest('.os-form-group'));
    }
  });
}

function latepoint_recalculate_items_count_in_category(){
  jQuery('.os-category-items-count').each(function(){
    var number_of_items = jQuery(this).closest('.os-category-parent-w').find('.item-in-category-w').length;
    jQuery(this).find('span').text(number_of_items);
  });
}

function latepoint_remove_agent_box($remove_btn){
  var $agent_box = $remove_btn.closest('.agent-box-w');
  $agent_box.fadeOut(300, function(){ jQuery(this).remove(); });
}

function latepoint_remove_service_box($remove_btn){
  var $service_box = $remove_btn.closest('.service-box-w');
  $service_box.fadeOut(300, function(){ jQuery(this).remove(); });
}

function latepoint_init_monthly_view(){
  if(!jQuery('.calendar-month-agents-w').length) return;

  jQuery('.monthly-calendar-headers select').on('change', function(){
    var $calendar = jQuery('.calendar-month-agents-w');
    var route_name = $calendar.data('route');
    $calendar.addClass('os-loading');
    var params = { month: jQuery('#monthly_calendar_month_select').val(), year: jQuery('#monthly_calendar_year_select').val() };
    if(jQuery('#monthly_calendar_location_select').length && jQuery('#monthly_calendar_location_select').val()) params.location_id = jQuery('#monthly_calendar_location_select').val();
    if(jQuery('#monthly_calendar_service_select').length && jQuery('#monthly_calendar_service_select').val()) params.service_id = jQuery('#monthly_calendar_service_select').val();
    var data = { action: latepoint_helper.route_action, route_name: route_name, params: params, layout: 'none', return_format: 'json' }
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(data){
        $calendar.removeClass('os-loading');
        if(data.status === "success"){
          $calendar.html(data.message);
        }else{
          // console.log(data.message);
        }
      }
    });
  });
}


function latepoint_init_copy_on_click_elements(){

  jQuery('.os-click-to-copy').on('mouseenter', function() {
    var $this = jQuery(this);
    var position_info = $this.offset();
    var width = jQuery(this).outerWidth();
    var position_left = position_info.left;
    var position_top = position_info.top - 20 - jQuery(window).scrollTop();

    let color = ($this.data('copy-tooltip-color') == 'dark') ? 'dark' : 'light';
    if($this.data('copy-tooltip-position') == 'left'){
      position_left = position_left - width - 5;
      position_top = position_top + $this.outerHeight() - jQuery(window).scrollTop();
    }
    jQuery('body').append('<div class="os-click-to-copy-prompt color-'+color+'" style="top: '+position_top+'px; left: '+position_left+'px;">' + latepoint_helper.click_to_copy_prompt + '</div>');
  }).on('mouseleave', function() {
    jQuery('body').find('.os-click-to-copy-prompt').remove();
  });
  jQuery('.os-click-to-copy').on('click', function(){
    var $this = jQuery(this);
    let color = ($this.data('copy-tooltip-color') == 'dark') ? 'dark' : 'light';
    jQuery('body').find('.os-click-to-copy-prompt').hide();
    var text_to_copy = $this.is('input') ? $this.val() : $this.text();
    navigator.clipboard.writeText(text_to_copy);

    var position_info = $this.offset();
    var width = $this.outerWidth();
    var position_left = position_info.left;
    var position_top = position_info.top - 20 - jQuery(window).scrollTop();

    if($this.data('copy-tooltip-position') == 'left'){
      position_left = position_left - width - 5;
      position_top = position_top + $this.outerHeight() - jQuery(window).scrollTop();
    }
    var $done_prompt = jQuery('<div class="os-click-to-copy-done color-'+color+'" style="top: '+position_top+'px; left: '+position_left+'px;">' + latepoint_helper.click_to_copy_done + '</div>');
    $done_prompt.appendTo(jQuery('body')).animate({
      opacity: 0,
      left: (position_left + 20),
    }, 600);
    setTimeout(function(){
      jQuery('body').find('.os-click-to-copy-done').remove();
      jQuery('body').find('.os-click-to-copy-prompt').show();
    }, 800);
  });
}

function latepoint_remove_floating_popup(){
  jQuery('.os-showing-popup').removeClass('os-showing-popup');
  jQuery('.os-floating-popup').remove();
}

function latepoint_init_clickable_cells(){
  jQuery('.os-clickable-popup-trigger').on('click', function(){
    var $this = jQuery(this);
    var position = $this.offset();
    var width = $this.outerWidth();
    var $popup = jQuery('<div class="os-floating-popup os-loading"></div>');
    if($this.hasClass('os-showing-popup')){
      latepoint_remove_floating_popup();
    }else{
      latepoint_remove_floating_popup();
      $popup.offset({top: position.top, left: (position.left + width/2)});
      jQuery('body').append($popup);
      $this.addClass('os-showing-popup');

      var route = $this.data('route');
      var params = $this.data('os-params');
      var data = { action: latepoint_helper.route_action, route_name: route, params: params, layout: 'none', return_format: 'json' };
      jQuery.ajax({
        type : "post",
        dataType : "json",
        url : latepoint_timestamped_ajaxurl(),
        data : data,
        success: function(response){
          if(response.status === latepoint_helper.response_status.success){
            jQuery('body').find('.os-floating-popup').html(response.message).removeClass('os-loading');
            latepoint_init_customer_donut_chart();
            jQuery('.os-floating-popup .os-floating-popup-close').on('click', function(){
              latepoint_remove_floating_popup();
              return false;
            });
          }else{

          }
        }
      });
    }
    return false;
  });
}

function latepoint_init_tiny_mce(element_id){
  // TODO CHECK IF wp.editor is defined
  if(typeof wp !== 'undefined' && typeof wp.editor !== 'undefined' && jQuery('#'+ element_id).length){
    wp.editor.remove(element_id);
    wp.editor.initialize(element_id,
      {
        tinymce: {
          wpautop: false,
          toolbar1: 'formatselect alignjustify forecolor | bold italic underline strikethrough | bullist numlist | blockquote hr | alignleft aligncenter alignright | link unlink | pastetext removeformat | outdent indent | undo redo',
          height : "480",
        },
        quicktags: true,
        mediaButtons: true,
      }
    );
  }
}

function latepoint_init_reminder_form(){
  latepoint_init_tiny_mce(jQuery('.os-reminder-form:last-child textarea').attr('id'));
}


function latepoint_filter_table($table, $filter_elem, reset_page = true){
  $filter_elem.addClass('os-loading');
  var filter_params = $table.find('.os-table-filter').serialize();
  var $table_w = $table.closest('.table-with-pagination-w');
  if(reset_page){
    $table_w.find('select.pagination-page-select').val(1);
  }else{
    filter_params+= '&page_number='+$table_w.find('select.pagination-page-select').val();
  }
  var route = $table.data('route');
  var data = { action: latepoint_helper.route_action, route_name: route, params: filter_params, layout: 'none', return_format: 'json' };
  jQuery.ajax({
    type : "post",
    dataType : "json",
    url : latepoint_timestamped_ajaxurl(),
    data : data,
    success: function(data){
      $filter_elem.removeClass('os-loading');
      if(data.status === "success"){
        $table.find('tbody').html(data.message);
        if(data.total_pages && reset_page){
          var options = '';
          for(var i = 1; i <= data.total_pages; i++){
            options+= '<option>'+ i +'</option>';
          }
          $table_w.find('select.pagination-page-select').html(options);
        }
        $table_w.find('.os-pagination-from').text(data.showing_from);
        $table_w.find('.os-pagination-to').text(data.showing_to);
        $table_w.find('.os-pagination-total').text(data.total_records);
        latepoint_init_clickable_cells();
      }else{
        // console.log(data.message);
      }
    }
  });
}

function latepoint_init_wizard_content(){
  latepoint_init_input_masks(jQuery('.os-wizard-step-content'));
}

function latepoint_init_input_masks($scoped_element = false){
  let $wrapper = $scoped_element ? $scoped_element : jQuery('body');
  latepoint_mask_timefield($wrapper.find('.os-mask-time'));

  $wrapper.find('.os-mask-phone').each(function(){
    latepoint_mask_phone(jQuery(this));
  });

  latepoint_mask_money($wrapper.find('.os-mask-money'));
  latepoint_mask_date($wrapper.find('.os-mask-date'));
  latepoint_mask_minutes($wrapper.find('.os-mask-minutes'));

  $wrapper.trigger('latepoint:initInputMasks');
}




function latepoint_init_quick_agent_form(){
  let $agent_form_wrapper = jQuery('.quick-agent-form-w');
  latepoint_init_input_masks($agent_form_wrapper);


  $agent_form_wrapper.find('.agent-quick-edit-form').on('submit', function(e){
    if(jQuery(this).find('button[type="submit"]').hasClass('os-loading')) return false;
    e.preventDefault();
    latepoint_submit_quick_agent_form();
  });


  $agent_form_wrapper.find('.quick-agent-form-view-log-btn').on('click', function(){
    let $trigger_elem = jQuery(this);
    $trigger_elem.addClass('os-loading');
    let route = $trigger_elem.data('route');
    let data = { action: 'latepoint_route_call', route_name: route, params: {agent_id: $trigger_elem.data('agent-id')}, return_format: 'json' }
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(response){
        $trigger_elem.removeClass('os-loading');
        if(response.status === "success"){
          latepoint_display_in_side_sub_panel(response.message);
          jQuery('body').addClass('has-side-sub-panel');
        }else{
          alert(response.message, 'error');
        }
      }
    });
    return false;
  });
}

/*
 * Copyright (c) 2024 LatePoint LLC. All rights reserved.
 */

function latepoint_init_quick_customer_form(){
  let $customer_form_wrapper = jQuery('.quick-customer-form-w');
  latepoint_init_input_masks($customer_form_wrapper);


  $customer_form_wrapper.find('.customer-quick-edit-form').on('submit', function(e){
    if(jQuery(this).find('button[type="submit"]').hasClass('os-loading')) return false;
    e.preventDefault();
    latepoint_submit_quick_customer_form();
  });


  $customer_form_wrapper.find('.quick-customer-form-view-log-btn').on('click', function(){
    var $trigger_elem = jQuery(this);
    $trigger_elem.addClass('os-loading');
    var route = $trigger_elem.data('route');
    var data = { action: 'latepoint_route_call', route_name: route, params: {customer_id: $trigger_elem.data('customer-id')}, return_format: 'json' }
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(response){
        $trigger_elem.removeClass('os-loading');
        if(response.status === "success"){
          latepoint_display_in_side_sub_panel(response.message);
          jQuery('body').addClass('has-side-sub-panel');
        }else{
          alert(response.message, 'error');
        }
      }
    });
    return false;
  });
}


function latepoint_submit_quick_customer_form(){
  let $quick_edit_form = jQuery('form.customer-quick-edit-form');

  let errors = latepoint_validate_form($quick_edit_form);
  if(errors.length){
    let error_messages = errors.map(error =>  error.message ).join(', ');
    latepoint_add_notification(error_messages, 'error');
    return false;
  }

  $quick_edit_form.find('button[type="submit"]').addClass('os-loading');
  jQuery.ajax({
    type: "post",
    dataType: "json",
    processData: false,
    contentType: false,
    url: latepoint_timestamped_ajaxurl(),
    data: latepoint_create_form_data($quick_edit_form),
    success: function (response) {
      $quick_edit_form.find('button[type="submit"]').removeClass('os-loading');
      if(response.form_values_to_update){
        jQuery.each(response.form_values_to_update, function(name, value){
          $quick_edit_form.find('[name="'+ name +'"]').val(value);
        });
      }
      if (response.status === "success") {
        latepoint_add_notification(response.message);
        latepoint_reload_after_customer_save();
      }else{
        latepoint_add_notification(response.message, 'error');
      }
    }
  });

}



function latepoint_reload_after_customer_save(){
  latepoint_reload_calendar_view();

  jQuery('.os-widget').each(function(){
    latepoint_reload_widget(jQuery(this));
  });
  if(jQuery('table.os-reload-on-booking-update').length) latepoint_filter_table(jQuery('table.os-reload-on-booking-update'), jQuery('table.os-reload-on-booking-update'));
  latepoint_close_side_panel();
}

/*
 * Copyright (c) 2023 LatePoint LLC. All rights reserved.
 */


function latepoint_init_daily_bookings_chart() {
  if (typeof Chart === 'undefined' || !jQuery('#chartDailyBookings').length) return

  let $dailyBookingsChart = jQuery('#chartDailyBookings');
  let dailyBookingsLabels = $dailyBookingsChart.data('chart-labels').toString().split(',');
  let dailyBookingsValues = $dailyBookingsChart.data('chart-values').toString().split(',').map(Number);
  let dailyBookingsChartMax = Math.max.apply(Math, dailyBookingsValues);
  // calculate max Y to have space for a tooltip
  let canvasHeight = 200
  let spaceForTooltip = 160
  let maxValue = dailyBookingsChartMax + spaceForTooltip * dailyBookingsChartMax / canvasHeight + 1


  var fontFamily = latepoint_helper.body_font_family;

  Chart.Tooltip.positioners.top = function (items) {
    const pos = Chart.Tooltip.positioners.average(items);

    // Happens when nothing is found
    if (pos === false) {
      return false;
    }

    const chart = this.chart;

    return {
      x: pos.x,
      y: chart.chartArea.top,
      xAlign: 'center',
      yAlign: 'bottom',
    };
  };

  Chart.defaults.defaultFontFamily = fontFamily;
  Chart.defaults.defaultFontSize = 18;
  Chart.defaults.defaultFontStyle = '400';
  Chart.defaults.plugins.tooltip.titleFont = {
    family: fontFamily,
    size: 14,
    color: 'rgba(255,255,255,0.6)',
    style: 'normal',
    weight: 400
  }

  Chart.defaults.plugins.tooltip.titleFont = {family: fontFamily, size: 14, weight: 400};
  Chart.defaults.plugins.tooltip.titleColor = 'rgba(255,255,255,0.6)';
  Chart.defaults.plugins.tooltip.backgroundColor = '#000';
  Chart.defaults.plugins.tooltip.titleMarginBottom = 5;
  Chart.defaults.plugins.tooltip.bodyFont = {family: fontFamily, size: 24, weight: 700, lineHeight: 0.8};
  Chart.defaults.plugins.tooltip.displayColors = false;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.yAlign = 'bottom';
  Chart.defaults.plugins.tooltip.xAlign = 'center';
  Chart.defaults.plugins.tooltip.cornerRadius = 4;
  Chart.defaults.plugins.tooltip.caretSize = 5;
  Chart.defaults.plugins.tooltip.position = 'top';

  var ctx = $dailyBookingsChart[0].getContext("2d");
  var gradientStroke = ctx.createLinearGradient(500, 0, 100, 0);
  gradientStroke.addColorStop(0, '#1d7bff');
  gradientStroke.addColorStop(1, '#1d7bff');


  let gradientFill = ctx.createLinearGradient(0, 0, 0, 140);
  gradientFill.addColorStop(0, 'rgb(206,224,255, 0.4)');
  gradientFill.addColorStop(1, 'rgba(206,224,255,0)');

  // line chart data
  var chartDailyBookingsData = {
    labels: dailyBookingsLabels,
    datasets: [{
      backgroundColor: gradientFill,
      borderColor: gradientStroke,
      label: "",
      fill: true,
      lineTension: 0.1,
      borderWidth: 2,
      borderCapStyle: 'butt',
      borderDash: [],
      borderDashOffset: 0.0,
      borderJoinStyle: 'miter',
      pointBorderColor: "#fff",
      pointBackgroundColor: "#1D7BFF",
      pointRadius: 3,
      pointBorderWidth: 2,
      pointHoverRadius: 6,
      pointHoverBorderWidth: 4,
      pointHoverBackgroundColor: "#1D7BFF",
      pointHoverBorderColor: "#aecdff",
      pointHitRadius: 20,
      spanGaps: false,
      data: dailyBookingsValues,
    }]
  };


  let options = {
    animation: false,
    layout: {
      padding: {
        top: 0
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    maintainAspectRatio: false,
    plugins: {
      verticalLiner: {},
      legend: {
        display: false
      },
    },
    scales: {
      x: {
        display: true,
        ticks: {
          fontFamily: fontFamily,
          maxRotation: 0,
          color: '#1f222b',
          font: {
            size: 11,
            family: fontFamily
          },
          callback: function (value, index, ticks) {
            if(ticks.length){
              return ((index + 2) % Math.round(ticks.length/8)) ? '' : this.getLabelForValue(value)
            }else{
              return this.getLabelForValue(value)
            }
          }
        },
        grid: {
          borderDash: [1, 5],
          color: 'rgba(0,0,0,0.35)',
          zeroLineColor: 'rgba(0,0,0,0.15)',
        },
      },
      y: {
        max: maxValue,
        grid: {
          color: 'rgba(0,0,0,0.05)',
          zeroLineColor: 'rgba(0,0,0,0.05)',
        },
        display: false,
        ticks: {
          beginAtZero: true,
          fontSize: '10',
          fontColor: '#000'
        }
      }

    }
  }

  const plugin = {
    id: 'verticalLiner',
    afterInit: (chart, args, opts) => {
      chart.verticalLiner = {}
    },
    afterEvent: (chart, args, options) => {
      const {inChartArea} = args
      chart.verticalLiner = {draw: inChartArea}
    },
    beforeTooltipDraw: (chart, args, options) => {
      const {draw} = chart.verticalLiner
      if (!draw) return

      const {ctx} = chart
      const {top, bottom} = chart.chartArea
      const {tooltip} = args
      const x = tooltip.caretX
      if (!x) return

      ctx.save()

      ctx.beginPath()
      ctx.moveTo(x, top)
      ctx.lineTo(x, bottom)
      ctx.stroke()

      ctx.restore()
    }
  }

  // line chart init
  let chartDailyBookings = new Chart($dailyBookingsChart, {
    type: 'line',
    data: chartDailyBookingsData,
    options: options,
    plugins: [plugin],
  });
}


function latepoint_init_customer_donut_chart() {
  if (typeof Chart !== 'undefined' && jQuery('.os-customer-donut-chart').length) {
    var fontFamily = latepoint_helper.body_font_family;
    // set defaults
    Chart.defaults.defaultFontFamily = fontFamily;
    Chart.defaults.defaultFontSize = 16;
    Chart.defaults.defaultFontStyle = '400';

    Chart.defaults.plugins.tooltip.titleFont = {family: fontFamily, size: 14, weight: 400};
    Chart.defaults.plugins.tooltip.titleColor = 'rgba(255,255,255,0.6)';
    Chart.defaults.plugins.tooltip.backgroundColor = '#000';
    Chart.defaults.plugins.tooltip.titleMarginBottom = 1;
    Chart.defaults.plugins.tooltip.bodyFont = {family: fontFamily, size: 18, weight: 500};
    Chart.defaults.plugins.tooltip.displayColors = false;
    Chart.defaults.plugins.tooltip.padding = 5;
    Chart.defaults.plugins.tooltip.yAlign = 'bottom';
    Chart.defaults.plugins.tooltip.xAlign = 'center';
    Chart.defaults.plugins.tooltip.cornerRadius = 4;
    Chart.defaults.plugins.tooltip.intersect = false;
    jQuery('.os-customer-donut-chart').each(function (index) {
      var chart_colors = jQuery(this).data('chart-colors').toString().split(',');
      var chart_labels = jQuery(this).data('chart-labels').toString().split(',');
      var chart_values = jQuery(this).data('chart-values').toString().split(',').map(Number);
      var $chart_canvas = jQuery(this);
      var chartDonut = new Chart($chart_canvas, {
        type: 'doughnut',
        data: {
          labels: chart_labels,
          datasets: [{
            data: chart_values,
            backgroundColor: chart_colors,
            hoverBackgroundColor: chart_colors,
            borderWidth: 0,
            hoverBorderColor: 'transparent'
          }]
        },
        options: {
          layout: {
            padding: {
              top: 10,
              bottom: 10,
              left: 10,
              right: 10
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                title: function (tooltipItem) {
                  return tooltipItem[0].label;
                },
                label: function (tooltipItem) {
                  return tooltipItem.parsed;
                },
              }
            },
          },
          animation: {
            animateRotate: false
          },
          cutout: "90%",
          responsive: false,
          maintainAspectRatio: true,
        }
      });
    });
  }
}

function latepoint_init_donut_charts() {
  if (typeof Chart !== 'undefined' && jQuery('.os-donut-chart').length) {
    var fontFamily = latepoint_helper.body_font_family;
    // set defaults
    Chart.defaults.defaultFontFamily = fontFamily;
    Chart.defaults.defaultFontSize = 18;
    Chart.defaults.defaultFontStyle = '400';

    Chart.defaults.plugins.tooltip.titleFont.family = fontFamily;
    Chart.defaults.plugins.tooltip.titleFont.size = 14;
    Chart.defaults.plugins.tooltip.titleColor = 'rgba(255,255,255,0.6)';
    Chart.defaults.plugins.tooltip.backgroundColor = '#000';
    Chart.defaults.plugins.tooltip.titleFont.style = '400';
    Chart.defaults.plugins.tooltip.titleMarginBottom = 1;
    Chart.defaults.plugins.tooltip.bodyFont.family = fontFamily;
    Chart.defaults.plugins.tooltip.bodyFont.size = 24;
    Chart.defaults.plugins.tooltip.bodyFont.style = '500';
    Chart.defaults.plugins.tooltip.displayColors = false;
    Chart.defaults.plugins.tooltip.padding.x = 10;
    Chart.defaults.plugins.tooltip.padding.y = 8;
    Chart.defaults.plugins.tooltip.yAlign = 'bottom';
    Chart.defaults.plugins.tooltip.xAlign = 'center';
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.intersect = false;
    jQuery('.os-donut-chart').each(function (index) {
      var chart_colors = jQuery(this).data('chart-colors').toString().split(',');
      var chart_labels = jQuery(this).data('chart-labels').toString().split(',');
      var chart_values = jQuery(this).data('chart-values').toString().split(',').map(Number);
      var $chart_canvas = jQuery(this);
      var chartDonut = new Chart($chart_canvas, {
        type: 'doughnut',
        data: {
          labels: chart_labels,
          datasets: [{
            data: chart_values,
            backgroundColor: chart_colors,
            hoverBackgroundColor: chart_colors,
            borderWidth: 0,
            hoverBorderColor: 'transparent'
          }]
        },
        options: {
          layout: {
            padding: {
              top: 40
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                title: function (tooltipItem, data) {
                  return data['labels'][tooltipItem[0]['index']];
                },
                label: function (tooltipItem, data) {
                  return data['datasets'][0]['data'][tooltipItem['index']];
                }
              }
            }
          },
          animation: {
            animateScale: true
          },
          cutoutPercentage: 96,
          responsive: false,
          maintainAspectRatio: true,
        }
      });
    });
  }
}


function latepoint_init_circles_charts() {
  jQuery('.circle-chart').each(function (index) {
    var chart_elem_id = jQuery(this).prop('id');
    var max_value = jQuery(this).data('max-value');
    var chart_value = jQuery(this).data('chart-value');
    var chart_color = jQuery(this).data('chart-color');
    var chart_color_fade = jQuery(this).data('chart-color-fade');
    var myCircle = Circles.create({
      id: chart_elem_id,
      radius: 25,
      value: chart_value,
      maxValue: max_value,
      width: 2,
      text: function (value) {
        return Math.round(value);
      },
      colors: [chart_color, chart_color_fade],
      duration: 200,
      wrpClass: 'circles-wrp',
      textClass: 'circles-text',
      valueStrokeClass: 'circles-valueStroke',
      maxValueStrokeClass: 'circles-maxValueStroke',
      styleWrapper: true,
      styleText: true
    });

  });


}


/*
 * Copyright (c) 2023 LatePoint LLC. All rights reserved.
 */

function latepoint_check_horizontal_calendar_scroll(){
  if(jQuery('.daily-availability-calendar.horizontal-calendar').length){
    if(jQuery('.daily-availability-calendar.horizontal-calendar').width() < 700){
      jQuery('.daily-availability-calendar.horizontal-calendar').scrollLeft(jQuery('.os-day.selected').index() * jQuery('.os-day.selected').width());
    }
  }
}

function latepoint_init_calendars(){
  latepoint_check_horizontal_calendar_scroll();
  jQuery('.os-calendar-settings-extra .latecheckbox').lateCheckbox();


  jQuery('.calendar-settings-toggler').on('click', function(){
    jQuery('.os-calendar-settings-form').toggleClass('show-extra-settings');
    return false;
  });

  jQuery('.os-calendar-settings-form').on('change', 'select[name="calendar_settings[view]"]', function(){
    jQuery(this).closest('.calendar-wrapper').attr('data-view', jQuery(this).val());
  });

  jQuery('.os-calendar-settings-form').on('change', 'select, input, .latecheckbox ', function(){
    latepoint_reload_calendar_view();
  });


  jQuery('.calendar-view-wrapper').on('click', '.weekly-calendar-agent-selector', function(){
    jQuery('.weekly-calendar-agent-selector.selected').removeClass('selected');
    jQuery(this).addClass('selected');
    jQuery('.os-calendar-settings-form input[name="calendar_settings[selected_agent_id]"]').val(jQuery(this).data('agent-id'));
    jQuery('.agent-weekly-calendar.selected').removeClass('selected');
    jQuery('.agent-weekly-calendar[data-agent-id="'+jQuery(this).data('agent-id')+'"]').addClass('selected');
    return false;
  });

  jQuery('.calendar-view-wrapper').on('click', '.daily-calendar-action-navigation-btn', function(){
    jQuery(this).addClass('os-loading');
    jQuery('input[name="calendar_settings[target_date_string]"]').val(jQuery(this).data('target-date')).trigger('change');
    return false;
  });

  jQuery('.calendar-view-wrapper').on('click', '.daily-availability-calendar .os-day', function(){
    jQuery('.os-monthly-calendar-days-w .os-day.selected').removeClass('selected');
    jQuery(this).addClass('selected');
    jQuery('input[name="calendar_settings[target_date_string]"]').val(jQuery(this).data('date')).trigger('change');
    return false;
  });


  jQuery('.os-calendar-today-btn').on('click', function(){
    jQuery(this).addClass('os-loading');
    jQuery('input[name="calendar_settings[target_date_string]"]').val(jQuery(this).data('target-date')).trigger('change');
    return false;
  });

  jQuery('.os-calendar-prev-btn').on('click', function(){
    jQuery(this).addClass('os-loading');
    jQuery('input[name="calendar_settings[target_date_string]"]').val(jQuery('input[name="prev_target_date"]').val()).trigger('change');
    return false;
  });

  jQuery('.os-calendar-next-btn').on('click', function(){
    jQuery(this).addClass('os-loading');
    jQuery('input[name="calendar_settings[target_date_string]"]').val(jQuery('input[name="next_target_date"]').val()).trigger('change');
    return false;
  });
}

function latepoint_reload_calendar_view(){
  let $calendar_wrapper = jQuery('.calendar-view-wrapper');
  if(!$calendar_wrapper.length) return;
  $calendar_wrapper.addClass('os-loading');

  let calendar_settings = new FormData(jQuery('form.os-calendar-settings-form')[0]);

  let data = new FormData();
  data.append('params', latepoint_formdata_to_url_encoded_string(calendar_settings));
  data.append('action', latepoint_helper.route_action);
  data.append('route_name', $calendar_wrapper.data('route'));
  data.append('return_format', 'json');

  jQuery.ajax({
    type: "post",
    dataType: "json",
    processData: false,
    contentType: false,
    url: latepoint_timestamped_ajaxurl(),
    data: data,
    success: function (response) {
      if (response.status === "success") {
        $calendar_wrapper.html(response.message).removeClass('os-loading');
        jQuery('.os-calendar-today-btn, .os-calendar-prev-btn, .os-calendar-next-btn').removeClass('os-loading');
        jQuery('.os-current-month-label .current-month').text(response.top_date_label);
        jQuery('.os-current-month-label .current-year').text(response.top_date_year);
        latepoint_check_horizontal_calendar_scroll();
      }
    }
  });

}

/*
 * Copyright (c) 2022 LatePoint LLC. All rights reserved.
 */

function latepoint_process_updated() {
    location.reload();
}

function latepoint_process_action_removed($elem) {
    $elem.closest('.os-form-block').remove();
}

function latepoint_replace_process_condition_element($trigger, params, $target, callback = null) {
    $trigger.closest('.sub-section-content').addClass('os-loading');
    let route_name = $trigger.data('route');
    let data = {action: latepoint_helper.route_action, route_name: route_name, params: params, return_format: 'json'}
    jQuery.ajax({
        type: 'post',
        dataType: "json",
        url: latepoint_timestamped_ajaxurl(),
        data: data,
        success: (response) => {
            if (response.status === latepoint_helper.response_status.success) {
                $target.html(response.message);
                latepoint_init_process_conditions_form();
                $trigger.closest('.sub-section-content').removeClass('os-loading');
                if (typeof callback === 'function') {
                    callback();
                }
            } else {
                alert("Error!");
            }
        }
    });
}


function latepoint_init_process_forms() {
    latepoint_init_process_conditions_form();

    jQuery('.os-processes-w').on('latepoint:initProcessActionForm latepoint:initProcessActionTypeSettings', '.process-action-form', async function () {
        if (jQuery(this).find('.latepoint-whatsapp-templates-loader').length) {
            let $loader = jQuery(this).find('.latepoint-whatsapp-templates-loader');
            let $settings = jQuery(this).find('.process-action-settings');
            let $holder = jQuery(this).find('.latepoint-whatsapp-templates-holder');
            $settings.addClass('os-loading');

            let data = {
                action: latepoint_helper.route_action,
                route_name: $loader.data('route'),
                params: {
                    template_id: $loader.data('selected-template-id'),
                    action_id: $loader.data('process-action-id'),
                    process_id: $loader.data('process-id')
                },
                layout: 'none',
                return_format: 'json'
            }
            try {
                let response = await jQuery.ajax({
                    type: "post",
                    dataType: "json",
                    url: latepoint_timestamped_ajaxurl(),
                    data: data
                });
                $settings.removeClass('os-loading');
                if (response.status === 'success') {
                    $loader.remove();
                    $holder.html(response.message);
                } else {
                    throw new Error(response.message);
                }
            } catch (e) {
                $settings.removeClass('os-loading');
                console.log(e);
                alert(e);
            }
        }
    });

    jQuery('.os-processes-w').on('click', '.os-run-process', function () {
        let $btn = jQuery(this);
        $btn.addClass('os-loading');
        let $process_form = $btn.closest('.os-process-form');
        // remove previously assigned class on other forms
        jQuery('.os-process-form.prepared-to-run').removeClass('prepared-to-run');
        // add class so we know which form is about to be processed
        $process_form.addClass('prepared-to-run');


        let form_data = new FormData($process_form[0]);
        form_data.set('process_event_type', $process_form.closest('.os-process-form').find('.process-event-type-selector').val());


        let data = new FormData();
        data.append('params', latepoint_formdata_to_url_encoded_string(form_data));
        data.append('action', latepoint_helper.route_action);
        data.append('route_name', $btn.data('route'));
        data.append('return_format', 'json');

        jQuery.ajax({
            type: "post",
            dataType: "json",
            processData: false,
            contentType: false,
            url: latepoint_timestamped_ajaxurl(),
            data: data,
            success: function (data) {
                latepoint_show_data_in_side_panel(data.message, 'width-600');
                latepoint_init_process_test_form();
                $btn.removeClass('os-loading');
            }
        });
        return false;
    });

    jQuery('.os-processes-w').find('.process-action-form').each(function (index) {
        latepoint_init_process_action_form(jQuery(this));
    });

    jQuery('.os-processes-w').on('click', '.pe-remove-condition', (event) => {
        if (jQuery(event.currentTarget).closest('.pe-conditions').find('.pe-condition').length > 1) {
            jQuery(event.currentTarget).closest('.pe-condition').remove();
        } else {
            alert('You need to have at least one condition if your custom field is set to be conditional.')
        }
        return false;
    });


    jQuery('.os-processes-w').on('change', 'select.process-condition-operator-selector', (event) => {
        let $select = jQuery(event.currentTarget);
        if ($select.val() == 'changed' || $select.val() == 'not_changed') {
            $select.closest('.pe-condition').find('.process-condition-values-w').hide();
        } else {
            $select.closest('.pe-condition').find('.process-condition-values-w').show();
        }
    });

    jQuery('.os-processes-w').on('change', 'select.process-event-type-selector', (event) => {
        let $select = jQuery(event.currentTarget);
        latepoint_replace_process_condition_element($select, {event_type: $select.val()}, $select.closest('.os-form-block').find('.process-event-condition-wrapper'));
    });

    jQuery('.os-processes-w').on('change', 'select.process-condition-object-selector', (event) => {
        let $select = jQuery(event.currentTarget);
        let $property_selector = $select.closest('.pe-condition').find('.process-condition-properties-w select');
        latepoint_replace_process_condition_element($select, {object_code: $select.val()}, $property_selector, () => {
            $property_selector.trigger('change');
        });
    });

    jQuery('.os-processes-w').on('change', 'select.process-condition-property-selector', (event) => {
        let $select = jQuery(event.currentTarget);
        let $operator_selector = $select.closest('.pe-condition').find('.process-condition-operators-w select');
        latepoint_replace_process_condition_element($select, {property: $select.val()}, $operator_selector, () => {
            $operator_selector.trigger('change');
        });
    });

    jQuery('.os-processes-w').on('change', 'select.process-condition-operator-selector', (event) => {
        let $select = jQuery(event.currentTarget);
        latepoint_replace_process_condition_element($select, {
            property: $select.closest('.pe-condition').find('select.process-condition-property-selector').val(),
            trigger_condition_id: $select.closest('.pe-condition').data('condition-id'),
            operator: $select.val()
        }, $select.closest('.pe-condition').find('.process-condition-values-w'));
    });

}

function latepoint_init_process_conditions_form() {
    jQuery('.os-late-select').lateSelect();
}

function latepoint_add_process_condition($btn, response) {
    $btn.closest('.pe-condition').after(response.message);
    latepoint_init_process_conditions_form();
}

function latepoint_init_added_process_action_form($trigger) {
    let $action_form = $trigger.prev('.process-action-form');
    $action_form.addClass('is-editing').trigger('latepoint:initProcessActionForm');
    latepoint_init_process_action_form($action_form);
}

function latepoint_init_process_test_form() {

    jQuery('.latepoint-run-process-btn').on('click', function () {
        let $btn = jQuery(this);
        if ($btn.hasClass('os-loading')) return false;
        $btn.addClass('os-loading');
        let $test_action_form = jQuery('.latepoint-side-panel-w .action-settings-wrapper');


        let form_data = new FormData(jQuery('.os-process-form.prepared-to-run')[0]);

        // set data sources
        jQuery('.process-test-data-source-selector').each(function () {
            form_data.set(jQuery(this).prop('name'), jQuery(this).val());
        });

        // set selected actions
        jQuery('.process-test-data-source-selector').each(function () {
            form_data.set(jQuery(this).prop('name'), jQuery(this).val());
        });

        let action_ids_to_run = [];
        jQuery('.action-to-run input[type="hidden"]').each(function () {
            if (jQuery(this).val() == 'on') action_ids_to_run.push(jQuery(this).closest('.action-to-run').data('id'));
        });
        form_data.set('action_ids', action_ids_to_run.join(','));


        let data = new FormData();
        data.append('params', latepoint_formdata_to_url_encoded_string(form_data));
        data.append('action', latepoint_helper.route_action);
        data.append('route_name', $btn.data('route'));
        data.append('return_format', 'json');

        jQuery.ajax({
            type: "post",
            dataType: "json",
            processData: false,
            contentType: false,
            url: latepoint_timestamped_ajaxurl(),
            data: data,
            success: function (data) {
                $btn.removeClass('os-loading');
                if (data.status == 'success') {
                    latepoint_add_notification(data.message);
                } else {
                    latepoint_add_notification(data.message, 'error');
                }
            }
        });
    });

    jQuery('.process-action-test-data-source-selector').on('change', function () {
        // TODO add call to server to check if selected data sources matches conditions of this process
    });
}


function latepoint_init_process_action_test_form() {

    latepoint_init_json_view(jQuery('.action-preview-wrapper.type-trigger_webhook pre'));

    jQuery('.latepoint-run-action-btn').on('click', function () {
        let $btn = jQuery(this);
        if ($btn.hasClass('os-loading')) return false;
        $btn.addClass('os-loading');
        let $test_action_form = jQuery('.latepoint-side-panel-w .action-settings-wrapper');

        let action_data = new FormData();


        action_data.append('params', $test_action_form.find('select, textarea, input').serialize());
        action_data.append('action', latepoint_helper.route_action);
        action_data.append('route_name', $btn.data('route'));
        action_data.append('return_format', 'json');

        jQuery.ajax({
            type: "post",
            dataType: "json",
            processData: false,
            contentType: false,
            url: latepoint_timestamped_ajaxurl(),
            data: action_data,
            success: function (data) {
                $btn.removeClass('os-loading');
                if (data.status == 'success') {
                    latepoint_add_notification(data.message);
                } else {
                    latepoint_add_notification(data.message, 'error');
                }
            }
        });
    });

    jQuery('.process-action-test-data-source-selector').on('change', function () {
        let $select = jQuery(this);
        jQuery('.action-preview-wrapper').addClass('os-loading');
        let $test_action_form = $select.closest('.action-settings-wrapper');

        let action_data = new FormData();


        action_data.append('params', $test_action_form.find('select, textarea, input').serialize());
        action_data.append('action', latepoint_helper.route_action);
        action_data.append('route_name', $select.data('route'));
        action_data.append('return_format', 'json');

        jQuery.ajax({
            type: "post",
            dataType: "json",
            processData: false,
            contentType: false,
            url: latepoint_timestamped_ajaxurl(),
            data: action_data,
            success: function (data) {
                jQuery('.action-preview-wrapper').html(data.message).removeClass('os-loading');
                latepoint_init_json_view(jQuery('.action-preview-wrapper.type-trigger_webhook pre'));
            }
        });
    });
}

function latepoint_init_process_action_form($action_form) {
    $action_form.on('click', '.os-run-process-action', function () {
        let $btn = jQuery(this);
        $btn.addClass('os-loading');
        let $action_form = $btn.closest('.process-action-form');

        if (window.tinyMCE !== undefined) window.tinyMCE.triggerSave();

        let action_data = new FormData();
        let params = latepoint_create_form_data_from_non_form_element($action_form);

        params.set('process_event_type', $action_form.closest('.os-process-form').find('.process-event-type-selector').val());

        action_data.append('params', latepoint_formdata_to_url_encoded_string(params));
        action_data.append('action', latepoint_helper.route_action);
        action_data.append('route_name', $btn.data('route'));
        action_data.append('return_format', 'json');

        jQuery.ajax({
            type: "post",
            dataType: "json",
            processData: false,
            contentType: false,
            url: latepoint_timestamped_ajaxurl(),
            data: action_data,
            success: function (data) {
                latepoint_show_data_in_side_panel(data.message, 'width-800');
                latepoint_init_process_action_test_form();
                $btn.removeClass('os-loading');
            }
        });
        return false;
    });
    $action_form.on('click', '.process-action-heading', function () {
        let $action_form = jQuery(this).closest('.process-action-form');
        if (!$action_form.hasClass('is-editing')) $action_form.trigger('latepoint:initProcessActionForm')
        $action_form.toggleClass('is-editing');
        return false;
    });

    $action_form.find('textarea.os-wp-editor-textarea').each(function (index) {
        latepoint_init_tiny_mce(jQuery(this).attr('id'));
    });
    $action_form.on('click', '.os-remove-process-action', function () {
        if (confirm(jQuery(this).data('os-prompt'))) {
            jQuery(this).closest('.process-action-form').remove();
        }
        return false;
    });

    $action_form.on('change', '.process-action-type-whatsapp-template-selector', async function () {
        let $select = jQuery(this);
        let $preview_holder = $select.closest('.process-action-settings').find('.latepoint-whatsapp-template-preview-holder');
        $preview_holder.addClass('os-loading');

        let data = {
            action: latepoint_helper.route_action,
            route_name: $select.data('route'),
            params: {
                template_id: $select.val(),
                action_id: $select.data('action-id')
            },
            layout: 'none',
            return_format: 'json'
        }
        try {
            let response = await jQuery.ajax({
                type: "post",
                dataType: "json",
                url: latepoint_timestamped_ajaxurl(),
                data: data
            });
            $preview_holder.removeClass('os-loading');
            if (response.status === 'success') {
                $preview_holder.html(response.message);
            } else {
                throw new Error(response.message);
            }
        } catch (e) {
            $preview_holder.removeClass('os-loading');
            console.log(e);
            alert(e);
        }
        return false;
    });

    $action_form.on('change', '.process-action-type', function () {
        let $select = jQuery(this);
        jQuery(this).closest('.process-action-form').find('.process-action-name').text($select.find('option:selected').text());
        let action_type = $select.val();
        let action_id = $select.data('action-id');
        let route_name = $select.data('route');
        let $action_settings = $select.closest('.process-action-content').find('.process-action-settings');
        $action_settings.addClass('os-loading');
        let data = {
            action: latepoint_helper.route_action,
            route_name: route_name,
            params: {
                action_type: action_type,
                action_id: action_id
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
                $action_settings.html(data.message).removeClass('os-loading');
                let $action_form = $select.closest('.process-action-form');
                latepoint_init_input_masks($action_form);
                $action_form.trigger('latepoint:initProcessActionTypeSettings');
            }
        });
        return false;
    });
}

/*
 * Copyright (c) 2024 LatePoint LLC. All rights reserved.
 */


function latepoint_preview_init_step_category_items(step_code){
  jQuery('.booking-form-preview .os-item-category-info').on('click', function(){
    var $booking_form_element = jQuery(this).closest('.booking-form-preview');
    jQuery(this).closest('.latepoint-step-content').addClass('selecting-item-category');
    var $category_wrapper = jQuery(this).closest('.os-item-category-w');
    var $main_parent = jQuery(this).closest('.os-item-categories-main-parent');
    if($category_wrapper.hasClass('selected')){
      $category_wrapper.removeClass('selected');
      if($category_wrapper.parent().closest('.os-item-category-w').length){
        $category_wrapper.parent().closest('.os-item-category-w').addClass('selected');
      }else{
        $main_parent.removeClass('show-selected-only');
      }
    }else{
      $main_parent.find('.os-item-category-w.selected').removeClass('selected');
      $main_parent.addClass('show-selected-only');
      $category_wrapper.addClass('selected');
    }
    return false;
  });
}

function latepoint_booking_form_discard_changes(){

  let form_data = new FormData(jQuery('.booking-form-preview-settings')[0]);

  var data = {
    action: latepoint_helper.route_action,
    route_name: jQuery('.booking-form-preview-settings').data('route-name'),
    params: latepoint_formdata_to_url_encoded_string(form_data),
    layout: 'none',
    return_format: 'json'
  }

  jQuery.ajax({
    type : "post",
    dataType : "json",
    url : latepoint_timestamped_ajaxurl(),
    data : data,
    success: function(data){
      if(data.status === "success"){
        jQuery('.booking-form-preview-inner').html(data.booking_form_html);
        latepoint_init_booking_form_preview();
      }else{
        latepoint_add_notification(data.message, 'error');
      }
    }
  });
}

function latepoint_booking_form_save_changes(){

  let form_data = new FormData(jQuery('.booking-form-preview-settings')[0]);

  jQuery('.editable-setting').each(function(){
    form_data.set('steps_settings' + jQuery(this).data('setting-key'), jQuery(this).html());
  });


  form_data.set('steps_settings' + jQuery('.bf-side-media-picker-trigger').find('.os-image-id-holder').prop('name'), jQuery('.bf-side-media-picker-trigger').find('.os-image-id-holder').val());


  var data = {
    action: latepoint_helper.route_action,
    route_name: jQuery('.booking-form-preview-settings').data('route-name'),
    params: latepoint_formdata_to_url_encoded_string(form_data),
    layout: 'none',
    return_format: 'json'
  }

  jQuery.ajax({
    type : "post",
    dataType : "json",
    url : latepoint_timestamped_ajaxurl(),
    data : data,
    success: function(data){
      jQuery('.booking-form-preview-settings').removeClass('os-loading');
      if(data.status === "success"){
        jQuery('.bf-preview-step-settings').html(data.step_settings_html);
        jQuery('.booking-form-preview-inner').html(data.booking_form_html);
        jQuery('#latepoint-main-admin-inline-css').html(data.css_variables);
        latepoint_init_booking_form_preview();
      }else{
        latepoint_add_notification(data.message, 'error');
      }
    }
  });
}

function latepoint_init_booking_form_preview(){

  latepoint_preview_init_step_category_items();
  latepoint_booking_form_preview_init_datepicker();


  jQuery('.booking-form-preview-wrapper').on('click', '.os-step-tab', function(){
    jQuery(this).closest('.os-step-tabs').find('.os-step-tab').removeClass('active');
    jQuery(this).addClass('active');
    var target = jQuery(this).data('target');
    jQuery(this).closest('.os-step-tabs-w').find('.os-step-tab-content').hide();
    jQuery(target).show();
  });


  jQuery('.bf-save-btn').on('click', function(){
    jQuery(this).addClass('os-loading');
    latepoint_booking_form_save_changes();
    return false;
  });

  jQuery('.bf-cancel-save-btn').on('click', function(){
    jQuery(this).addClass('os-loading');
    latepoint_booking_form_discard_changes();
    return false;
  });


  jQuery('.booking-form-preview .bf-next-btn').on('click', function(){
    jQuery(this).addClass('os-loading');
    jQuery("#selected_step_code > option:selected")
        .prop("selected", false)
        .next()
        .prop("selected", true).trigger('change');
  });

  jQuery('.booking-form-preview .bf-prev-btn').on('click', function(){
    jQuery(this).addClass('os-loading');
    jQuery("#selected_step_code > option:selected")
        .prop("selected", false)
        .prev()
        .prop("selected", true).trigger('change');
  });


  jQuery('.booking-form-preview .os-image-selector-trigger').on('click', function(){
    jQuery('.booking-form-preview').addClass('has-changes');
  });

  jQuery('.booking-form-preview .editable-setting').on('focus', function(){
    jQuery('.booking-form-preview').addClass('has-changes');
  });


  let editor = new MediumEditor('.booking-form-preview .os-editable', {toolbar: {
        buttons: [
          {
                name: 'bold',
                classList: ['latepoint-icon', 'latepoint-icon-format_bold'],
            },
          {
                name: 'anchor',
                classList: ['latepoint-icon', 'latepoint-icon-format_link'],
            },
          {
                name: 'h3',
                classList: ['latepoint-icon', 'latepoint-icon-format_h3'],
            },
          {
                name: 'h4',
                classList: ['latepoint-icon', 'latepoint-icon-format_h4'],
            },
          {
                name: 'h5',
                classList: ['latepoint-icon', 'latepoint-icon-format_h5'],
            },

        ]
  }
  });
  let editor_basic = new MediumEditor('.booking-form-preview .os-editable-basic', {toolbar: {
        buttons: [
          {
                name: 'bold',
                classList: ['latepoint-icon', 'latepoint-icon-format_bold'],
            },
          {
                name: 'italic',
                classList: ['latepoint-icon', 'latepoint-icon-format_italic'],
            },
          {
                name: 'underline',
                classList: ['latepoint-icon', 'latepoint-icon-format_underlined'],
            },
          {
                name: 'anchor',
                classList: ['latepoint-icon', 'latepoint-icon-format_link'],
            },

        ]
  }
  });
}

function latepoint_reload_booking_form_preview(){
  latepoint_booking_form_save_changes();
}

function latepoint_init_steps_settings(){

  jQuery('.booking-form-preview-settings').on('change', ' select, input[type="hidden"]', function(){
    jQuery('.booking-form-preview-settings').addClass('os-loading');
    latepoint_reload_booking_form_preview();
  });

  jQuery('.trigger-custom-color-save').on('click', function(){
    jQuery('.booking-form-preview-settings').addClass('os-loading');
    latepoint_booking_form_save_changes();
    return false;
  });

  jQuery('.bf-color-scheme-color-trigger').on('click', function(){
    jQuery('.bf-color-scheme-color-trigger.is-selected').removeClass('is-selected');
    jQuery(this).addClass('is-selected');
    let color_scheme = jQuery(this).data('color-code');
    jQuery('.os-color-scheme-selector-wrapper select').val(color_scheme).trigger('change');
    if(color_scheme == 'custom'){
      jQuery('.os-custom-color-selector-wrapper').removeClass('is-hidden');
    }else{
      jQuery('.os-custom-color-selector-wrapper').addClass('is-hidden');
    }
    return false;
  });

  jQuery('.os-section-collapsible-trigger').on('click', function(){
    jQuery(this).closest('.os-section-collapsible-wrapper').toggleClass('is-open');
    return false;
  })
}


function latepoint_booking_form_preview_init_timeslots($booking_form_element = false){
  if(!$booking_form_element) return;
  $booking_form_element.on('click', '.dp-timepicker-trigger', function(){
    if(jQuery(this).hasClass('is-booked') || jQuery(this).hasClass('is-off')){
      // Show error message that you cant select a booked period
    }else{
      if(jQuery(this).hasClass('selected')){
        jQuery(this).removeClass('selected');
        jQuery(this).find('.dp-success-label').remove();
      }else{
        $booking_form_element.find('.dp-timepicker-trigger.selected').removeClass('selected').find('.dp-success-label').remove();
        var selected_timeslot_time = jQuery(this).find('.dp-label-time').html();
        jQuery(this).addClass('selected').find('.dp-label').prepend('<span class="dp-success-label">' + latepoint_helper.datepicker_timeslot_selected_label + '</span>');

        var minutes = parseInt(jQuery(this).data('minutes'));
        var timeshift_minutes = parseInt($booking_form_element.find('.latepoint_timeshift_minutes').val());
        // we substract timeshift minutes because its timeshift minutes that the business is running in, in opposite of what we do when we generate a calendar for a client
        if(timeshift_minutes) minutes = minutes - timeshift_minutes;
        var start_date = new Date($booking_form_element.find('.os-day.selected').data('date'));
        if(minutes < 0){
          // business minutes are in previous day
          minutes = 24*60 + minutes;
          // move start date back 1 day
          start_date.setDate(start_date.getDate() - 1);
        }else if(minutes >= 24*60){
          // business minutes are in next day
          minutes = minutes - 24*60;
          start_date.setDate(start_date.getDate() + 1);
        }
        $booking_form_element.find('.latepoint_start_date').val(start_date.toISOString().split('T')[0])
        latepoint_trigger_next_btn($booking_form_element);
      }
    }
    return false;
  });
}


function latepoint_booking_form_preview_day_timeslots($day){
  let $wrapper_element = jQuery('.booking-form-preview');
  $day.addClass('selected');

  var service_duration = $day.data('service-duration');
  var interval = $day.data('interval');
  var work_start_minutes = $day.data('work-start-time');
  var work_end_minutes = $day.data('work-end-time');
  var total_work_minutes = $day.data('total-work-minutes');
  var bookable_minutes = [];
  var available_capacities_of_bookable_minute = [];
  if($day.attr('data-bookable-minutes')){
    if($day.data('bookable-minutes').toString().indexOf(':') > -1){
      // has capacity information embedded into bookable minutes string
      let bookable_minutes_with_capacity = $day.data('bookable-minutes').toString().split(',');
      for(let i = 0; i < bookable_minutes_with_capacity.length; i++){
        bookable_minutes.push(parseInt(bookable_minutes_with_capacity[i].split(':')[0]));
        available_capacities_of_bookable_minute.push(parseInt(bookable_minutes_with_capacity[i].split(':')[1]));
      }
    }else{
      bookable_minutes = $day.data('bookable-minutes').toString().split(',').map(Number);
    }
  }
  var work_minutes = $day.data('work-minutes').toString().split(',').map(Number);

  var $timeslots = $wrapper_element.find('.timeslots');
  $timeslots.html('');

  if(total_work_minutes > 0 && bookable_minutes.length && work_minutes.length){
    var prev_minutes = false;
    work_minutes.forEach(function(current_minutes){
      var ampm = latepoint_am_or_pm(current_minutes);

      var timeslot_class = 'dp-timepicker-trigger';
      var timeslot_available_capacity = 0;
      if($wrapper_element.find('.os-dates-w').data('time-pick-style') == 'timeline'){
        timeslot_class+= ' dp-timeslot';
      }else{
        timeslot_class+= ' dp-timebox';
      }

      if(prev_minutes !== false && ((current_minutes - prev_minutes) > service_duration)){
        // show interval that is off between two work periods
        var off_label = latepoint_minutes_to_hours_and_minutes(prev_minutes + service_duration)+' '+ latepoint_am_or_pm(prev_minutes + service_duration) + ' - ' + latepoint_minutes_to_hours_and_minutes(current_minutes)+' '+latepoint_am_or_pm(current_minutes);
        var off_width = (((current_minutes - prev_minutes - service_duration) / total_work_minutes) * 100);
        $timeslots.append('<div class="'+ timeslot_class +' is-off" style="max-width:'+ off_width +'%; width:'+ off_width +'%"><span class="dp-label">' + off_label + '</span></div>');
      }

      if(!bookable_minutes.includes(current_minutes)){
        timeslot_class+= ' is-booked';
      }else{
        if(available_capacities_of_bookable_minute.length) timeslot_available_capacity = available_capacities_of_bookable_minute[bookable_minutes.indexOf(current_minutes)];
      }
      var tick_html = '';
      var capacity_label = '';
      var capacity_label_html = '';
      var capacity_internal_label_html = '';

      if(((current_minutes % 60) == 0) || (interval >= 60)){
        timeslot_class+= ' with-tick';
        tick_html = '<span class="dp-tick"><strong>'+latepoint_minutes_to_hours_preferably(current_minutes)+'</strong>'+' '+ampm+'</span>';
      }
      var timeslot_label = latepoint_minutes_to_hours_and_minutes(current_minutes)+' '+ampm;
      if(latepoint_show_booking_end_time()){
        var end_minutes = current_minutes + service_duration;
        if(end_minutes > 1440) end_minutes = end_minutes - 1440;
        var end_minutes_ampm = latepoint_am_or_pm(end_minutes);
        timeslot_label+= ' - <span class="dp-label-end-time">' + latepoint_minutes_to_hours_and_minutes(end_minutes)+' '+end_minutes_ampm + '</span>';
      }
      if(timeslot_available_capacity){
        var spaces_message = timeslot_available_capacity > 1 ? latepoint_helper.many_spaces_message : latepoint_helper.single_space_message;
        capacity_label = timeslot_available_capacity + ' ' + spaces_message;
        capacity_label_html = '<span class="dp-capacity">' + capacity_label + '</span>';
        capacity_internal_label_html = '<span class="dp-label-capacity">' + capacity_label + '</span>';
      }
      timeslot_label = timeslot_label.trim();
      $timeslots.removeClass('slots-not-available').append('<div class="'+timeslot_class+'" data-minutes="' + current_minutes + '"><span class="dp-label">' + capacity_internal_label_html + '<span class="dp-label-time">' + timeslot_label + '</span>' +'</span>'+tick_html+ capacity_label_html + '</div>');
      prev_minutes = current_minutes;
    });
  }else{
    // No working hours this day
    $timeslots.addClass('slots-not-available').append('<div class="not-working-message">' + latepoint_helper.msg_not_available + "</div>");
  }
  jQuery('.times-header-label span').text($day.data('nice-date'));
  $wrapper_element.find('.time-selector-w').slideDown(200);
}

function latepoint_booking_form_preview_init_monthly_calendar_navigation($booking_form_element){

  if(!$booking_form_element) return;
  $booking_form_element.on('click', '.os-month-next-btn', function(){
    var $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');
    var next_month_route_name = jQuery(this).data('route');
    if($booking_form_element.find('.os-monthly-calendar-days-w.active + .os-monthly-calendar-days-w').length){
      $booking_form_element.find('.os-monthly-calendar-days-w.active').removeClass('active').next('.os-monthly-calendar-days-w').addClass('active');
      latepoint_booking_form_preview_calendar_set_month_label($booking_form_element);
    }else{
      alert('Disabled in preview');
    }
    latepoint_calendar_show_or_hide_prev_next_buttons($booking_form_element);
    return false;
  });
  $booking_form_element.on('click', '.os-month-prev-btn', function(){
    var $booking_form_element = jQuery(this).closest('.latepoint-booking-form-element');
    if($booking_form_element.find('.os-monthly-calendar-days-w.active').prev('.os-monthly-calendar-days-w').length){
      $booking_form_element.find('.os-monthly-calendar-days-w.active').removeClass('active').prev('.os-monthly-calendar-days-w').addClass('active');
      latepoint_booking_form_preview_calendar_set_month_label($booking_form_element);
    }
    return false;
  });
}


function latepoint_booking_form_preview_calendar_set_month_label(){
  jQuery('.os-current-month-label .current-month').text(jQuery('.os-monthly-calendar-days-w.active').data('calendar-month-label'));
  jQuery('.os-current-month-label .current-year').text(jQuery('.os-monthly-calendar-days-w.active').data('calendar-year'));
}



function latepoint_booking_form_preview_init_datepicker(){
  let $booking_form_element = jQuery('.latepoint-booking-form-element');
  latepoint_booking_form_preview_init_timeslots($booking_form_element);
  latepoint_booking_form_preview_init_monthly_calendar_navigation($booking_form_element);
  $booking_form_element.on('click', '.os-months .os-day', function(){
    if(jQuery(this).hasClass('os-day-passed')) return false;
    if(jQuery(this).hasClass('os-not-in-allowed-period')) return false;
    if(jQuery(this).closest('.os-monthly-calendar-days-w').hasClass('hide-if-single-slot')){

      // HIDE TIMESLOT IF ONLY ONE TIMEPOINT
      if(jQuery(this).hasClass('os-not-available')){
        // clicked on a day that has no available timeslots
        // do nothing
      }else{
        $booking_form_element.find('.os-day.selected').removeClass('selected');
        jQuery(this).addClass('selected');
        // set date
        $booking_form_element.find('.latepoint_start_date').val(jQuery(this).data('date'));
        if(jQuery(this).hasClass('os-one-slot-only')){
          // clicked on a day that has only one slot available
          var bookable_minutes = jQuery(this).data('bookable-minutes').toString().split(':')[0];
          var selected_timeslot_time = latepoint_format_minutes_to_time(Number(bookable_minutes), Number(jQuery(this).data('service-duration')));
          $booking_form_element.find('.time-selector-w').slideUp(200);
        }else{
          // regular day with more than 1 timeslots available
          // build timeslots
          latepoint_booking_form_preview_day_timeslots(jQuery(this));
          // clear time and hide next btn
        }
      }
    }else{
      // SHOW TIMESLOTS EVEN IF ONLY ONE TIMEPOINT
      $booking_form_element.find('.latepoint_start_date').val(jQuery(this).data('date'));
      $booking_form_element.find('.os-day.selected').removeClass('selected');
      jQuery(this).addClass('selected');

      // build timeslots
      latepoint_booking_form_preview_day_timeslots(jQuery(this));
      // clear time and hide next btn
    }


    return false;
  });
}



/*
 * Copyright (c) 2024 LatePoint LLC. All rights reserved.
 */

function latepoint_submit_quick_order_form(){
  let $quick_edit_form = jQuery('form.order-quick-edit-form');

  let errors = latepoint_validate_form($quick_edit_form);
  if(errors.length){
    let error_messages = errors.map(error =>  error.message ).join(', ');
    latepoint_add_notification(error_messages, 'error');
    return false;
  }

  $quick_edit_form.find('button[type="submit"]').addClass('os-loading');
  jQuery.ajax({
    type: "post",
    dataType: "json",
    processData: false,
    contentType: false,
    url: latepoint_timestamped_ajaxurl(),
    data: latepoint_create_form_data($quick_edit_form),
    success: function (response) {
      if(response.fields_to_update){
        for (const [key, value] of Object.entries(response.fields_to_update)) {
            $quick_edit_form.find('input[name="' + key + '"]').val(value)
        }
      }
      $quick_edit_form.find('button[type="submit"]').removeClass('os-loading');
      if(response.form_values_to_update){
        jQuery.each(response.form_values_to_update, function(name, value){
          $quick_edit_form.find('[name="'+ name +'"]').val(value);
        });
      }
      if (response.status === "success") {
        latepoint_add_notification(response.message);
        latepoint_reload_after_order_save();
      }else{
        latepoint_add_notification(response.message, 'error');
      }
    }
  });

}

function latepoint_apply_agent_selector_change(){
  if(jQuery('.quick-availability-per-day-w').length){

    let booking_form_id = jQuery('.quick-availability-per-day-w').data('trigger-form-booking-id');
    let $trigger_btn = jQuery('.order-item-booking-data-form-wrapper[data-booking-id="' + booking_form_id + '"]').find('.trigger-quick-availability');

    latepoint_load_quick_availability($trigger_btn);
  }
}

function latepoint_apply_service_selector_change($form){
  let field_base_name = 'order_items[' + $form.data('order-item-id') +'][bookings][' + $form.data('booking-id') +']';

  var $selected_service = $form.find('.os-services-select-field-w .service-option-selected');
  var service_id = $selected_service.data('id');
  var buffer_before = $selected_service.data('buffer-before');
  var buffer_after = $selected_service.data('buffer-after');
  var default_duration = $selected_service.data('duration');
  var default_duration_name = $selected_service.data('duration-name');
  var min_capacity = $selected_service.data('capacity-min');
  var max_capacity = $selected_service.data('capacity-max');

  var extra_durations = $selected_service.data('extra-durations');

  $form.find('input[name="'+field_base_name+'[buffer_before]"]').val(buffer_before).trigger('change').closest('.os-form-group').addClass('has-value');
  $form.find('input[name="'+field_base_name+'[buffer_after]"]').val(buffer_after).trigger('change').closest('.os-form-group').addClass('has-value');
  $form.find('input[name="'+field_base_name+'[service_id]"]').val(service_id).trigger('change').closest('.os-form-group').addClass('has-value');

  var duration_name = default_duration_name ? default_duration_name : (default_duration + ' ' + latepoint_helper.string_minutes);
  var options = '<option value="'+ default_duration +'">' + duration_name + '</option>';
  if(extra_durations.length){
    jQuery.each(extra_durations, function(index, value){
      var duration_name = value.name ? value.name : value.duration + ' ' + latepoint_helper.string_minutes;
      options+= '<option value="'+ value.duration +'">' + duration_name + '</option>';
    });
    $form.find('.os-service-durations').show();
  }else{
    $form.find('.os-service-durations').hide();
  }

  $form.find('.booking-total-attendees-selector-w .capacity-info strong').text(max_capacity);
  var attendees_options_html = '';
  for(var i=1;i<=max_capacity;i++){
    attendees_options_html+= '<option value="' + i + '">' + i + '</option>';
  }
  var selected_attendees = Math.min(jQuery('.booking-total-attendees-selector-w select').val(), max_capacity);
  $form.find('.booking-total-attendees-selector-w select').html(attendees_options_html).val(selected_attendees);
  if(max_capacity > 1){
    $form.find('.booking-total-attendees-selector-w').show();
  }else{
    $form.find('.booking-total-attendees-selector-w').hide();
  }

  $form.find('.os-service-durations select').html(options);

  latepoint_set_booking_end_time($form);
  if(jQuery('.quick-availability-per-day-w').length){
    latepoint_load_quick_availability($form.find('.trigger-quick-availability'));
  }

  latepoint_init_input_masks($form);
}

function latepoint_reload_balance_and_payments(){
  let $wrapper = jQuery('.balance-payment-info');
  $wrapper.closest('.balance-payment-wrapper').addClass('os-loading');
  let route_name = $wrapper.data('route');
  let $quick_edit_form = $wrapper.closest('form.order-quick-edit-form');
  let form_data = new FormData($quick_edit_form[0]);

  let data = { action: latepoint_helper.route_action, route_name: route_name, params: latepoint_formdata_to_url_encoded_string(form_data), return_format: 'json' }
  jQuery.ajax({
    type : "post",
    dataType : "json",
    url : latepoint_timestamped_ajaxurl(),
    data : data,
    success: function(response){
      $wrapper.closest('.balance-payment-wrapper').removeClass('os-loading');
      if(response.status === "success"){
        jQuery('.balance-payment-wrapper').html(response.message);
        latepoint_init_input_masks(jQuery('.balance-payment-wrapper'));
        latepoint_init_daterangepicker(jQuery('.balance-payment-wrapper .os-date-range-picker'));
        latepoint_init_payment_request_form(jQuery('.quick-order-form-w'));
      }else{
        alert(response.message);
      }
    }
  });
}



function latepoint_cancel_adding_new_order_item_to_quick_edit_form(){
  jQuery('.order-items-list').removeClass('is-blurred');
  jQuery('.new-order-item-list-bundles-wrapper').removeClass('is-open');
  jQuery('.new-order-item-variant-selector-wrapper').removeClass('is-open');
  jQuery('.order-form-add-item-btn').removeClass('is-cancelling').find('span').text(jQuery('.order-form-add-item-btn').data('add-label'));
}

function latepoint_build_new_booking_order_item(){
  jQuery('.order-form-add-item-btn').addClass('os-loading');
  latepoint_cancel_adding_new_order_item_to_quick_edit_form();
  let params = {}

  var data = {
    action: 'latepoint_route_call',
    route_name: jQuery('.order-form-add-item-btn').data('booking-form-route-name'),
    params: params,
    return_format: 'json'
  }
  jQuery.ajax({
    type : "post",
    dataType : "json",
    url : latepoint_timestamped_ajaxurl(),
    data : data,
    success: function(response){
      if(response.status === "success"){
        let $form = jQuery(response.message);
        jQuery('.order-items-list').prepend($form);
        jQuery('.order-form-add-item-btn').removeClass('os-loading');
        latepoint_init_booking_data_form(jQuery('.order-item-booking-data-form-wrapper[data-order-item-id="' + $form.data('order-item-id') + '"]'));
        // new item added, trigger change event
        latepoint_quick_order_items_changed();
      }else{
        alert(response.message, 'error');
      }
    }
  });
}

function latepoint_build_booking_data_form_for_bundle($slot_for_booking){
  $slot_for_booking.addClass('os-loading');
  latepoint_cancel_adding_new_order_item_to_quick_edit_form();
  let params = {}

  let is_booked = $slot_for_booking.hasClass('is-booked');

  var data = {
    action: 'latepoint_route_call',
    route_name: jQuery('.order-form-add-item-btn').data('booking-form-route-name'),
    params: {
      order_item_id: $slot_for_booking.data('order-item-id'),
      order_item_variant: $slot_for_booking.data('order-item-variant'),
      booking_id: $slot_for_booking.data('booking-id'),
      booking_item_data: is_booked ? $slot_for_booking.find('.booking_item_data').val() : $slot_for_booking.find('.unscheduled_booking_item_data').val()
    },
    return_format: 'json'
  }
  jQuery.ajax({
    type : "post",
    dataType : "json",
    url : latepoint_timestamped_ajaxurl(),
    data : data,
    success: function(response){
      if(response.status === "success"){
        let $form = jQuery(response.message);
        $slot_for_booking.removeClass('os-loading');
        if($slot_for_booking){
          $slot_for_booking.find('.scheduled-bundle-booking').html($form).closest('.order-item-variant-bundle-booking ').addClass('is-booked');
        }else{
          jQuery('.order-items-list').prepend($form);
        }
        latepoint_init_booking_data_form(jQuery('.order-item-booking-data-form-wrapper[data-order-item-id="' + $form.data('order-item-id') + '"][data-booking-id="' + $form.data('booking-id') + '"]'));
        // new item added, trigger change event
        if(!$slot_for_booking) latepoint_quick_order_items_changed();
      }else{
        alert(response.message, 'error');
      }
    }
  });
}

function latepoint_bundle_added_to_quick_order(){
  latepoint_quick_order_items_changed();
  latepoint_cancel_adding_new_order_item_to_quick_edit_form();
}

function latepoint_quick_order_items_changed(){
  latepoint_reload_price_breakdown();
}


function latepoint_fold_booking_data_form_in_order_quick_edit($booking_data_form){
  if(!$booking_data_form.length) return false;
  latepoint_close_quick_availability_form();
  latepoint_show_all_order_items();
  let order_item_id = $booking_data_form.data('order-item-id');
  let booking_id = $booking_data_form.data('booking-id');
  let order_item_variant = $booking_data_form.data('order-item-variant');


  $booking_data_form.addClass('is-loading');

  let form_data = new FormData(jQuery('.order-quick-edit-form')[0]);
  form_data.set('order_item_id', order_item_id);
  form_data.set('booking_id', booking_id);
  var data = {
    action: 'latepoint_route_call',
    route_name: jQuery('.order-form-add-item-btn').data('fold-booking-data-route-name'),
    params: latepoint_formdata_to_url_encoded_string(form_data),
    return_format: 'json'
  }
  jQuery.ajax({
    type : "post",
    dataType : "json",
    url : latepoint_timestamped_ajaxurl(),
    data : data,
    success: function(response){
      if(response.status === "success"){
        $booking_data_form.removeClass('is-loading').removeClass('is-unfolded').addClass('is-folded');
        if(order_item_variant == latepoint_helper.order_item_variant_bundle){
          $booking_data_form.closest('.order-item-variant-bundle-booking').addClass('is-booked');
          $booking_data_form.find('.bundle-booking-item-pill').replaceWith(response.message);
        }else{
          $booking_data_form.find('.order-item-pill').replaceWith(response.message);
        }
      }else{
        alert(response.message, 'error');
      }
    }
  });
}


function latepoint_init_booking_data_form($booking_data_form){
  latepoint_init_input_masks($booking_data_form);

  $booking_data_form.find('.fold-order-item-booking-data-form-btn').on('click', function(){
    latepoint_fold_booking_data_form_in_order_quick_edit($booking_data_form);
    return false;
  });

  $booking_data_form.find('.quick-booking-form-view-log-btn').on('click', function(){
    var $trigger_elem = jQuery(this);
    $trigger_elem.addClass('os-loading');
    var route = $trigger_elem.data('route');
    var data = { action: 'latepoint_route_call', route_name: route, params: {booking_id: $trigger_elem.data('booking-id')}, return_format: 'json' }
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(response){
        $trigger_elem.removeClass('os-loading');
        if(response.status === "success"){
          latepoint_display_in_side_sub_panel(response.message);
          jQuery('body').addClass('has-side-sub-panel');
        }else{
          alert(response.message, 'error');
        }
      }
    });
    return false;
  });


  $booking_data_form.find('.os-late-select').lateSelect();

  $booking_data_form.find('.trigger-quick-availability').on('click', function(){
    latepoint_load_quick_availability(jQuery(this));
    return false;
  });

  let field_base_name = 'order_items[' + $booking_data_form.data('order-item-id') +'][bookings][' + $booking_data_form.data('booking-id') +']';

  $booking_data_form.find('input[name="' + field_base_name +'[start_time][formatted_value]"]').on('change', function(){
    latepoint_set_booking_end_time($booking_data_form);
  });
  $booking_data_form.find('input[name="' + field_base_name +'[end_time][formatted_value]"]').on('change', function(){
    latepoint_is_next_day($booking_data_form);
  });



  $booking_data_form.on('change', '.agent-selector', function(){
    latepoint_apply_agent_selector_change($booking_data_form);
  });
  $booking_data_form.on('change', 'select[name="booking[location_id]"]', function(){
    latepoint_apply_agent_selector_change($booking_data_form);
  });
  $booking_data_form.on('change', 'select[name="booking[total_attendees]"]', function(){
    latepoint_apply_agent_selector_change($booking_data_form);
  });

  $booking_data_form.on('change', '.os-affects-duration', function(){
    latepoint_set_booking_end_time($booking_data_form);
    if(jQuery('.quick-availability-per-day-w').length){
      latepoint_load_quick_availability($booking_data_form.find('.trigger-quick-availability'));
    }
  });

  $booking_data_form.on('change', '.os-affects-price', function(){
    latepoint_reload_price_breakdown();
  });

  $booking_data_form.on('change', '.os-affects-balance', function(){
    latepoint_reload_balance_and_payments();
  });
  $booking_data_form.on('keyup', '.os-affects-balance', function(event){
    if(event.keyCode == 13) {
      latepoint_reload_balance_and_payments();
    }
  });


  $booking_data_form.on('click', '.services-options-list .service-option', function(){
    var selected_option_html = jQuery(this).html();
    var $selected_option = jQuery(this).closest('.os-services-select-field-w').find('.service-option-selected');
    $selected_option.html(selected_option_html)
                    .data('id', jQuery(this).data('id'))
                    .data('duration', jQuery(this).data('duration'))
                    .data('duration-name', jQuery(this).data('duration-name'))
                    .data('buffer-before', jQuery(this).data('buffer-before'))
                    .data('buffer-after', jQuery(this).data('buffer-after'))
                    .data('capacity-min', jQuery(this).data('capacity-min'))
                    .data('capacity-max', jQuery(this).data('capacity-max'))
                    .data('extra-durations', jQuery(this).data('extra-durations'));
    jQuery(this).closest('.os-services-select-field-w').find('.service-option.selected').removeClass('selected');
    jQuery(this).addClass('selected').closest('.os-services-select-field-w').removeClass('active');
    latepoint_apply_service_selector_change($booking_data_form);
    return false;
  });

  $booking_data_form.trigger('latepoint:initBookingDataForm');

}

function latepoint_init_payment_request_form($quick_order_form){
  $quick_order_form.find('select[name="payment_request[portion]"]').on('change', function(){
    if(jQuery(this).val() == 'custom'){
      $quick_order_form.find('.custom-charge-amount-wrapper').show();
    }else{
      $quick_order_form.find('.custom-charge-amount-wrapper').hide();
    }
  })
}

function latepoint_show_all_order_items(){
  let $quick_order_form = jQuery('.quick-order-form-w');
  $quick_order_form.find('.order-items-info-w').removeClass('show-preselected-only');
  $quick_order_form.find('.holds-preselected-booking').removeClass('holds-preselected-booking');
}

function latepoint_init_quick_order_form(){
  let $quick_order_form = jQuery('.quick-order-form-w');
  $quick_order_form.trigger('latepoint:initOrderEditForm');

  $quick_order_form.on('change', '.os-affects-balance', function(){
    latepoint_reload_balance_and_payments();
  });
  $quick_order_form.on('keyup', '.os-affects-balance', function(event){
    if(event.keyCode == 13) {
      latepoint_reload_balance_and_payments();
    }
  });

  latepoint_init_customer_inline_edit_form($quick_order_form.find('.customer-info-w'));
  $quick_order_form.find('.order-item-booking-data-form-wrapper').each(function(){
    latepoint_init_booking_data_form(jQuery(this));
  });

  latepoint_lightbox_close();
  latepoint_remove_floating_popup();
  latepoint_init_input_masks($quick_order_form);
  latepoint_init_daterangepicker($quick_order_form.find('.os-date-range-picker'));
  latepoint_init_payment_request_form($quick_order_form);

  // Transactions

  $quick_order_form.on('click', '.transaction-refund-settings-button', function(){
    jQuery(this).closest('.quick-add-transaction-box-w').addClass('show-refund-settings');
  });
  $quick_order_form.on('click', '.transaction-refund-submit-button', function(){
      let $trigger_elem = jQuery(this);
      if(confirm(jQuery(this).data('os-prompt'))){
        $trigger_elem.addClass('os-loading');
        let route = $trigger_elem.data('route');
        let data = { action: 'latepoint_route_call', route_name: route, params: $trigger_elem.closest('.refund-settings-fields').find('input, textarea, select').serialize(), return_format: 'json' }
        jQuery.ajax({
          type : "post",
          dataType : "json",
          url : latepoint_timestamped_ajaxurl(),
          data : data,
          success: function(response){
            $trigger_elem.removeClass('os-loading');
            if(response.status === "success"){
              $trigger_elem.closest('.quick-add-transaction-box-w').replaceWith(response.message);
              latepoint_reload_balance_and_payments();
            }else{
              alert(response.message, 'error');
            }
          }
        });
        return false;
      }
  });

  $quick_order_form.on('click', '.refund-settings-close', function(){
    jQuery(this).closest('.quick-add-transaction-box-w').removeClass('show-refund-settings');
  });
  $quick_order_form.on('change', '.refund-portion-selector', function(){
    if(jQuery(this).val() == 'full'){
      jQuery(this).closest('.refund-settings-fields').find('.custom-charge-amount-wrapper').hide();
    }else{
      jQuery(this).closest('.refund-settings-fields').find('.custom-charge-amount-wrapper').show();
    }
  });

  // Log

  $quick_order_form.find('.quick-order-form-view-log-btn').on('click', function(){
    var $trigger_elem = jQuery(this);
    $trigger_elem.addClass('os-loading');
    var route = $trigger_elem.data('route');
    var data = { action: 'latepoint_route_call', route_name: route, params: {order_id: $trigger_elem.data('order-id')}, return_format: 'json' }
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(response){
        $trigger_elem.removeClass('os-loading');
        if(response.status === "success"){
          latepoint_display_in_side_sub_panel(response.message);
          jQuery('body').addClass('has-side-sub-panel');
        }else{
          alert(response.message, 'error');
        }
      }
    });
    return false;
  });


  $quick_order_form.find('.new-order-item-variant-bundle').on('click', function(){
    $quick_order_form.find('.new-order-item-list-bundles-wrapper').toggleClass('is-open');
    $quick_order_form.find('.new-order-item-variant-selector-wrapper').toggleClass('is-open');
    return false;
  });




  $quick_order_form.find('.hidden-order-items-notice-link, .hidden-bundle-items-notice-link').on('click', function(e){
    latepoint_show_all_order_items();
    return false;
  });

  $quick_order_form.find('.order-quick-edit-form').on('submit', function(e){
    if(jQuery(this).find('button[type="submit"]').hasClass('os-loading')) return false;
    e.preventDefault();
    latepoint_submit_quick_order_form();
  });

  $quick_order_form.on("keydown", ":input:not(textarea):not(:submit)", function(event) {
    if (event.key == "Enter") {
        event.preventDefault();
    }
  });

  $quick_order_form.find('.order-items-list').on('click', '.remove-order-item-btn', function(){
    latepoint_close_quick_availability_form();
    if(confirm(jQuery(this).data('os-prompt'))){
      if(jQuery(this).closest('.order-item-variant-bundle-booking-wrapper').length){
        // it's a bundle booking
        // need to figure out how to remove it when bundle
        jQuery(this).closest('.order-item-variant-bundle-booking').removeClass('is-booked').find('.scheduled-bundle-booking').html('');
      }else{
        jQuery(this).closest('.order-item').remove();
        jQuery(this).closest('.order-item-booking-data-form-wrapper').remove();

      }
      latepoint_quick_order_items_changed();
    }
    return false;
  });

  $quick_order_form.find('.new-order-item-variant-booking').on('click', function(){
    latepoint_fold_all_open_booking_data_forms();
    latepoint_build_new_booking_order_item();
  });

  $quick_order_form.on('click', '.order-item-pill.order-item-pill-variant-booking', function(){
    jQuery(this).closest('.order-item-booking-data-form-wrapper').removeClass('is-folded').addClass('is-unfolded');
    return false;
  });

  $quick_order_form.on('click', '.bundle-booking-item-pill', function(){
    jQuery(this).closest('.order-item-booking-data-form-wrapper').removeClass('is-folded').addClass('is-unfolded');
    return false;
  });

  $quick_order_form.on('click', '.unscheduled-bundle-booking', function(){
    latepoint_build_booking_data_form_for_bundle(jQuery(this).closest('.order-item-variant-bundle-booking'));
  });


  $quick_order_form.find('.order-form-add-item-btn').on('click', function(){
    let $booking_data_forms = jQuery('.order-item-booking-data-form-wrapper');
    $booking_data_forms.each(function(){
      latepoint_fold_booking_data_form_in_order_quick_edit(jQuery(this));
    });
    if(jQuery(this).hasClass('is-cancelling')){
      latepoint_cancel_adding_new_order_item_to_quick_edit_form();
    }else{
      if(jQuery('.new-order-item-variant-selector-wrapper').length){
        jQuery('.order-items-list').addClass('is-blurred');
        jQuery('.new-order-item-variant-selector-wrapper').addClass('is-open');
        jQuery(this).addClass('is-cancelling').find('span').text(jQuery(this).data('cancel-label'));
      }else{
        // no bundles exist, create booking form
        latepoint_cancel_adding_new_order_item_to_quick_edit_form();
        latepoint_build_new_booking_order_item();
      }
    }
    return false;
  });


  $quick_order_form.on('click', '.order-item-variant-bundle .bundle-icon', function(){
    jQuery(this).closest('.order-item-variant-bundle').toggleClass('is-open');
    return false;
  });

  $quick_order_form.find('.reload-price-breakdown').on('click', function(){
    latepoint_reload_price_breakdown();
    return false;
  });

  $quick_order_form.on('click', '.trigger-remove-transaction-btn', function(){
    jQuery(this).closest('.quick-add-transaction-box-w').remove();
    return false;
  });


  $quick_order_form.trigger('latepoint:initQuickOrderForm');
}

function latepoint_fold_all_open_booking_data_forms(){
  let $booking_data_forms = jQuery('.order-item-booking-data-form-wrapper');
  $booking_data_forms.each(function(){
    latepoint_fold_booking_data_form_in_order_quick_edit(jQuery(this));
  });
}

function latepoint_init_customer_inline_edit_form($customer_form){

  latepoint_init_input_masks($customer_form);

  $customer_form.find('.customers-selector-search-input').on('keyup',function(){
    var $queryInput = jQuery(this);
    var query = $queryInput.val().toLowerCase();
    if(query == $queryInput.data('current-query')) return;

    // Search
    $queryInput.closest('.customers-selector-search-w').addClass('os-loading');
    $queryInput.data('searching-query', query);
    setTimeout(function(){
      if(query != jQuery('.customers-selector-search-input').data('searching-query')) return;
      var data = { action: latepoint_helper.route_action, route_name: $queryInput.data('route'), params: {query: query}, return_format: 'json' }
      jQuery.ajax({
        type : "post",
        dataType : "json",
        url : latepoint_timestamped_ajaxurl(),
        data : data,
        success: function(response){
          if($queryInput.data('searching-query') != query) return;
          $queryInput.closest('.customers-selector-search-w').removeClass('os-loading');
          if(response.status === "success"){
            $queryInput.data('current-query', query);
            jQuery('.quick-order-form-w .customers-options-list').html(response.message);
          }else{
            // console.log(response.message);
          }
        }
      });
    }, 300, query, $queryInput);
 });

}


function latepoint_load_quick_availability($trigger_elem, custom_agent_id = false, start_date = false, load_more_days = false, load_prev_days = false){
  $trigger_elem.addClass('os-loading');

  let $booking_form = $trigger_elem.closest('.order-item-booking-data-form-wrapper');
  var route = $booking_form.find('.trigger-quick-availability').data('route');
  var $quick_order_form = jQuery('.quick-order-form-w');

  if(custom_agent_id) $quick_order_form.find('.agent-selector').val(custom_agent_id);
  if(!$quick_order_form.find('.service-selector').val() || $quick_order_form.find('.service-selector').val() == '0'){
    $quick_order_form.find('.os-services-select-field-w .service-option:first').trigger('click');
  }

  let form_data = new FormData($quick_order_form.find('form')[0]);


  form_data.set('trigger_form_booking_id', $booking_form.data('booking-id'));
  form_data.set('trigger_form_order_item_id', $booking_form.data('order-item-id'));

  if(start_date) form_data.set('start_date', start_date);
  if(load_more_days || load_prev_days) form_data.set('show_days_only', true);
  if(load_prev_days) form_data.set('previous_days', true);

  var data = {
    action: latepoint_helper.route_action,
    route_name: route,
    params: latepoint_formdata_to_url_encoded_string(form_data),
    return_format: 'json'
  }

  jQuery.ajax({
    type : "post",
    dataType : "json",
    url : latepoint_timestamped_ajaxurl(),
    data : data,
    success: function(response){
      $trigger_elem.removeClass('os-loading');
      if(response.status === "success"){
        if(load_more_days){
          jQuery('.latepoint-side-panel-w .quick-availability-per-day-w').html(response.message);
        }else if(load_prev_days){
          jQuery('.latepoint-side-panel-w .quick-availability-per-day-w').html(response.message);
          jQuery('.latepoint-side-panel-w .os-availability-days').scrollTop(30);
        }else{
          latepoint_display_in_side_sub_panel(response.message);
          jQuery('.latepoint-side-panel-w .os-availability-days').scrollTop(30);
          jQuery('body').addClass('has-side-sub-panel');
          latepoint_init_quick_availability_form();
        }
      }else{
        alert(response.message, 'error');
      }
    }
  });
}

function latepoint_create_field_base_name(order_item_id, booking_id){
  return 'order_items['+order_item_id+'][bookings]['+booking_id+']';
}

function latepoint_close_quick_availability_form(){
  jQuery('.quick-availability-per-day-w').remove();
  jQuery('body').removeClass('has-side-sub-panel');
}

function latepoint_init_quick_availability_form(){
  // TODO set booking ID
  let $quick_availability_wrapper = jQuery('.quick-availability-per-day-w');

  let trigger_form_order_item_id = $quick_availability_wrapper.data('trigger-form-order-item-id');
  let trigger_form_booking_id = $quick_availability_wrapper.data('trigger-form-booking-id');

  let field_base_name = latepoint_create_field_base_name(trigger_form_order_item_id, trigger_form_booking_id);

  let $booking_data_form = jQuery('.quick-order-form-w .order-item-booking-data-form-wrapper[data-booking-id="'+trigger_form_booking_id+'"]');

  var selected_start_date = $booking_data_form.find('input[name="'+field_base_name+'[start_date_formatted]"').val();
  var selected_start_time = $booking_data_form.find('input[name="'+field_base_name+'[start_time][formatted_value]"]').val();
  var selected_start_time_ampm = $booking_data_form.find('input[name="'+field_base_name+'[start_time][ampm]"]').val();


  var selected_start_time_minutes = latepoint_hours_and_minutes_to_minutes(selected_start_time, selected_start_time_ampm);
  $quick_availability_wrapper.find('.os-availability-days').find('.agent-timeslot[data-formatted-date="'+ selected_start_date +'"][data-minutes="' + selected_start_time_minutes + '"]').addClass('selected');
  $quick_availability_wrapper.on('click', '.load-more-quick-availability', function(){
    jQuery(this).addClass('os-loading');
    let booking_form_id = jQuery(this).closest('.quick-availability-per-day-w').data('trigger-form-booking-id');
    let $trigger_btn = jQuery('.order-item-booking-data-form-wrapper[data-booking-id="' + booking_form_id + '"]').find('.trigger-quick-availability');
    latepoint_load_quick_availability($trigger_btn, false, jQuery(this).data('start-date'), true);
    return false;
  });
  $quick_availability_wrapper.on('click', '.load-prev-quick-availability', function(){
    jQuery(this).addClass('os-loading');
    let booking_form_id = jQuery(this).closest('.quick-availability-per-day-w').data('trigger-form-booking-id');
    let $trigger_btn = jQuery('.order-item-booking-data-form-wrapper[data-booking-id="' + booking_form_id + '"]').find('.trigger-quick-availability');
    latepoint_load_quick_availability($trigger_btn, false, jQuery(this).data('start-date'), false, true);
    return false;
  });
  $quick_availability_wrapper.find('select[name="booking[agent_id]"]').on('change', function(){
    latepoint_load_quick_availability(jQuery('.trigger-quick-availability'), jQuery(this).val());
  });
  jQuery('.os-time-group label').on('click', function(){
    jQuery(this).closest('.os-time-group').find('.os-form-control').trigger('focus');
  });
  $quick_availability_wrapper.on('click', '.fill-booking-time', function(){
    jQuery('.os-availability-days .agent-timeslot.selected').removeClass('selected');
    jQuery(this).addClass('selected');
    var formatted_date = jQuery(this).data('formatted-date');
    var minutes = jQuery(this).data('minutes');
    $booking_data_form.find('input[name="'+field_base_name+'[start_date_formatted]"]').val(formatted_date);
    var start_minutes = minutes;
    var start_hours_and_minutes = latepoint_minutes_to_hours_and_minutes(start_minutes);

    if(start_minutes >= 720){
      $booking_data_form.find('.quick-start-time-w .time-pm').trigger('click');
    }else{
      $booking_data_form.find('.quick-start-time-w .time-am').trigger('click');
    }

    $booking_data_form.find('input[name="'+field_base_name+'[start_time][formatted_value]"]').val(start_hours_and_minutes);
    latepoint_set_booking_end_time($booking_data_form);
    $booking_data_form.find('.ws-period, .as-period').addClass('animate-filled-in');
    setTimeout(function(){
      $booking_data_form.find('.ws-period, .as-period').removeClass('animate-filled-in');
    }, 500)
  });
}


function latepoint_reload_after_order_save(){
  latepoint_reload_calendar_view();

  jQuery('.os-widget').each(function(){
    latepoint_reload_widget(jQuery(this));
  });
  if(jQuery('table.os-reload-on-booking-update').length) latepoint_filter_table(jQuery('table.os-reload-on-booking-update'), jQuery('table.os-reload-on-booking-update'));
  latepoint_close_side_panel();
}

/*
 * Copyright (c) 2024 LatePoint LLC. All rights reserved.
 */

class LatepointStripeConnectAdmin {

	// Init
	constructor(){
		this.ready();
	}

	ready() {
    jQuery(document).ready(() => {
      jQuery('.stripe-connect-status-wrapper').on('click', '.payment-start-connecting', function(){
        let $link = jQuery(this);
        $link.addClass('os-loading');
        var data = {
          action: 'latepoint_route_call',
          route_name: $link.data('route-name'),
          params: { env: $link.data('env') },
          layout: 'none',
          return_format: 'json'
        }
        jQuery.ajax({
          type : "post",
          dataType : "json",
          url : latepoint_timestamped_ajaxurl(),
          data : data,
          success: (data) => {
            window.location.href = data.url;
          }
        });
        return false;
      });

      if(jQuery('.stripe-connect-status-wrapper').length){
        jQuery('.stripe-connect-status-wrapper').each((index, elem) => {
          let $wrapper = jQuery(elem);
          var data = {
            action: 'latepoint_route_call',
            route_name: $wrapper.data('route-name'),
            params: { env: $wrapper.data('env') },
            layout: 'none',
            return_format: 'json'
          }
          jQuery.ajax({
            type : "post",
            dataType : "json",
            url : latepoint_timestamped_ajaxurl(),
            data : data,
            success: (data) => {
              this.reload_connect_status_wrapper($wrapper, data);
            }
          });
        })
      }
    });
  }


  reload_connect_status_wrapper($elem, data){
    if(data.status === 'success'){
      if($elem.hasClass('.stripe-connect-status-wrapper')){
        $elem.html(data.message);
      }else{
        $elem.closest('.stripe-connect-status-wrapper').html(data.message);
      }
    }else{
      alert(data.message);
    }
  }


}


window.latepointStripeConnectAdmin = new LatepointStripeConnectAdmin();

/*
 * Copyright (c) 2022 LatePoint LLC. All rights reserved.
 */

// @codekit-prepend "bin/time.js";
// @codekit-prepend "bin/lateselect.js";
// @codekit-prepend "bin/latecheckbox.js";
// @codekit-prepend "bin/actions.js";
// @codekit-prepend "bin/notifications.js";
// @codekit-prepend "bin/shared.js";
// @codekit-prepend "bin/admin/updates.js";
// @codekit-prepend "bin/admin/main.js";
// @codekit-prepend "bin/admin/_agents.js";
// @codekit-prepend "bin/admin/_customers.js";
// @codekit-prepend "bin/admin/_chart.js";
// @codekit-prepend "bin/admin/_calendar.js";
// @codekit-prepend "bin/admin/_processes.js";
// @codekit-prepend "bin/admin/_steps.js";
// @codekit-prepend "bin/admin/_orders.js";
// @codekit-prepend "bin/admin/_stripe_connect.js";



// DOCUMENT READY
jQuery(document).ready(function( $ ) {


  // DASHBOARD
  latepoint_init_calendars();
  latepoint_init_circles_charts();
  latepoint_init_donut_charts();
  latepoint_init_daily_bookings_chart();
  latepoint_init_element_togglers();
  latepoint_init_daterangepicker(jQuery('.os-date-range-picker'));
  latepoint_init_monthly_view();
  latepoint_init_form_blocks();
  latepoint_init_reminders_form();
  latepoint_init_coupons_form();
  latepoint_init_copy_on_click_elements();
  latepoint_init_side_menu();
  latepoint_init_color_picker();
  latepoint_init_clickable_cells();
  latepoint_init_input_masks();
  latepoint_init_process_forms();
  latepoint_init_sticky_side_menu();
  latepoint_init_sortable_columns();
  latepoint_init_accordions();
  latepoint_init_default_form_fields_settings();
  latepoint_init_steps_settings();
  latepoint_init_booking_form_preview();

  latepoint_init_version5_intro();

  jQuery(document).on({
    mouseenter: function () {
      let $elem = jQuery(this);
      let offset = $elem.offset();
      jQuery('body > .late-tooltip').remove();
      let $popup = jQuery('<div/>').addClass('late-tooltip').text($elem.data('late-tooltip')).appendTo(jQuery('body'));
      $popup.css('top', offset.top - 2);
      $popup.css('left', offset.left + $elem.outerWidth() / 2);
      return false;
    },
    mouseleave: function () {
      jQuery('body > .late-tooltip').remove();
    }
  }, "[data-late-tooltip]");

  jQuery('body').on('click', '.disabled-items-open-trigger', function(){
    jQuery('.disabled-items-wrapper').toggleClass('is-open');
    return false;
  });

  jQuery('body').on('click', '.latepoint-side-panel-close', function(){
    jQuery('.side-sub-panel-wrapper').remove();
    return false;
  });

  jQuery('#settings_list_of_phone_countries').on('change', function(){
    if(jQuery(this).val() == latepoint_helper.value_all){
      jQuery('.select-phone-countries-wrapper').hide();
    }else{
      jQuery('.select-phone-countries-wrapper').show();
    }
  });

  jQuery('.os-select-all-toggler').on('change', function(){
    var $connection_wrappers = jQuery(this).closest('.white-box').find('.os-complex-connections-selector .connection');
    if(jQuery(this).is(':checked')){
      latepoint_complex_selector_select($connection_wrappers);
    }else{
      latepoint_complex_selector_deselect($connection_wrappers);
    }
    return false;
  });


  jQuery('.os-main-location-selector').on('change', function(){
    var route = jQuery(this).data('route');
    var params = 'id=' + jQuery(this).val();
    var data = { action: latepoint_helper.route_action, route_name: route, params: params, layout: 'none', return_format: 'json' };
    jQuery('.latepoint-content-w').addClass('os-loading');
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(data){
        location.reload();
      }
    });
  });

  jQuery('.os-service-durations-w').on('click', '.os-remove-duration', function(){
    jQuery(this).closest('.duration-box').slideUp(300, function(){
      jQuery(this).remove();
    });
    return false;
  });


  jQuery('.menu-color-toggler').on('click', function(){
    jQuery('.latepoint-side-menu-w').toggleClass('dark');
    return false;
  });


  jQuery('.latepoint-mobile-top-menu-trigger').on('click', function(){
    jQuery(this).closest('.latepoint-all-wrapper').toggleClass('os-show-mobile-menu');
    if(jQuery(this).closest('.latepoint-all-wrapper').hasClass('os-show-mobile-menu')){
      jQuery('.latepoint-side-menu-w ul.side-menu > li.has-children > a').on('click', function(){
        jQuery(this).closest('li').toggleClass('menu-item-sub-open-mobile');
        return false;
      });
    }else{
      jQuery('.latepoint-side-menu-w ul.side-menu > li.has-children > a').off('click');
    }
    return false;
  });

  jQuery('.latepoint-mobile-top-search-trigger-cancel').on('click', function(){
    jQuery(this).closest('.latepoint-all-wrapper').removeClass('os-show-mobile-search');
    return false;
  });

  jQuery('.latepoint-mobile-top-search-trigger').on('click', function(){
    jQuery(this).closest('.latepoint-all-wrapper').toggleClass('os-show-mobile-search');
    if(jQuery(this).closest('.latepoint-all-wrapper').hasClass('os-show-mobile-search')){
      jQuery('.latepoint-top-search').trigger('focus');
    }
    return false;
  });


  jQuery('.latepoint-side-menu-w').on('click', '.top-user-info-toggler', function(){
    jQuery('.latepoint-user-info-dropdown').toggleClass('os-visible');
    return false;
  });

  jQuery('.latepoint-content').on('click', '.mobile-calendar-actions-trigger', function(){
    jQuery(this).closest('.calendar-mobile-controls').toggleClass('os-show-actions');
    return false;
  });

  jQuery('.latepoint-content').on('click', '.os-widget-header-actions-trigger', function(){
    jQuery(this).closest('.os-widget-header').toggleClass('os-show-actions');
    return false;
  });

  jQuery('.latepoint-content').on('click', '.mobile-table-actions-trigger', function(){
    jQuery(this).closest('.os-pagination-w').toggleClass('os-show-actions');
    return false;
  });



  


  jQuery('.download-csv-with-filters').on('click', function(){
    var filter_params = jQuery(this).closest('.table-with-pagination-w').find('.os-table-filter').serialize();
    filter_params+= '&download=csv';
    jQuery(this).attr('href', this.href + '&' + filter_params);
  });

  jQuery('select.pagination-page-select').on('change', function(){
    latepoint_filter_table(jQuery(this).closest('.table-with-pagination-w').find('table'), jQuery(this).closest('.pagination-page-select-w'), false);
  });

  jQuery('select.os-table-filter').on('change', function(){
    latepoint_filter_table(jQuery(this).closest('table'), jQuery(this).closest('.os-form-group'));
  });

  jQuery('input.os-table-filter').on('keyup', function(){
    latepoint_filter_table(jQuery(this).closest('table'), jQuery(this).closest('.os-form-group'));
  });


  jQuery('.customize-connection-btn').on('click', function(){
    jQuery(this).closest('.connection').toggleClass('show-customize-box');
    return false;
  });

  jQuery('.connection-children-list').on('click', 'li', function(){
    if(jQuery(this).hasClass('active')){
      jQuery(this).removeClass('active');
      jQuery(this).find('input.connection-child-is-connected').val('no');
    }else{
      jQuery(this).addClass('active');
      jQuery(this).find('input.connection-child-is-connected').val('yes');
    }
    latepoint_count_active_connections(jQuery(this).closest('.connection'));
    return false;
  });

  jQuery('.display-toggler-control').on('change', function(){
    let group = jQuery(this).data('toggler-group');
    let key = jQuery(this).val();
    jQuery('.display-toggler-target[data-toggler-group="' + group + '"]').hide();
    jQuery('.display-toggler-target[data-toggler-group="' + group + '"][data-toggler-key="'+ key +'"]').show();
    return false;
  });

  jQuery('.add-item-category-trigger').on('click', function(){
    jQuery('.add-item-category-box').toggle();
    jQuery('.os-new-item-category-form-w').toggle();
    return false;
  });

  jQuery('.latepoint-top-search').on('keyup', function(event){
    var $wrapper = jQuery(this).closest('.latepoint-top-search-w');
    $wrapper.addClass('os-loading');
    var query = jQuery(this).val();
    if(event.keyCode == 27){
      $wrapper.removeClass('typing');
      jQuery('.latepoint-top-search-results-w').html('');
      jQuery(this).val('');
      $wrapper.removeClass('os-loading');
      return;
    }
    if(query == ''){
      $wrapper.removeClass('typing');
      jQuery('.latepoint-top-search-results-w').html('');
      $wrapper.removeClass('os-loading');
      return;
    }
    var route = jQuery(this).data('route');
    var params = 'query=' + query;
    var data = { action: latepoint_helper.route_action, route_name: route, params: params, layout: 'none', return_format: 'json' };
    $wrapper.addClass('typing');
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(data){
        if(!$wrapper.hasClass('typing')) return;
        $wrapper.removeClass('os-loading');
        if(data.status === "success"){
          jQuery('.latepoint-top-search-results-w').html(data.message);
        }else{
          // console.log(data.message);
        }
      }
    });
  });


  jQuery('.appointment-status-selector').on('click', function(e){
    e.stopPropagation();
  });

  jQuery('.latepoint-show-license-details').on('click', function(e){
    jQuery(this).closest('.active-license-info').find('.license-info-w').slideToggle(200);
    return false;
  });

  jQuery('.aba-button-w').on('click', function(e){
    e.stopPropagation();
    var confirm_message = (jQuery(this).hasClass('aba-approve')) ? latepoint_helper.approve_confirm : latepoint_helper.reject_confirm;
    if(confirm(confirm_message)){
      var $box = jQuery(this).closest('.appointment-box-large');
      $box.find('.appointment-status-selector select').val(jQuery(this).data('status')).trigger('change');
    }
    return false;
  });



  jQuery('.appointment-status-selector select').on('change', function(e){
    var $wrapper = jQuery(this).closest('.appointment-status-selector');
    var route = $wrapper.data('route');
    var nonce = $wrapper.data('wp-nonce');
    var booking_id = $wrapper.data('booking-id');
    var status = jQuery(this).val();
    jQuery(this).closest('.appointment-box-large').attr('class', 'appointment-box-large status-' + status);
    var params = 'id=' + booking_id + '&status=' + status + '&_wpnonce=' + nonce;
    var data = { action: latepoint_helper.route_action, route_name: route, params: params, layout: 'none', return_format: 'json' };
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(data){
        if(data.status === "success"){
          latepoint_add_notification(data.message);
        }else{
          latepoint_add_notification(data.message, 'error');
          // console.log(data.message);
        }
      }
    });
  });

  jQuery('body').on('click', '.open-template-variables-panel', function(){
    jQuery('.latepoint-template-variables').toggleClass('is-visible');
    return false;
  });

  jQuery('body').on('click', '.close-template-variables-panel', function(){
    jQuery('.latepoint-template-variables').removeClass('is-visible');
    return false;
  });

  jQuery('body').on('click', '.open-layout-template-variables-panel', function(){
    jQuery('.latepoint-layout-template-variables').toggleClass('is-visible');
    return false;
  });

  jQuery('body').on('click', '.close-layout-template-variables-panel', function(){
    jQuery('.latepoint-layout-template-variables').removeClass('is-visible');
    return false;
  });

  jQuery('body').on('click', '.os-notifications .os-notification-close', function(){
    jQuery(this).closest('.item').remove();
    return false;
  });


  jQuery('body').on('keyup', '.os-form-group .os-form-control', function(){
    if(jQuery(this).val()){
      jQuery(this).closest('.os-form-group').addClass('has-value');
    }else{
      jQuery(this).closest('.os-form-group').removeClass('has-value');
    }
  });



  jQuery('.os-wizard-setup-w, .latepoint-settings-w, .custom-schedule-wrapper').on('click', '.ws-head', function(){
    var $schedule_wrapper = jQuery(this).closest('.weekday-schedule-w');
    $schedule_wrapper.toggleClass('is-editing').removeClass('day-off');
    $schedule_wrapper.find('.os-toggler').removeClass('off');
    $schedule_wrapper.find('input.is-active').val(1);
  });


  jQuery('.latepoint').on('click', '.wizard-add-edit-item-trigger', function(e){
    jQuery(this).addClass('os-loading');
    var add_item_route_name = jQuery(this).data('route');
    var item_info = {  };
    if(jQuery(this).data('id')){
      item_info.id = jQuery(this).data('id');
    }
    var data = { action: latepoint_helper.route_action, route_name: add_item_route_name, params: item_info, layout: 'none', return_format: 'json' };
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(data){
        jQuery('.wizard-add-edit-item-trigger.os-loading').removeClass('os-loading');
        if(data.status === "success"){
          jQuery('.os-wizard-step-content-i').html(data.message);
          jQuery('.os-wizard-setup-w').addClass('is-sub-editing');
          jQuery('.os-wizard-footer').hide();
          latepoint_init_wizard_content();
        }else{
          // console.log(data.message);
        }
      }
    });
  });




  // WIZARD NEXT BUTTON CLICK LOGIC
  jQuery('.latepoint').on('click', '.latepoint-pro-link-subtle', function(){
    jQuery('.pro-premium-features-list-wrapper').slideDown(200);
    jQuery('.pro-feature-banner').addClass('is-open');
    jQuery(this).hide();
    return false;
  });

  jQuery('.latepoint').on('click', '.os-wizard-trigger-next-btn', function(){
    var $next_btn = jQuery(this);
    $next_btn.addClass('os-loading');
    var current_step_code = jQuery('#wizard_current_step_code').val();
    var params = 'current_step_code='+current_step_code;

    // work periods step
    if(jQuery('.os-wizard-setup-w form.weekday-schedules-w').length){
      params+= '&'+ jQuery('.os-wizard-setup-w form.weekday-schedules-w .weekday-schedule-w:not(.day-off) input').serialize();
    }
    // agent/notifications step
    if(jQuery('.os-wizard-default-agent-form').length){
      params+= '&'+ jQuery('.os-wizard-default-agent-form input').serialize();

      var $form = $('.os-wizard-default-agent-form');
      var form_data = new FormData($form[0]);
      form_data.set('current_step_code', current_step_code);

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
      params = latepoint_formdata_to_url_encoded_string(form_data);
    }

    var data = {
      action: latepoint_helper.route_action,
      route_name: jQuery(this).data('route-name'),
      params: params,
      layout: 'none',
      return_format: 'json'};
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(data){
        $next_btn.removeClass('os-loading');
        if(data.status === "success"){
          jQuery('#wizard_current_step_code').val(data.step_code);
          jQuery('.os-wizard-setup-w').attr('class', 'os-wizard-setup-w step-' + data.step_code);
          jQuery('.os-wizard-step-content').html(data.message);
          latepoint_init_wizard_content();
          if(data.show_prev_btn){
            jQuery('.os-wizard-prev-btn').show();
          }else{
            jQuery('.os-wizard-prev-btn').hide();
          }
          if(data.show_next_btn){
            jQuery('.os-wizard-next-btn').show();
          }else{
            jQuery('.os-wizard-next-btn').hide();
          }
          if(!data.show_next_btn && !data.show_prev_btn){
            jQuery('.os-wizard-footer').hide();
          }else{
            jQuery('.os-wizard-footer').show();
          }
        }
      }
    });
    return false;
  });

  // WIZARD PREV BUTTON CLICK LOGIC
  jQuery('.latepoint').on('click', '.os-wizard-trigger-prev-btn', function(){
    var $prev_btn = jQuery(this);
    $prev_btn.addClass('os-loading');
    var current_step_code = jQuery('#wizard_current_step_code').val();
    var params = 'current_step_code='+current_step_code;
    var data = { action: latepoint_helper.route_action, route_name: jQuery(this).data('route-name'), params: params, layout: 'none', return_format: 'json'};
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(data){
        $prev_btn.removeClass('os-loading');
        if(data.status === "success"){
          jQuery('#wizard_current_step_code').val(data.step_code);
          jQuery('.os-wizard-setup-w').attr('class', 'os-wizard-setup-w step-' + data.step_code);
          jQuery('.os-wizard-step-content').html(data.message);
          latepoint_init_wizard_content();
          if(data.show_prev_btn){
            jQuery('.os-wizard-prev-btn').show();
          }else{
            jQuery('.os-wizard-prev-btn').hide();
          }
          if(data.show_next_btn){
            jQuery('.os-wizard-next-btn').show();
          }else{
            jQuery('.os-wizard-next-btn').hide();
          }
          if(!data.show_next_btn && !data.show_prev_btn){
            jQuery('.os-wizard-footer').hide();
          }else{
            jQuery('.os-wizard-footer').show();
          }
        }
      }
    });
    return false;
  });

  jQuery('.latepoint-content-w').on('change', '.os-widget .os-trigger-reload-widget', function(){
    latepoint_reload_widget(jQuery(this).closest('.os-widget'));
  });

  jQuery('.latepoint-content-w').on('click', '.os-widget .timeline-type-toggle .timeline-type-option', function(){
    jQuery(this).closest('.timeline-type-toggle').find('.timeline-type-option.active').removeClass('active');
    jQuery(this).addClass('active');
    jQuery('.timeline-and-availability-contents').removeClass('shows-appointments shows-availability').addClass('shows-' + jQuery(this).data('value'));
    jQuery('#' + jQuery(this).closest('.timeline-type-toggle').data('value-holder-id')).val(jQuery(this).data('value'));
  });


  dragula([].slice.apply(document.querySelectorAll('.os-categories-ordering-w .os-category-children')), {
    moves: function (el, container, handle) {
      return (handle.classList.contains('os-category-drag') || handle.classList.contains('os-category-item-drag'));
    },
  }).on('drop', function(el){
    var $categories_wrapper = jQuery('.os-categories-ordering-w');
    var category_datas = [];
    var item_datas = [];

    $categories_wrapper.find('.os-category-parent-w').each(function(index){
      var order_number = jQuery(this).index() + 1;
      var parent_id = jQuery(this).parent().closest('.os-category-parent-w').data('id') || 0;
      category_datas.push({id: jQuery(this).data('id'), order_number: order_number, parent_id: parent_id});
    });
    $categories_wrapper.find('.item-in-category-w').each(function(index){
      var item_order_number = jQuery(this).index() + 1;
      var category_id = jQuery(this).closest('.os-category-parent-w').data('id') || 0;
      item_datas.push({id: jQuery(this).data('id'), order_number: item_order_number, category_id: category_id});
    });
    latepoint_recalculate_items_count_in_category();
    var data = { action: latepoint_helper.route_action, route_name: $categories_wrapper.data('category-order-update-route'), params: {category_datas: category_datas, item_datas: item_datas}, return_format: 'json' }
    $categories_wrapper.addClass('os-loading');
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(response){
        $categories_wrapper.removeClass('os-loading');
        if(response.status === "success"){
          // latepoint_add_notification(response.message);
        }else{
          alert(response.message);
        }
      }
    });
  });


  // Universal re-ordering dragging for form blocks
  dragula([jQuery('.os-draggable-form-blocks')[0]], {
    moves: function (el, container, handle) {
      return handle.classList.contains('os-form-block-drag');
    },
  }).on('drop', function(el){
    var blocks_order_data = {};
    var $draggable_form_blocks_wrapper = jQuery('.os-draggable-form-blocks');
    $draggable_form_blocks_wrapper.find('.os-form-block').each(function(index){
      var new_order_number = jQuery(this).index() + 1;
      var $block_model_id = jQuery(this).find('.os-form-block-id');
      if($block_model_id.length && $block_model_id.val()) blocks_order_data[$block_model_id.val()] = new_order_number;
    });
    var data = { action: latepoint_helper.route_action,
                  route_name: $draggable_form_blocks_wrapper.data('order-update-route'),
                  params: {ordered_fields: blocks_order_data,
                  fields_for: $draggable_form_blocks_wrapper.data('fields-for')},
                  return_format: 'json' } 
    $draggable_form_blocks_wrapper.addClass('os-loading');
    jQuery.ajax({
      type : "post",
      dataType : "json",
      url : latepoint_timestamped_ajaxurl(),
      data : data,
      success: function(response){
        $draggable_form_blocks_wrapper.removeClass('os-loading');
      }
    });
  });


  jQuery('body.latepoint-admin').on('click', '.os-category-edit-btn, .os-category-edit-cancel-btn, .os-category-w .os-category-name', function(){
    jQuery(this).closest('.os-category-w').toggleClass('editing');
    return false;
  });

  jQuery('body.latepoint-admin').on('click', '.step-edit-btn, .step-edit-cancel-btn, .step-w .step-head', function(){
    jQuery(this).closest('.step-w').toggleClass('editing');
    return false;
  });
    
  jQuery('body.latepoint-admin').on('click', '.agent-info-change-agent-btn', function(){
    jQuery(this).closest('.agent-info-w').removeClass('selected').addClass('selecting');
    return false;
  });
  
  jQuery('body.latepoint-admin').on('click', '.agent-info-change-agent-btn', function(){
    jQuery(this).closest('.agent-info-w').removeClass('selected').addClass('selecting');
    return false;
  });
  

  jQuery('body.latepoint-admin').on('click', '.customer-info-create-btn', function(){
    jQuery(this).closest('.customer-info-w').removeClass('selecting').addClass('selected');
    return false;
  });

  jQuery('body.latepoint-admin').on('click', '.customer-info-load-btn', function(){
    jQuery(this).closest('.customer-info-w').removeClass('selected').addClass('selecting').find('.customers-selector-search-input').trigger('focus');
    return false;
  });

  jQuery('body.latepoint-admin').on('click', '.customers-selector-cancel', function(){
    jQuery(this).closest('.customer-info-w').removeClass('selecting').addClass('selected ');
    jQuery('.customers-options-list .customer-option').show();
    jQuery('.customers-selector-search-input').val('');
    return false;
  });

  // CUSTOMER SELECTOR

  // SERVICES SELECTOR
  jQuery('body.latepoint-admin').on('click', '.service-option-selected', function(){
    var $select = jQuery(this).closest('.os-services-select-field-w');
    if($select.hasClass('active')){
      $select.removeClass('active');
    }else{
      $select.addClass('active').find('input').trigger('focus');
    }
    return false;
  });


  jQuery('body.latepoint-admin').on('keyup', '.service-options-filter-input', function(){
    var $list = jQuery(this).closest('.services-options-list');
    var text = jQuery(this).val().toLowerCase();
    $list.find('.service-option').hide();

    // Search 
    $list.find('.service-option').each(function(){

      if(jQuery(this).text().toLowerCase().indexOf(""+text+"") != -1 ){
       jQuery(this).show();
      }
    });
    return false;
  });


  jQuery('.calendar-week-agent-w').on('click', '.calendar-load-target-date', function(event){
    jQuery(this).addClass('os-loading');
    latepoint_reload_week_view_calendar(jQuery(this).data('target-date'));
    return false;
  });

  jQuery('.calendar-week-agent-w').on('change', '.cc-availability-toggler #overlay_service_availability', function(event){
    if(jQuery(this).val() == 'on'){
      jQuery('.calendar-week-agent-w .cc-service-selector').show();
    }else{
      jQuery('.calendar-week-agent-w .cc-service-selector').hide();
    }
    latepoint_reload_week_view_calendar();
  });


  jQuery('.calendar-week-agent-w').on('change', '.trigger-weekly-calendar-reload', function(event){
    latepoint_reload_week_view_calendar();
    return false;
  });

  jQuery('.latepoint-admin').on('click', '.os-complex-connections-selector .selector-trigger', function(e){
    var $connection_wrapper = jQuery(this).closest('.connection');
    if($connection_wrapper.hasClass('active')){
      latepoint_complex_selector_deselect($connection_wrapper);
      jQuery(this).closest('.white-box').find('.os-select-all-toggler').prop('checked', false);
    }else{
      latepoint_complex_selector_select($connection_wrapper);
    }
    return false;
  });

  jQuery('.latepoint-admin').on('click', '.os-complex-connections-selector .item-quantity-selector', function(e){
    let val = parseInt(jQuery(this).closest('.item-quantity-selector-w').find('.item-quantity-selector-input').val());
    if(jQuery(this).data('sign') == 'plus'){
      val = val + 1;
    }else{
      val = val - 1;
    }
    val = (val > 0) ? val : 0;
    jQuery(this).closest('.item-quantity-selector-w').find('.item-quantity-selector-input').val(val).trigger('change');
    return false;
  });

  jQuery('.latepoint-admin').on('change', '.os-complex-connections-selector .item-quantity-selector-input', function(e){
    let $this = jQuery(this);
    let $connection_wrapper = jQuery(this).closest('.connection');
    if($this.val() > 0){
      latepoint_complex_selector_select($connection_wrapper, $this.val());
    }else{
      latepoint_complex_selector_deselect($connection_wrapper);
    }
    return false;
  });

  jQuery('.latepoint-admin').on('click', '.os-agents-selector .agent', function(){
    if(jQuery(this).hasClass('active')){
      jQuery(this).removeClass('active');
      jQuery(this).find('.connection-child-is-connected').val('no');
    }else{
      jQuery(this).addClass('active');
      jQuery(this).find('.connection-child-is-connected').val('yes');
    }
    return false;
  });

  jQuery('.latepoint-admin').on('click', '.os-services-selector .service', function(){
    if(jQuery(this).hasClass('active')){
      jQuery(this).removeClass('active');
      jQuery(this).find('.connection-child-is-connected').val('no');
    }else{
      jQuery(this).addClass('active');
      jQuery(this).find('.connection-child-is-connected').val('yes');
    }
    return false;
  });

  jQuery('.latepoint-admin').on( 'click', '.os-form-toggler-group', function( event ){
    jQuery(this).find('.os-toggler').trigger('click');
    return false;
  });

  jQuery('.latepoint-admin').on( 'click', '.os-toggler', function( event ){
    let $toggler = jQuery(this);
    if($toggler.data('confirm')){
      if(!confirm($toggler.data('confirm'))) return false;
    }
    if($toggler.hasClass('on')){
      $toggler.removeClass('on').addClass('off');
    }else{
      $toggler.removeClass('off').addClass('on');
    }
    if($toggler.data('for')){
      if($toggler.hasClass('os-toggler-radio')){
        // radio
        // uncheck all radio buttons with the same name
        let $radio = jQuery('#' + $toggler.data('for'));
        jQuery('input[type="radio"][name="'+ $radio.prop('name') + '"]:checked').each(function(index){
          let toggle_content_id = jQuery(this).prop('checked', false).closest('.os-toggler-w').find('.os-toggler.on').removeClass('on').addClass('off').data('controlled-toggle-id');
          jQuery('#'+ toggle_content_id).hide();
        });
        $radio.prop('checked', !$toggler.hasClass('off'));
      }else{
        var $hiddenInput = jQuery('input[type="hidden"]#' + $toggler.data('for'));
        if($hiddenInput.length){
          // hidden input
          if($toggler.data('is-string-value')){
            $hiddenInput.val($toggler.hasClass('off') ? 'off' : 'on').trigger('change');
          }else{
            $hiddenInput.val($toggler.hasClass('off') ? 0 : 1).trigger('change');
          }

          if($toggler.data('os-instant-update')){
            let data = new FormData();

            let params = $hiddenInput.serialize();
            if($toggler.data('nonce')) params+= '&_wpnonce='+$toggler.data('nonce');
            data.append('params', params);
            data.append('action', latepoint_helper.route_action);
            data.append('route_name', $toggler.data('os-instant-update'));
            data.append('return_format', 'json');

            jQuery.ajax({
              type: "post",
              dataType: "json",
              processData: false,
              contentType: false,
              url: latepoint_timestamped_ajaxurl(),
              data: data,
              success: function (response) {

              }
            });
          }
        }else{
          // checkbox
          jQuery('#' + $toggler.data('for')).prop('checked', !$toggler.hasClass('off'));
        }
      }
    }
    if($toggler.data('controlled-toggle-id')){
      if($toggler.hasClass('off')){
        jQuery('#' + $toggler.data('controlled-toggle-id')).hide();
      }else{
        jQuery('#' + $toggler.data('controlled-toggle-id')).show();
      }
    }
    $toggler.trigger('ostoggler:toggle');
    return false;
  });



  // UPLOAD/REMOVE IMAGE LINK LOGIC
  jQuery('.latepoint-admin').on( 'click', '.os-image-selector-trigger', function( event ){
    var frame;

    event.preventDefault();

    var $image_uploader_trigger = jQuery(this);
    var $image_selector_w = jQuery(this).closest('.os-image-selector-w');
    var $image_container = $image_selector_w.find('.os-image-container');
    var $image_id_holder = $image_selector_w.find('.os-image-id-holder');

    let is_avatar = $image_selector_w.hasClass('is-avatar');

    var image_exists = is_avatar ? $image_container.find('.image-self').length : $image_container.find('img').length;

    if(image_exists){
      $image_id_holder.val('');
      $image_selector_w.removeClass('has-image');
      $image_container.html('');
      $image_uploader_trigger.find('.os-text-holder').text($image_uploader_trigger.data('label-set-str'));
    }else{
      // If the media frame already exists, reopen it.
      if ( frame ) {
        frame.open();
        return false;
      }
      
      // Create a new media frame
      frame = wp.media({
        title: 'Select or Upload Media',
        button: { text: 'Use this media' },
        multiple: false
      });

      frame.on( 'select', function() {
        var attachment = frame.state().get('selection').first().toJSON();
        if(is_avatar){
          $image_container.html( '<div class="image-self" style="background-image: url('+attachment.url+')"></div>' );
        }else{
          $image_container.html( '<img src="'+attachment.url+'" alt=""/>' );
        }
        $image_id_holder.val( attachment.id );
        $image_selector_w.addClass('has-image');
        $image_uploader_trigger.find('.os-text-holder').text($image_uploader_trigger.data('label-remove-str'));
      });

      frame.open();
    }
    
    return false;
  });



  jQuery('body').on('click', '.latepoint-lightbox-close', function(){
    latepoint_lightbox_close();
    return false;
  });


  jQuery('body').on('click', '.latepoint-side-panel-close-trigger', function(){
    latepoint_close_side_panel();
    return false;
  });
  jQuery('body').on('click', '.latepoint-side-sub-panel-close-trigger', function(){
    jQuery(this).closest('.side-sub-panel-wrapper').remove();
    return false;
  });
  


  jQuery('body.latepoint-admin').on('click', '.time-ampm-select', function(){
    let $form = jQuery(this).closest('.order-item-booking-data-form-wrapper');
    jQuery(this).closest('.time-ampm-w').find('.active').removeClass('active');
    jQuery(this).addClass('active');
    var ampm_value = jQuery(this).data('ampm-value');
    jQuery(this).closest('.os-time-group').find('.ampm-value-hidden-holder').val(ampm_value);
    if(jQuery(this).closest('.quick-start-time-w').length){
      // if called from quick edit form - we need to make sure it accurately changes time to next day if end time is earlier than start time
      latepoint_set_booking_end_time($form);
      latepoint_is_next_day($form);
    }
    if(jQuery(this).closest('.quick-end-time-w').length){
      latepoint_is_next_day($form);
    }
    return false;
  });


  jQuery('body.latepoint-admin').on('click', '.latepoint-lightbox-shadow', function(){
    latepoint_lightbox_close();
    return false;
  });

  jQuery('body.latepoint-admin').on('click', '.latepoint-side-panel-shadow', function(){
    jQuery('.latepoint-side-panel-w').remove();
    return false;
  });

  // SCHEDULE

  jQuery('body.latepoint-admin').on('click', '.ws-period-remove', function(e){
    jQuery(this).closest('.ws-period').remove();
    return false;
  });


  jQuery('.latepoint-admin').on( 'click', '.weekday-schedule-w .os-toggler', function( event ){
    if(jQuery(this).hasClass('off')){
      jQuery(this).closest('.weekday-schedule-w').addClass('day-off').removeClass('is-editing').find('input.is-active').val(0);
    }else{
      jQuery(this).closest('.weekday-schedule-w').removeClass('day-off').addClass('is-editing').find('input.is-active').val(1);
    }
    return false;
  });

  

});