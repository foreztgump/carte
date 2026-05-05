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

class Product_Layout {

  public $productArgs;

  /**
   * [setProductArgs description]
   * @param [type] $args [description]
   */
  public function setProductArgs( $args ) {
    $this->productArgs = $args;
    return $this;
  }

  /**
   * [product_layout_grid description]
   * @return [type] [description]
   */
  public function product_layout_grid() {
    $getData = $this->productArgs;

    if( !empty( $getData['query_type'] ) && $getData['query_type'] == 'search' ) {
      $product = $getData['product'];
      $imgUrl = get_the_post_thumbnail_url( $product->get_id(), 'full' );
    } else {
      $product = $getData['product'];
      $imgUrl  = $getData['imgurl'];
    }

    $column  = $getData['column'];

    ?>
    <div class="<?php echo esc_attr( 'rb_col_xl_'.$column.' grid_style_'.$getData['style'].' rb_col_lg_4 rb_col_sm_6' ); ?>">
        <!-- Single Product -->
        <div class="rb_single_product_item">
          <?php
          // Show this if product not visible
          self::visiblityAlert( $getData );
          ?>
          <!-- Product Thumb -->
          <div class="rb_product_top">
            <!-- Product Thumb -->
            <div class="rb_product_thumb rb_product_details_img">
              <img src="<?php echo esc_url( $imgUrl ); ?>" alt="<?php echo esc_attr( $product->get_name() ); ?>" />
            </div>
            <!-- End Product Thumb -->
            <!-- OnSale -->
            <?php 
            if( !empty( $product->get_regular_price() ) && !empty( $product->get_sale_price() )  ) {
              echo '<span class="rb_badge">'.esc_html__( 'On sale', 'restrofood' ).'</span>';
            }
            ?>
            <!-- End OnSale -->
          </div>
          <!-- End Product Thumb -->
          <!-- Product Content -->
          <div class="rb_product_content">
            <div class="product-tags-group-wrapper">
              <?php
              // Product visibility tag
              self::productVisibilityTag( $getData );
              // Item preparing time and delivery time
              self::productPreparingDeliveryTime( $getData );
              ?>
            </div>
            <!-- Title -->
            <h4 class="rb_product_title rb_order_cart_button" data-pid="<?php echo esc_attr( $product->get_id() ); ?>" data-toggle="fbPopupModal" data-target="rb_popup_modal"><?php echo esc_html( $product->get_name() ); ?></h4>
            <!-- End Title -->
            <!-- Price -->
            <h6 class="rb_product_price">
              <?php
              echo $product->get_price_html();
              ?>
            </h6>
            <!-- End Price -->
            <!-- Star Rating -->
            <div class="rb_star_rating">
              <?php
              $avRating = $product->get_average_rating();
              $totalRating = $product->get_rating_count();
              echo '<div class="rb-star-icon-wrap">';
                restrofood_rating_reviews( esc_html( $avRating ) );
              echo '</div>';
              //
              if( $avRating > 0 && $totalRating > 0 ) {
                echo '<div class="rb-star-rating-word">';
                if( $avRating > 0 ) {
                  echo '<span>'.esc_html( $avRating ).'</span>';
                }
                //
                if( $totalRating > 0 ) {
                  echo '<span>('.esc_html( $totalRating ).' '.esc_html__( 'Ratings', 'restrofood' ).')</span>';
                }
                echo '</div>';
              }
              ?>                    
            </div>
            <!-- End Star Rating -->
            <div class="item-cart-area item-cart-qty">
              <?php
              $this->buttonSet($getData);
              ?>
            </div>

          </div>
          <!-- End Product Content -->
        </div>
        <!-- Single Product -->
    </div>

    <?php

  }
  
  /**
   * [product_layout_grid description]
   * @return [type] [description]
   */
  public function product_layout_list() {
    $getData = $this->productArgs;

    if( $getData['style'] != '3' ) {
      $this->product_list_style_1();
    } else {
      $this->product_list_style_3();
    }

  }

