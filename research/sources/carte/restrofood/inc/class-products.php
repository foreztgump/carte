<?php
namespace RestroFood;
/**
 *
 * @package     Restrofood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 *
 */


class Products{

  function __construct() {

    add_action( 'wp_ajax_woo_products_view', [ $this, 'productQuery' ] );
    add_action( 'wp_ajax_nopriv_woo_products_view', [ $this, 'productQuery' ] );

    add_action( 'wp_ajax_woo_product_byid', [ $this, 'getProductById' ] );
    add_action( 'wp_ajax_nopriv_woo_product_byid', [ $this, 'getProductById' ] );

    add_action( 'wp_ajax_woo_product_reviews_byid', [ $this, 'getProductReviewsByid' ] );
    add_action( 'wp_ajax_nopriv_woo_product_reviews_byid', [ $this, 'getProductReviewsByid' ] );

    add_action('wp_ajax_woo_rb_ajax_add_to_cart', [ $this, 'wooAjaxAddToCart' ] );
    add_action('wp_ajax_nopriv_woo_rb_ajax_add_to_cart', [ $this, 'wooAjaxAddToCart' ] );

    add_action( 'wp_ajax_woo_get_checkout_data', [ $this, 'get_checkout_data' ] );
    add_action( 'wp_ajax_nopriv_woo_get_checkout_data', [ $this, 'get_checkout_data' ] );

    add_action( 'wp_ajax_woo_order_place', [ $this, 'order_place' ] );
    add_action( 'wp_ajax_nopriv_woo_order_place', [ $this, 'order_place' ] );

    add_action( 'wp_ajax_woo_add_discount', [ $this, 'add_discount' ] );
    add_action( 'wp_ajax_nopriv_woo_add_discount', [ $this, 'add_discount' ] );

    add_action( 'wp_ajax_woo_set_shipping_methods', [ $this, 'set_shipping_methods' ] );
    add_action( 'wp_ajax_nopriv_woo_set_shipping_methods', [ $this, 'set_shipping_methods' ] );

    add_action( 'wp_ajax_woo_get_variation_data', [ $this, 'get_variation_data' ] );
    add_action( 'wp_ajax_nopriv_woo_get_variation_data', [ $this, 'get_variation_data' ] );

    add_action( 'wp_ajax_woo_mini_cart_qty_update', [ $this, 'miniCartQtyUpdate' ] );
    add_action( 'wp_ajax_nopriv_woo_mini_cart_qty_update', [ $this, 'miniCartQtyUpdate' ] );


  }

  public function args() {

    $options = get_option('restrofood_options');

    $catSlug  = !empty( $_POST['catSlug'] ) ? $_POST['catSlug'] : '';
    $catSlug  = array_filter( explode(',', $catSlug) );
    $taxonomy = !empty( $_POST['taxonomy'] ) ? $_POST['taxonomy'] : '';
    $limit    = !empty( $options['product-limit'] ) ? $options['product-limit'] : '6';
    $orderBy  = !empty( $options['product-order'] ) ? $options['product-order'] : 'DESC';
    $page     = !empty( $_POST['page'] ) ? $_POST['page'] : 1;
    $filter_key = !empty( $_POST['filter_key'] ) ? $_POST['filter_key'] : '';
    $branchId = !empty( $_POST['branch_id'] ) ? $_POST['branch_id'] : '';

    // Check limit
    if( !empty( $_POST['limit'] ) ) {
      $limit = $_POST['limit'];
    }

    // Default Init
    $args = array(
        'limit'     => esc_html( $limit ),
        'page'      => esc_html( $page ),
        'status'    => 'publish',
        'order'     => esc_html( $orderBy ),
        'paginate'  => true
    );

    // add category slug
    if( !empty( $catSlug ) && ( $taxonomy != 'specialoffer' && $taxonomy != 'product-visibility' ) ) {
      $args['category'] = $catSlug;
    }

    // Special offer taxonomy term slug for tax query
    if( !empty( $catSlug ) && $taxonomy == 'specialoffer' ) {

      $args['tax_query'] = array(
                array(
                    'taxonomy' => 'specialoffer',
                    'field'    => 'slug',
                    'terms'    => $catSlug
                ),
            );

    }

    // Product visibility taxonomy term slug for tax query
    if( !empty( $catSlug ) && $taxonomy == 'product-visibility' ) {

      $args['tax_query'] = array(
                array(
                    'taxonomy' => 'product-visibility',
                    'field'    => 'slug',
                    'terms'    => $catSlug
                ),
            );

    }
    // product query by branch
    if( !empty( $branchId ) ) {
      $args['product_by_branch'] = $branchId;
    }

    // Meta Query
    
    if( $filter_key  && $filter_key  != 'menu_order' ) {

      $filterKeys = [ 'price'];

      if( in_array( $filter_key , $filterKeys ) ) {
        $args['order'] = 'ASC';
      }

      //
      $args['orderby'] = 'meta_value';

      switch( $filter_key ) {

        case 'rating':
          $args['average_rating_product'] = 0.1;
        break;
        case 'price':
        case 'price-desc':
          $args['low_to_high_price'] = 0.1;
        break;
        case 'popularity':
          $args['total_sales_product'] = 1;
        break;
      }

    }

    return $args;

  }

