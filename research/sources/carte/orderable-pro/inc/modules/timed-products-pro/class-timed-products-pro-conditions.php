<?php
/**
 * Module: Timed Products Pro.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Funtions related to verify the timed product conditions.
 */
class Orderable_Timed_Products_Conditions {
	/**
	 * Date Format.
	 *
	 * @var string
	 */
	public static $date_format = 'Y-m-d';

	/**
	 * Hide timed products from WooCommerce products loop.
	 *
	 * @param WP_Query $q The query.
	 *
	 * @return WP_Query updated query.
	 */
	public static function hide_timed_products_in_woocommerce_product_loop( $q ) {
		$timed_product_conditions = get_posts(
			array(
				'post_type'      => 'timed_prod_condition',
				'posts_per_page' => 100, // instead of -1.
				'post_status'    => 'publish',
			)
		);

		if ( empty( $timed_product_conditions ) ) {
			return $q;
		}

		foreach ( $timed_product_conditions as $condition_post ) {
			$time_rules          = get_post_meta( $condition_post->ID, '_orderable_time_rules', true );
			$conditions          = get_post_meta( $condition_post->ID, '_orderable_timed_products_condition', true );
			$action              = $time_rules['action'];
			$time_rule_apply_now = self::is_time_rule_applicable_now( $condition_post->ID );

			/*
			If action is 'set_hidden':
				And time rule does NOT apply then "dont change query".
				And time rule DOES apply then "hide applicable products"
			else when action is "set_visible"
				And time rule does NOT apply then "hide applicable product"
				And time rule DOES apply then "dont change query"
			*/

			if ( 'set_hidden' === $action && $time_rule_apply_now ) {
				// modify query: hide products.
				self::modify_query_hide_products( $q, $conditions );
			}

			if ( 'set_visible' === $action && ! $time_rule_apply_now ) {
				// modify query: hide products.
				self::modify_query_hide_products( $q, $conditions );
			}
		}
	}

	/**
	 * Modify the query to hide products based on the given condition.
	 *
	 * @param WP_Query $q              WP_Query object.
	 * @param array    $or_conditions  Or Condition.
	 *
	 * @return null
	 */
	public static function modify_query_hide_products( $q, $or_conditions ) {
		if ( empty( $or_conditions ) ) {
			return $q;
		}

		$posts_to_hide      = array();
		$posts_to_show      = array();
		$categories_to_hide = array();
		$categories_to_show = array();

		// Determine values of the 4 arrays.
		foreach ( $or_conditions as $conditions ) {
			if ( empty( $conditions ) ) {
				continue;
			}

			// There is always one and_condition for Timed products so we dont need a loop here.
			$condition = $conditions[0];

			if ( empty( $condition['objects'] ) ) {
				continue;
			}

			if ( 'product' === $condition['objectType'] && 'not_equal_to' === $condition['operator'] ) {
				$posts_to_show[] = (int) $condition['objects']['code'];
			} elseif ( 'product' === $condition['objectType'] && 'is_equal_to' === $condition['operator'] ) {
				$posts_to_hide[] = (int) $condition['objects']['code'];
			}

			if ( 'product_category' === $condition['objectType'] && 'is_equal_to' === $condition['operator'] ) {
				$categories_to_hide[] = (int) $condition['objects']['code'];
			} elseif ( 'product_category' === $condition['objectType'] && 'not_equal_to' === $condition['operator'] ) {
				$categories_to_show[] = (int) $condition['objects']['code'];
			}
		}

		// Update the query based on the 4 arrays.
		if ( ! empty( $posts_to_hide ) ) {
			$existing_post__not_in = $q->get( 'post__not_in' );
			$q->set( 'post__not_in', array_merge( $existing_post__not_in, $posts_to_hide ) );
		}

		if ( ! empty( $posts_to_show ) ) {
			$q->set( 'post__in', $posts_to_show );
		}

		$tax_query = (array) $q->get( 'tax_query' );

		if ( ! empty( $categories_to_hide ) ) {
			$tax_query[] = array(
				'taxonomy' => 'product_cat',
				'field'    => 'term_id',
				'terms'    => $categories_to_hide,
				'operator' => 'NOT IN',
			);
		}

		if ( ! empty( $categories_to_show ) ) {
			$tax_query[] = array(
				'taxonomy' => 'product_cat',
				'field'    => 'term_taxonomy_id',
				'terms'    => $categories_to_show,
				'operator' => 'IN',
			);
		}

		$q->set( 'tax_query', $tax_query );
	}

	/**
	 * Is product visible now.
	 *
	 * @param WC_Product $product Product.
	 *
	 * @return bool
	 */
	public static function is_product_visible_now( $product ) {
		/*
		Fetch all the timed product conditions that match with the product/category
		specified in the conditions metabox.
		*/
		$applicable_timed_products = Orderable_Pro_Conditions_Matcher::get_applicable_cpt( 'timed_prod_condition', $product->get_id() );

		// No applicable timed product CPT, the product is visible.
		if ( empty( $applicable_timed_products ) ) {
			return true;
		}

		$product_visible = true;
		foreach ( $applicable_timed_products as $time_rule_post_id ) {
			$time_rules = get_post_meta( $time_rule_post_id, '_orderable_time_rules', true );
			if ( empty( $time_rules ) ) {
				continue;
			}

			// It tells if current time obeys the time-rules.
			$time_condition_matches = self::is_time_rule_applicable_now( $time_rule_post_id );

			if ( 'set_hidden' === $time_rules['action'] ) {
				$product_visible = $time_condition_matches ? false : true;
			} else { // action is 'set_visible'.
				$product_visible = $time_condition_matches ? true : false;
			}

			// We already got one false, no need to continue the loop.
			if ( ! $product_visible ) {
				break;
			}
		}

		return $product_visible;
	}


