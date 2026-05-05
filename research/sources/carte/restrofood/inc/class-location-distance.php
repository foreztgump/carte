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

class Location_Distance {

  /**
   * [getMainDomain description]
   * @return [type] [description]
   */
  private static function getMainDomain() {
    return \RestroFood\Inc\Google_API::getApDomain();
  }
  /**
   * [getDistancematrixUrlPath description]
   * @return [type] [description]
   */
  private static function getDistancematrixUrlPath() {
    return \RestroFood\Inc\Google_API::distancematrixUrlPath();
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
  public static function longLatToAddress( $origins, $destinations ) {

    $buildUrl = self::getMainDomain().self::getDistancematrixUrlPath();

    $url = add_query_arg( [ "origins" => rawurlencode( $origins ), "destinations" => rawurlencode( $destinations ), "key" => self::getApiKey()  ], $buildUrl );

    $getData = self::remoteGet( $url );

    return $getData['rows'][0]['elements'][0]['distance']['text'];      
  }
  

}
