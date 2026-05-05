<?php
/**
 * Plugin Name: Orderable Pro
 * Author URI: https://orderable.com
 * Description: Pro extension for Orderable, enabling time slots, holidays, layout options, addons, and more.
 * Version: 1.15.0
 * Author: Orderable
 * Text Domain: orderable-pro
 * WC requires at least: 5.4.0
 * WC tested up to: 9.1
 */

defined( 'ABSPATH' ) || exit;
$orderale_settings_check = get_option('orderable_settings');
$orderale_settings_check['dashboard_license_key'] = 'sc432984-********-********';
update_option('orderable_settings', $orderale_settings_check);
/**
 * Orderable main class.
 */
class Orderable_Pro {
	/**
	 * @var string Plugin version.
	 */
	public static $version = '1.15.0';

	/**
	 * @var string Required core version.
	 */
	public static $required_core_version = '1.15.0';

	/**
	 * Construct the plugin.
	 */
	public function __construct() {
		$this->define_constants();

		add_action( 'init', array( $this, 'load_textdomain' ), 10 );
		add_action( 'plugins_loaded', array( $this, 'run' ), 10 );
		add_action( 'woocommerce_blocks_loaded', array( $this, 'load_woocommerce_blocks' ) );

		// Declare compatibility with High-Performance Order Storage (HPOS).
		add_action(
			'before_woocommerce_init',
			function () {
				if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
					\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
				}
			}
		);
	}

	/**
	 * Load Textdomain.
	 */
	public function load_textdomain() {
		load_plugin_textdomain( 'orderable-pro', false, ORDERABLE_PRO_LANGUAGES_PATH );
	}

	/**
	 * Init Orderable Pro after the free version.
	 */
	public function run() {
		if ( ! class_exists( 'Orderable' ) ) {
			add_action( 'admin_notices', array( __CLASS__, 'orderable_notice' ) );

			return;
		}

		if ( ! $this->validate_core_version() ) {
			add_action( 'admin_notices', array( __CLASS__, 'orderable_notice_core_version' ) );

			return;
		}

		add_action( 'orderable_init', array( $this, 'orderable_init' ) );

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );

		do_action( 'orderable_pro_init' );
	}

	/**
	 * Run on Orderable (free) init.
	 */
	public function orderable_init() {
		$this->load_classes();
	}

	/**
	 * Get Orderable free version notice.
	 */
	public static function orderable_notice() {
		?>
		<div class="notice notice-error">
			<p>
				<?php _e( 'Orderable Pro requires the free version of Orderable to be installed and activated.', 'orderable-pro' ); ?>
				<a href="https://wordpress.org/plugins/orderable/"><?php _e( 'Get it now', 'orderable-pro' ); ?></a>.
			</p>
		</div>
		<?php
	}

	/**
	 * Get Orderable free version notice.
	 */
	public static function orderable_notice_core_version() {
		?>
		<div class="notice notice-error">
			<p>
				<?php printf( __( 'Orderable Pro requires the free version of Orderable to be at least v%s. Please update the Orderable plugin.', 'orderable-pro' ), self::$required_core_version ); ?>
				<a href="<?php echo esc_url( admin_url( 'plugins.php' ) ); ?>"><?php _e( 'Update now', 'orderable-pro' ); ?></a>.
			</p>
		</div>
		<?php
	}

	/**
	 * Define Constants.
	 */
	private function define_constants() {
		$this->define( 'ORDERABLE_PRO_SLUG', 'orderable-pro' );
		$this->define( 'ORDERABLE_PRO_PATH', plugin_dir_path( __FILE__ ) );
		$this->define( 'ORDERABLE_PRO_URL', plugin_dir_url( __FILE__ ) );
		$this->define( 'ORDERABLE_PRO_ASSETS_URL', ORDERABLE_PRO_URL . 'assets/' );
		$this->define( 'ORDERABLE_PRO_INC_PATH', ORDERABLE_PRO_PATH . 'inc/' );
		$this->define( 'ORDERABLE_PRO_MODULES_PATH', ORDERABLE_PRO_INC_PATH . 'modules/' );
		$this->define( 'ORDERABLE_PRO_VENDOR_PATH', ORDERABLE_PRO_INC_PATH . 'vendor/' );
		$this->define( 'ORDERABLE_PRO_TEMPLATES_PATH', ORDERABLE_PRO_PATH . 'templates/' );
		$this->define( 'ORDERABLE_PRO_TPL_PATH', ORDERABLE_PRO_PATH . 'templates/' );
		$this->define( 'ORDERABLE_PRO_BASENAME', plugin_basename( __FILE__ ) );
		$this->define( 'ORDERABLE_PRO_LANGUAGES_PATH', dirname( ORDERABLE_PRO_BASENAME ) . '/languages/' );
		$this->define( 'ORDERABLE_PRO_VERSION', self::$version );
	}

	/**
	 * Get plugin URI.
	 *
	 * @return mixed
	 */
	public static function get_plugin_uri() {
		return ltrim( str_replace( WP_PLUGIN_DIR, '', __FILE__ ), '/' );
	}

	/**
	 * Define constant if not already set.
	 *
	 * @param string      $name
	 * @param string|bool $value
	 */
	private function define( $name, $value ) {
		if ( ! defined( $name ) ) {
			define( $name, $value );
		}
	}

	/**
	 * Load classes.
	 */
	private function load_classes() {
		require_once ORDERABLE_PRO_INC_PATH . 'class-modules.php';
		require_once ORDERABLE_PRO_INC_PATH . 'class-license.php';
		require_once ORDERABLE_PRO_INC_PATH . 'class-auto-update.php';
		require_once ORDERABLE_PRO_INC_PATH . 'class-conditions-matcher.php';
		require_once ORDERABLE_PRO_INC_PATH . 'class-compat-wpc-product-timer.php';
		require_once ORDERABLE_PRO_INC_PATH . 'class-helpers.php';
		require_once ORDERABLE_PRO_INC_PATH . 'class-blocks.php';
		require_once ORDERABLE_PRO_INC_PATH . 'class-integrations.php';

		Orderable_Pro_Modules::run();
		Orderable_Pro_License::run();
		Orderable_Pro_Auto_Update::run();
		Orderable_Pro_Wpc_Product_Timer::run();
		Orderable_Pro_Conditions_Matcher::run();
		Orderable_Pro_Blocks::run();
		Orderable_Pro_Integrations::run();
	}

	/**
	 * Validate the Orderable core version number.
	 *
	 * @return bool
	 */
	private static function validate_core_version() {
		if ( ! defined( 'ORDERABLE_VERSION' ) ) {
			return false;
		}

		$core_version = explode( '-', ORDERABLE_VERSION );

		return version_compare( $core_version[0], self::$required_core_version, '>=' );
	}

	/**
	 * Enqueue assets.
	 *
	 * @return void
	 */
	public function enqueue_assets() {
		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		wp_register_script( 'orderable-pro-main', ORDERABLE_PRO_ASSETS_URL . 'admin/js/main' . $suffix . '.js', array( 'jquery' ), ORDERABLE_PRO_VERSION, true );

		wp_localize_script(
			'orderable-pro-main',
			'orderable_pro_main',
			array(
				'search_category' => esc_html__( 'Search for a Category..', 'orderable-pro' ),
				'search_product'  => esc_html__( 'Search for a Product..', 'orderable-pro' ),
			)
		);
	}

	/**
	 * Load WooCommerce blocks.
	 *
	 * @return void
	 */
	public function load_woocommerce_blocks() {
		require_once ORDERABLE_PRO_MODULES_PATH . 'checkout-pro/blocks/order-time/class-checkout-pro-order-time-blocks-integration.php';
		require_once ORDERABLE_PRO_MODULES_PATH . 'checkout-pro/blocks/order-time/class-checkout-pro-order-time-extend-store-api.php';

		add_action(
			'woocommerce_blocks_checkout_block_registration',
			function ( $integration_registry ) {
				$integration_registry->register( new Checkout_Pro_Order_Time_Blocks_Integration() );
			},
			15
		);

		woocommerce_store_api_register_endpoint_data( Checkout_Pro_Order_Time_Extend_Store_API::extend_cart_schema() );
		woocommerce_store_api_register_endpoint_data( Checkout_Pro_Order_Time_Extend_Store_API::extend_checkout_schema() );

		woocommerce_store_api_register_update_callback(
			array(
				'namespace' => 'orderable-pro/tip',
				'callback'  => function ( $data ) {
					$tip_data = array(
						'index'  => wc_clean( wp_unslash( $data['index'] ) ),
						'amount' => wc_clean( wp_unslash( $data['amount'] ) ),
					);

					Orderable_Tip_Pro::set_session_tip_data( $tip_data );

					add_action(
						'woocommerce_cart_calculate_fees',
						function () use ( $tip_data ) {
							WC()->cart->add_fee( __( 'Tip', 'orderable-pro' ), $tip_data['amount'] );
						}
					);
				},
			)
		);

		add_action(
			'woocommerce_store_api_checkout_update_order_from_request',
			array( 'Checkout_Pro_Order_Time_Blocks_Integration', 'save_order_service_time_fields' ),
			10,
			2
		);
	}
}

$orderable_pro = new Orderable_Pro();

/**
 * The code that runs during plugin activation.
 */
register_activation_hook(
	__FILE__,
	function () {
		if ( ! class_exists( 'Orderable' ) ) {
			require_once plugin_dir_path( __FILE__ ) . 'inc/class-core-install.php';
			( new Orderable_Pro_Core_Install() )->maybe_install_core();
		}
	}
);
