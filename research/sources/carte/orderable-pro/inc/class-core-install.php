<?php
/**
 * Install core if not already.
 *
 * @package Orderable_Pro/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Settings class.
 */
class Orderable_Pro_Core_Install {
	/**
	 * Plugin slug.
	 *
	 * @var string Plugin slug.
	 */
	private $slug = 'orderable';

	/**
	 * Plugin path.
	 *
	 * @var string Plugin path.
	 */
	public $plugin = 'orderable/orderable.php';

	/**
	 * Plugin source.
	 *
	 * @var string Temporary free plugin source.
	 */
	public $plugin_src = 'https://iconicwp.com/jeksnrhxk73be/orderable.zip';

	/**
	 * Maybe install the core plugin
	 *
	 * @return void
	 */
	public function maybe_install_core() {
		if ( is_plugin_active( $this->plugin ) ) {
			return;
		}

		if ( ! current_user_can( 'install_plugins' ) ) {
			return;
		}

		$this->install_plugin();
		$this->install_database();
	}

	/**
	 * Install the plugin from the source
	 */
	public function install_plugin() {
		include_once ABSPATH . 'wp-admin/includes/file.php';
		include_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		// if exists and not activated, activate it
		if ( file_exists( WP_PLUGIN_DIR . '/' . $this->plugin ) ) {
			return activate_plugin( $this->plugin );
		}

		// seems like the plugin doesn't exists. Download and activate it
		$upgrader = new \Plugin_Upgrader( new \WP_Ajax_Upgrader_Skin() );

		$api           = plugins_api(
			'plugin_information',
			array(
				'slug'   => $this->slug,
				'fields' => array( 'sections' => false ),
			)
		);
		$download_link = is_wp_error( $api ) ? $this->plugin_src : $api->download_link;

		$result = $upgrader->install( $download_link );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return activate_plugin( $this->plugin );
	}
}
