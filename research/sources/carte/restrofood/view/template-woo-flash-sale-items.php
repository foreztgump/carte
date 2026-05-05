<?php
  global $restrofoodFlashProducts;

  $limit       = '5';
  $itemPerSlide = '4';
  $title        = '';
  $show_btn     = '';
  $link         = '';
  $paddingTop   = '';
  $paddingBottom  = '';
  $branch_id    = '';
  $is_shortcode = false;


  if( !empty( $restrofoodFlashProducts ) ) {

    $limit            = !empty(  $restrofoodFlashProducts['limit'] ) ? $restrofoodFlashProducts['limit'] : '5';
    $itemPerSlide     = !empty(  $restrofoodFlashProducts['per_slide'] ) ? $restrofoodFlashProducts['per_slide'] : '4';
    $title            = !empty(  $restrofoodFlashProducts['title'] ) ? $restrofoodFlashProducts['title'] : '';
    $show_btn         = !empty(  $restrofoodFlashProducts['show_btn'] ) ? $restrofoodFlashProducts['show_btn'] : '';
    $link             = !empty(  $restrofoodFlashProducts['link'] ) ? $restrofoodFlashProducts['link'] : '';
    $paddingTop       = !empty(  $restrofoodFlashProducts['padding_top'] ) ? $restrofoodFlashProducts['padding_top'] : '';
    $paddingBottom    = !empty(  $restrofoodFlashProducts['padding_bottom'] ) ? $restrofoodFlashProducts['padding_bottom'] : '';

    // Add attr
    $getAttr = '';

    if( !empty(  $restrofoodFlashProducts['padding_top'] ) ) {
      $getAttr .= "padding-top:{$restrofoodFlashProducts['padding_top']};";
    }
    //
    if( !empty(  $restrofoodFlashProducts['padding_bottom'] ) ) {
      $getAttr .= "padding-bottom:{$restrofoodFlashProducts['padding_bottom']};";
    }

    // Check
    if( !empty(  $restrofoodFlashProducts['branch_id'] ) ) {
      $branch_id = $restrofoodFlashProducts['branch_id'];
      $is_shortcode = true;
    }

  }

?>

<div class="rb__wrapper" style="<?php echo $getAttr; ?>">
  <?php
  // Product
  ?>
  <div class="flashsale-slider-top">
    <div class="flashsale-slider-title">
      <?php
      //
      if( !empty( $title ) ) {
        echo '<h3>'.esc_html( $title ).'</h3>';
      }
      ?>
    </div>
    <?php 
    if( $show_btn == 'yes' ) {
      echo '<a target="_blank" href="'.esc_url( $link ).'">'.esc_html__( 'View All', 'restrofood' ).'</a>';
    }
    ?>
  </div>  
  <div class="flashproductslider carousel" data-items="<?php echo esc_attr( $itemPerSlide ); ?>">
    <ul class="slides">
    <?php
    //arguments
    $args = array(
        'posts_per_page'    => $limit,
        'post_status'       => 'publish',
        'post_type'         => 'product',
        'meta_query'        => array(
              array(
                  'key'     => '_set_flash_sale',
                  'value'   => 'yes',
                  'compare' => '=',
              )
        )
    );

    //get products on sale using wp_query class
    $getProducts = new \WP_Query( $args );

    if( $getProducts->have_posts() ) {
      while( $getProducts->have_posts() ) {
        $getProducts->the_post();
        $product = wc_get_product();

        $imgId  = $product->get_image_id();
        $imgUrl = wp_get_attachment_url( absint( $imgId ) );

        // Product visibility time and preparing info
        $metaData = restrofood_visibility_time_preparing_info( $product->get_id() );
    ?>
    <li>
      <?php
      $productData = [
        'product' => $product,
        'is_visible' => $metaData['is_visible'],
        'visibility_time_type' => $metaData['visibility_type'],
        'preparing_data' => $metaData['preparing_data'],
        'options' => [],
        'column'  => '12',
        'style'  => '1',
        'imgurl'  => $imgUrl
      ];

      $productMarkup = new RestroFood\Product_Layout();
      $productMarkup->setProductArgs( $productData )->product_layout_grid();
      ?>
  </li>
  <?php
      }
    }
    ?>
  </ul>
  </div>

</div>
