var OrderableFieldsApp = new Vue({
  el: '#orderable-fields-app',
  data: {
    drag: false,
    fields: []
  },
  mounted: function () {
    var fields = jQuery("#orderable-fields-app").data('fields');
    this.fields = Array.isArray(fields) ? fields : [];
    jQuery('#publishing-action #publish.button').on('click', this.open_field_on_error);
  },
  methods: {
    newField: function () {
      this.fields.push({
        id: this.generateFieldID(),
        type: 'text',
        title: window.orderable_pro_conditions_params.i18n.new_field,
        description: '',
        required: false,
        options: [],
        default: '',
        open: false,
        is_multiline: false,
        placeholder: ''
      });
    },
    generateFieldID() {
      min = 10000000000;
      max = 10000000000000;
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    deleteField: function (index) {
      this.fields.splice(index, 1);
    },
    duplicateField: function (index, oldField) {
      oldField.open = false;
      var newField = {
        ...oldField
      };
      newField.id = this.generateFieldID();
      newField.open = true;
      newField.title = newField.title + " - copy";
      this.fields.splice(index + 1, 0, newField);
    },
    // Function related to options
    addOption: function (field, index) {
      field.options.push({
        id: this.generateFieldID(),
        label: '',
        visual_type: 'none',
        image: '',
        color: '',
        selected: '',
        price: ''
      });
    },
    deleteOption: function (optionIndex, field) {
      field.options.splice(optionIndex, 1);
    },
    addImage: function (option) {
      this.frame = wp.media({
        button: {
          text: 'Use this Image'
        },
        multiple: false
      });
      this.frame.on('select', () => {
        var attachment = this.frame.state().get('selection').first().toJSON();
        option.image = {
          id: attachment.id,
          thumbnail: attachment.sizes.thumbnail.url,
          src: attachment.sizes.full.url
        };
      });
      this.frame.open();
    },
    removeImage: function (option) {
      option.image = false;
    },
    selected_input_type: function (field) {
      var radio_field_types = ['select', 'visual_radio'];
      if (radio_field_types.includes(field.type)) {
        return 'radio';
      }
      return 'checkbox';
    },
    /**
     * Deselect other Radio/Dropdown, because there can only be one selection for
     * these field types.
     * 
     * @param Object option 
     * @param int optionIndex 
     * @param Object field 
     */
    deselectOtherRadio: function (option, optionIndex, field) {
      var radio_field_types = ['select', 'visual_radio'];

      // if input type is checkbox then there is no need to uncheck other options
      // because checkbox can have multiple values.
      if (!radio_field_types.includes(field.type)) {
        return;
      }
      field.options.forEach((option, optionLoopIndex) => {
        if (optionLoopIndex != optionIndex) {
          option.selected = 0;
        }
      });
    },
    /**
     * Open the field if the inner title field is empty.
     */
    open_field_on_error: function () {
      this.fields.forEach(function (field) {
        if (!field.title) {
          field.open = true;
        }
      });
    }
  },
  components: {
    'draggable': vuedraggable
  },
  computed: {
    fieldsJson: function () {
      var tempFields = [];
      this.fields.forEach(field => {
        var tempField = Object.assign({}, field);
        tempField.open = false;
        tempFields.push(tempField);
      });
      return JSON.stringify(tempFields);
    }
  }
});