  public function productQuery() {

    $productMarkup = new Product_Layout();

    $options = get_option( 'restrofood_options' );
    
    $column = !empty( $_POST['col'] ) ? $_POST['col'] : '3';
    $layout = !empty( $_POST['layout'] ) ? $_POST['layout'] : 'grid';
    $style = !empty( $_POST['style'] ) ? $_POST['style'] : '1';

    $args = $this->args();
    
    $currentPage = $args['page'];
    $query       = wc_get_products( $args );
    $products    = $query->products;

    ob_start();

    if( !empty( $products ) ):
      $i = 0;
      foreach( $products as $product ):

        $productID = $product->get_id();

        // Product visibility time and preparing info
        $metaData = restrofood_visibility_time_preparing_info( $productID );
        //
        $i++;
        $imgId = $product->get_image_id();
        $imgUrl = wp_get_attachment_url( absint( $imgId ) );
        
        $productData = [
          'product' => $product,
          'is_visible' => $metaData['is_visible'],
          'visibility_time_type' => $metaData['visibility_type'],
          'preparing_data' => $metaData['preparing_data'],
          'options' => $options,
          'column'  => $column,
          'style'   => $style,
          'imgurl'  => $imgUrl
        ];

        if( $layout != 'grid' ) {
          $productMarkup->setProductArgs($productData)->product_layout_list();
        } else {
          $productMarkup->setProductArgs($productData)->product_layout_grid();
        }
      

      endforeach;
    endif;
    
    $max_num_pages = $query->max_num_pages;

    if( $max_num_pages > 1 ):
      $showNumber = 5;
      
    ?>
    <div class="fb-pagination rb_w_100">
      <div class="rb_col_lg_12 rb_col_sm_12">
        <div class="rb_pagination">
            <ul class="rb_pagination_list">
            <?php
            for(  $i = 1; $i <= $max_num_pages; $i++  ) {
              
              $active = "";

              if( $i == $currentPage ) {
                $active = "active";
              }

              //
              if( $i < $showNumber ) {
                echo '<li data-page-number="'.esc_attr( $i ).'" class="rb_pagination_list_item '.esc_attr( $active ).'">'.esc_html( $i ).'</li>';
              } else {
                //
                if( $i < $max_num_pages ) {
                  echo '<li data-page-number="'.esc_attr( $i ).'" class="rb_pagination_list_item pagi-hide '.esc_attr( $active ).'">'.esc_html( $i ).'</li>';
                }
              }
              
            }
            
            //
            if( $showNumber < $max_num_pages ) {
            echo '<li class="rb_pagination_list_item pagi-item-dot">.....</li>';
            echo '<li data-page-number="'.esc_attr( $max_num_pages ).'" class="rb_pagination_list_item pagi-last-item '.esc_attr( $active ).'">'.esc_html( $max_num_pages ).'</li>';
            }
            ?>
            </ul>
          </div>
      </div>
    </div>
    <?php
    endif;
    echo ob_get_clean();
    exit;

  }

