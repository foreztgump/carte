<?php
/**
 *
 * @package     Restrofood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 */

// Include files

require_once( RESTROFOOD_DIR_INC.'class-google-api.php' );
require_once( RESTROFOOD_DIR_INC.'Mail_Sender.php' );
require_once( RESTROFOOD_DIR_INC.'Delivery_Boy_Order_Assign_Mail.php' );
require_once( RESTROFOOD_DIR_INC.'class-mail-notifier.php' );
require_once( RESTROFOOD_DIR_INC.'class-text.php' );
require_once( RESTROFOOD_DIR_INC.'custom-hooks.php' );
require_once( RESTROFOOD_DIR_INC.'class-date-time-map.php' );
require_once( RESTROFOOD_DIR_INC.'helper-functions.php' );
require_once( RESTROFOOD_DIR_INC.'class-location-visitor.php' );
require_once( RESTROFOOD_DIR_INC.'class-location-distance.php' );
require_once( RESTROFOOD_DIR_INC.'class-ability-checker-form.php' );
require_once( RESTROFOOD_DIR_INC.'class-components-ajax.php' );
require_once( RESTROFOOD_DIR_INC.'class-components.php' );
require_once( RESTROFOOD_DIR_INC.'class-product-layout.php');
require_once( RESTROFOOD_DIR_INC.'class-products.php' );
require_once( RESTROFOOD_DIR_INC.'class-hooks.php' );
require_once( RESTROFOOD_DIR_INC.'class-woo-hooks.php' );
require_once( RESTROFOOD_DIR_INC.'woo-product-tab/woo-product-tab.php' );
require_once( RESTROFOOD_DIR_PATH.'frontend-admin/template-admin-components.php' );
require_once( RESTROFOOD_DIR_INC.'class-order-metabox.php' );
require_once( RESTROFOOD_DIR_INC.'enqueue.php' );
require_once( RESTROFOOD_DIR_INC.'class-order-details-json.php' );
require_once( RESTROFOOD_DIR_PATH.'widgets/Elementor_Init.php' );
require_once( RESTROFOOD_DIR_ADMIN.'admin.php' );
