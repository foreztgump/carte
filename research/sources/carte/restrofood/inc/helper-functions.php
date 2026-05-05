<?php 
/**
 *
 * @package     Restrofood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 *
 */

/**
 * [restrofood_getOptionData description]
 * @return [type] [description]
 */
function restrofood_getOptionData( $key, $defaultValue = '' ) {

  $data = get_option( 'restrofood_options' );
  return !empty( $data[$key] ) ? $data[$key] : $defaultValue;
}

/**
 * [restrofood_get_categories description]
 * @return array
 */
function restrofood_get_categories() {

  $taxonomies = restrofood_get_terms('product_cat');
  
  $output = [ '' => esc_html__( 'All', 'restrofood' ) ];

  if ( !empty( $taxonomies ) ) {
      
      foreach( $taxonomies as $category ) {
        $output[$category->slug] =  $category->name;
      }
  }

  return $output;

}

/**
 * [restrofood_get_productCategories description]
 * @return array
 */
function restrofood_get_productCategories() {

  $taxonomies = restrofood_get_terms('product_cat');
  
  $output = $getlist = '';

  $totalCat = 0;

  if ( !empty( $taxonomies ) ) {
      
      foreach( $taxonomies as $category ) {
        $totalCat += $category->count;
        if( $category->parent == 0 ) {
            $getlist .=  restrofood_product_cat_html( $category, 'rb_product_category', '' );
            foreach( $taxonomies as $subcategory ) {
                if($subcategory->parent == $category->term_id) {
                  $totalCat += $subcategory->count;
                  $getlist .=  restrofood_product_cat_html( $subcategory, 'rb_product_category', 'item-sub-category' );
                }
            }
        }
      }

    $output.= '<li>
                <input type="radio" data-name="'.esc_html__('All', 'restrofood').'" name="rb_product_category" value="" id="cat-all">
                <label for="cat-all">
                    <span class="rb_cat_name">'.esc_html__('All', 'restrofood').'</span>
                    <span class="rb_cat_count">'.esc_html( $totalCat ).'</span>
                </label>
            </li>';

    $output .= $getlist;

  }

  return $output;

}

/**
 * [restrofood_product_cat_html description]
 * @param  [type] $cat [description]
 * @return html
 */
function restrofood_product_cat_html( $cat, $name, $class = '' ) {
  ob_start()
  ?>
  <li class="<?php echo esc_attr( $class ); ?>">
      <input type="radio" data-name="<?php echo esc_attr( $cat->name ) ?>" name="<?php echo esc_attr( $name ); ?>" value="<?php echo esc_attr( $cat->slug ); ?>" id="<?php echo esc_attr( $cat->slug ); ?>">
      <label for="<?php echo esc_attr( $cat->slug ); ?>">
          <span class="rb_cat_name"><?php echo esc_html( $cat->name ) ?></span>
          <?php 
          if( !empty( $cat->count ) ) {
            echo '<span class="rb_cat_count">'.esc_html( $cat->count ).'</span>';
          }
          ?>
      </label>
  </li>
  <?php
  return ob_get_clean();
}


/**
 * [foodman_getSpecialOffer description]
 * @return array
 */
function restrofood_getSpecialOffer() {

    $terms = restrofood_get_terms('specialoffer');

    $output = $getList = '';
    $totalCat = 0;
    if( !empty( $terms ) ) {

      foreach( $terms as $term ){
        $getList .= restrofood_product_cat_html( $term, 'rb_product_specialoffer', '' );
        $totalCat += $term->count;
      }

      $output .= '<li>
                  <input type="radio" data-name="'.esc_html__('All', 'restrofood').'" name="rb_product_specialoffer" value="" id="offer-all">
                  <label for="offer-all">
                      <span class="rb_cat_name">'.esc_html__('All', 'restrofood').'</span>
                      <span class="rb_cat_count">'.esc_html( $totalCat ).'</span>
                  </label>
              </li>';
      $output .= $getList;

    }

  return $output;
}

/**
 * [foodman_getSpecialOffer description]
 * @return array
 */
