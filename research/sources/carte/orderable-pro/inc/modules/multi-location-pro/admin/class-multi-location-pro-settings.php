<?php
/**
 * Multi-location Pro settings class.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Multi-location Pro settings class.
 */
class Orderable_Multi_Location_Pro_Settings {

	/**
	 * Transient cache key.
	 *
	 * @var string
	 */
	public static $all_pages_transient_key = 'orderable_settings_all_pages';

	/**
	 * Init.
	 */
	public static function run() {
		add_action( 'save_post_page', array( __CLASS__, 'clear_transient' ) );

		add_filter( 'wpsf_register_settings_orderable', array( __CLASS__, 'register_settings' ), 20 );
		add_filter( 'orderable_default_settings', array( __CLASS__, 'default_settings' ) );
		add_filter( 'orderable_asap_order_options', array( __CLASS__, 'output_asap_order_options' ) );
	}

	/**
	 * Load classes.
	 *
	 * @return void
	 */
	protected static function load_classes() {
		$meta_boxes = array(
			'location-open-hours-meta-box' => 'Orderable_Location_Open_Hours_Meta_Box',
			'location-holidays-meta-box'   => 'Orderable_Location_Holidays_Meta_Box',
		);

		Orderable_Helpers::load_classes(
			$meta_boxes,
			'location/admin/meta-boxes',
			ORDERABLE_MODULES_PATH
		);
	}

	/**
	 * Register Settings.
	 *
	 * @param array $settings Settings.
	 *
	 * @return array
	 */
	public static function register_settings( $settings = array() ) {
		self::load_classes();

		$settings['tabs'][] = array(
			'id'       => 'integrations',
			'title'    => __( 'Integrations', 'orderable-pro' ),
			'priority' => 100,
		);

		$settings['tabs'][] = array(
			'id'       => 'locations',
			'title'    => __( 'Locations', 'orderable-pro' ),
			'priority' => 15,
		);

		$settings['sections'][] = array(
			'tab_id'              => 'integrations',
			'section_id'          => 'integrations',
			'section_title'       => __( 'Integrations', 'orderable-pro' ),
			'section_description' => '',
			'section_order'       => 0,
			'fields'              => array(
				array(
					'id'          => 'google_api_key',
					'title'       => __( 'Google API Key', 'orderable-pro' ),
					'type'        => 'text',
					'subtitle'    => __( 'Your Google API key to enable Geolocate for Location picker.', 'orderable-pro' ),
					'default'     => '',
					'placeholder' => '',
				),
			),
		);

		$settings['sections'][] = array(
			'tab_id'              => 'locations',
			'section_id'          => 'multi_location',
			'section_title'       => __( 'Location Picker', 'orderable-pro' ),
			'section_description' => '',
			'section_order'       => 10,
			'fields'              => array(
				array(
					'id'          => 'require_location',
					'title'       => __( 'Require a location to be selected before shopping', 'orderable-pro' ),
					'type'        => 'checkbox',
					'subtitle'    => '',
					'default'     => '',
					'placeholder' => '',
				),
				array(
					'id'          => 'popup',
					'title'       => __( 'Show location selector popup', 'orderable-pro' ),
					'type'        => 'select',
					'subtitle'    => __( 'Automatically show the location selector popup when the location is not set.', 'orderable-pro' ),
					'choices'     => array(
						'all_pages'      => __( 'On all pages', 'orderable-pro' ),
						'specific_pages' => __( 'On specific pages', 'orderable-pro' ),
						'dont_show'      => __( 'Dont show', 'orderable-pro' ),
					),
					'default'     => 'dont_show',
					'placeholder' => '',
				),
				array(
					'id'       => 'pages',
					'title'    => __( 'Pages', 'orderable-pro' ),
					'type'     => 'select',
					'subtitle' => __( 'Select pages where location selector will appear.', 'orderable-pro' ),
					'choices'  => self::get_all_pages(),
					'default'  => '',
					'multiple' => true,
					'show_if'  => array(
						array(
							'field' => 'locations_multi_location_popup',
							'value' => array( 'specific_pages' ),
						),
					),
				),
				array(
					'id'       => 'mini_locator_title',
					'title'    => __( 'Mini Locator Title', 'orderable-pro' ),
					'type'     => 'select',
					'choices'  => array(
						'location_name' => __( 'Location Name', 'orderable-pro' ),
						'postcode'      => __( 'Postcode', 'orderable-pro' ),
					),
					'subtitle' => 'Choose between displaying location name or postcode in Mini location picker.',
					'default'  => 'location_name',
				),
			),
		);

		$open_hours_settings = Orderable_Settings::get_setting( Orderable_Timings_Settings::$open_hours_key );

		$settings['sections'][] = array(
			'tab_id'              => 'locations',
			'section_id'          => 'locations-open-hours',
			'section_title'       => __( 'Default settings', 'orderable-pro' ),
			'section_description' => '',
			'section_order'       => 0,
			'fields'              => array(
				array(
					'id'       => 'open_hours',
					'title'    => __( 'Open Hours', 'orderable-pro' ),
					'subtitle' => __( 'The days and hours your location is open. Leave "Max Orders" empty for no limit.', 'orderable-pro' ),
					'type'     => 'custom',
					'default'  => '',
					'output'   => Orderable_Location_Open_Hours_Meta_Box::get_open_hours_fields( $open_hours_settings ),
				),
				array(
					'id'       => 'timezone',
					'title'    => __( 'Timezone', 'orderable' ),
					'subtitle' => __( "Your location's current timezone. This should be set to the location of your location.", 'orderable' ),
					'type'     => 'custom',
					'default'  => '',
					'output'   => self::get_timezone_field(),
				),
				array(
					'id'       => 'location-holidays',
					'title'    => __( 'Holidays', 'orderable-pro' ),
					'subtitle' => __( 'Days when your location is closed.', 'orderable-pro' ),
					'type'     => 'custom',
					'default'  => '',
					'output'   => self::get_holidays_field(),
				),
			),
		);

		return $settings;
	}

