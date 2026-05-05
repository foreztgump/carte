<?php
namespace RestroFood\Admin;
 /**
  * 
  * @package    RestroFood 
  * @since      3.0.0
  * @version    3.0.0
  * @author     ThemeLooks
  * @Websites:  http://themelooks.com/
  *
  */
 
final class Settings_Fields {

	public function fileInclude() {

	require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/checkbox.php';
    require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/switcher.php';
    require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/media.php';
    require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/multiple-select.php';
    require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/number.php';
    require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/select.php';
    require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/time-picker.php';
    require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/textarea.php';
    require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/text.php';
    require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/timezone-select.php';
	require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/location-search.php';
    require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/zipcode.php';
    require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/color.php';
    require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/day-based-time.php';
    require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/km-fee-repeater.php';
    require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/zipcode-multiinput.php';
    require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/product-visibility-time.php';
	//
	require_once RESTROFOOD_DIR_ADMIN.'inc/settings-fields/class-settings-fields-base.php';

	}

}

$obj = new Settings_Fields();

$obj->fileInclude();