function restrofood_getVisibility() {

    $terms = restrofood_get_terms('product-visibility');

    $output = $getList = '';
    $totalCat = 0;
    if( !empty( $terms ) ) {

      foreach( $terms as $term ) {
        $totalCat += $term->count;
        $getList .= restrofood_product_cat_html( $term, 'rb_product_visibility', '' );
      }

      $output .= '<li>
                  <input type="radio" data-name="'.esc_html__('All', 'restrofood').'" name="rb_product_visibility" value="" id="visibility-all">
                  <label for="offer-all">
                      <span class="rb_cat_name">'.esc_html__('All', 'restrofood').'</span>
                      <span class="rb_cat_count">'.esc_html( $totalCat ).'</span>
                  </label>
              </li>';

      $output .= $getList;
    }

  return $output;
}

/**
 * [restrofood_get_specialOffer_terms description]
 * @return array
 */
function restrofood_get_terms( $taxonomy ) {
  $terms = get_terms( array(
      'taxonomy' => $taxonomy,
      'hide_empty' => true,
  ) );
  return $terms;
}

/**
 * [restrofood_get_pages description]
 * @return array
 */
function restrofood_get_pages() {

  $pages = get_pages();

  $getPages = [];

  foreach( $pages as $page ) {
    $getPages[$page->post_name] = $page->post_title;
  }

  return $getPages;
  
}

/**
 * [restrofood_rating_reviews description]
 * @param  string  $rating [description]
 * @param  boolean $echo   [description]
 * @return html          [description]
 */
function restrofood_rating_reviews( $rating, $echo = true ) {

  $starRating = '';

  $j = 0;

    for( $i = 0; $i <= 4; $i++ ) {
      $j++;

      if( $rating  >= $j   || $rating  == '5'   ) {

        $starRating .= '<i class="fas fa-star"></i>';

      }elseif( $rating < $j && $rating  > $i )
      {
        $starRating .= '<i class="fas fa-star-half-alt"></i>';

      } else {

        $starRating .= '<i class="far fa-star"></i>';

      }

    }

    if( $echo == true ) {
      echo $starRating;
    } else {
      return $starRating;
    }


}

/**
 * [restrofood_getStatusText description]
 * @return [type] [description]
 */
function restrofood_getStatusText() {

  return [

    'no'    => restrofood_getOptionData( 'new-order-text', esc_html__( 'New Order', 'restrofood' ) ),
    'op'    => restrofood_getOptionData( 'order-placed-text', esc_html__( 'Order Placed', 'restrofood' ) ),
    'po'    => restrofood_getOptionData( 'pre-order-text', esc_html__( 'Pre Order', 'restrofood' ) ),
    'oc'    => restrofood_getOptionData( 'order-cancel-text', esc_html__( 'Order Cancel', 'restrofood' ) ),
    'of'    => restrofood_getOptionData( 'order-failed-text', esc_html__( 'Order Failed', 'restrofood' ) ),
    'p'     => restrofood_getOptionData( 'processing-text', esc_html__( 'Processing', 'restrofood' ) ),
    'ac'    => restrofood_getOptionData( 'accepted-cooking-text', esc_html__( 'Accepted Cooking', 'restrofood' ) ),
    'stc'   => restrofood_getOptionData( 'send-to-cooking-text', esc_html__( 'Send To Cooking', 'restrofood' ) ),
    'wfka'  => restrofood_getOptionData( 'waiting-for-kitchen-accept-text', esc_html__( 'Waiting For Kitchen Accept', 'restrofood' ) ),
    'cc'    => restrofood_getOptionData( 'cooking-completed-text', esc_html__( 'Cooking Completed', 'restrofood' ) ),
    'rtd'   => restrofood_getOptionData( 'ready-to-delivery-text', esc_html__( 'Ready To Delivery', 'restrofood' ) ),
    'otw'   => restrofood_getOptionData( 'on-the-way-text', esc_html__( 'On The Way', 'restrofood' ) ),
    'owd'   => restrofood_getOptionData( 'way-to-delivery-text', esc_html__( 'On The Way To Delivery', 'restrofood' ) ),
    'dc'    => restrofood_getOptionData( 'delivery-completed-text', esc_html__( 'Delivery Completed', 'restrofood' ) ),
    'cp'    => restrofood_getOptionData( 'cooking-processing-text', esc_html__( 'Cooking Processing', 'restrofood' ) )

  ];

}