  public function getProductById() {

    $product_id = !empty( $_POST['product_id'] ) ? $_POST['product_id'] : ''; 

    if( empty( $product_id ) ) {
      return $product_id;
    }

    $product = wc_get_product( $product_id );

    // get product extra features
    $featured = get_post_meta( $product_id, '_extra_featured', true );

    $decodedFeaturedData = json_decode( $featured, true );

    // Get nutrition information
    $nutritionData = get_post_meta( $product_id, '_nutrition_information', true );
    $nutritionData = json_decode( $nutritionData, true );

  // Product Attributes
  $defaultAttributes = $product->get_default_attributes();
  $defaultAttributes = array_values( $defaultAttributes );
  $defaultAttributes = implode('', $defaultAttributes);

  $attributes = [];

  if( $product->is_type('variable') ) {
  
    if( !empty( $product->get_attributes() ) ) {

      foreach( $product->get_attributes() as $attribute ) {

        $name = str_replace( ['pa_', '-'], ['',' '], $attribute->get_name() );

        $attributes[$name] = [
            'name'      => sanitize_title( $attribute->get_name() ),
            'attribute' => 'attribute_'.sanitize_title( $attribute->get_name() ),
            'options'   => $attribute->get_terms()

        ];

      }

    }

  }

  // Product Thumbnail
  $thumbnail = wp_get_attachment_image_url( $product->get_image_id(), 'full' );

  // Product gallery
  $imageIds = $product->get_gallery_image_ids();

  $galleryImg = [];
  if( !empty( $imageIds ) ) {
    foreach( $imageIds as $imageId ) {
      $galleryImg[] = wp_get_attachment_image_url( $imageId, 'full' );
    }
  }

  // Product type
  $sale_price = $regular_price = '';
  if ( $product->is_type( 'simple' ) ) {
    $sale_price     =  $product->get_sale_price();
    $regular_price  =  $product->get_regular_price();
  }
  elseif( $product->is_type('variable') ) {
    $sale_price     =  $product->get_variation_sale_price( 'min', true );
    $regular_price  =  $product->get_variation_regular_price( 'max', true );
  }

  // Rating
  $avRating    = $product->get_average_rating();
  $reviewCount = $product->get_review_count();

  $starRating = restrofood_rating_reviews( esc_html( $avRating ), false );
  
  //
  $isTaxes = get_option( 'woocommerce_calc_taxes' );
  $taxStatus = $product->get_tax_status();

    if( $isTaxes && $taxStatus ) {
      $productPrice = wc_get_price_including_tax( $product );
    } else {
      $productPrice = $product->price;
    }

  // check verified owner
  $verified_owner = wc_customer_bought_product( '', get_current_user_id(), absint( $product->get_id() ) ); 

    $product = array(

      'id'      => $product->get_id(),
      'title'   => $product->get_name(),
      'slug'    => $product->get_slug(),
      'sku'     => $product->get_sku(),
      'description'   => wpautop($product->get_description()),
      'short_description'   => $product->get_short_description(),
      'type'          => $product->get_type(),
      'price'         => $productPrice,
      'price_html'    => $product->get_price_html(),
      'display_price' => restrofood_woo_custom_number_format( $productPrice ),
      'regular_price' => $regular_price,
      'display_regular_price' => restrofood_currency_symbol_position( restrofood_woo_custom_number_format( $regular_price ), false),
      'sale_price'            => $sale_price,
      'display_sale_price'    => restrofood_currency_symbol_position( restrofood_woo_custom_number_format( $sale_price ), false),
      'thumbnail'     => $thumbnail,
      'galleryimgs'   => $galleryImg,
      'attributes'    => $attributes,
      'attributes_count'  => count( $attributes ),
      'defaultAttributes' => $defaultAttributes,
      'star_rating'       => wp_kses_post( $starRating ),
      'reviewcount'       => esc_html( $reviewCount ),
      'verified_owner'    => esc_html( $verified_owner ),
      'extraFeatured'     => $decodedFeaturedData,
      'nutrition'         => $nutritionData

    );

    echo wp_json_encode( $product );

    exit;
  }

  public function getProductReviewsByid() {

    if( isset( $_POST['product_id'] ) && !empty( $_POST['product_id'] ) ) {

        $args = array( 'post_type' => 'product', 'post_id' => absint( $_POST['product_id'] ) );
        $comments = get_comments( $args );
        wp_list_comments( array( 'callback' => 'woocommerce_comments' ), $comments );

    }

    exit;

  }

