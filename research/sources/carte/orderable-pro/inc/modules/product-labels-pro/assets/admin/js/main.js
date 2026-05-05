(function ($) {
  /* global: orderable_pro_product_labels_params. */

  var orderable_product_labels = {
    on_ready: function () {
      orderable_product_labels.init_color_pickers();
      orderable_product_labels.attach_event_handlers();
      $(document).ajaxSuccess(orderable_product_labels.after_saving_product_label);
    },
    /**
     * Handle after saving product label.
     * 
     * @param {Event} event 
     * @param {jqXHR} xhr It is a superset of the browser's native XMLHttpRequest object.
     * @param {Object} settings The HTTP data.
     */
    after_saving_product_label: function (event, xhr, settings) {
      if (!settings || !settings.data || !settings.data.includes('action=add-tag&screen=edit-orderable_product_label&taxonomy=orderable_product_label')) {
        return;
      }
      orderable_product_labels.reset_values();
    },
    /**
     * Reset custom fields values.
     */
    reset_values: function () {
      $('.taxonomy-orderable_product_label #tag-name').trigger('input');
      $('.orderable-pro-product-labels__display-option select').val('name').trigger('change');
      $('#orderable_product_label_foreground_color').wpColorPicker('color', '#fafafa');
      $('#orderable_product_label_background_color').wpColorPicker('color', '#171717');
      orderable_product_labels.clear_icon();
    },
    /**
     * Init the foreground and background color picker fields.
     */
    init_color_pickers: function () {
      $('#orderable_product_label_foreground_color').wpColorPicker({
        change: function (event, ui) {
          orderable_product_labels.update_label_css('color', ui.color.toString());
        }
      }).show();
      $('#orderable_product_label_background_color').wpColorPicker({
        change: function (event, ui) {
          orderable_product_labels.update_label_css('background-color', ui.color.toString());
        }
      }).show();
    },
    /**
     * Set the CSS property to the preview label element.
     *
     * @param {String} propertyName A CSS property name.
     * @param {String} value        A value to set for the property.
     */
    update_label_css: function (propertyName, value) {
      $('.orderable-pro-product-labels__preview .orderable-pro-product-labels__label').css(propertyName, value);
    },
    /**
     * Update the icon class based on the selected icon.
     *
     * @param {string} selector The element selector to update the class attribute.
     */
    update_icon_class: function (selector) {
      var icon = $('.orderable-pro-product-labels-font-families__icon--selected').data('icon');
      $('.orderable-pro-product-labels-icon__input').val(icon);
      var icon_family = $('.orderable-pro-product-labels-icon-font-families__field').val();
      var icon_family_class = '';
      switch (icon_family) {
        case 'fontawesome':
          icon_family_class = 'fa';
          break;
        case 'woocommerce':
          icon_family_class = 'wooicon';
          break;
        case 'dashicons':
          icon_family_class = 'dashicons';
          break;
        case 'orderable-pro-icons':
          icon_family_class = 'orderable-pro-icons';
        default:
          break;
      }
      var $element = $(selector);
      $element.removeClass().addClass(icon_family_class).addClass(icon);
      return $element;
    },
    /**
     * Attach event handlers to update the icon preview accordingly with the settings selected
     */
    attach_event_handlers: function () {
      /**
       * Attached in the Layout settings page.
       */
      $('#orderable_product_labels_position').on('change', orderable_product_labels.handle_product_labels_alignment);
      $('.orderable-pro-product-labels-icon-font-families__field').change(function () {
        var icon_family = $(this).val();
        $('.orderable-pro-product-labels-font-families__font').hide();
        $('.orderable-pro-product-labels-font-families__font--' + icon_family).show();
      }).trigger('change');
      $('.orderable-pro-product-labels-font-families__icon').click(function () {
        var icon = $(this).data('icon');
        $('.orderable-pro-product-labels-icon__input').val(icon);
        $('.orderable-pro-product-labels-font-families__icon').removeClass('orderable-pro-product-labels-font-families__icon--selected');
        $(this).addClass('orderable-pro-product-labels-font-families__icon--selected');
        orderable_product_labels.update_icon_class('.orderable-pro-product-labels-icon__preview').addClass('orderable-pro-product-labels-icon__preview');
        orderable_product_labels.update_icon_class('.orderable-pro-product-labels__preview .orderable-pro-product-labels__icon').addClass('orderable-pro-product-labels__icon').show();
        if ('icon' === $('.orderable-pro-product-labels__display-option select').val()) {
          $('.orderable-pro-product-labels__preview .orderable-pro-product-labels__label').show();
        }
        $('.orderable-pro-product-labels__preview i, .orderable-pro-product-labels-icon__preview').html($(this).data('icon-content') || '');
        orderable_product_labels.update_change_icon_button_label();
        $('.orderable-pro-product-labels-icon-font-families').hide();
      });
      $('.orderable-pro-product-labels-font-families__icon--selected').trigger('click');
      $('.taxonomy-orderable_product_label #tag-name, .taxonomy-orderable_product_label .term-name-wrap #name').on('input', function () {
        var value = $(this).val();
        $('.orderable-pro-product-labels__preview .orderable-pro-product-labels__label').show();
        $('.orderable-pro-product-labels__preview .orderable-pro-product-labels__text').text(value);
        orderable_product_labels.handle_preview_display($('.orderable-pro-product-labels__display-option select').val());
      }).trigger('input');
      $('.orderable-pro-product-labels__display-option select').on('change', function () {
        var value = $(this).val();
        if (!value.length) {
          return;
        }
        orderable_product_labels.handle_icon_field_display(value);
        orderable_product_labels.handle_preview_display(value);
        orderable_product_labels.handle_icon_and_name_display_in_preview(value);
      }).trigger('change');
      $('.orderable-pro-product-labels-icon__change-icon-action').on('click', function () {
        $('.orderable-pro-product-labels-icon-font-families').toggle();
      });
      $('.orderable-pro-product-labels-icon-font-families__search-field').on('keyup', orderable_product_labels.search_icon);
      $('.orderable-pro-product-labels-icon__clear-icon-action').on('click', orderable_product_labels.clear_icon);
    },
    /**
     * Handle the icon field display.
     *
     * @param {string} value The selected setting.
     */
    handle_icon_field_display: function (value) {
      if ('name' === value) {
        $('.orderable-pro-product-labels-icon').hide();
      } else {
        if (!$('.orderable-pro-product-labels-icon__input').val()) {
          $('.orderable-pro-product-labels-icon__clear-icon-action').hide();
        } else {
          $('.orderable-pro-product-labels-icon__clear-icon-action').show();
        }
        $('.orderable-pro-product-labels-icon').show();
      }
    },
    /**
     * Handle the icon and name display based on the
     * display settings. 
     *
     * @param {String} value The selected setting.
     */
    handle_icon_and_name_display_in_preview: function (value) {
      var show_icon_name = 'icon_name' === value || 'name_icon' === value;
      var show_icon = show_icon_name || 'icon' === value;
      var show_name = show_icon_name || 'name' === value;
      if (show_icon && $('.orderable-pro-product-labels-icon__input').val()) {
        $('.orderable-pro-product-labels__preview .orderable-pro-product-labels__icon').removeClass('orderable-pro-product-labels__icon--display-none').show();
      } else {
        $('.orderable-pro-product-labels__preview .orderable-pro-product-labels__icon').addClass('orderable-pro-product-labels__icon--display-none').hide();
      }
      if (show_name) {
        $('.orderable-pro-product-labels__preview .orderable-pro-product-labels__text').css('margin-left', '').show();
      } else {
        $('.orderable-pro-product-labels__preview .orderable-pro-product-labels__text').hide();
      }
      switch (value) {
        case 'name':
          $('.orderable-pro-product-labels__preview .orderable-pro-product-labels__text').css('margin-left', '0');
          break;
        case 'name_icon':
          $('.orderable-pro-product-labels__preview .orderable-pro-product-labels__label').addClass('orderable-pro-product-labels__label--direction-row-reverse');
          break;
        case 'icon':
          $('.orderable-pro-product-labels__preview .orderable-pro-product-labels__label').removeClass('orderable-pro-product-labels__label--direction-row-reverse');
          break;
        default:
          $('.orderable-pro-product-labels__preview .orderable-pro-product-labels__label').removeClass('orderable-pro-product-labels__label--direction-row-reverse');
          break;
      }
    },
    /**
     * Handle the search for icons.
     *
     */
    search_icon: function () {
      var value = $(this).val().toLowerCase().trim();
      if (!value || 2 > value.length) {
        $('.orderable-pro-product-labels-font-families__wrap .orderable-pro-product-labels-font-families__icon').removeClass('orderable-pro-product-labels-font-families__icon--display-none');
        return;
      }
      $('.orderable-pro-product-labels-font-families__wrap .orderable-pro-product-labels-font-families__icon').addClass(function () {
        return this.dataset.icon.indexOf(value) !== -1 ? '' : 'orderable-pro-product-labels-font-families__icon--display-none';
      });
    },
    /**
     * Handle the alignment select input that should be shown in the Layout settings.
     *
     * E.g.: `Over image` should allow a vertical and horizontal
     * aligment.
     */
    handle_product_labels_alignment: function () {
      switch ($(this).val()) {
        case 'none':
          $('.orderable_product_labels_alignment__select').attr('disabled', 'disabled').hide();
          break;
        case 'over-image':
          $('.orderable_product_labels_alignment__select-horizontal-alignment').attr('disabled', 'disabled').hide();
          $('.orderable_product_labels_alignment__select-vertical-horizontal-alignment').removeAttr('disabled').show();
          break;
        default:
          $('.orderable_product_labels_alignment__select-vertical-horizontal-alignment').attr('disabled', 'disabled').hide();
          $('.orderable_product_labels_alignment__select-horizontal-alignment').removeAttr('disabled').show();
          break;
      }
    },
    /**
     * Update the Change Icon button label.
     */
    update_change_icon_button_label: function () {
      var icon_selected = $('.orderable-pro-product-labels-icon__input').val(),
        $button_label = $('.orderable-pro-product-labels-icon__change-icon-action-text');
      $clear_button = $('.orderable-pro-product-labels-icon__clear-icon-action');
      if (icon_selected) {
        $button_label.text(orderable_pro_product_labels_params.i18n.change_icon);
        $clear_button.show();
      } else {
        $button_label.text(orderable_pro_product_labels_params.i18n.select_icon);
        $clear_button.hide();
      }
    },
    /**
     * Clear the icon field.
     */
    clear_icon: function () {
      $(this).hide();
      $('.orderable-pro-product-labels-icon__input').val('').trigger('change');
      $('.orderable-pro-product-labels-font-families__icon--selected').removeClass('orderable-pro-product-labels-font-families__icon--selected');
      $('.orderable-pro-product-labels-icon__preview').html('').removeClass().addClass('orderable-pro-product-labels-icon__preview');
      $('.orderable-pro-product-labels-icon__change-icon-action-text').text(orderable_pro_product_labels_params.i18n.select_icon);
      var display_option = $('.orderable-pro-product-labels__display-option select').val();
      orderable_product_labels.handle_preview_display(display_option);
      orderable_product_labels.handle_icon_and_name_display_in_preview(display_option);
    },
    /**
     * Handle the preview display.
     * 
     * @param {String} value 
     */
    handle_preview_display: function (value) {
      var is_icon_selected = !!$('.orderable-pro-product-labels-icon__input').val(),
        is_tag_name_filled = !!$('.taxonomy-orderable_product_label #tag-name, .taxonomy-orderable_product_label .term-name-wrap #name').val();
      if (!is_icon_selected && !is_tag_name_filled || is_icon_selected && !is_tag_name_filled && 'name' === value || is_tag_name_filled && !is_icon_selected && 'icon' === value) {
        $('.orderable-pro-product-labels__preview .orderable-pro-product-labels__label').hide();
        return;
      }
      $('.orderable-pro-product-labels__preview .orderable-pro-product-labels__label').show();
    }
  };
  $(document).ready(orderable_product_labels.on_ready);
})(jQuery);