/**
 * [restrofood_tracking_status description]
 * Order Tracking Status list
 * @return array
 */
function restrofood_tracking_status() {

  $statusText = restrofood_getStatusText();

  $stc = $statusText['stc'];

  if( restrofood_is_user_role('kitchen_manager') ) {
    $stc = $statusText['wfka'];
  } 

  return [

    'OP'    => $statusText['op'],
    'PO'    => $statusText['po'],
    'OC'    => $statusText['oc'],
    'OF'    => $statusText['of'],
    'PROC'  => $statusText['p'],
    'AC'    => $statusText['ac'],
    'STC'   => $stc,
    'CC'    => $statusText['cc'],
    'RD'    => $statusText['rtd'],
    'OWD'   => $statusText['owd'],
    'DC'    => $statusText['dc']

  ];

}

/**
 * [restrofood_converted_tracking_status description]
 * Order Tracking Status convert
 * @param  string $val [description]
 * @return string      
 */
function restrofood_converted_tracking_status( $val ) {

  $status = restrofood_tracking_status();

  switch( $val ) {
    case  "OP" :
      return $status['OP'];
      break;
      case  "PO" :
      return $status['PO'];
      break;
      case  "OC" :
      return $status['OC'];
      break;
      case  "OF" :
      return $status['OF'];
      break;
      case  "PROC" :
      return $status['PROC'];
      break;
      case  "AC" :
      return $status['AC'];
      break;
      case  "STC" :
      return $status['STC'];
      break;
      case  "CC" :
      return $status['CC'];
      break;
      case  "RD" :
      return $status['RD'];
      break;
      case  "OWD" :
      return $status['OWD'];
      break;
      case  "DC" :
      return $status['DC'];
      break;
  }

}

/**
 * [restrofood_branch_list description]
 * @return [type] [description]
 */
function restrofood_branch_list() {

  $args = array(
    'posts_per_page' => '-1',
    'post_type' => 'branches',
  );

  $getBranch = get_posts( $args );

  $options = [];

  foreach( $getBranch as $branch ) {
      $options[$branch->ID] = $branch->post_title;
  }

  return $options;
}

/**
 * [restrofood_branch_list_html description]
 * branch list with select box option html
 * @return [type] [description]
 */
function restrofood_branch_list_html( $beforeText = '', $beforeValue = '', $selectedVal = '' ) {

  $args = array(
    'posts_per_page' => '-1',
    'post_type' => 'branches',
  );

  $getBranch = get_posts( $args );

  if( !empty( $beforeText ) ) {
    $output = '<option value="'.esc_attr( $beforeValue ).'">'.esc_html( $beforeText ).'</option>';
  } else {
    $output = '';
  }

  foreach( $getBranch as $branch ) {
    $output .= '<option value="'.esc_attr( $branch->ID ).'" '.selected( $selectedVal, $branch->ID, false ).'>'.esc_html( $branch->post_title ).'</option>';
  }

  return $output;
}

/**
 * [restrofood_get_current_branch_id_by_manager description]
 * Get current branch ID
 * @return array
 */
function restrofood_get_current_branch_id_by_manager() {

   $currentUser = get_current_user_id();

    // User data
    $user_meta = get_userdata( $currentUser );

    $user_roles = $user_meta->roles;

    //
    $meta_key = '';

    // is branch manager
    if( $user_roles[0] == 'branch_manager' ) {

      $meta_key = 'restrofoodbranch_manager';
     
    }
    // is kitchen manager
    if( $user_roles[0] == 'kitchen_manager' ) {

      $meta_key = 'restrofoodkitchen_manager';
     
    }
    // is delivery boy
    if( $user_roles[0] == 'delivery_boy' ) {

      $meta_key = 'restrofooddelivery_boy';
     
    }

    // Get branch
    $args = array (
        'post_type'        => 'branches',
        'post_status'      => 'publish',
        'meta_key'         => $meta_key,
        'meta_value'       => esc_html( $currentUser ),
        'meta_compare' => 'LIKE'
    );

  $getBranchesId = get_posts( $args );
  $getBranchesId = array_column( $getBranchesId, 'ID' );
  $getBranchesId = !empty( $getBranchesId[0] ) ? $getBranchesId[0] : '';
  return $getBranchesId;
}

