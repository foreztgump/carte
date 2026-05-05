<?php
/**
 * Tip Pro settings.
 *
 * @package Orderable/Classes
 */
defined( 'ABSPATH' ) || exit;

/**
 * Tip Pro settings class.
 */
class Orderable_Tip_Pro_Settings {
	/**
	 * Init.
	 */
	public static function run() {
		add_filter( 'orderable_default_settings', array( __CLASS__, 'default_settings' ) );
		remove_filter( 'wpsf_register_settings_orderable', array( 'Orderable_Tip', 'register_settings' ), 10 );
		add_filter( 'wpsf_register_settings_orderable', array( __CLASS__, 'register_settings' ), 20 );
	}

	/**
	 * Add default settings.
	 *
	 * @param array $default_settings
	 *
	 * @return array
	 */
	public static function default_settings( $default_settings = array() ) {
		$default_settings['enable_tip']         = '';
		$default_settings['no_tip_label']       = __( 'No Tip', 'orderable-pro' );
		$default_settings['enable_custom_tip']  = '';
		$default_settings['custom_tip_label']   = __( 'Custom Tip', 'orderable-pro' );
		$default_settings['tip_options']        = array(
			array(
				'label'  => '',
				'amount' => 0,
				'type'   => 'fixed',
			),
		);
		$default_settings['default_tip_option'] = 'no_tip';

		return $default_settings;
	}

	/**
	 * Register settings.
	 *
	 * @param array $settings
	 *
	 * @return array
	 */
	public static function register_settings( $settings = array() ) {
		$settings['tabs'][] = array(
			'id'       => 'tip',
			'title'    => __( 'Tip Settings', 'orderable-pro' ),
			'priority' => 20,
		);

		$settings['sections'][] = array(
			'tab_id'              => 'tip',
			'section_id'          => 'general',
			'section_title'       => __( 'Tip Settings', 'orderable-pro' ),
			'section_description' => '',
			'section_order'       => 0,
			'fields'              => array(
				array(
					'id'       => 'enable_tip',
					'title'    => __( 'Enable Tipping', 'orderable-pro' ),
					'subtitle' => __( 'Show tipping options at checkout.', 'orderable-pro' ),
					'type'     => 'checkbox',
					'default'  => '',
				),
				array(
					'id'       => 'tip_options',
					'title'    => __( 'Tip Options', 'orderable-pro' ),
					'subtitle' => __( 'Enter the tip options you want to display at checkout. We recommend adding 3 options.', 'orderable-pro' ),
					'type'     => 'custom',
					'default'  => '',
					'output'   => self::get_tip_options_fields(),
				),
				array(
					'id'       => 'default_tip_option',
					'title'    => __( 'Default Option', 'orderable-pro' ),
					'subtitle' => __( 'Choose which option is pre-selected in checkout. The options are updated after saving.', 'orderable-pro' ),
					'type'     => 'custom',
					'default'  => '',
					'output'   => self::get_default_tip_option_fields(),
				),
				array(
					'id'       => 'no_tip_label',
					'title'    => __( 'No Tip Label', 'orderable-pro' ),
					'subtitle' => __( 'Enter a label for the "No Tip" button at checkout.', 'orderable-pro' ),
					'type'     => 'text',
					'default'  => __( 'No Tip', 'orderable-pro' ),
				),
				array(
					'id'       => 'enable_custom_tip',
					'title'    => __( 'Enable Custom Tip', 'orderable-pro' ),
					'subtitle' => __( 'Allow customers to enter their own tip amount at checkout.', 'orderable-pro' ),
					'type'     => 'checkbox',
					'default'  => '',
				),
				array(
					'id'       => 'custom_tip_label',
					'title'    => __( 'Custom Tip Label', 'orderable-pro' ),
					'subtitle' => __( 'Enter a label for the "Custom Tip" button.', 'orderable-pro' ),
					'type'     => 'text',
					'default'  => __( 'Custom Tip', 'orderable-pro' ),
				),
			),
		);

		return $settings;
	}

