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

class Google_API {

  /**
   * [getApDomain description]
   * @return [type] [description]
   */
  public static function getApDomain() {
    return 'https://maps.googleapis.com/';
  }

  /**
   * [distancematrixUrlPath description]
   * @return [type] [description]
   */
  public static function distancematrixUrlPath() {
    return 'maps/api/distancematrix/json';
  }
  
  /**
   * [geocodeUrlPath description]
   * @return [type] [description]
   */
  public static function geocodeUrlPath() {
    return 'maps/api/geocode/json';
  }
  /**
   * [getApiKey description]
   * @return [type] [description]
   */
  public static function getApiKey() {
    $optionData = get_option('restrofood_options');
    return !empty( $optionData['google-api-key'] ) ? $optionData['google-api-key'] : '';
  }

}