/**
 * [restrofood_get_users_role_delivery_manager description]
 * Get delivery users
 * @return array
 */
function restrofood_get_users_role_delivery_manager() {

  $users = get_users( [ 'role__in' => [ 'delivery_boy' ] ] );

  $getUser = [ '0' => 'Select Delivery Boy' ];

  foreach( $users as $user ) {

    $getUser[$user->ID] = $user->display_name;

  }

  return $getUser;

}

/**
 * [restrofood_get_branch_delivery_boy description]
 * Get branch delivery boy
 * @param  string $branch_id [description]
 * @return array
 */
function restrofood_get_branch_delivery_boy( $branch_id = '' ) {
  //
  if( restrofood_is_multi_branch() )  {

    if( empty( $branch_id ) ) {
      $branch_id = restrofood_get_current_branch_id_by_manager();
    }  

    $dIDs = get_post_meta( absint( $branch_id ), 'restrofooddelivery_boy', true );

    // User data
    $boy = [];

    if( !empty( $dIDs ) ) {

      foreach( $dIDs as $id ) {

        $user_meta = get_userdata( $id );

        $boy[$user_meta->ID] =  $user_meta->user_login;

      }

    }

  } else {
    $boy = restrofood_get_users_role_delivery_manager();
  }

  return $boy;

}

/**
 * [restrofood_current_date ]
 * @return string date
 */
function restrofood_current_date( $is_wpdate = false ) {

  if( $is_wpdate ) {
    $zone = new DateTimeZone('UTC');
    $currentDate = wp_date( 'M d, Y', null, $zone );
  } else {
    $currentDate = \RestroFood\Date_Time_Map::getDateTime();
    $currentDate = $currentDate->format('M d, Y');
  }
  //
  return $currentDate;

}

function restrofood_display_date( $date ) {
  $getDateFormat = get_option('date_format');
  $zone = new DateTimeZone('UTC');
  return wp_date( $getDateFormat, strtotime( $date ), $zone );
}

/**
 * [restrofood_time_elapsed_string description]
 * time elapsed string
 * @param  [type]  $datetime [description]
 * @param  boolean $full     [description]
 * @return string            [description]
 */
function restrofood_time_elapsed_string( $datetime, $full = false ) {
    
    $getCurrentDateTime = \RestroFood\Date_Time_Map::getDateTime();
    $getCurrentDateTime->format( "Y-m-d h:i:s" );
    $getDateTimeDiff    = \RestroFood\Date_Time_Map::getDateTime();

    //
    $dateTimeExplode = explode(' ', $datetime);
    $getOrderDate = $dateTimeExplode[0];
    $getOrderDate = explode('-', $getOrderDate);
    //
    $getOrderTime = $dateTimeExplode[1];
    $getOrderTime = explode(':', $getOrderTime);

    // Set order date and time
    $getDateTimeDiff->setDate( $getOrderDate[0], $getOrderDate[1], $getOrderDate[2] );
    $getDateTimeDiff->setTime( $getOrderTime[0], $getOrderTime[1], $getOrderTime[2] );

    $diff = $getCurrentDateTime->diff($getDateTimeDiff);

    $diff->w = floor($diff->d / 7);
    $diff->d -= $diff->w * 7;

    $string = array(
        'y' => esc_html__( 'year', 'restrofood' ),
        'm' => esc_html__( 'month', 'restrofood' ),
        'w' => esc_html__( 'week', 'restrofood' ),
        'd' => esc_html__( 'day', 'restrofood' ),
        'h' => esc_html__( 'hour', 'restrofood' ),
        'i' => esc_html__( 'minute', 'restrofood' ),
        's' => esc_html__( 'second', 'restrofood' ),
    );
    foreach ($string as $k => &$v) {
        if ($diff->$k) {
            $v = $diff->$k . ' ' . $v . ($diff->$k > 1 ? 's' : '');
        } else {
            unset($string[$k]);
        }
    }

    if (!$full) $string = array_slice($string, 0, 1);
    return $string ? implode(', ', $string) .' '.esc_html__( 'ago', 'restrofood' ) : esc_html__( 'just now', 'restrofood' );
}

