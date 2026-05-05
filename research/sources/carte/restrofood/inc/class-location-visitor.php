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

class Location {

  /**
   * [getMainDomain description]
   * @return [type] [description]
   */
  private static function getMainDomain() {
    return \RestroFood\Inc\Google_API::getApDomain();
  }

  /**
   * [getmapUrlPath description]
   * @return [type] [description]
   */
  private static function getmapUrlPath() {
    return \RestroFood\Inc\Google_API::geocodeUrlPath();
  }

  /**
   * [setApiKey description]
   */
  private static function getApiKey() {
    return \RestroFood\Inc\Google_API::getApiKey();
  }

  /**
   * [remoteGet description]
   * @param  [type] $url [description]
   * @return [type]      [description]
   */
  public static function remoteGet( $url ) {
    $response = wp_remote_get( $url );
    return json_decode( wp_remote_retrieve_body( $response ) , true );
  }

  /**
   * [longLatToAddress description]
   * @param  [type] $lat  [description]
   * @param  [type] $long [description]
   * @return [type]       [description]
   */
  public static function longLatToAddress( $lat, $long ) {
    $buildUrl = self::getMainDomain().self::getmapUrlPath();
    $url = add_query_arg( [ "latlng" => "$lat,$long", "key" => self::getApiKey()  ], $buildUrl );
    $getData = self::remoteGet( $url );
    return $getData['results'][0]['formatted_address'];
    
  }
  
}
