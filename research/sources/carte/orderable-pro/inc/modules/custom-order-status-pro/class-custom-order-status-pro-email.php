<?php
/**
 * The custom email class for Orderable Custom Order Status.
 *
 * @package Orderable/Classes
 */

/**
 * Class Orderable_Custom_Order_Status_Pro_Email
 */
class Orderable_Custom_Order_Status_Pro_Email extends WC_Email {
	/**
	 * From name.
	 *
	 * @var string
	 */
	public $orderable_cos_from_name = '';

	/**
	 * From email.
	 *
	 * @var string
	 */
	public $orderable_cos_from_email = '';

	/**
	 * Notification message.
	 *
	 * @var string
	 */
	public $notification_message = '';

	/**
	 * Notification Title.
	 *
	 * @var string
	 */
	public $notification_title = '';

	/**
	 * Include order table.
	 *
	 * @var bool
	 */
	public $include_order_table = true;


	/**
	 * Include customer information.
	 *
	 * @var bool
	 */
	public $include_customer_info = true;

	/**
	 * Constructor.
	 *
	 * @return void
	 */
	public function __construct() {
		$this->id          = 'wc_orderable_pro_cos_custom_email';
		$this->title       = __( 'Custom Order Status Notification', 'orderable-pro' );
		$this->description = __( 'Custom Order Status Notification by Orderable', 'custom-wc-email' );

		// Template paths.
		$this->template_html  = 'emails/custom-status-template.php';
		$this->template_plain = 'emails/plain/custom-status-template.php';
		$this->template_base  = ORDERABLE_PRO_COS_PATH . 'templates/';

		parent::__construct();
	}

	/**
	 * Get content html.
	 *
	 * @return string
	 */
	public function get_content_html() {
		return wc_get_template_html(
			$this->template_html,
			array(
				'order'                 => $this->object,
				'notification_message'  => $this->notification_message,
				'email_heading'         => $this->notification_title,
				'include_order_table'   => $this->include_order_table,
				'include_customer_info' => $this->include_customer_info,
				'sent_to_admin'         => false,
				'plain_text'            => false,
				'email'                 => $this,
			),
			'',
			$this->template_base
		);
	}

	/**
	 * Get content plain.
	 *
	 * @return string
	 */
	public function get_content_plain() {
		return wc_get_template_html(
			$this->template_plain,
			array(
				'order'                 => $this->object,
				'email_heading'         => $this->notification_title,
				'sent_to_admin'         => false,
				'plain_text'            => true,
				'include_order_table'   => $this->include_order_table,
				'include_customer_info' => $this->include_customer_info,
				'email'                 => $this,
			),
			'',
			$this->template_base
		);
	}


	/**
	 * Trigger Function that will send this email.
	 *
	 * @param int   $order_id     Order ID.
	 * @param array $notification Notification data.
	 *
	 * @return void
	 */
	public function trigger( $order_id, $notification ) {
		if ( empty( $notification['final_email_recipient'] ) ) {
			return;
		}

		$email_type = $this->get_email_type();

		$is_plain_text = ( 'plain' === $email_type || 'email' !== $notification['type'] ) ? true : false;

		$this->order                 = $order_id;
		$this->object                = wc_get_order( $order_id );
		$this->include_order_table   = $notification['include_order_table'];
		$this->include_customer_info = $notification['include_customer_info'];
		$this->notification_message  = Orderable_Custom_Order_Status_Pro_Helper::replace_shortcodes( $notification['message'], $this->object, $is_plain_text );
		$this->notification_title    = Orderable_Custom_Order_Status_Pro_Helper::replace_shortcodes( $notification['title'], $this->object, $is_plain_text );
		$this->notification_subject  = Orderable_Custom_Order_Status_Pro_Helper::replace_shortcodes( $notification['subject'], $this->object, $is_plain_text );

		if ( ! empty( $notification['from_name'] ) ) {
			$this->orderable_cos_from_name = $notification['from_name'];
		}

		if ( ! empty( $notification['from_email'] ) ) {
			$this->orderable_cos_from_email = $notification['from_email'];
		}

		$this->send( $notification['final_email_recipient'], $this->notification_subject, $this->get_content(), $this->get_headers(), $this->get_attachments() );
	}
}
