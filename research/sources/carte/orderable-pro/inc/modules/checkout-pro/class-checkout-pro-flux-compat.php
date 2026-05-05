<?php
/**
 * Module: Checkout Pro.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Compatibility with Flux Checkout.
 */
class Orderable_Checkout_Pro_Flux_Compat {
	/**
	 * Run.
	 *
	 * @return void
	 */
	public static function run() {
		add_action( 'admin_footer', array( __CLASS__, 'disable_settings_if_flux_is_present' ) );
	}

	/**
	 * Is Flux Checkout active.
	 *
	 * @return bool
	 */
	public static function is_flux_checkout_active() {
		/**
		 * Is Flux Checkout plugin active?
		 *
		 * @since 1.8.0
		 */
		return apply_filters( 'orderable_checkout_pro_is_flux_checkout_active', class_exists( 'Iconic_Flux_Core' ) );
	}

	/**
	 * Disable settings if Flux Checkout if active.
	 *
	 * @return void
	 */
	public static function disable_settings_if_flux_is_present() {
		if ( ! self::is_flux_checkout_active() ) {
			return;
		}

		$screen = get_current_screen();

		if ( empty( $screen ) || 'orderable_page_orderable-settings' !== $screen->id ) {
			return;
		}

		$flux_settings_url = admin_url( 'admin.php?page=iconic-flux-settings' );
		?>
		<script type="text/html" id="orderable-flux-popup">
			<div class="orderable-flux">
				<div class="orderable-flux-popup">
					<div class="orderable-flux-popup__header-iconic-logo">
						<svg width="36" height="43" viewBox="0 0 36 43" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M13.1468 40.7954L16.3827 42.7334V23.3486L13.1468 21.4106V40.7954ZM19.6185 42.7334L35.7991 32.9166V29.1354L19.6185 38.9521V42.7334ZM14.8555 2.6169L31.0361 12.3105L34.1806 10.4258L18 0.733429L14.8555 2.6169ZM6.67384 36.9182L9.90974 38.8562V19.4726L6.67384 17.5334V36.9182ZM19.6185 34.9932L35.7991 25.1765V21.3952L19.6185 31.2132V34.9932ZM8.35407 6.63863L24.5347 16.331L27.6804 14.4475L11.4986 4.7551L8.35407 6.63863ZM3.43676 15.5954L0.200928 13.6574V33.0422L3.43676 34.9802V15.5954ZM19.6185 27.2542L35.7991 17.4363V13.6562L19.6185 23.4742V27.2542ZM1.85264 10.4056L18.0332 20.0981L21.1778 18.2146L4.99715 8.52335L1.85264 10.4056Z" fill="#1B2328"/>
						</svg>
					</div>

					<h2 class="orderable-flux-popup__heading">
						<?php
						/*
						 * translators: 1: <a>, 2: </a>
						 */
						printf( esc_html__( 'The checkout page is currently being managed by %1$sFlux Checkout%2$s', 'orderable-pro' ), "<a href='" . esc_url( $flux_settings_url ) . "'>", '</a>' );
						?>
					</h2>

					<a href="<?php echo esc_url( $flux_settings_url ); ?>" class="button button-primary orderable-flux-popup__button"><?php esc_html_e( 'Manage Flux Checkout Settings', 'orderable-pro' ); ?></a>
				</div>
			</div>
		</script>
		<script>
			jQuery( document ).ready( function($) {
				$('#tab-checkout').append( $('#orderable-flux-popup').html() );
			} );
		</script>
		<style>
			#tab-checkout {
				position: relative;
			}

			.orderable-flux {
				position: absolute;
				width: 100%;
				display: flex;
				height: 100%;
				top: 0;
				left: 0;
				justify-content: center;
				align-items: center;
				background: #ffffffd4;
				text-align: center;
				border-radius: 8px;
				z-index: 20;
			}

			.orderable-flux-popup {
				background: #fff;
				max-width: 444px;
				padding: 60px 80px;
				border-radius: 10px;
				box-shadow: 0px 0px 40px rgb(0 0 0 / 25%);
				position: relative;
				width: 100%;
			}

			.orderable-flux-popup:after {
				content: "\f160";
				position: absolute;
				top: 16px;
				right: 16px;
				font-size: 20px;
				font-family: dashicons;
				color: #1B2328;
			}

			.orderable-flux-popup__header-iconic-logo {
				margin-bottom: 16px;
			}

			h2.orderable-flux-popup__heading {
				max-width: 284px;
				margin: 0 auto 36px auto;
				font-weight: 300;
				font-size: 16px;
				line-height: 24px;
			}

			h2.orderable-flux-popup__heading a {
				font-size: 16px;
				font-weight: 700;
			}

			.button.orderable-flux-popup__button {
				padding: 10px 20px;
				line-height: 1.2;
			}
		</style>
		<?php
	}
}
