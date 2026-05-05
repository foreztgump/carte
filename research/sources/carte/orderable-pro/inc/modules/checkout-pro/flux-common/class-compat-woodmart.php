<?php
/**
 * Iconic_Flux_Compat_Woodmart.
 *
 * Compatibility with Woodmart.
 *
 * @package Iconic_Flux
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( class_exists( 'Iconic_Flux_Compat_Woodmart' ) ) {
	return;
}

/**
 * Iconic_Flux_Compat_Woodmart.
 *
 * @class    Iconic_Flux_Compat_Woodmart.
 * @version  2.0.0.0
 * @package  Iconic_Flux
 */
class Iconic_Flux_Compat_Woodmart {
	/**
	 * Run.
	 */
	public static function run() {
		add_action( 'wp', array( __CLASS__, 'compat_woodmart' ) );
		add_action( 'woocommerce_login_form_end', array( __CLASS__, 'render_social_login' ) );
	}

	/**
	 * Disable Woodmart styles.
	 */
	public static function compat_woodmart() {
		if ( ! function_exists( 'woodmart_enqueue_styles' ) || ( class_exists( 'Iconic_Flux_Flux' ) && ! Iconic_Flux_Flux::is_checkout() || ! Orderable_Checkout_Pro::is_checkout_page() ) ) {
			return;
		}

		remove_action( 'wp_enqueue_scripts', 'woodmart_enqueue_styles', 10000 );
		remove_action( 'wp_footer', 'woodmart_mobile_menu', 130 );
		remove_action( 'wp_footer', 'woodmart_full_screen_main_nav', 120 );
		remove_action( 'wp_footer', 'woodmart_extra_footer_action', 500 );
		remove_action( 'wp_footer', 'woodmart_search_full_screen', 1 );
		remove_action( 'wp_footer', 'woodmart_core_outdated_message', 10 );
		remove_action( 'wp_footer', 'woodmart_cart_side_widget', 140 );
	}

	/**
	 * Render Social Login.
	 *
	 * @return void
	 */
	public static function render_social_login() {

		if ( class_exists( 'Iconic_Flux_Flux' ) && ! Iconic_Flux_Flux::is_checkout() || ! Orderable_Checkout_Pro::is_checkout_page() ) {
			return;
		}

		if ( ! function_exists( 'woodmart_get_opt' ) ) {
			return;
		}

		$vk_app_id      = woodmart_get_opt( 'vk_app_id' );
		$vk_app_secret  = woodmart_get_opt( 'vk_app_secret' );
		$fb_app_id      = woodmart_get_opt( 'fb_app_id' );
		$fb_app_secret  = woodmart_get_opt( 'fb_app_secret' );
		$goo_app_id     = woodmart_get_opt( 'goo_app_id' );
		$goo_app_secret = woodmart_get_opt( 'goo_app_secret' );

		if ( class_exists( 'WOODMART_Auth' ) && ( ( ! empty( $fb_app_id ) && ! empty( $fb_app_secret ) ) || ( ! empty( $goo_app_id ) && ! empty( $goo_app_secret ) ) || ( ! empty( $vk_app_id ) && ! empty( $vk_app_secret ) ) ) ) {
			?>
			<?php woodmart_enqueue_inline_style( 'social-login' ); ?>
			<div class="title wd-login-divider social-login-title<?php echo woodmart_get_old_classes( ' wood-login-divider' ); ?>"><span><?php esc_html_e( 'Or login with', 'woodmart' ); ?></span></div>
			<div class="wd-social-login">
				<?php if ( ! empty( $fb_app_id ) && ! empty( $fb_app_secret ) ) : ?>
					<div class="social-login-btn">
						<a href="<?php echo add_query_arg( 'social_auth', 'facebook', wc_get_page_permalink( 'myaccount' ) ); ?>" class="login-fb-link btn"><?php esc_html_e( 'Facebook', 'woodmart' ); ?></a>
					</div>
				<?php endif ?>
				<?php if ( ! empty( $goo_app_id ) && ! empty( $goo_app_secret ) ) : ?>
					<div class="social-login-btn">
						<a href="<?php echo add_query_arg( 'social_auth', 'google', wc_get_page_permalink( 'myaccount' ) ); ?>" class="login-goo-link btn"><?php esc_html_e( 'Google', 'woodmart' ); ?></a>
					</div>
				<?php endif ?>
				<?php if ( ! empty( $vk_app_id ) && ! empty( $vk_app_secret ) ) : ?>
					<div class="social-login-btn">
						<a href="<?php echo add_query_arg( 'social_auth', 'vkontakte', wc_get_page_permalink( 'myaccount' ) ); ?>" class="login-vk-link btn"><?php esc_html_e( 'VKontakte', 'woodmart' ); ?></a>
					</div>
				<?php endif ?>
			</div>
			<?php
		}
	}
}

