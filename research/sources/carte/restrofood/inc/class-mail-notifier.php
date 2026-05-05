<?php 
namespace RestroFood\Inc;
/**
 *
 * @package     Restrofood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 *
 */

class Mail_Notifier {

	public static $subject;
	public static $receiverEmail;
	public static $senderEmail;
	public static $options;
	public static $getStatus;
	public static $orderData;

	function __construct() {

		self::$options = get_option('restrofood_options');
		self::setSenderEmail();
		self::setSubject();
	}

	/**
	 * [setOrderData description]
	 * @param [type] $order [description]
	 */
	public function setOrderData( $order ) {
				
		self::$orderData = $order;
		return $this;
	}

	/**
	 * [geReceiverEmail description]
	 * @return [type] [description]
	 */
	public function setReceiverEmail() {
				
		self::$receiverEmail = self::$orderData->get_billing_email();
		return $this;  
	}
	/**
	 * [getSenderEmail description]
	 * @return [type] [description]
	 */
	private static function setSenderEmail() {
		self::$senderEmail = get_option('woocommerce_email_from_address');
	}
	/**
	 * [getSubject description]
	 * @return [type] [description]
	 */
	public function setSubject() {
		$options = self::$options;
		self::$subject = !empty( $options['subject-text'] ) ? esc_html( $options['subject-text'] ) : sprintf( esc_html__(' %s Order Status', 'restrofood' ), get_bloginfo('name') );
	}
	/**
	 * [geReceiverEmail description]
	 * @return [type] [description]
	 */
	private static function getReceiverEmail() {
		return self::$receiverEmail;
	}
	/**
	 * [getSenderEmail description]
	 * @return [type] [description]
	 */
	private static function getSenderEmail() {
		return self::$senderEmail;
	}
	/**
	 * [getSubject description]
	 * @return [type] [description]
	 */
	private static function getSubject() {
		return self::$subject;
	}
	/**
	 * [getMessage description]
	 * @return [type] [description]
	 */
	private static function getMessage() {
		return self::mailTemplate();
	}

	/**
	 * [setHeader description]
	 */
	private static function setHeader() {

		// Always set content-type when sending HTML email
		$headers  = "MIME-Version: 1.0" . "\r\n";
		$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";

		// More headers
		$headers .= 'From: <'.self::$senderEmail.'>' . "\r\n";
		return $headers;
	}
	/**
	 * [mailFunc description]
	 * @return [type] [description]
	 */
	public static function mailFunc() {
		$response = mail( sanitize_email( self::getReceiverEmail() ) , esc_html( self::getSubject() ), self::getMessage(), self::setHeader() );
	}
	/**
	 * [mailTemplate description]
	 * @return [type] [description]
	 */
	public static function mailTemplate() {

		$dateTimeMap = \RestroFood\Date_Time_Map::getDateTime();
  		
		$options 	  = self::$options;
		$order 	 	  =  self::$orderData;
		$orderId 	  =  $order->get_id();
		$customerName =  $order->get_billing_first_name();
		$getStatus 	  = self::$getStatus;
		$dateTime 	  =  $dateTimeMap->format('d-M-Y h:i:sa');

		$headerText = !empty( $options['et-header-text'] ) ? $options['et-header-text'] : esc_html__( 'Thanks for shopping with us', 'restrofood' );
		$footerText = !empty( $options['et-footer-text'] ) ? $options['et-footer-text'] : esc_html__( 'Thanks for shopping with us.', 'restrofood' );
		$bgColor = !empty( $options['et-bg-color'] ) ? $options['et-bg-color'] : '#96588a';


		$template = "
				<html>
				<body>
				<div style='border:1px solid #eee;background-color:#fff;width:600px;margin:0 auto;'>
				<h2 style='background-color:$bgColor;color:#fff;padding:30px 0px;padding-left:25px;margin-bottom: 30px;margin-top: 0px;'>$headerText</h2>
				<div style='padding-left:25px;'>
				<p>Hi $customerName,</p>
				<p>$getStatus</p>
				<p>[Order #$orderId] ($dateTime)</p>
				<p>$footerText</p>
				</div>
				</div>
				</body>
				</html>
				";
		return $template;

	}
	/**
	 * [setStatus description]
	 * @param [type] $status [description]
	 */
	public function setStatus( $status ) {

		$options = self::$options;

		$getStatus = '';

		switch( $status ) {

			case 'OC':
				$getStatus 	= !empty( $options['on-cancel-text'] ) ? $options['on-cancel-text'] : esc_html__( 'Order Cancelled', 'restrofood' );
			break;
			case 'STC':
				$getStatus  = !empty( $options['on-stc-text'] ) ? $options['on-stc-text'] : esc_html__( 'Order send to Cooking', 'restrofood' );
			break;
			case 'AC':
				$getStatus 	= !empty( $options['on-ac-text'] ) ? $options['on-ac-text'] : esc_html__( 'Order accept to cooking', 'restrofood' );
			break;
			case 'CC':
				$getStatus 	= !empty( $options['on-cc-text'] ) ? $options['on-cc-text'] : esc_html__( 'Cooking hasbeen completed', 'restrofood' );
			break;
			case 'OWD':
				$getStatus 	= !empty( $options['on-owd-text'] ) ? $options['on-owd-text'] : esc_html__( 'Order on the way to delivery', 'restrofood' );
			break;
			case 'DC':
				$getStatus 	= !empty( $options['on-dc-text'] ) ? $options['on-dc-text'] : esc_html__( 'Order delivery hasbeen completed', 'restrofood' );
			break;

		}

		self::$getStatus = $getStatus;
		return $this;
	}

}