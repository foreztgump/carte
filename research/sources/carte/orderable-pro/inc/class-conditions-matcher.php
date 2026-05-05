<?php
/**
 * Utility class to check and fetch applicable post types
 * based on the data saved in Conditions metabox.
 *
 * The Conditions meta box is used in Timed Products and Product Addons modules.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Conditions class.
 *
 * Note on data structure: Condition are stored as an array of array.
 * The top level array contains OR condition. Inside 'OR' array we have
 * a number of 'AND' conditions.
 */
class Orderable_Pro_Conditions_Matcher {

	/**
	 * Add hooks.
	 *
	 * @return void
	 */
	public static function run() {
		add_action( 'transition_post_status', array( __CLASS__, 'invalidate_cache_on_post_transition_status' ), 10, 3 );
	}

	/**
	 * Get all applicable CPT (Addon field groups, Timed product condition) for a given product.
	 *
	 * @param bool $post_type  Post type, example: timed_prod_condition, orderable_addons.
	 * @param bool $product_id Product ID.
	 *
	 * @return array ID of field groups.
	 */
	public static function get_applicable_cpt( $post_type, $product_id = false ) {
		global $product;

		$product_id        = $product_id ? $product_id : $product->get_ID();
		$applicable_groups = array();
		$cache_key         = sprintf( 'orderable_pro_get_applicable_cpt_%s', $post_type );

		/**
		 * Filter whether skip using cache to retrieve applicable CPT. Default: false.
		 *
		 * @since 1.7.1
		 * @hook orderable_skip_applicable_cpt_cache
		 * @param  bool   $should_skip_cache Whether skip the cache or not. Default: false.
		 * @param  string $post_type         The post type.
		 * @param  int    $product_id        The post ID.
		 * @return bool New value
		 */
		$should_skip_cache = apply_filters( 'orderable_skip_applicable_cpt_cache', false, $post_type, $product_id );

		$field_groups = $should_skip_cache ? false : wp_cache_get( $cache_key );

		if ( false === $field_groups ) {

			$field_groups = get_posts(
				array(
					'post_type'      => $post_type,
					'posts_per_page' => 100, // instead of -1.
					'post_status'    => 'publish',
				)
			);

			wp_cache_set( $cache_key, $field_groups );
		}

		foreach ( $field_groups as $group ) {
			if ( self::is_post_applicable( $group, $product_id, $post_type ) ) {
				$applicable_groups[] = $group->ID;
			}
		}

		/**
		 * Filter the applicable CPTs associated with the product.
		 *
		 * @since 1.6.0
		 * @hook orderable_{$post_type}_applicable_groups
		 * @param  array          $applicable_groups Array of post IDs applicable for the product.
		 * @param  string         $post_type         The post type. E.g.: timed_prod_condition, orderable_addons.
		 * @param  int|WC_Product $product           The product or product ID.
		 * @return array New value
		 */
		$applicable_groups = apply_filters( "orderable_{$post_type}_applicable_groups", $applicable_groups, $post_type, $product_id );

		return $applicable_groups;
	}

	/**
	 * Does this CPT's conditions match for the given product.
	 *
	 * @param int    $post       WP_Post object of posttype orderable_addons or timed_prod_condition.
	 * @param int    $product_id Product post ID.
	 * @param string $post_type  The post type to query.
	 *
	 * @return bool
	 */
	public static function is_post_applicable( $post, $product_id, $post_type ) {
		$conditions = self::get_conditions_data( $post->ID, $post_type );
		$product    = wc_get_product( $product_id );

		// If no conditions are there, then this CPT is applicable for all product.
		if ( ! is_array( $conditions ) || 0 === count( $conditions ) ) {
			return true;
		}

		foreach ( $conditions as $or_condition ) {
			foreach ( $or_condition as $and_condition ) {
				$and_flag = true;
				if ( ! self::does_condition_match( $product, $and_condition ) ) {
					$and_flag = false;
				}

				// no and_condition failed, this or_condition matches for this product.
				if ( $and_flag ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Is this condition applicable for the given product?
	 *
	 * @param WC_product $product       Product object.
	 * @param array      $and_condition Condition array.
	 */
	public static function does_condition_match( $product, $and_condition ) {

		if ( empty( $and_condition['objects'] ) ) {
			return false;
		}

		$product_objects   = array();
		$condition_objects = (array) $and_condition['objects']['code'];

		if ( 'product_category' === $and_condition['objectType'] ) {
			$product_objects = $product->get_category_ids();
		} elseif ( 'product' === $and_condition['objectType'] ) {
			$product_objects = (array) $product->get_ID();
		}

		$common             = array_intersect( $condition_objects, $product_objects );
		$has_common_objects = count( $common );

		return 'is_equal_to' === $and_condition['operator'] ?
			( $has_common_objects ? true : false ) :
			( $has_common_objects ? false : true );
	}

	/**
	 * Get conditions data.
	 *
	 * @param int    $post_id   Post ID.
	 * @param string $post_type Post Type.
	 *
	 * @return array
	 */
	public static function get_conditions_data( $post_id, $post_type ) {
		$meta_key = array(
			'orderable_addons'     => '_orderable_addon_conditions',
			'timed_prod_condition' => '_orderable_timed_products_condition',
		);

		$conditions = get_post_meta( $post_id, $meta_key[ $post_type ], true );

		return $conditions;
	}

	/**
	 * Invalidate the cache `orderable_pro_get_applicable_cpt_POST_TYPE`
	 * when the post status change.
	 *
	 * @param string  $new_status New post status.
	 * @param string  $old_status Old post status.
	 * @param WP_Post $post       Post object.
	 * @return void
	 */
	public static function invalidate_cache_on_post_transition_status( $new_status, $old_status, $post ) {
		if ( ! in_array( $post->post_type, array( 'orderable_addons', 'timed_prod_condition' ), true ) ) {
			return;
		}

		if ( $new_status === $old_status ) {
			return;
		}

		/**
		 * Do not delete the cache if the status transitioned between
		 * statuses different of `publish`. E.g.: from `draft` to `pending review`.
		 */
		if ( 'publish' !== $new_status && 'publish' !== $old_status ) {
			return;
		}

		wp_cache_delete( 'orderable_pro_get_applicable_cpt_' . $post->post_type );
	}
}
