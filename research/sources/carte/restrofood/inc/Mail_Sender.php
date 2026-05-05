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

abstract class Mail_Sender {

	public $subject;
	public $receiverEmail;
	public $senderEmail;

	function __construct() {}

	/**
	 * [geReceiverEmail description]
	 * @return [type] [description]
	 */
	public function setReceiverEmail() {}
	/**
	 * [getSenderEmail description]
	 * @return [type] [description]
	 */
	public function setSenderEmail() {}
	/**
	 * [getSubject description]
	 * @return [type] [description]
	 */
	public function setSubject() {}
	/**
	 * [geReceiverEmail description]
	 * @return [type] [description]
	 */
	private function getReceiverEmail() {
		return $this->receiverEmail;
	}
	/**
	 * [getSenderEmail description]
	 * @return [type] [description]
	 */
	private function getSenderEmail() {
		return $this->senderEmail;
	}
	/**
	 * [getSubject description]
	 * @return [type] [description]
	 */
	private function getSubject() {
		return $this->subject;
	}
	/**
	 * [getMessage description]
	 * @return [type] [description]
	 */
	private function getMessage() {
		return $this->mailTemplate();
	}
	/**
	 * [mailTemplate description]
	 * @return [type] [description]
	 */
	abstract protected function mailTemplate();
	/**
	 * [setHeader description]
	 */
	private function setHeader() {

		// Always set content-type when sending HTML email
		$headers  = "MIME-Version: 1.0" . "\r\n";
		$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";

		// More headers
		$headers .= 'From: <'.$this->senderEmail.'>' . "\r\n";
		return $headers;
	}
	/**
	 * [mailFunc description]
	 * @return [type] [description]
	 */
	public function mailFunc() {
		return $response = mail( sanitize_email( $this->getReceiverEmail() ) , esc_html( $this->getSubject() ), $this->getMessage(), $this->setHeader() );
	}

}