Vue.config.debug = true;
Vue.config.devtools = true;
Vue.use(DatePicker);
var OrderableTimedProductRulesApp = new Vue({
  el: '#orderable-timed-products-app',
  data: {
    rules: [],
    action: 'set_visible',
    i18n: {
      'date_validation': orderable_pro_conditions_params.i18n.date_validation,
      'time_validation': orderable_pro_conditions_params.i18n.time_validation,
      'from': orderable_pro_conditions_params.i18n.from,
      'to': orderable_pro_conditions_params.i18n.to
    }
  },
  mounted: function () {
    var data = jQuery("#orderable-timed-products-app").data('rules');
    this.rules = Array.isArray(data.rules) ? data.rules : [];
    this.action = data && data.action ? data.action : 'set_visible';
  },
  methods: {
    addRule: function () {
      this.rules.push({
        id: this.generateRuleID(),
        date_condition: 'on_date',
        date_from: '',
        date_to: '',
        time_from: '',
        time_to: '',
        days: [],
        day_toggle_open: false
      });
    },
    generateRuleID() {
      min = 10000000000;
      max = 10000000000000;
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    deleteCondition: function (index) {
      this.rules.splice(index, 1);
    },
    dayChanged: function (days, ruleIndex) {
      this.rules[ruleIndex].days = days;
    },
    fromPlaceholder: function (rule) {
      return 'on_date' === rule.date_condition ? orderable_pro_conditions_params.i18n.date : orderable_pro_conditions_params.i18n.from;
    }
  },
  computed: {
    rulesJson: function () {
      var obj = {
        action: this.action,
        rules: this.rules
      };
      return JSON.stringify(obj);
    }
  }
});

/**
 * Define component orderable-multiselect.
 */
var OrderableMultiselect = Vue.component('orderable-multiselect', {
  data: function () {
    return {
      all_days: orderable_pro_conditions_params.days,
      select_label: orderable_pro_conditions_params.i18n.days_select_value,
      toggle_open: false,
      this_days: []
    };
  },
  props: ['days', 'idx'],
  mounted: function () {
    this.this_days = this.days;
  },
  watch: {
    this_days: function () {
      this.$emit('day_changed', this.this_days, this.idx);
    }
  },
  methods: {
    close_toggle: function () {
      this.toggle_open = false;
    },
    selected_days: function () {
      var days_label_array = this.days.map(day => {
        return this.all_days[day];
      });
      return days_label_array.join(', ');
    }
  },
  template: /* html */`
		<div class="orderable-multiselect" v-click-outside='close_toggle'>
			<div
				class="orderable-multiselect__label"
				@click='toggle_open = ! toggle_open'
				:class='{"orderable-multiselect__label--open": toggle_open}'
				@blur='toggle_open = false'
				>
				<span v-if='this_days.length' class="orderable-multiselect__label--value" >
				{{ selected_days() }}
				</span>
				<span v-else class="orderable-multiselect__label--placeholder">
					{{ select_label }}
				</span>
			</div>
			<div v-show='toggle_open' class='orderable-multiselect__dropdown'>	
				<label v-for='(day,dayKey) in all_days'><input type='checkbox' v-model='this_days' :value='dayKey'> {{day}}</label>
			</div>
		</div>	
	`
});
Vue.directive('click-outside', {
  bind: function (el, binding, vnode) {
    el.eventSetDrag = function () {
      el.setAttribute('data-dragging', 'yes');
    };
    el.eventClearDrag = function () {
      el.removeAttribute('data-dragging');
    };
    el.eventOnClick = function (event) {
      var dragging = el.getAttribute('data-dragging');
      // Check that the click was outside the el and its children, and wasn't a drag
      if (!(el == event.target || el.contains(event.target)) && !dragging) {
        // call method provided in attribute value
        vnode.context[binding.expression](event);
      }
    };
    document.addEventListener('touchstart', el.eventClearDrag);
    document.addEventListener('touchmove', el.eventSetDrag);
    document.addEventListener('click', el.eventOnClick);
    document.addEventListener('touchend', el.eventOnClick);
  },
  unbind: function (el) {
    document.removeEventListener('touchstart', el.eventClearDrag);
    document.removeEventListener('touchmove', el.eventSetDrag);
    document.removeEventListener('click', el.eventOnClick);
    document.removeEventListener('touchend', el.eventOnClick);
    el.removeAttribute('data-dragging');
  }
});