/**
 * [restrofood_page_permission description]
 * @param  [type] $role [description]
 * @return url       [description]
 */
function restrofood_page_permission( $role ) {

  $url = home_url('/');

  if( is_user_logged_in() ) {

    $user = wp_get_current_user();

    $roles = $user->roles;

    if( $roles[0] != $role ) {
      wp_safe_redirect( $url );
    }

  } else {
    wp_safe_redirect( $url );
    exit;

  }

}

/**
 * restrofood_is_user_role
 * @return bool
 */
function restrofood_is_user_role( $role ) {

  if( is_user_logged_in() ) {

    $user = wp_get_current_user();

    $roles = $user->roles;

    if( $roles[0] == $role ) {
      return true;
    } else {
      return false;
    }

  }

}

/**
 * restrofood_is_multi_branch 
 * check is set multi branch
 * @return bool
 */

function restrofood_is_multi_branch() {

  if( ! restrofood_is_active_multi_branch() ) {
    return false;
  }

  $options = get_option('restrofood_options');

  if( !empty( $options['brunch-type'] ) && $options['brunch-type'] == 'multi' ) {
    return true;
  } else {
    return false;
  }

}


/**
 * restrofood_is_active_multi_branch 
 * check is set active multi branch
 * @return bool
 */

function restrofood_is_active_multi_branch() {

  if( ! class_exists('RestrofoodMultibranch') ) {
    return false;
  } else {
    return true;
  }

}

/**
 * restrofood_is_active_inrestaurant 
 * check is set active inrestaurant order
 * @return bool
 */

function restrofood_is_active_inrestaurant() {

  if( ! class_exists('Fbiro') ) {
    return false;
  } else {
    return true;
  }

}

/**
 * restrofood_currency_symbol_position
 * currency symbol position
 * @return 
 */

function restrofood_currency_symbol_position( $price , $format = true ) {

  $currencyPos = get_option( 'woocommerce_currency_pos' );

  $currency   = get_woocommerce_currency_symbol();

  if( !$price ) {
    return;
  }

  /*  if( $format ) {

    $price = restrofood_woo_custom_number_format( $price );
  }*/

  
  $getPrice = $currency.$price;

  if( $currencyPos != 'left' ) {

    switch( $currencyPos ) {

      case 'right':
        $getPrice =  $price.$currency;
      break;
      case 'left_space':
        $getPrice =  $currency.' '.$price;
      break;
      case 'right_space':
        $getPrice =  $price.' '.$currency;
      break;
      default :
        $getPrice = $currency.$price;
      break;

    }

  }

  return $getPrice;
  
}

/**
 * restrofood_bootstrap_column_map
 * bootstrap grid column maping
 * @return 
 */

function restrofood_bootstrap_column_map( $col ) {

  switch( $col ) {
    case '2' :
      $setCol = '6';
      break;
    case '3' :
      $setCol = '4';
      break;
    case '4' :
      $setCol = '3';
      break;
      default: 
        $setCol = '4';
      break;
  }

  return $setCol;

}
function restrofoodgetlkey() {
  return get_option( "restrofood_plugin_lic_Key", "" );
}
/**
 * restrofood_woo_custom_number_format
 * custom number format decimal, thousand separator  and Number of decimals set 
 * @return 
 */

function restrofood_woo_custom_number_format( $number ) {

  if( empty( $number ) ) {
    return;
  }
  
  $decimal_separator  = wc_get_price_decimal_separator();
  $thousand_separator = wc_get_price_thousand_separator();
  $decimals           = wc_get_price_decimals();

  return number_format( $number, $decimals, $decimal_separator, $thousand_separator);

}

/**
 * restrofood_extra_option_price_filter
 * @param  [type] $data [description]
 * @return [type]       [description]
 */
function restrofood_extra_option_price_filter( $data ) {

  $explodeData = explode(':', $data);
  $arrayEnd = end($explodeData);
  return preg_replace('/[^0-9-.]+/', '', $arrayEnd );
}

/**
 * [restrofood_date_format description]
 * @param  string $format [description]
 * @param  [type] $date   [description]
 * @return string         [description]
 */
