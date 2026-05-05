<?php 
$getText = \Restrofood\Inc\Text::getText();
?>
<section class="pb-pb-80">
  <div class="rb_container">
    <div class="rb_row">
      <div class="rb_col_lg_4">
        <div class="rb_category_wrapper">
          <div class="rb_category_trigger">
              <div  class="rb_category_trigger_inner" data-toggle="collapse" data-target="rb_cat_drop">
                  <span class="rb_menu-trigger rb_icon_circle">
                    <img src="<?php echo RESTROFOOD_DIR_URL.'assets/img/icon/dropdown.svg'; ?>">
                  </span>
                  <h3><?php echo esc_html( $getText['cat_nav_text'] ); ?></h3>
              </div>
          </div>
          <!-- Category Dropdown -->
          <div class="rb_category_dropdown" id="rb_cat_drop">
              <div class="rb_category_dropdown_inner">
                  <?php
                  if( !empty( restrofood_get_productCategories() ) ):
                  ?>
                  <div class="rb_category">
                      <div class="rb_category_header">
                          <span class="rb_icon_circle">
                            <img src="<?php echo RESTROFOOD_DIR_URL.'assets/img/icon/category.svg'; ?>">
                          </span>
                          <h3><?php echo esc_html( $getText['cat_heading_text'] ); ?></h3>
                      </div>
                      <ul class="rb_category_list">
                          <?php
                            // Get product categories
                            echo restrofood_get_productCategories();
                          ?>
                      </ul>
                  </div>
                  <?php 
                  endif;
                  // Offer filter
                  if( !empty( restrofood_getSpecialOffer() ) ):
                  ?>
                  <div class="rb_offer">
                      <div class="rb_offer_header">
                          <span class="rb_icon_circle">
                            <img src="<?php echo RESTROFOOD_DIR_URL.'assets/img/icon/offer.svg'; ?>">
                          </span>
                          <h3><?php echo esc_html( $getText['spec_offer_heading_text'] ); ?></h3>
                      </div>

                      <ul class="rb_offer_list">
                        <?php
                        echo restrofood_getSpecialOffer();
                        ?>
                      </ul>
                  </div>
                  <?php 
                  endif;
                  // Visibility Filter
                  if( !empty( restrofood_getVisibility() ) ):
                  ?>
                  <div class="rb_offer">
                      <div class="rb_offer_header">
                          <span class="rb_icon_circle"><img src="<?php echo RESTROFOOD_DIR_URL.'assets/img/icon/visibility.svg'; ?>"></span>
                          <h3><?php echo esc_html( $getText['visibility_heading_text'] ); ?></h3>
                      </div>
                      <ul class="rb_offer_list">
                        <?php
                        echo restrofood_getVisibility();
                        ?>
                      </ul>
                  </div>
                  <?php 
                  endif;
                  ?>
              </div>
          </div>
        </div>
      </div>

      <div class="rb_col_lg_8">
        <!-- Search -->
        <div class="rb_search rb_top_50">
          <!-- Search Form -->
          <form action="#" class="rb_search_form">
            <div class="rb_search_input_group">
              <input
                id="rb_search"
                class="rb_input_style"
                type="text"
                placeholder="<?php esc_html_e( 'Search your favorite food...', 'restrofood' ); ?>"
              />
              <label for="rb_search">
                <img
                  src="<?php echo esc_url( RESTROFOOD_DIR_URL.'assets/img/icon/search.svg' ); ?>"
                  class="rb_svg"
                  alt="<?php esc_attr_e( 'Search svg', 'restrofood' ); ?>"
                />
              </label>
            </div>
            <div class="fb-search-result" data-col="<?php echo esc_attr( $column ); ?>" data-layout="<?php echo esc_attr( $layout ); ?>"></div>
          </form>
          <!-- End Search Form -->
        </div>
        <!-- End Search -->
      </div>

    </div>
  </div>
</section>