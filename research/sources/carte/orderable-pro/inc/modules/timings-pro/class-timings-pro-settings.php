<?php
/**
 * Timings Pro settings.
 *
 * @package Orderable/Classes
 */

defined( 'ABSPATH' ) || exit;

/**
 * Timings Pro settings class.
 */
class Orderable_Timings_Pro_Settings {
	/**
	 * Init.
	 */
	public static function run() {
		add_filter( 'wpsf_register_settings_orderable', array( __CLASS__, 'register_settings' ), 20 );
		add_filter( 'orderable_get_max_orders_field', array( __CLASS__, 'get_max_orders_field' ), 10, 3 );
		add_filter( 'orderable_get_time_slot_fields', array( __CLASS__, 'get_time_slot_fields' ), 10, 3 );
	}

	/**
	 * Register settings.
	 *
	 * @param array $settings
	 *
	 * @return array
	 */
	public static function register_settings( $settings = array() ) {
		if ( empty( $settings['sections']['store_general']['fields']['asap']['choices'] ) ) {
			return $settings;
		}

		$settings['sections']['store_general']['fields']['asap']['choices']['slot'] = __( 'Allow "ASAP" as an option when choosing delivery time', 'orderable-pro' );

		return $settings;
	}

	/**
	 * Get max orders field.
	 *
	 * @param string $field
	 * @param string $name
	 * @param array  $settings
	 *
	 * @return false|string
	 */
	public static function get_max_orders_field( $field, $name, $settings = array() ) {
		$max_orders = ! empty( $settings['max_orders'] ) ? $settings['max_orders'] : '';

		ob_start();
		?>
		<strong class="orderable-table__rwd-labels"><?php esc_attr_e( 'Max Orders (Day)', 'orderable-pro' ); ?></strong>
		<input type="number" name="<?php echo esc_attr( $name ); ?>" value="<?php echo esc_attr( $max_orders ); ?>">
		<?php

		return ob_get_clean();
	}

	/**
	 * Get time slot fields.
	 *
	 * @param string $field
	 * @param string $name
	 * @param array  $settings
	 *
	 * @return false|string
	 */
	public static function get_time_slot_fields( $field, $name, $settings = array() ) {
		ob_start();
		?>
		<tr data-orderable-period="time-slots" 
		<?php
		if ( 'all-day' === $settings['period'] ) {
			echo 'style="display: none;"';
		}
		?>
		>
			<th class="orderable-table__column orderable-table__column--medium"><?php _e( 'Hours', 'orderable-pro' ); ?></th>
			<td class="orderable-table__column orderable-table__column--time">
				<fieldset class="orderable-table__fieldset orderable-table__fieldset--nowrap">
					<legend><?php _e( 'From:', 'orderable-pro' ); ?></legend>
					<?php echo Orderable_Timings_Settings::get_time_field( $name . '[from]', $settings['from'] ); ?>
				</fieldset>
				<fieldset class="orderable-table__fieldset orderable-table__fieldset--nowrap">
					<legend><?php _e( 'To:', 'orderable-pro' ); ?></legend>
					<?php echo Orderable_Timings_Settings::get_time_field( $name . '[to]', $settings['to'] ); ?>
				</fieldset>
			</td>
		</tr>
		<tr data-orderable-period="time-slots" 
		<?php
		if ( 'all-day' === $settings['period'] ) {
			echo 'style="display: none;"';
		}
		?>
		>
			<th class="orderable-table__column orderable-table__column--medium"><?php _e( 'Frequency (Mins)', 'orderable-pro' ); ?></th>
			<td>
				<input type="number" name="<?php echo esc_attr( $name ); ?>[frequency]" value="<?php echo esc_attr( $settings['frequency'] ); ?>" placeholder="<?php esc_attr_e( 'Default: 30', 'orderable-pro' ); ?>">
			</td>
		</tr>
		<tr data-orderable-period="time-slots" 
		<?php
		if ( 'all-day' === $settings['period'] ) {
			echo 'style="display: none;"';
		}
		?>
		>
			<th class="orderable-table__column orderable-table__column--medium"><?php _e( 'Lead Time (Mins)', 'orderable-pro' ); ?></th>
			<td>
				<input type="number" name="<?php echo esc_attr( $name ); ?>[cutoff]" value="<?php echo esc_attr( $settings['cutoff'] ); ?>">
			</td>
		</tr>
		<tr data-orderable-period="time-slots" 
		<?php
		if ( 'all-day' === $settings['period'] ) {
			echo 'style="display: none;"';
		}
		?>
		>
			<th class="orderable-table__column orderable-table__column--medium"><?php _e( 'Max Orders (Slot)', 'orderable-pro' ); ?></th>
			<td>
				<input type="number" name="<?php echo esc_attr( $name ); ?>[max_orders]" value="<?php echo esc_attr( $settings['max_orders'] ); ?>">
			</td>
		</tr>
		<?php

		return ob_get_clean();
	}
}