function restrofood_date_format( $date, $format = '' ) {
  $format = !empty( $format ) ? $format : 'M-d-Y';
  return date( $format, strtotime( $date ) );
}

function restrofood_is_location_type_address() {

  $options = get_option('restrofood_options');

  return !empty( $options['location_type'] ) && $options['location_type'] == 'address' ? true : false;

}
function restrofoodgetG() {
  global $lstatus;
  if( !restrofoodgetlkey() ) {
    return;
  }
  return $lstatus["getlst"];
}

/**
 * [restrofood_time_format description]
 * @return string
 */
function restrofood_time_format() {

  $options = get_option('restrofood_options');

  $timeFormat = 'h:ia';
  if( !empty( $options['delivery-time-format'] ) && $options['delivery-time-format'] == '24' ) {
    $timeFormat = 'H:i';
  }
  return $timeFormat;

}
/**
 * Convert php date format to js date format 
 * @param  $format php date
 * @return string
 */
function restrofood_datepicker_format($format) {

  $assoc = array(
      'Y' => 'yy',
      'y' => 'yy',
      'F' => 'MM',
      'm' => 'mm',
      'l' => 'DD',
      'd' => 'dd',
      'D' => 'D',
      'j' => 'd',
      'M' => 'M',
      'n' => 'm',
      'z' => 'o',
      'N' => '',
      'S' => '',
      'w' => '',
      'W' => '',
      't' => '',
      'L' => '',
      'o' => '',
      'a' => '',
      'A' => '',
      'B' => '',
      'g' => '',
      'G' => '',
      'h' => '',
      'H' => '',
      'i' => '',
      's' => '',
      'u' => ''
  );

  $keys = array_keys($assoc);

  $indeces = array_map(function($index) {
      return '{{' . $index . '}}';
  }, array_keys($keys));

  $format = str_replace($keys, $indeces, $format);

  return str_replace($indeces, $assoc, $format);

}

/**
 * [restrofood_get_weekday description]
 * @return array
 */
function restrofood_get_weekday() {

  return [
          '0' => esc_html__( 'Sunday', 'restrofood' ),
          '1' => esc_html__( 'Monday', 'restrofood' ),
          '2' => esc_html__( 'Tuesday', 'restrofood' ),
          '3' => esc_html__( 'Wednesday', 'restrofood' ),
          '4' => esc_html__( 'Thursday', 'restrofood' ),
          '5' => esc_html__( 'Friday', 'restrofood' ),
          '6' => esc_html__( 'Saturday', 'restrofood' )
        ];

}

/**
 * [restrofood_get_the_day description]
 * @return string
 */
function restrofood_get_the_day( $number ) {
  $weekday = restrofood_get_weekday();
  return !empty( $weekday[$number] ) ? $weekday[$number] : '';
}

/**
 * [restrofood_get_day_number description]
 * @return [type] [description]
 */
function restrofood_get_day_number( $dayName ) {
    $days = [
      'Sunday'    => 0,
      'Monday'    => 1,
      'Tuesday'   => 2,
      'Wednesday' => 3,
      'Thursday'  => 4,
      'Friday'    => 5,
      'Saturday'  => 6
    ];

  return $days[$dayName];
}
/**
 * [restrofood_get_day_by_date description]
 * @param  [type] $date [description]
 * @return string
 */
function restrofood_get_day_by_date( $date ) {

  $dayByDate = \RestroFood\Date_Time_Map::getDay( $date );
  $dayNumber = restrofood_get_day_number( $dayByDate );
  return restrofood_get_the_day( $dayNumber );

}
/**
 * [restrofood_display_day_by_date description]
 * @param  [type] $date [description]
 * @return [type]       [description]
 */
function restrofood_display_day_by_date( $date ) {
  return wp_date( 'l', strtotime( $date ), null );
}

/**
 * [restrofood_time_solt_options_html description]
 * @param  [type] $timeList [description]
 * @return [type]           [description]
 */
function restrofood_time_solt_options_html( $timeList ) {

  if( !empty( $timeList ) ) {
    foreach ( $timeList as $time ) {

      $a = [ $time['times'], $time['slot_order_status'], $time['break_time'] ];
      $v = implode( ',', $a );

        echo '<option value="'.esc_html( $v ).'">'.esc_html( $time['times'].restrofood_time_slot_status( $time ) ).'</option>';
    }
  }

}