	/**
	 * Get predefined tips options fields.
	 *
	 * @return void|false|string
	 */
	public static function get_tip_options_fields() {
		if ( ! is_admin() ) {
			return;
		}

		$settings = Orderable_Settings::get_setting( 'tip_options' );
		$defaults = Orderable_Settings::get_setting_default( 'tip_options' );

		$defaults = $defaults[0];

		ob_start();
		?>
		<div class="orderable-toolbar">
			<div class="orderable-toolbar__actions">
				<button class="orderable-admin-button orderable-admin-button--primary" data-orderable-trigger="new-row" data-orderable-target=".orderable-table--tip_options">
					<span class="dashicons dashicons-plus"></span> <?php esc_html_e( 'Add Option', 'orderable-pro' ); ?>
				</button>
			</div>
		</div>
		<table class="orderable-table orderable-table--tip_options" cellpadding="0" cellspacing="0" style="max-width: 500px;">
			<tbody class="orderable-table__body">
			<?php
			foreach ( $settings as $index => $settings_row ) {
				$label  = isset( $settings_row['label'] ) ? $settings_row['label'] : $defaults['label'];
				$amount = isset( $settings_row['amount'] ) ? $settings_row['amount'] : $defaults['amount'];
				$type   = isset( $settings_row['type'] ) ? $settings_row['type'] : $defaults['type'];
				?>
				<tr class="orderable-table__row orderable-table__row--repeatable" data-orderable-index="<?php echo esc_attr( $index ); ?>">
					<td class="orderable-table__cell orderable-table__cell--no-padding">
						<table class="orderable-table orderable-table--child" cellpadding="0" cellspacing="0">
							<tbody>
							<tr>
								<th class="orderable-table__column orderable-table__column--medium"><?php esc_html_e( 'Label', 'orderable-pro' ); ?></th>
								<td class="orderable-table__column">
									<input type="text" name="orderable_settings[tip_options][<?php echo esc_attr( $index ); ?>][label]" value="<?php esc_attr_e( $label ); ?>">
								</td>
							</tr>
							<tr>
								<th class="orderable-table__column orderable-table__column--medium"><?php esc_html_e( 'Amount', 'orderable-pro' ); ?></th>
								<td class="orderable-table__column">
									<input type="number" name="orderable_settings[tip_options][<?php echo esc_attr( $index ); ?>][amount]" value="<?php esc_attr_e( $amount ); ?>">
								</td>
							</tr>
							<tr>
								<th class="orderable-table__column orderable-table__column--medium"><?php esc_html_e( 'Type', 'orderable-pro' ); ?></th>
								<td class="orderable-table__column">
									<select class="orderable-select" name="orderable_settings[tip_options][<?php echo esc_attr( $index ); ?>][type]" data-orderable-trigger="toggle-element-select" data-orderable-parent=".orderable-table__row">
										<option value="fixed" <?php selected( $settings_row['type'], 'fixed' ); ?>><?php esc_html_e( 'Fixed', 'orderable-pro' ); ?></option>
										<option value="percentage" <?php selected( $settings_row['type'], 'percentage' ); ?>><?php esc_html_e( 'Percentage', 'orderable-pro' ); ?></option>
									</select>
								</td>
							</tr>
							</tbody>
						</table>
					</td>
					<td class="orderable-table__column orderable-table__column--remove">
						<a href="javascript: void( 0 );" class="orderable-table__remove-row" data-orderable-trigger="remove-row"><span class="dashicons dashicons-trash"></span></a>
					</td>
				</tr>
			<?php } ?>
			</tbody>
		</table>
		<?php
		return ob_get_clean();
	}

	/**
	 * Get default tips option fields.
	 *
	 * @return void|false|string
	 */
	public static function get_default_tip_option_fields() {
		if ( ! is_admin() ) {
			return;
		}

		$default_tip_option = Orderable_Settings::get_setting( 'default_tip_option' );
		$tip_options        = self::get_tip_options();

		ob_start();
		?>
		<select class="orderable-select" name="orderable_settings[default_tip_option]" data-orderable-trigger="toggle-element-select" data-orderable-parent=".orderable-table__row">
			<option value="no_tip" <?php selected( $default_tip_option, 'no_tip' ); ?>><?php esc_html_e( 'No Tip', 'orderable-pro' ); ?></option>
			<?php
			if ( ! empty( $tip_options ) ) {
				foreach ( $tip_options as $index => $tip_option ) {
					?>
					<option value="<?php echo $index; ?>" <?php selected( $default_tip_option, $index ); ?>><?php echo esc_attr( $tip_option['label'] ); ?></option>
												<?php
				}
			}
			?>
		</select>
		<?php
		return ob_get_clean();
	}

	/**
	 * Get tip options.
	 *
	 * @return array
	 */
	public static function get_tip_options() {
		$tip_options = Orderable_Settings::get_setting( 'tip_options' );

		if ( ! empty( $tip_options ) ) {
			foreach ( $tip_options as $key => $tip_option ) {
				if ( empty( $tip_option['amount'] ) ) {
					unset( $tip_options[ $key ] );
					continue;
				}

				$tip_options[ $key ]['label'] = empty( $tip_option['label'] ) ? $tip_option['amount'] : $tip_option['label'];
			}
		}

		return apply_filters( 'orderable_get_tip_options', $tip_options );
	}

	/**
	 * Get tip options.
	 *
	 * @return mixed|void
	 */
	public static function get_tip_options_prepared() {
		static $prepared_tip_options = null;

		if ( null !== $prepared_tip_options ) {
			return $prepared_tip_options;
		}

		if ( ! function_exists( 'WC' ) || ( empty( WC()->cart ) ) ) {
			return apply_filters( 'orderable_get_tip_options_prepared', array() );
		}

		$cart_total       = WC()->cart->get_subtotal();
		$active_tip_index = Orderable_Tip_Pro::get_active_tip_index();
		$tip_options      = self::get_tip_options();

		if ( ! empty( $tip_options ) ) {
			foreach ( $tip_options as $key => $tip_option ) {
				$tip_options[ $key ]['active'] = $key === $active_tip_index;

				if ( 'percentage' === $tip_option['type'] ) {
					$tip_options[ $key ]['amount'] = number_format( ( $cart_total * $tip_option['amount'] ) / 100, 2, '.', '' );
				}
			}
		}

		$prepared_tip_options = $tip_options;

		/**
		 * To modify the prepared tips array.
		 *
		 * @since 1.6.0
		 * @param $tip_options Tip options.
		 */
		return apply_filters( 'orderable_get_tip_options_prepared', $tip_options );
	}
}