  /**
   * [product_list_style_1 description]
   * @return [type] [description]
   */
  public function product_list_style_1() {

    $style = restrofood_getOptionData('product-layout-style'); // 1,2,3
    $getData = $this->productArgs;

    if( !empty( $getData['query_type'] ) && $getData['query_type'] == 'search' ) {
      $product = $getData['product'];
      $imgUrl = get_the_post_thumbnail_url( $product->get_id(), 'full' );
    } else {
      $product = $getData['product'];
      $imgUrl  = $getData['imgurl'];
    }

    $style = $getData['style'];

    ?>
    <div class="rb_col_lg_12 rb_col_sm_6 rb_food_item_wrap">
      <div class="rb_food_item style_<?php echo esc_attr( $style ); ?>">
            <?php
              // Show this if product not visible
              self::visiblityAlert( $getData );
              //
              if( !empty( $product->get_regular_price() ) && !empty( $product->get_sale_price() )  ) {
                echo '<span class="rb_ribbon">'.esc_html__( 'On sale', 'restrofood' ).'</span>';
              }
            ?>
            <div class="rb_food_item_left_content">
                <?php
                if( !empty( $imgUrl ) ):
                ?>
                <div class="rb_img rb_product_details_img">
                  <img src="<?php echo esc_url( $imgUrl ); ?>" alt="<?php echo esc_attr( $product->get_name() ); ?>" />
                </div>
                <?php
                endif;
                ?>
                <div class="rb_content">
                    <?php 
                    // Product visibility tag
                    self::productVisibilityTag( $getData );
                    ?>
                    <h3 class="rb_product_title rb_order_cart_button" data-pid="<?php echo esc_attr( $product->get_id() ); ?>" data-toggle="fbPopupModal" data-target="rb_popup_modal"><?php echo esc_html( $product->get_name() ); ?></h3>
                    <?php
                    if($style == '2' ):
                    ?>
                    <div class="price-el-wraping">
                    <span class="rb_start_form"><?php esc_html_e( 'Start From', 'restrofood' ); ?> </span>
                    <h6 class="rb_price">
                        <?php echo $product->get_price_html();?>
                    </h6>
                    </div>
                    <?php
                    else:
                    ?>
                    <div class="rb_d_flex rb_align_items_center">
                      <div class="rb_rating_wrap">
                        <?php 
                        $avRating    = $product->get_average_rating();
                        $totalRating = $product->get_rating_count();
                        ?>
                        <span class="rb_rating rb_star_rating">
                            <?php restrofood_rating_reviews( esc_html( $avRating ) ); ?>
                        </span>
                        <span class="rb_rating_text"><?php echo $avRating ? $avRating:''; echo $totalRating ? ' ('.$totalRating.' Rating)' : '';?></span>
                      </div>
                    </div>
                    <?php 
                    endif;
                    ?>
                    <div class="product-tags-group-wrapper">
                      <?php
                      // Item preparing time and delivery time
                      self::productPreparingDeliveryTime( $getData );
                      ?>
                    </div>
                </div>
            </div>
            
            <div class="rb_food_item_right_content item-cart-qty">
                <?php 
                if($style == '2' ):
                ?>
                <div class="rb_rating_wrap">
                    <?php 
                    $avRating = $product->get_average_rating();
                    $totalRating = $product->get_rating_count();
                    ?>
                    <span class="rb_rating rb_star_rating">
                        <?php restrofood_rating_reviews( esc_html( $avRating ) ); ?>
                    </span>
                    <span class="rb_rating_text"><?php echo $avRating ? $avRating:''; echo $totalRating ? ' ('.$totalRating.' Rating)' : '';?></span>
                </div>
                <?php 
                else:
                ?>
                <h6 class="rb_price">
                  <?php echo $product->get_price_html();?>
                </h6>
                <?php 
                endif;
                // Button
                echo '<div class="list-style-btn-wrap">';
                $this->buttonSet($getData);
                echo '</div>';
                ?>
            </div>
      </div>
    </div>

    <?php
  }

  /**
   * [product_list_style_3 description]
   * @return [type] [description]
   */
  public function product_list_style_3() {
    global $restrofoodAttr;

    $getData = $this->productArgs;

    if( !empty( $getData['query_type'] ) && $getData['query_type'] == 'search' ) {
      $product = $getData['product'];
      $imgUrl = get_the_post_thumbnail_url( $product->get_id(), 'full' );
    } else {
      $product = $getData['product'];
      $imgUrl  = $getData['imgurl'];
    }

    ?>
    <div class="rb_col_sm_6 rb_food_item_wrap rb_food_item_menu_list">
      <div class="rb_food_item style_<?php echo esc_attr( $getData['style'] ); ?>">
        <div class="rb_food_item-inner">
              <?php
                // Show this if product not visible
                self::visiblityAlert( $getData );
                //
                if( !empty( $product->get_regular_price() ) && !empty( $product->get_sale_price() )  ) {
                  echo '<span class="rb_ribbon">'.esc_html__( 'On sale', 'restrofood' ).'</span>';
                }
              ?>
              <div class="rb_food_item_left_content">
                  <div class="rb_content">
                    <?php 
                    // Product visibility tag
                    self::productVisibilityTag( $getData );
                    ?>
                    <h3 class="rb_product_title rb_order_cart_button" data-pid="<?php echo esc_attr( $product->get_id() ); ?>" data-toggle="fbPopupModal" data-target="rb_popup_modal"><?php echo esc_html( $product->get_name() ); ?></h3>
                    <?php
                    if( !empty( $product->get_short_description() )  ) {
                      echo '<p class="fb-read-more">'.$product->get_short_description().'</p>';
                    }
                    ?>
                  </div>
              </div>
              <div class="rb_food_item_right_content item-cart-qty">
                  <h6 class="rb_price">
                    <?php echo $product->get_price_html();?>
                  </h6>
                  <?php
                  // Button
                  $this->buttonSet( $getData, '', false, true );
                  ?>
              </div>
          </div>

          <div class="product-tags-group-wrapper">
            <?php
            // Item preparing time and delivery time
            self::productPreparingDeliveryTime( $getData );
            ?>
          </div>

        </div>
      </div>

    <?php
  }

