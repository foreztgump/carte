<script type="text/html" id="tmpl-rb_product_content">
<!-- Step Content -->
<ul class="rb_steps_list">
</ul>
<div class="rb_steps_content step-product-info">
  <form action="#" id="fbs_single_add_to_cart_button" method="post" class="rb_product_details_form">
    <div class="rb_row">
      <div class="rb_col_12">
        <div class="modal-content-left-content">
          <div class="rb_row">
            <div class="rb_col_md_6">
              <div class="modal-product-image">
                <!-- Product Details Image -->
                <# if( ! _.isEmpty(data.galleryimgs) ){ #>
                <!-- Place somewhere in the <body> of your page -->
                <div id="slider" class="flexslider rb_product_details_img">
                  <ul class="slides">
                    <li><img src={{data.thumbnail}} /></li>
                    <# _.each( data.galleryimgs, function( item, key ) { #>
                      <li><img src={{item}} alt={{key}} /></li>
                    <#} ) #>
                    <!-- items mirrored twice, total of 12 -->
                  </ul>
                </div>
                <div id="carousel" class="flexslider gallery-nav">
                  <ul class="slides">
                    <li><img src={{data.thumbnail}} /></li>
                    <# _.each( data.galleryimgs, function( item, key ) { #>
                      <li><img src={{item}} alt={{key}} /></li>
                    <#} ) #>
                    <!-- items mirrored twice, total of 12 -->
                  </ul>
                </div>
                <# } else{ #> 
                <div class="rb_product_details_img">
                  <img src={{data.thumbnail}} alt="" />
                </div>
                <#} #>
              <!-- End Product Details Image -->
              </div>
            </div>

            <div class="rb_col_md_6">
                <h3 class="rb_product_title">{{data.title}}</h3>
                <# if( data.nutrition ){ #>
                <div class="product-nutrition">
                  <ul>
                  <# _.each( data.nutrition, function( item, key ) { #>
                      <li><span>{{item.title}}</span><span class="nutrition-qty">{{item.quantity}}</span></li>
                  <#} ) #>
                  </ul>
                </div>
                <#}

                if( data.short_description ){
                #>
                <p class="product-short-description">{{data.short_description}}</p>
                <#}#>
                <h6 class="pricing-wrap">
                <?php esc_html_e( 'Price:', 'restrofood' ); ?>
                <p class="rb_product_price"> {{{data.price_html}}} </p>
                </h6>
                <# if( restrofoodobj.is_enable_reviews == 'yes' ) { #>
                <div class="fb-product-reviews">
                  <div class="rb_star_rating">{{{data.star_rating}}}</div>
                  <span class="woocommerce-review-link fb-product-review">(<span class="count">{{data.reviewcount}}</span> <?php esc_html_e( 'customer reviews', 'restrofood'); ?>)</span>
                </div> 
                <#}#>
            </div>

          </div>
        </div>
      </div>

      <div class="rb_col_12">
        <div class="rb_mt_50 rb_mt_lg_0">
          <!-- Tabs area -->
          <div class="moal-product-info-tabs-wrap">
            <div class="tab-items">
              <ul>
                <# if( data.attributes.length != 0 || data.extraFeatured  ){ #>
                <li class="fb-single-tab tab-active-status-checker" data-tab-item="variations"><?php esc_html_e( 'Variations', 'restrofood' ); ?></li>
                <#
                }
                if( data.description ) {
                #>
                <li class="fb-single-tab tab-active-status-checker" data-tab-item="descriptions"><?php esc_html_e( 'Descriptions', 'restrofood' ); ?></li>
                <#}#>
              </ul>
            </div>
            <div>
            <# if( data.attributes.length != 0 || data.extraFeatured  ){ #>
            <div class="variations-tab-content variations">
              <!-- Extra Options -->
              <div class="rb_extra_options">
                <# if( data.attributes.length != 0 ) { #>
                <h4><?php esc_html_e( 'Variations', 'restrofood' ); ?></h4>
                <# } #>
                  
                <ul class="rb_list_unstyled rb_attribute_list" data-attribute-count={{data.attributes_count}}>
                <# _.each( data.attributes, function( items, key ) {  #>
                  <div class="attribute-items-wrap fb-wrap-selector">
                  <li data-product-attribute={{items.attribute}}>
                    <h5 class="rb_label_title fb-product-extra-group-title"><span>{{key}} <span>*</span></span> <span class="icon-set"><i class="fas fa-angle-down"></i><i class="fas fa-angle-up"></i></span></h5>
                  </li>
                  <div class="product-variation-wrap rb_extra_group_wrap fb-d-none">
                  <# _.each( items.options, function( item ) { #>
                  <li>

                    <# var t = items.name; #>
                    <span class="rb_custom_checkbox">
                      <label>
                        <input
                          type="radio"
                          value="{{item.name}}"
                          name="{{items.attribute}}"
                          data-attr-slug="{{item.slug}}"
                          data-name-attr="{{items.attribute}}"
                          data-name="{{item.name}}"
                          class="fb-product-attribute"
                          
                        />
                        <span class="rb_input_text">{{{item.name}}}</span>
                        <span class="rb_custom_checkmark"></span>
                      </label>
                    </span>
                    <span class="fb-variable-price"></span>
                  </li>
                  <# } )#>
                  </div> 
                  </div> 
                  <# } ) #>
                  
                </ul>
              </div>
              <!-- End Extra Options -->

              <div class="extra-items-group-wrapper">
                <# if( data.extraFeatured ) { #>
                <h4><?php esc_html_e( 'Extra Item', 'restrofood' ); ?></h4>
                <# }#>
                <!-- Extra features List -->
                <# _.each( data.extraFeatured, function( item, i ) { #>
                <#
                var getListType = item.list_type,
                    listType = 'checkbox',
                    inputName = 'rb_product_extra_options',
                    $parentIndex = i;

                if( getListType != 'checkbox' ) {

                  listType =  'radio';
                  inputName =  'rb_product_extra_options_'+i;

                }

                #>
                <div class="fb-wrap-selector rb_form_extra_input_list">
                  <div class="rb_features_list_title_wrap">
                      <h5 class="input_list_title fb-product-extra-group-title">
                        <span>{{item.group_title}}
                        <# if( item.group_required_number ){ #>
                          <span>*</span>
                        <#}#>
                        </span>
                        <span class="icon-set">
                        <i class="fas fa-angle-up"></i>
                        <i class="fas fa-angle-down"></i>
                        </span>
                      </h5>

                      <# 
                      if( item.group_required_number || item.group_required_number_max ){  
                      #>
                      <input type="hidden" name="items_required_status[]" value="false" class="selectedcount">
                      <#}#>
                  </div>
                  
                  <ul class="rb_list_unstyled rb_extra_group_wrap fb-d-none" data-extra-group="group_{{$parentIndex}}" data-extra-max-count="{{item.group_required_number_max}}" data-extra-required-count="{{item.group_required_number}}">

                    <# 
                    if( item.group_required_number && item.group_required_number_max ){  
                    #>
                    <p class="required-msg"> <?php echo sprintf( esc_html__( 'Please choose at list %s and max %s options.', 'restrofood' ), "{{item.group_required_number}}","{{item.group_required_number_max}}" ); ?></p>
                    
                    <#}#>

                    <# 
                    if( !item.group_required_number && item.group_required_number_max ){  
                    #>
                    <p class="required-msg"> <?php echo sprintf( esc_html__( 'You could choose max %s options.', 'restrofood' ), "{{item.group_required_number_max}}" ); ?></p>
                    
                    <#}#>

                    <# 
                    if( item.group_required_number && !item.group_required_number_max ){ 
                    #>
                    <p class="required-msg"> <?php echo sprintf( esc_html__( 'Please choose at list %s options.', 'restrofood' ), "{{item.group_required_number}}" ); ?></p>
                    
                    <#}#>

                    <# _.each( item.group_feature, function( item, i ) {
                    var p = item.price,
                        dataPrice = p.replace(',', '.'),
                        formatType = 'en-IN';

                        if( restrofoodobj.wc_decimal_separator == ',' ) {
                          formatType = 'de-DE';
                        }
                    var y = new Intl.NumberFormat(formatType).format(dataPrice);
                    #>
                    <li>
                      <span class="rb_custom_checkbox extra_item_checkbox rb_w_100">
                        <label>
                          <input
                            class="product-extra-options"
                            type="{{listType}}"
                            data-price="{{dataPrice}}"                          
                            data-formatted-price ="{{item.title}} : <?php echo restrofood_currency_symbol_position( "{{y}}", false ); ?>";
                            value="{{dataPrice}}"
                            name="{{inputName}}[]"
                          />
                          <span
                            class="rb_input_text rb_d_flex rb_align_items_center rb_justify_content_between rb_w_100"
                            >{{item.title}}
                            <span>+ <?php echo restrofood_currency_symbol_position( "{{y}}" , false ); ?></span>
                          </span>
                          <span class="rb_custom_checkmark"></span>
                        </label>
                      </span>
                    </li>
                    <# } ) #>
                    
                  </ul>
                </div>
                <# }  ) #>
              </div>
              <!-- End Extra features List -->
            </div>
            <# } 
            if( data.description ) {
            #>
            <!-- Product Details Content -->
            <div class="variations-tab-content descriptions">
              <div class="rb_product_details_content">
                <div class="rb_product_summary">{{{data.description}}}</div>
              </div>
            </div>
            <#}#>
            </div>
          </div>

          <!-- Quantity -->
          <div class="product-details-qty rb_d_flex rb_align_items_center rb_justify_content_between">
            <span class="rb_label_title"><?php esc_html_e( 'Quantity', 'restrofood' ); ?></span>
            <div class="rb_quantity rb_d_flex rb_align_items_center">
              <div class="rb_input_group">
                  <input type="text" class="rb_input_text" name="rb_quantity" value="1">
                  <span class="rb_minus rb_minus_2"><img src="<?php echo RESTROFOOD_DIR_URL.'assets/img/icon/minus1.svg'; ?>" alt=""></span>
                  <span class="rb_plus rb_plus_2"><img src="<?php echo RESTROFOOD_DIR_URL.'assets/img/icon/plus1.svg'; ?>" alt=""></span>
              </div>
            </div>
          </div>
          <!-- End Quantity -->

          <!-- Input List -->
          <div class="rb_form_input_list">
            <h5 class="input_list_title">
              <?php esc_html_e( 'Special Instructions?', 'restrofood' ); ?>
            </h5>
            <textarea
              class="rb_input_style"
              placeholder="<?php esc_attr_e( 'Add instructions...', 'restrofood' ); ?>"
              name="item_instructions"
            ></textarea>
          </div>
          <!-- End Input List -->

          <!-- Total Price -->
          <div class="rb_label_title rb_total_price rb_d_flex rb_align_items_center rb_justify_content_between">
            <span><?php esc_html_e( 'Total Price', 'restrofood' ); ?></span>
            <span class="rb_total_Price" data-item-price={{data.price}}><?php echo restrofood_currency_symbol_position( "{{data.display_price}}" , false ); ?></span>
          </div>
          <!-- End Tolal Price -->
          <input type="hidden" name="product_id" value={{data.id}} />
          <input type="hidden" name="variation_id" class="variation_id" value="" />
          <input type="hidden" name="product_sku" value={{data.sku}} />
          <!-- Add To Cart -->
          <?php
          $options = get_option('restrofood_options');
          if( !empty( $options['show-cart-button'] ) && $options['show-cart-button'] == 'yes'  ):
          ?>
          <button type="submit" class="rb_btn_fill rb_w_100 rb_add_to_cart_ajax ajax_add_to_cart" ><?php esc_html_e( 'Add to cart', 'restrofood' ); ?></button>
          <?php
          endif;
          ?>

          <div class="fb-after-cart-button" style="display:none"></div>
          <!-- End Add To Cart -->
        </div>
        <!-- End Card -->
      </div>

    </div>
  </form>
</div>
<!-- End Step Content -->

</script>