/**
 * [restrofood_time_slot_order_count description]
 * @param  string $date [description]
 * @param  string $time [description]
 * @return [type]       [description]
 */
function restrofood_time_slot_order_count( $date = '', $time = '' ) {
  // 02/20/2021 10:30am
  
  if( $date && $time ) {
    $args = array(
      'limit'         => '-1',
      'date_created'  => esc_html( $date ),
      'pickup_time'   => esc_html( $time )
    );
    $orders = wc_get_orders( $args );
    return count( $orders );
  }
}
/**
 * [restrofood_time_slot_status description]
 * @return [type] [description]
 */
function restrofood_time_slot_status( $status ) {
  $text = RestroFood\Inc\Text::getText();
  if( $status['slot_order_status'] == 'no' ) {
    return ' - '.$text['slot_full_text'];
  }

  if( $status['break_time'] == 'true' ) {
    return ' - '.$text['valid_break_time'];
  }

}

/**
 * [restrofood_wc_before_cart_hook description]
 * @return [type] [description]
 */
function restrofood_wc_before_cart_hook() {
  ob_start();
  do_action( 'woocommerce_before_cart' );
  return ob_get_clean();
}

/**
 * [restrofood_radius_based_delivery_fee description]
 * @return [type] [description]
 */
function restrofood_radius_based_delivery_fee() {

  $options = get_option('restrofood_options');
  $deliveryFee = '';
  $locationDistance = get_transient('rb_location_distance');
  $rbBranchId = get_transient('rb_branch_id');

  // Delivery fee based on kilometer for multi branch
  if( restrofood_is_multi_branch() && !empty( $rbBranchId ) ) {

    $deliveryFee = get_post_meta( $rbBranchId, 'restrofooddelivery_fee_on_branch', true );

    if( get_option('restrofood_multideliveryfees_option') ) {

      if( !empty( $locationDistance ) && !empty( $rbBranchId ) ) {

        $feeRange = get_post_meta( $rbBranchId, 'restrofooddelivery_fee_on_km', true );

        if( !empty( $feeRange ) ) {

          $cacheKM = 0;

          foreach( $feeRange as $val ) {

            if( $cacheKM < $locationDistance && $val['km'] >= $locationDistance ) {
              $deliveryFee = $val['fee'];
            }

            $cacheKM = $val['km'];

          }

        }

      }

    }

  } else {

    $deliveryFee    = isset( $options['delivery-fee'] ) ? $options['delivery-fee'] : '';

    // Delivery fee based on kilometer for single branch
    
    if( isset( $options['delivery-fee-km'] ) && !empty( $options['delivery-fee-km'] )  ) {

      if( !empty( $locationDistance ) ) {

        $feeRange = $options['delivery-fee-km'];

        if( !empty( $feeRange ) ) {

          $cacheKM = 0;

          foreach( $feeRange as $val ) {

            if( $cacheKM < $locationDistance && $val['km'] >= $locationDistance ) {
              $deliveryFee = $val['fee'];
            }

            $cacheKM = $val['km'];

          }

        }

      }

    }

  }

  return $deliveryFee;

}

/**
 * restrofood_radius_based_delivery_fee description
 * @return string
 */
function restrofood_zipcode_based_delivery_fee() {

  $options = get_option('restrofood_options');
  $deliveryFee = '';
  $rbBranchId = get_transient('rb_branch_id');
  $rbSelectedZipcode = get_transient('rb_selected_zipcode');
  
  // Delivery fee based on kilometer for multi branch
  if( restrofood_is_multi_branch() && !empty( $rbBranchId ) ) {

    $deliveryFee = get_post_meta( $rbBranchId, 'restrofooddelivery_fee_on_branch', true );

    if( get_option('restrofood_multideliveryfees_option') ) {

      if( !empty( $rbSelectedZipcode ) && !empty( $rbBranchId ) ) {

        $zip = get_post_meta( $rbBranchId, 'restrofoodbranch_zipcode_with_fee', true );

        if( !empty( $zip ) ) {

          foreach( $zip as $val ) {

            if( $val['code'] == $rbSelectedZipcode ) {
              $deliveryFee = $val['fee'];
            }

          }

        }

      }

    }

  } else {

    $deliveryFee    = isset( $options['delivery-fee'] ) ? $options['delivery-fee'] : '';

    // Delivery fee based on kilometer for single branch
    
    if( isset( $options['zip-delivery-fee'] ) && !empty( $options['zip-delivery-fee'] )  ) {

      if( !empty( $rbSelectedZipcode ) ) {

        $zipCodes = $options['zip-delivery-fee'];

        if( !empty( $zipCodes ) ) {

          foreach( $zipCodes as $val ) {

            if( $val['code'] == $rbSelectedZipcode ) {
              $deliveryFee = $val['fee'];
            }

          }

        }

      }

    }

  }

  return $deliveryFee;

}