  public function get_variation_data() {

        if( ! isset( $_POST['pid'] ) ) {
          return;
        }

        /* Get variation attribute based on product ID */
        $product = new \WC_Product_Variable( $_POST['pid'] );
        $product_variations = $product->get_available_variations();

        $variations = [];

        foreach( $product_variations as $val ) {

          $variations[] = [
            'attributes'              => $val['attributes'],
            'variation_id'            => $val['variation_id'],
            'price_html'              => $val['price_html'],
            'display_price'           => $val['display_price'],
            'display_regular_price'   => $val['display_regular_price']
          ];

        }

        // Get selected attribute
        $h = [];
        foreach( $_POST['attribute'] as $o ) {
          $h[$o[0]] = sanitize_title($o[1]);
        }

        // get attribute id
        $p = ( new \WC_Product_Data_Store_CPT())->find_matching_product_variation(
            new \WC_Product( $_POST['pid'] ),
            $h
        );

      //
      foreach ( $variations as $v ) {

        if( $v['variation_id'] == $p ) {

            $attr = [
              'variation_id'    => $v['variation_id'],
              'price_html'      => $v['price_html'],
              'display_price'   => $v['display_price'],
              'display_regular_price' => $v['display_regular_price']

            ];

          wp_send_json_success( $attr );

        }
        
      }

      exit;

  }
        
  public function wooAjaxAddToCart() {

      $product_id   = apply_filters('woocommerce_add_to_cart_product_id', absint($_POST['product_id']));
      $quantity     = empty($_POST['quantity']) ? 1 : wc_stock_amount($_POST['quantity']);
      $variation_id = absint( $_POST['variation_id'] );
      $passed_validation = apply_filters('woocommerce_add_to_cart_validation', true, $product_id, $quantity);
      $product_status = get_post_status($product_id);
      $variation      = !empty( $_POST['attributes'] ) ? $_POST['attributes'] :'';

      $extra_optionsTotalPrice = !empty( $_POST['extra_options'] ) ? $_POST['extra_options'] : '';
      $extra_formatted_options = !empty( $_POST['extra_formatted_options'] ) ? implode( ' | ', $_POST['extra_formatted_options'] ) : '';

      // Process Extra options price
      $totalExtraOPtionsPrice = !empty( $extra_optionsTotalPrice ) ? array_sum( $extra_optionsTotalPrice ) : '';

      $instructions = !empty( $_POST['instructions'] ) ? $_POST['instructions'] : '';
      // Extra features
      $cart_item_data = [
        'item_instructions' => sanitize_text_field( $instructions ),
        'extra_options'     => $extra_formatted_options,
        'extra_options_price' => $totalExtraOPtionsPrice
      ];

      if ( $passed_validation && 'publish' === $product_status && WC()->cart->add_to_cart( $product_id, $quantity, $variation_id, $variation, $cart_item_data ) ) {

          do_action('woocommerce_ajax_added_to_cart', $product_id);
          
          if ('yes' === get_option('woocommerce_cart_redirect_after_add')) {
              wc_add_to_cart_message( array( $product_id => $quantity ), true);
          }

          \WC_AJAX::get_refreshed_fragments();
        
      } else {

        $notices = end( wc_get_notices('error') );
        $data = array(
            'status' => false,
            'status_msg' => $notices['notice'] ,
            'product_url' => apply_filters('woocommerce_cart_redirect_after_error', get_permalink($product_id), $product_id)
        );

        echo wp_send_json($data);
      }

      wp_die();
  }
 
  public function set_shipping_methods() {

      if( isset( $_POST['method'] ) ) {
        WC()->session->set('chosen_shipping_methods', array( $_POST['method'] ) );
        // Update shipping and cart total
        WC()->cart->calculate_shipping();
        WC()->cart->calculate_totals();
      }

    exit;      

  }
  public function add_discount() {

    $code = '';
    if( isset( $_POST['coupon_code'] ) ) {
      $code = $_POST['coupon_code'];
    }
    
    $ret = WC()->cart->add_discount( $code );
    die();

  }
  public function miniCartQtyUpdate() {

    $items = WC()->cart->get_cart();
    $itemQty = isset( $_POST['item_qty'] ) ? $_POST['item_qty'] : '';
    $getItemId = isset( $_POST['item_id'] ) ? $_POST['item_id'] : '';

    foreach ( $items as $cart_item_key => $item ) {
      $itemId = $item['product_id'];
      if( $itemId == $getItemId ) {
        WC()->cart->set_quantity( $cart_item_key, $itemQty );
      }
    }
    //
    \WC_AJAX::get_refreshed_fragments();

    die();

  }


}

// Products Class init
new Products();