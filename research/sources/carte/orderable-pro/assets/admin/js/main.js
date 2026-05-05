var OrderableConditionsApp = new Vue({
  el: '#orderable-conditions-app',
  data: {
    rules: [],
    conditionOptions: []
  },
  mounted: function () {
    var rules = jQuery("#orderable-conditions-app").data('rules');
    this.rules = Array.isArray(rules) ? rules : [];
  },
  methods: {
    /**
     * Add OR rule. 
     * NOTE: An OR rule is an array of AND rules.
     */
    addOrRule: function () {
      this.rules.push([{
        id: this.generateRuleID(),
        objectType: 'product',
        operator: 'is_equal_to',
        objects: ''
      }]);
    },
    addAndRule: function (orRule) {
      orRule.push({
        id: this.generateRuleID(),
        objectType: 'product',
        operator: 'is_equal_to',
        objects: ''
      });
    },
    generateRuleID() {
      min = 10000000000;
      max = 10000000000000;
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    fetchOptions: function (search, loading) {
      // Set loading true.
      loading(true);
      Vue.nextTick(() => {
        var objectType = jQuery('#orderable-conditions-app .vs--loading').closest('.orderable-conditions__row').find('.orderable-conditions__row-item--object-type select').val();
        if ('product' === objectType) {
          this.fetchProducts(search, loading);
        } else {
          this.fetchProductCategories(search, loading);
        }
      });
    },
    fetchProducts: function (search, loading) {
      var self = this;
      var action = 'woocommerce_json_search_products';
      var nonce = window.orderable_pro_conditions_params.search_products_nonce;
      var data = {
        security: nonce,
        action: action,
        term: search
      };
      jQuery.get(window.orderable_pro_conditions_params.ajax_url, data).done(function (data) {
        var formattedOptions = [];
        for (var i in data) {
          formattedOptions.push({
            code: i,
            label: data[i]
          });
        }
        self.conditionOptions = formattedOptions;
        loading(false);
      });
    },
    fetchProductCategories: function (search, loading) {
      var self = this;
      var action = 'woocommerce_json_search_categories';
      var nonce = window.orderable_pro_conditions_params.search_categories_nonce;
      var data = {
        security: nonce,
        action: action,
        term: search
      };
      loading(true);
      jQuery.get(window.orderable_pro_conditions_params.ajax_url, data).done(function (categories) {
        var formattedOptions = [];
        for (var i in categories) {
          formattedOptions.push({
            code: categories[i]['term_id'],
            label: categories[i]['name']
          });
        }
        self.conditionOptions = formattedOptions;
        loading(false);
      });
    },
    resetConditions: function (andRule, orRule) {
      delete andRule.objects;
      this.conditionOptions = [];
    },
    deleteCondition: function (orIndex, andIndex) {
      this.rules[orIndex].splice(andIndex, 1);

      // If the parent (orRule) has no other child rules (andRules) then delete parent rule too.
      if (0 === this.rules[orIndex].length) {
        this.rules.splice(orIndex, 1);
      }
    },
    objectPlaceholder: function (andRule) {
      return 'product_category' === andRule.objectType ? window.orderable_pro_main.search_category : window.orderable_pro_main.search_product;
    }
  },
  components: {
    'v-select': VueSelect.VueSelect
  },
  computed: {
    conditionJson: function () {
      return JSON.stringify(this.rules);
    }
  }
});