/**
 * restrofood_get_zipcodes get zipcode from settings or branch
 * @return array
 */
function restrofood_get_zipcodes() {

  $options = get_option('restrofood_options');
  $multideliveryfees = get_option('restrofood_multideliveryfees_option');
  $zipCodes = '';
  $rbBranchId = get_transient('rb_branch_id');

  // Check multi branch and selected branch ID
  if( restrofood_is_multi_branch() && !empty( $rbBranchId ) ) {

      // checkout page check
      if( is_checkout() ) {
        // Check multideliveryfees option
        if( !empty( $multideliveryfees ) ) {
          $getZipCodes = get_post_meta( $rbBranchId, 'restrofoodbranch_zipcode_with_fee', true );
          $getZipCodes = !empty( $getZipCodes ) ? $getZipCodes : [];
          $zipCodes = array_column( $getZipCodes, 'code');
        } else {
          $zipCodes = get_post_meta( $rbBranchId, 'restrofoodbranch_zipcode', true );
        }
      }

  } else {

    // Check multideliveryfees option
    if( !empty( $multideliveryfees ) ) {
      
      $zipCodes = !empty( $options['zip-delivery-fee'] ) ? $options['zip-delivery-fee'] : [];
      $zipCodes = array_column( $zipCodes, 'code' );

    } else {
      $zipCodes = !empty( $options['delivery_zip'] ) ? $options['delivery_zip'] : '';
    }

  }

  return $zipCodes;

}

function restrofood_visibility_time_preparing_info( $productID ) {

  // Check product visibility time 
  $productVisibility = get_the_terms( $productID, 'product-visibility' );

  $visibilityValuation = $visibilityTimeType = [];
  $is_product_visible = true;
  if( !empty( $productVisibility ) ) {
    
    foreach( $productVisibility as $getVisibility ) {

      $termID = $getVisibility->term_id;

      $startTimeValue = get_term_meta( $termID, '_visibility_start_time', true );
      $endTimeValue = get_term_meta( $termID, '_visibility_end_time', true );

      $currentTime = RestroFood\Date_Time_Map::currentTimeStamp();

      $visibilityValuation[] = $currentTime >= strtotime( $startTimeValue )  &&  strtotime( $endTimeValue ) > $currentTime ? true : false;

      $visibilityTimeType[] = $getVisibility->name;

    }

    //
    $is_product_visible = in_array( true, $visibilityValuation ) ? true : false;

  } // End product visibility time check

  // Preparing Meta
  $preparingData = [];

  $preparingTime = get_post_meta( $productID, '_resf_preparing_time', true );
  $preparingTimeText = get_post_meta( $productID, '_resf_preparing_time_text', true );

  $deliveryTime = get_post_meta( $productID, '_resf_delivery_time', true );
  $DeliveryTimeText = get_post_meta( $productID, '_resf_preparing_time_text', true );
  //
  if( !empty( $preparingTime ) ) {
    $preparingData['preparing_info'] = [ 'time' => $preparingTime, 'text' => $preparingTimeText ];
  }
  //
  if( !empty( $deliveryTime ) ) {
    $preparingData['delivery_info'] = [ 'time' => $deliveryTime, 'text' => $DeliveryTimeText ];
  }

  return [ 'preparing_data' => $preparingData, 'is_visible' => $is_product_visible, 'visibility_type' => $visibilityTimeType ];

}