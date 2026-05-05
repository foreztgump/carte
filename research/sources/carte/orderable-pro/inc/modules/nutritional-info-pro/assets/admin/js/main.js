(function ($) {
  function removeVitaminsAndMineralsField(event) {
    event.preventDefault();
    $(this).parent('.orderable-pro-vitamins-and-minerals-fields__field').fadeOut(400, function () {
      $(this).remove();
    });
  }
  function addVitaminsAndMineralsField() {
    const field = $('.orderable-pro-vitamins-and-minerals-fields__field').last().clone();
    $(field).find('input, select').val('').change();
    $(field).find('.orderable-pro-vitamins-and-minerals-fields__button-remove').on('click', removeVitaminsAndMineralsField);
    $(field).appendTo('#orderable_vitamins_and_minerals_fields');
  }
  function saveNutritionalInfo(event) {
    event.preventDefault();
    $('#orderable_nutritional_info_panel .orderable-pro-nutritional-info-panel__form-control .orderable-pro-nutritional-info-panel__form-message').css('display', '');
    $('#woocommerce-product-data').block({
      message: null,
      overlayCSS: {
        background: '#fff',
        opacity: 0.6
      }
    });
    const fieldsGroup = $('#orderable_nutritional_info_panel .fields_group');
    let fieldsData = {};
    fieldsGroup.each(function () {
      $(this).find('input[name]').each(function () {
        const field = $(this);
        const value = field.val();
        const id = field.attr('id');
        const daily_value = $(`#${id}-daily-value`).val();
        if (id && value) {
          fieldsData = {
            ...fieldsData,
            [id]: {
              value,
              daily_value
            }
          };
        }
      });
    });
    const vitaminsAndMineralsFields = $('#orderable_vitamins_and_minerals_fields .orderable-pro-vitamins-and-minerals-fields__field');
    let vitaminsAndMineralsData = [];
    vitaminsAndMineralsFields.each(function () {
      const vitamin_or_mineral = $(this).find('.vitamin-or-mineral').val();
      const amount = $(this).find('.orderable-pro-vitamins-and-minerals-fields__amount').val();
      const amount_in = $(this).find('.orderable-pro-vitamins-and-minerals-fields__amount-in').val();
      const daily_value = $(this).find('.orderable-pro-vitamins-and-minerals-fields__daily-value').val();
      if (vitamin_or_mineral) {
        vitaminsAndMineralsData = [...vitaminsAndMineralsData, {
          vitamin_or_mineral,
          amount,
          amount_in,
          daily_value
        }];
      }
    });
    $.post(orderable_pro_nutritional_info_params?.ajax_url, {
      action: 'save_nutritional_info',
      nonce: orderable_pro_nutritional_info_params?.nonce,
      post_id: orderable_pro_nutritional_info_params?.post_id,
      data: {
        fields: fieldsData,
        vitamins_and_minerals: vitaminsAndMineralsData
      }
    }).fail(function () {
      $('#orderable_nutritional_info_panel .orderable-pro-nutritional-info-panel__form-control .orderable-pro-nutritional-info-panel__form-message').css('display', 'block');
    }).always(function () {
      $('#woocommerce-product-data').unblock();
    });
  }
  $('#orderable-add-vitamin-mineral-field').on('click', addVitaminsAndMineralsField);
  $('.orderable-pro-vitamins-and-minerals-fields__field .orderable-pro-vitamins-and-minerals-fields__button-remove').not(':nth-child(1)').on('click', removeVitaminsAndMineralsField);
  $('.orderable-pro-nutritional-info-panel__button-save-nutritional-info').on('click', saveNutritionalInfo);
})(jQuery);