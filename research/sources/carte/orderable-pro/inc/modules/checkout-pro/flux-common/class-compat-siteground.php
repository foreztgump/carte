<?php
/**
 * Iconic_Flux_Compat_Siteground.
 *
 * Compatibility with Siteground.
 *
 * @package Iconic_Flux
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( class_exists( 'Iconic_Flux_Compat_Siteground' ) ) {
	return;
}

/**
 * Iconic_Flux_Compat_Siteground.
 *
 * @class    Iconic_Flux_Compat_Siteground.
 * @version  2.0.0.0
 * @package  Iconic_Flux
 */
class Iconic_Flux_Compat_Siteground {
	/**
	 * Run.
	 */
	public static function run() {
		add_action( 'sgo_css_combine_exclude', array( __CLASS__, 'compat_siteground_exclude' ) );
	}

	/**
	 * Siteground optimizer compatibility.
	 *
	 * @param array $exclude_list Exclude List.
	 *
	 * @return array
	 */
	public static function compat_siteground_exclude( $exclude_list ) {
		$exclude_list[] = 'flux-checkout';
		$exclude_list[] = 'orderable-checkout-pro';

		return $exclude_list;
	}
}