  public function buttonSet( $getData, $gridType = '', $isQty = true, $is_icon = false ) {

    $product = $getData['product'];
    $options = $getData['options'];

    if( empty( $options['show-cart-button'] )  ) {
      return;
    }

    $productID = $product->get_id();

    $featured = get_post_meta( $productID, '_extra_featured', true );
    $minNumber = $maxNumber = '';
    if( !empty( $featured ) ) {
      $decodedFeaturedData = json_decode( $featured, true );
      $minNumber = array_filter( array_column( $decodedFeaturedData, 'group_required_number' ) );
      $maxNumber = array_filter( array_column( $decodedFeaturedData, 'group_required_number_max' ) );
    }

    if( !empty( $minNumber ) || !empty( $maxNumber ) || $product->is_type( 'variable' ) ) {
      $is_featured_required = true;
      $AddOpacity = 'gb-opacity-0';
    } else {
      $is_featured_required = false;
      $AddOpacity = '';
    }
    //

    if( $isQty != false ):
    ?>
    <div class="rb_quantity">
      <div class="rb_input_group <?php echo esc_attr( $AddOpacity ); ?>">
          <input type="text" class="rb_input_text rb_qty" name="rb_quantity" min="1" value="1">
          <span class="rb_minus rb_minus_2"><img src="<?php echo RESTROFOOD_DIR_URL.'assets/img/icon/minus1.svg'; ?>" alt=""></span>
          <span class="rb_plus  rb_plus_2"><img src="<?php echo RESTROFOOD_DIR_URL.'assets/img/icon/plus1.svg'; ?>" alt=""></span>
      </div>
    </div>
    <?php
    endif;
    //
    if( $is_icon != true  ) {
      $cartText = esc_html__( 'Add to cart', 'restrofood' );
      $optionCartText = esc_html__( 'Select Options', 'restrofood' );
    } else {
      $cartText = '<i class="fas fa-shopping-cart"></i>';
      $optionCartText = '<i class="fa fa-plus"></i>';
    }
    //
    if( $is_featured_required != true ) {
      echo '<a href="?add-to-cart='.esc_attr( $productID ).'" class="rb_btn_fill ajax_add_to_cart add_to_cart_button rb_order_button" data-quantity="1"  data-product_id="'.esc_attr( $productID ).'" data-product_sku="woo-beanie" aria-label="'.esc_attr( $product->get_name() ).'" >'.$cartText.'</a>';
    } else {
      echo '<a href="#" class="rb_btn_fill rb_order_button rb_order_cart_button" data-pid="'.esc_attr( $product->get_id() ).'" data-toggle="fbPopupModal" data-target="rb_popup_modal">'.$optionCartText.'</a>';
    }
    

  }

  protected static function visiblityAlert( $visiblity ) {

    if( empty( $visiblity['is_visible'] ) ) {
      $msg = restrofood_getOptionData('product-visibility-alert-msg', esc_html__( 'Not Available for this time.', 'restrofood' ) );
      echo '<span class="not-visible"><span class="not-visible-inner">'.esc_html( $msg ).'</span></span>';
    }
  }

  protected static function productVisibilityTag( $tags ) {

    // Product visibility tag
    if( !empty( $tags['visibility_time_type'] ) ) {
      echo '<span class="visibility-tag-wrapper">';
      foreach( $tags['visibility_time_type'] as $vtime ) {
        echo '<span class="visibility-tag">'.esc_html( $vtime ).'</span>';
      }
      echo '</span>';
    }

  }

  protected static function productPreparingDeliveryTime( $getInfo ) {
    
    if( !empty( $getInfo['preparing_data'] ) ) {

      $getInfo = $getInfo['preparing_data'];

      echo '<span class="preparing-tooltips-wrapper">';
        if( !empty( $getInfo['preparing_info']['time'] ) ) {
          echo '<sapn class="preparing-info-tag preparing-time-tag">';
            if( !empty( $getInfo['preparing_info']['text'] ) ) {
              echo '<span class="preparing-time-tooltip">'.esc_html( $getInfo['preparing_info']['text'] ).'</span>';
            }
            echo '<i class="fa fa-clock"></i>
            '.esc_html( $getInfo['preparing_info']['time'] ).'
          </sapn>';
        }
        //
        if( !empty( $getInfo['delivery_info']['time'] ) ) {
          echo '<sapn class="preparing-info-tag delivery-time-tag">';
            if( !empty( $getInfo['delivery_info']['text'] ) ) {
              echo '<span class="delivery-time-tooltop">'.esc_html( $getInfo['delivery_info']['text'] ).'</span>';
            }
            echo '<i class="fa fa-truck"></i>
            '.esc_html( $getInfo['delivery_info']['time'] ).'
          </sapn>';
        }

      echo '</span>';
    }

  }


}