	/**
	 * Is product category visible now.
	 *
	 * @param int $prouct_category_id Product category ID.
	 *
	 * @return bool
	 */
	public static function is_product_category_visible_now( $prouct_category_id ) {
		$timed_product_conditions = self::get_all_timed_products();

		if ( empty( $timed_product_conditions ) ) {
			return true;
		}

		foreach ( $timed_product_conditions as $post_id ) {
			$time_rules              = get_post_meta( $post_id, '_orderable_time_rules', true );
			$conditions              = get_post_meta( $post_id, '_orderable_timed_products_condition', true );
			$action                  = $time_rules['action'];
			$time_rule_apply_now     = self::is_time_rule_applicable_now( $post_id );
			$is_equal_to_categories  = array();
			$not_equal_to_categories = array();

			foreach ( $conditions as $or_condition ) {
				$and_condition = $or_condition[0];
				if ( 'product_category' !== $and_condition['objectType'] ) {
					continue;
				}

				if ( 'is_equal_to' === $and_condition['operator'] ) {
					$is_equal_to_categories[] = $and_condition['objects']['code'];
				} else {
					$not_equal_to_categories[] = $and_condition['objects']['code'];
				}
			}

			// If both is_equal_to_categories and not_equal_to_categories are set then we will
			// ignore and_equal_to_categories.
			if ( ! empty( $not_equal_to_categories ) ) {
				$present = in_array( $prouct_category_id, $is_equal_to_categories );

				if ( $present ) {
					if (
						( 'set_hidden' === $action && $time_rule_apply_now )
						||
						( 'set_visible' === $action && ! $time_rule_apply_now )
					) {
						return false;
					}

					return true;
				}
			}

			if ( ! empty( $not_equal_to_categories ) ) {
				$present = in_array( $prouct_category_id, $not_equal_to_categories );

				if ( $present ) {
					if (
						( 'set_hidden' === $action && $time_rule_apply_now )
						||
						( 'set_visible' === $action && ! $time_rule_apply_now )
					) {
						return true;
					}

					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Does the given time rule apply for now?
	 *
	 * @param int $time_rule_post_id Time rule post ID.
	 *
	 * @return bool
	 */
	public static function is_time_rule_applicable_now( $time_rule_post_id ) {
		$time_rules = get_post_meta( $time_rule_post_id, '_orderable_time_rules', true );

		if ( empty( $time_rules ) || empty( $time_rules['rules'] ) ) {
			return true;
		}

		foreach ( $time_rules['rules'] as $rule ) {
			$result = true;

			switch ( $rule['date_condition'] ) {
				case 'on_date':
					$result = self::check_rule_on_date( $rule );
					break;

				case 'after_date':
				case 'before_date':
				case 'date_range':
					$result = self::check_rule_date_range( $rule );
					break;

				case 'day_of_week':
					$result = self::check_rule_day_of_week( $rule );
					break;

				case 'time_range':
					$result = self::check_rule_time_range( $rule );
					break;
			}

			// We only need one false to matter.
			if ( ! $result ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Check time rule 'on_date'.
	 *
	 * @param array $rule Rule.
	 *
	 * @return bool.
	 */
	public static function check_rule_on_date( $rule ) {
		if ( ! $rule['date_from'] ) {
			return true;
		}

		$date_now = current_time( self::$date_format );

		return $date_now === $rule['date_from'];
	}

	/**
	 * Check time rule 'date_range'.
	 *
	 * @param array $rule Rule.
	 *
	 * @return bool.
	 */
	public static function check_rule_date_range( $rule ) {
		$from_date = $rule['date_from'] ? strtotime( $rule['date_from'] ) : 0;
		$to_date   = $rule['date_to'] ? strtotime( $rule['date_to'] ) : PHP_INT_MAX;
		$now       = strtotime( current_time( 'Y-m-d 00:00' ) );

		if ( 'after_date' === $rule['date_condition'] ) {
			return $now > $from_date;
		} elseif ( 'before_date' === $rule['date_condition'] ) {
			return $now < $to_date;
		} elseif ( 'date_range' === $rule['date_condition'] ) {
			return ( $now >= $from_date && $now <= $to_date );
		}
	}

	/**
	 * Check time rule 'day_of_week'.
	 *
	 * @param array $rule Rule.
	 *
	 * @return bool
	 */
	public static function check_rule_day_of_week( $rule ) {
		$day_today = current_time( 'D' );
		return in_array( $day_today, $rule['days'], true );
	}

	/**
	 * Check time rule 'time'.
	 *
	 * @param array $rule Rule.
	 *
	 * @return bool
	 */
	public static function check_rule_time_range( $rule ) {
		$time_now = current_time( 'H:i' );
		return $time_now >= $rule['time_from'] && $time_now <= $rule['time_to'];
	}

	/**
	 * Get all timed products.
	 */
	public static function get_all_timed_products() {
		$cache_key      = 'orderable_pro_timed_products';
		$timed_products = wp_cache_get( $cache_key );

		if ( false !== $timed_products ) {
			return $timed_products;
		}

		$args = array(
			'post_type'              => 'timed_prod_condition',
			'posts_per_page'         => 100, // Instead of -1.
			'post_status'            => 'publish',
			'no_found_rows'          => true,
			'update_post_term_cache' => false,
			'fields'                 => 'ids',
		);

		$query = new WP_Query( $args );

		$post_ids = array();
		while ( $query->have_posts() ) {
			$query->the_post();
			$post_ids[] = get_the_ID();
		}

		wp_cache_set( $cache_key, $post_ids );

		return $post_ids;
	}
}
