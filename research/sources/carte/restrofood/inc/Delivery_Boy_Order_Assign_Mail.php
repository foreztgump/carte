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

class Delivery_Boy_Order_Assign_Mail extends Mail_Sender {

	public $options;
	public $boyId;
	public $orderId;

	function __construct() {
		$this->options = get_option('restrofood_options');
		$this->setSenderEmail();
		$this->setSubject();
	}

	/**
	 * [setOrderId description]
	 * @param [type] $orderId [description]
	 */
	public function setBoyId( $boyId ) {
		$this->boyId = $boyId;
		return $this;
	}
	/**
	 * [setOrderId description]
	 * @param [type] $orderId [description]
	 */
	public function setOrderId( $orderId ) {
		$this->orderId = $orderId;
		return $this;
	}

	/**
	 * [geReceiverEmail description]
	 * @return [type] [description]
	 */
	public function setReceiverEmail() {
		$user_info = $this->getUserData();
		$this->receiverEmail = $user_info->user_email;
		return $this;  
	}
	/**
	 * [getSenderEmail description]
	 * @return [type] [description]
	 */
	public function setSenderEmail() {
		$this->senderEmail = get_option('woocommerce_email_from_address');
	}
	/**
	 * [getSubject description]
	 * @return [type] [description]
	 */
	public function setSubject() {
		
		$this->subject = sprintf( esc_html__(' %s Assigned New Order', 'restrofood' ), get_bloginfo('name') );
	}
	/**
	 * [getUserData description]
	 * @return array user data
	 */
	private function getUserData() {
		return get_userdata( $this->boyId );
	}

	/**
	 * [mailTemplate description]
	 * @return [type] [description]
	 */
	protected function mailTemplate() {

		$dateTimeMap  = \RestroFood\Date_Time_Map::getDateTime();
  		$user_info 	  = $this->getUserData();
		$options 	  = $this->options;
		$orderId 	  =  $this->orderId;
		$boyName 	  =  $user_info->user_login;
		$dateTime 	  =  $dateTimeMap->format('d-M-Y h:i:sa');

		$bgColor = !empty( $options['et-bg-color'] ) ? $options['et-bg-color'] : '#96588a';

		$template = "
				<html>
				<body>
				<div style='border:1px solid #eee;background-color:#fff;width:600px;margin:0 auto;'>
				<div style='padding-left:25px;'>
				<p>Hi $boyName,</p>
				<p>You have got a new order for delivery</p>
				<p>[Order #$orderId] Assign on ($dateTime)</p>
				</div>
				</div>
				</body>
				</html>
				";
		return $template;

	}


}