	/**
	 * Get the holidays field.
	 *
	 * @return string
	 */
	protected static function get_holidays_field() {
		$holidays_settings = Orderable_Settings::get_setting( Orderable_Timings_Settings::$holidays_key );
		$field_name_prefix = 'orderable_settings[' . Orderable_Timings_Settings::$holidays_key . ']';

		ob_start();
		Orderable_Location_Holidays_Meta_Box::holiday_fields( $holidays_settings, $field_name_prefix );
		$holidays_field_output = ob_get_clean();

		return $holidays_field_output;
	}

	/**
	 * Get the timezone field
	 *
	 * @return string
	 */
	protected static function get_timezone_field() {
		$allowed_html    = array(
			'code' => array(),
			'a'    => array(
				'href'   => array(),
				'target' => array(),
			),
		);
		$timezone_format = _x( 'Y-m-d H:i:s', 'timezone date format' );

		$timezone_description = Orderable_Location_Open_Hours_Meta_Box::get_timezone_description();

		$utc_time = sprintf(
			/* translators: %s: UTC time. */
			__( 'Universal time is %s.' ),
			'<code>' . date_i18n( $timezone_format, false, true ) . '</code>'
		);

		$local_time = sprintf(
			/* translators: %s: Local time. */
			__( 'Local time is %s.' ),
			'<code>' . date_i18n( $timezone_format ) . '</code>'
		);

		ob_start();
		?>
			<p>
				<?php echo wp_kses( $timezone_description, $allowed_html ); ?>
			</p>
			<p>
				<?php echo wp_kses( $utc_time, $allowed_html ); ?>
			</p>

			<?php if ( get_option( 'timezone_string' ) || ! empty( get_option( 'gmt_offset' ) ) ) : ?>
				<p>
					<?php echo wp_kses( $local_time, $allowed_html ); ?>
				</p>
			<?php endif; ?>
		<?php

		return ob_get_clean();
	}

	/**
	 * Get all pages.
	 *
	 * @return array
	 */
	public static function get_all_pages() {
		$pages = get_transient( self::$all_pages_transient_key );
		if ( $pages ) {
			return $pages;
		}

		$args = array(
			'post_type'      => 'page',
			'posts_per_page' => 200,
		);

		$pages = get_posts( $args );

		$result = array();

		foreach ( $pages as $page ) {
			$result[ $page->ID ] = $page->post_title;
		}

		set_transient( self::$all_pages_transient_key, $result, HOUR_IN_SECONDS );

		return $result;
	}

	/**
	 * Delete transient on page update.
	 *
	 * @return void
	 */
	public static function clear_transient() {
		delete_transient( self::$all_pages_transient_key );
	}

	/**
	 * Define default setting for multi-location.
	 *
	 * @param array $default_settings Default settings.
	 *
	 * @return array
	 */
	public static function default_settings( $default_settings = array() ) {
		$default_settings['locations_multi_location_popup']              = 'dont_show';
		$default_settings['locations_multi_location_mini_locator_title'] = 'location_name';

		return $default_settings;
	}

	/**
	 * Output additional ASAP order options.
	 *
	 * @param Orderable_Location_Single $location Orderable_Location_Single instance.
	 *
	 * @return void
	 */
	public static function output_asap_order_options( $location ) {
		$asap                          = $location->get_asap_settings();
		$is_asap_delivery_time_enabled = ! empty( $asap['time'] );

		$toggle_class = array(
			'orderable-toggle-field',
			'woocommerce-input-toggle',
		);

		$asap_delivery_time_toggle_class[] = $is_asap_delivery_time_enabled ? 'woocommerce-input-toggle--enabled' : 'woocommerce-input-toggle--disabled';
		$asap_delivery_time_toggle_class   = join( ' ', array_merge( $toggle_class, $asap_delivery_time_toggle_class ) );

		?>
		<div class="orderable-toggle-field-wrapper">
			<span
				class="<?php echo esc_attr( $asap_delivery_time_toggle_class ); ?>"
			>
				<?php echo esc_html( 'On delivery time' ); ?>
			</span>

			<input
				type="hidden"
				name="orderable_location_order_options_asap_delivery_time"
				class="orderable-toggle-field__input"
				value="<?php echo esc_attr( $is_asap_delivery_time_enabled ? 'yes' : 'no' ); ?>"
			/>

			<span class="orderable-toggle-field__label-wrapper">
				<span class="orderable-toggle-field__label">
					<?php echo esc_html__( 'On delivery time' ); ?>
				</span>
				<span class="orderable-toggle-field__label-help">
					<?php echo esc_html__( 'Allow "ASAP" as an option when choosing delivery time' ); ?>
				</span>
			</span>
		</div>
		<?php
	}
}
