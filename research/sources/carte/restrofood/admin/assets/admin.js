(function ($) {
    "use strict";
    
    var restrofoodAdmin = {

        init: function () {

            var $this = this;

            /**
             * datepicker init for Date filter 
             * { dateFormat: 'dd-mm-yy' }
             * 
             */

            $(".datepicker").datepicker({ 
                dateFormat: adminRestrofoodobj.datepicker_format,
                 inline: true,
                onSelect: function(dateText, inst) { 
                    var date = $(this).datepicker('getDate'),
                        day  = date.getDate(),  
                        month = date.getMonth() + 1,              
                        year =  date.getFullYear();

                    $(this).data( 'getdate', month+ '/' + day + '/' + year );
                }
            });


            // Time Picker init
            $this.timePicker();
            // admin settings conditional field
            $this.conditionalField();

            // admin settings tab
            $this.adminSettingsTab();

            // zip code repeter
            $this.zipCodeRepeater();

            // Zip code repeter multi input
            $this.zipCodeRepeaterMultiInput();

            // km Delivery Fee repeter
            $this.kmDeliveryFeeRepeaterField();

            // Product visibility Time repeter
            $this.productVisibilityTime();
            
            // add branch repeter
            $this.addBranchRepeater();

            // Media uploader
            $this.mediaUploader();

            // color picker
            $this.colorPicker();

            // Order view modal
            $this.OrderViewModal();

            // pre order data filter
            $this.preOrderDataFilter();

            // admin Default order list
            $this.adminDefaultOrderList();

            // admin order list by filter
            $this.adminFilterOrderList();

            // Order Tracking status chnage 
            $this.orderTrackingStatusChange();

            // Delivery boy assign ajax handler
            $this.deliveryAssign();

            // Order branch transfer ajax handler
            $this.OrderBranchTransfer();

            // invoice print
            $this.invoicePrint();

            // Shortcode Generator
            $this.shortcodeGenerator();

            // Admin new order notification 
            if( adminRestrofoodobj.is_branch_order ) {
                $this.newOrderNotification();
            } 
            
        },
        colorPicker: function () {
            $('.fb-color-field').wpColorPicker();
        },
        timePicker: function () {
            // Time picker
            let $timeFormat = 'h:mm tt';;

            if( adminRestrofoodobj.time_format == '24' ) {
                $timeFormat = 'hh:mm tt';
            }

            $('.time-picker').mdtimepicker({
                // format of the input value
                format: $timeFormat 
            });
        },
        conditionalField: function () {

            /**
             * Conditional field for settings option
             */

            let addressFields = $('.fb-address-conditional-field'),
                zipFields     = $('.fb-zip-conditional-field'),
                branchAddressFields = $('.tatCmf-branch-address-field'),
                branchZipFields     = $('.tatCmf-branch-zip-code-field');

            // Onchange event
            $('[name="restrofood_options[location_type]"]').on( 'change', function() {

                let $this = $(this);

                if( $this.val() == 'address' ) {
                   addressFields.show('slow');
                   zipFields.hide('slow');
                }else {
                    addressFields.hide('slow');
                    zipFields.show('slow');
                }

            } )

            // Default
            
            if( $('[name="restrofood_options[location_type]"]').val() == 'address' ) {
                addressFields.show('slow');
                zipFields.hide('slow');
            } else {
                addressFields.hide('slow');
                zipFields.show('slow');
            }

            /**
             * Conditional field for add/edit branch option 
             */

            if( adminRestrofoodobj.location_type == 'zip' ) {
                branchAddressFields.hide();
                branchZipFields.show();
            } else {
                branchAddressFields.show();
                branchZipFields.hide();
            }


        },
        adminSettingsTab: function () {

            // Tab
            var tabSelect = $('[data-tab-select]');
            var tab = $('[data-tab]');
            tabSelect.each(function () {
                var tabText = $(this).data('tab-select');
                $(this).on('click', function () {
                    localStorage.setItem("tabActivation", tabText);
                    
                    $(this).addClass('active').siblings().removeClass('active');
                    tab.each(function () {
                        if (tabText === $(this).data('tab')) {
                            $(this).fadeIn(500).siblings().hide(); // for click
                            // $(this).fadeIn(500).siblings().stop().hide(); // active if hover
                            $(this).addClass('active').siblings().removeClass('active');
                        }
                    });
                });
                if ($(this).hasClass('active')) {
                    tab.each(function () {
                        if (tabText === $(this).data('tab')) {
                            $(this).addClass('active');
                        }
                        if ($(this).hasClass('active')) {
                            $(this).show().siblings().hide();

                        }
                    });
                }
            });

            // localStorage.removeItem("tabActivation");
            
            // Check active tab
            let activateTab = localStorage.getItem("tabActivation");

            if( activateTab ) {
                $('[data-tab-select="'+activateTab+'"]').addClass('active').siblings().removeClass('active');
                $('[data-tab="'+activateTab+'"]').show().siblings().hide();
            }

        },
        zipCodeRepeater: function () {

            $(document).on('click', '.addtime', function (e) {

                e.preventDefault();

                var $this = $(this);

                var inner = $this.parent().find('.field-wrapper'),
                    $name = inner.data('name');
                    
                var $new_repeater = '';
                $new_repeater += '<div class="single-field">';
                $new_repeater += '<input type="text" name="restrofood_options['+$name+'][]" />';
                $new_repeater += '<span class="removetime fb-admin-btn">Remove</span>';
                $new_repeater += '</div>';

                inner.append($new_repeater);

            })

            //
            $(document).on('click', '.removetime', function () {
                var $this = $(this);
                $this.parent().remove();
            })


        },
        zipCodeRepeaterMultiInput: function () {

            $(document).on('click', '.addRepeaterFieldMultiInput', function (e) {

                e.preventDefault();

                var $this = $(this);

                var inner = $this.parent().find('.field-wrapper'),
                    $name = inner.data('name');

                var $count = inner.find( '.single-field' ).length;

                var $new_repeater = '';
                $new_repeater += '<div class="single-field">';
                $new_repeater += '<input type="text" name="'+$name+'['+$count+'][code]" placeholder="Zip Code" />';
                $new_repeater += '<input type="text" name="'+$name+'['+$count+'][fee]" placeholder="fee" />';
                $new_repeater += '<span class="removetime fb-admin-btn">Remove</span>';
                $new_repeater += '</div>';

                inner.append($new_repeater);

                $count++;

            })

            //
            $(document).on('click', '.removetime', function () {
                var $this = $(this);
                $this.parent().remove();
            })


        },
        kmDeliveryFeeRepeaterField: function() {

            var $count = $( '.km-single-field' ).length;
            // Text Repeater Field
            $(document).on('click', '.addkmRepeaterField', function (e) {

                var inner = $(this).parent().find('.field-wrapper'),
                    $name = inner.data('name');

                var $new_repeater = '';
                $new_repeater += '<div class="single-field">';
                $new_repeater += '<input type="number" name="'+$name+'['+$count+'][km]" placeholder="Kilometer" step="0.1" />';
                $new_repeater += '<input type="number" name="'+$name+'['+$count+'][fee]" placeholder="Fee" step="0.1" />';
                $new_repeater += '<span class="removeRepeaterField fb-admin-btn">Remove</span>';
                $new_repeater += '</div>';

                $count++;
                inner.append($new_repeater);

            })
            //
            $(document).on('click', '.removeRepeaterField', function () {
                var $this = $(this);
                $this.parent().remove();
            })

        },
        productVisibilityTime: function() {

            var $count = $( '.km-single-field' ).length,
                $that = this;
            // Text Repeater Field
            $(document).on('click', '.addProductVisibilityTime', function (e) {

                var inner = $(this).parent().find('.field-wrapper'),
                    $name = inner.data('name');

                var $new_repeater = '';
                $new_repeater += '<div class="single-field">';
                $new_repeater += '<input class="tatCmf-input-control" type="text" name="'+$name+'['+$count+'][type]" placeholder="Type"  />';
                $new_repeater += '<input class="time-picker" type="text" name="'+$name+'['+$count+'][starttime]" placeholder="Start Time"  />';
                $new_repeater += '<input class="time-picker" type="text" name="'+$name+'['+$count+'][endtime]" placeholder="End Time" />';
                $new_repeater += '<span class="removeRepeaterField fb-admin-btn">Remove</span>';
                $new_repeater += '</div>';

                $count++;
                inner.append($new_repeater);

                $(inner).trigger('click');

                $that.timePicker();
            })

            //
            $(document).on('click', '.removeRepeaterField', function () {
                var $this = $(this);
                $this.parent().remove();
            })

        },
        addBranchRepeater: function () {

            $(document).on('click', '.addbranch', function (e) {

                e.preventDefault();

                var $this = $(this);

                var inner = $this.parent().find('.field-wrapper');

                var $new_repeater = '';
                $new_repeater += '<div class="single-field">';
                $new_repeater += '<input type="text" name="restrofood_options[branch_name][]" />';
                $new_repeater += '<span class="removebranch fb-admin-btn">Remove</span>';
                $new_repeater += '</div>';

                inner.append($new_repeater);

            })

            //
            $(document).on('click', '.removebranch', function () {
                var $this = $(this);
                $this.parent().remove();
            })
        },
        mediaUploader: function () {

            // Media Upload
            var mediaUploader, t;

            $('.restrofood_image_upload_btn').on('click', function (e) {

                e.preventDefault();

                t = $(this).parent().find('.restrofood_background_image');

                if (mediaUploader) {
                    mediaUploader.open();
                    return;
                }
                mediaUploader = wp.media.frames.file_frame = wp.media({
                    title: 'Choose Image',
                    button: {
                        text: 'Choose Image'
                    }, multiple: false
                });
                mediaUploader.on('select', function () {
                    var attachment = mediaUploader.state().get('selection').first().toJSON();

                    t.val(attachment.url)

                });
                mediaUploader.open();
            });

        },
        OrderViewModal: function () {

            // Modal Open Event
            $(document).on('click', '.fb-view-order', function () {
                $(this).parent().find('.rb_popup_modal').addClass('open').fadeIn('300');
                $("body").addClass('fbPopupModal-opened');

            });

            function removeModal() {
                $('.rb_popup_modal').removeClass('open').fadeOut('300')
                $("body").removeClass('fbPopupModal-opened');
            }

            // Modal Close event
            $(document).on('click', '.rb_close_modal', removeModal)

            $(document).on('click', '.rb_popup_modal', function (e) {
                let isShow = e.target === e.currentTarget;

                if (isShow) {
                    removeModal();
                }
            })

            $(document).on('keydown', function (e) {
                if (e.key === 'Escape') {
                    removeModal();
                }
            })

        },
        adminDefaultOrderList: function () {

            let $this = this;

            if ( $('#restrofood_filter').length ) {

                // DataTable Default
                $.ajax({

                    type: "POST",
                    url: adminRestrofoodobj.ajaxurl,
                    data: {
                        action: "order_filter_by_date_action",
                    },
                    beforeSend: function () {
                        $('#admin-branch-order-list').html('<h3 class="order-loading">Loading.........</h3>')
                    },
                    success: function (res) {

                        $('#dtable').html(res)
                        $('.restrofood-order-list').DataTable({responsive: true})

                        // Order statistic
                        $this.orderStatistic();
                        // ajax get order status notification count
                        $this.notificationCount();

                    }

                })

                // Click filter
                $(document).on('click', '[data-filter]', function () {

                    var t = $(this).data('filter');

                    $('.restrofood-order-list').DataTable({responsive: true}).search(t,false, false).draw();

                })

            }

        },
        adminFilterOrderList: function () {

            var $that = this;

            $(document).on('submit', '#restrofood_filter', function (e) {

                e.preventDefault();

                //
                $that.orderStatistic();

                var $date       = $('.order-date').val(),
                    $formatedDate = $('[data-getdate]').data('getdate'),
                    $branch     = $('#order-branch').val(),
                    $branchName = $('#order-branch option:selected').text();

                $('.current-date').text($date);

                // AJAX 
                $.ajax({

                    type: "POST",
                    url: adminRestrofoodobj.ajaxurl,
                    data: {
                        action: "order_filter_by_date_action",
                        date: $formatedDate,
                        branch: $branch
                    },
                    beforeSend: function () {
                        $('#admin-branch-order-list').html('<h3 class="order-loading">Loading.........</h3>')
                    },
                    success: function (res) {
                        
                        $('.branch-order').show();
                        $('.statistics-area').show();

                        $('.branch-name').text( $branchName );
                        $('#dtable').html(res)
                        $('.restrofood-order-list').DataTable({responsive: true})
                        $that.notificationCount();

                    }

                })

            })

        },
        orderTrackingStatusChange: function () {

            var $that = this;

            $(document).on('click', '[data-tracking-status]', function () {

                var $this = $(this),
                    $orderID = $this.data('orderid'),
                    $status = $this.data('tracking-status');

                $.ajax({
                    type: "POST",
                    url: adminRestrofoodobj.ajaxurl,
                    data: {
                        action: "order_tracking_status_action",
                        orderId: $orderID,
                        status: $status
                    },
                    success: function (res) {
                        $('.status-active').removeClass('status-active')
                        $this.addClass('status-active')
                        $this.prevAll().addClass("fb-d-none")
                        $that.notificationCount();
                    }
                })

            })

        },
        preOrderDataFilter: function() {

            let filter = $(document).find('.preorder-date-filter'),
                $this = this;

            filter.on( 'click', function( e ) {

                e.preventDefault();

                let $this   = $( this ),
                    $date   = $this.closest('.rb_input_wrapper').find('[data-getdate]').data('getdate'),
                    $branch = $this.closest('.rb_input_wrapper').find('#order-branch').val(),
                    $allPreorder = $this.data('all-preorder');
                
                $.ajax({

                    type: "post",
                    url: adminRestrofoodobj.ajaxurl,
                    data: {
                        action: "order_filter_by_date_action",
                        date: $date,
                        branch: $branch,
                        preorder: $allPreorder,
                        queryType: 'preorder'
                    },
                    success: function ( res ) {
                        $('.branch-order').hide();
                        $('.statistics-area').hide();
                        $('#dtable').html(res);
                    }

                })

            } )

        },
        notificationCount: function () {

            var $date = $('[data-getdate]').data('getdate'),
                $branch = $('#order-branch').val();

            $.ajax({
                type: "POST",
                url: adminRestrofoodobj.ajaxurl,
                data: {
                    action: "notification_number_action",
                    date: $date,
                    branche_id: $branch
                },
                success: function (res) {
                    $('.fb-order-notification').html(res)
                }
            })

        },
        deliveryAssign: function () {

            $(document).on('click', '#delivery_assign', function () {

                var $this = $(this),
                    $parent = $this.parent(),
                    $boy_id = $this.parent().find('#delivery_boy').val(),
                    $orderId = $this.data('orderid');


                $.ajax({
                    type: "POST",
                    url: adminRestrofoodobj.ajaxurl,
                    data: {
                        action: "order_delivery_boy_assign_action",
                        boy_id: $boy_id,
                        orderId: $orderId
                    },
                    success: function (res) {

                        $('.assigned-alert').remove();

                        if (res.success == true) {

                            $parent.append('<p class="assigned-alert">'+adminRestrofoodobj.get_text.boy_assigned_success+'</p>');

                        } else {
                            $parent.append('<p class="assigned-alert">'+adminRestrofoodobj.get_text.boy_assigned_failed+'</p>');
                        }

                    }
                })


            })

        },
        OrderBranchTransfer: function () {

            $(document).on('click', '#order_transfer', function () {

                var $this = $(this),
                    $parent = $this.parent(),
                    $branch_id = $this.parent().find('#branch_list').val(),
                    $orderId = $this.data('orderid');


                $.ajax({
                    type: "POST",
                    url: adminRestrofoodobj.ajaxurl,
                    data: {
                        action: "order_branch_transfer_action",
                        branch_id: $branch_id,
                        orderId: $orderId
                    },
                    success: function (res) {

                        $('.assigned-alert').remove();

                        if (res.success == true) {

                            $parent.append('<p class="assigned-alert">'+adminRestrofoodobj.get_text.Order_transfer_success+'</p>');

                        } else {
                            $parent.append('<p class="assigned-alert">'+adminRestrofoodobj.get_text.Order_transfer_failed+'</p>');
                        }

                    }
                })

            })


        },
        orderStatistic: function () {

            var $that = this,
                $date = $('[data-getdate]').data('getdate'),
                $branchId = $('#order-branch').val();

            $.ajax({
                type: "POST",
                url: adminRestrofoodobj.ajaxurl,
                data: {
                    action: "order_statistic_action",
                    date: $date,
                    branchId: $branchId
                },
                success: function (res) {

                    $.each(res.data, function ( index, item ) {

                        $('.' + index + '-total_count').text(item.total_count)
                        $('.' + index + '-total_value').html( item.total_value )

                    })

                }
            })

        },
        invoicePrint: function() {

            // Print event             
            $( document ).on( 'click', '.fb-inv-print', function() {

                var t = $(this).closest( '.rb_modal_content' ),
                    i = $(t).find(".content-inner-hide"),
                    e = $(t).find(".fb-invoice-template");

                i.hide();
                e.show();
                $( '.fb-inv-back' ).show();
                e.print({addGlobalStyles: true});


            } )

            // Print Preview
            $( document ).on( 'click', '.fb-inv-back', function() {

                var t = $(this).closest( '.rb_modal_content' ),
                    i = $(t).find(".content-inner-hide"),
                    e = $(t).find(".fb-invoice-template");
                    
                    i.show('slow')
                    e.hide('slow')
                    $(this).hide('slow')

            } )

        },
        currency_symbol_position: function( price = '' ) {

            var currency_pos = adminRestrofoodobj.currency_pos,
                $currency = adminRestrofoodobj.currency,
                $price;


            switch( currency_pos ) {
              case 'right':
                $price = price+$currency;
                break;
              case 'left_space':
                $price = $currency+' '+price;
                break;
              case 'right_space':
                $price = price+' '+$currency;
                break;
              default:
                $price = $currency+price;
                break;
                // code block
            }

            return $price;

        },
        newOrderNotification: function() {

            let time = adminRestrofoodobj.order_notification_delay_time,
                text = adminRestrofoodobj.get_text.new_order_placed,
                $this = this;

            let  $audio = '<audio autoplay><source src="'+adminRestrofoodobj.notification_audio+'" type="audio/mpeg"></audio>';

            let stopAudioLoop =  0;


            setInterval( function(){

                setTimeout( function(){

                    $(document).find('.fb-admin-order-push-notification-inner').slideUp('slow', function() {
                        $(this).parent().remove()
                    });

                }, 4000);

                $.ajax({
                    type: "POST",
                    url: adminRestrofoodobj.ajaxurl,
                    data: {
                        action: "new_order_push_notification_action"
                    },
                    success: function ( res ) {
                        //
                        if( res != 0 ) {

                            let audioHtml = '';

                            if( stopAudioLoop < res || stopAudioLoop > res ) {
                                //
                                if( adminRestrofoodobj.noti_audio_loop != 'yes' && stopAudioLoop < res ) {
                                    audioHtml = $audio;                         
                                }
                                
                                //
                                if( stopAudioLoop > 0 || res == 1 ) {

                                    // update Branch Manager Data
                                    $this.adminDefaultOrderList(); 
                                }

                                stopAudioLoop = res;
                            }

                            // Audio loop active
                            if( adminRestrofoodobj.noti_audio_loop == 'yes' ) {
                                audioHtml = $audio;
                            }

                            $('body').append('<div class="fb-admin-order-push-notification"><div class="fb-admin-order-push-notification-inner" >'+audioHtml+'<p>'+res+' '+text+'</p></div></div>');

                            $(document).find('.fb-admin-order-push-notification-inner').fadeIn('slow'); 


                                                      
                        }
                        
                    }
                })

            }, time+'000');
     
        },
        shortcodeGenerator: function() {

            /*********************************
                Shortcode Generator Options
            **********************************/
            
            // Selectors 
            let $shortcodeType  = $('#shortcodeType'),
                $column         = $('#column'),
                $layout         = $('#layout'),
                $limit          = $('#limit'),
                $style          = $('#style'),
                $search         = $('#search'),
                $padding_top    = $("#padding_top"),
                $padding_bottom = $("#padding_bottom"),
                $categories     = $("#categories"),
                $branch_list    = $("#branch_list"),
                $search_text    = $("#search_text"),
                $mini_cart_type = $("#mini_cart_type"),
                $buttonArea     = $('.button-area'),
                $scodeShow      = $('.scode-show'),
                $scodeCopy      = $( '#scode-copy' ),
                $selectAll      = $('.shortcode-attr-single-field'),
                $selectProdutAttr      = $('.produt-attr-field'),
                $selectAbilityChecker  = $('.ability-checker-attr-field');



            // Default events
            $buttonArea.hide();

            if( $shortcodeType.val() == '' ) {
                $selectAll.hide()
            }

            $scodeCopy.hide();

            // Review Type on change events
            
            $shortcodeType.on( 'change', function() {

                $buttonArea.show();

                if( $(this).val() == 'restrofood_products' ) {
                    $selectProdutAttr.show();
                    $mini_cart_type.show();
                    $style.show();
                    $selectAbilityChecker.hide();
                    $limit.hide();
                }else if( $(this).val() == 'restrofood_delivery_ability_checker' ) {
                    $selectAbilityChecker.show();
                    $mini_cart_type.hide();
                    $style.hide();
                    $selectProdutAttr.hide();
                }else {
                    $selectAll.hide();
                }
                
            });  
            
            $( '#scodegenerate' ).on( 'click', function() {

                let $attr ='';

                let $getShortcode = $shortcodeType.val();

                //
                if( $column.is(":visible") ) {
                    $attr += ' col="'+$column.val()+'"';
                }
                //
                if( $layout.is(":visible") && $layout ) {
                    $attr += ' layout="'+$layout.val()+'"';
                }
                //
                if( $style.is(":visible") && $style ) {
                    $attr += ' style="'+$style.val()+'"';
                }
                //
                if( $mini_cart_type.is(":visible") && $mini_cart_type ) {
                    $attr += ' mini_cart_type="'+$mini_cart_type.val()+'"';
                }
                //
                if( $limit.is(":visible") && $limit ) {
                    $attr += ' limit="'+$limit.val()+'"';
                }
                //
                if( $search.is(":visible") ) {
                    $attr += ' search="'+$search.val()+'"';
                }
                //
                if( $padding_top.is(":visible") ) {
                    $attr += ' padding_top="'+$padding_top.val()+'"';
                }
                //
                if( $padding_bottom.is(":visible") ) {
                    $attr += ' padding_bottom="'+$padding_bottom.val()+'"';
                }
                //
                if( $categories.is(":visible") ) {
                    $attr += ' cat="'+$categories.val()+'"';
                }
                //
                if( $search_text.is(":visible") ) {
                    $attr += ' button_text="'+$search_text.val()+'"';
                }
                //
                if( $branch_list.is(":visible") ) {
                    $attr += ' branch_id="'+$branch_list.val()+'"';
                }

                $scodeShow.fadeIn('slow');
                $scodeCopy.show();
                $scodeShow.html( '<p class="shortcodearea"><code>['+$getShortcode+' '+$attr+']</code></p>' );

            });


            // Copy shortcode
            $scodeCopy.on( 'click', function() {

                var $shortcode = $('.shortcodearea');

                var $temp = $("<input>");
                $("body").append($temp);
                $temp.val($shortcode.text()).select();
                document.execCommand("copy");
                $temp.remove();

                $scodeShow.fadeIn('slow').fadeOut('slow');
                $(this).fadeOut('slow');


            } );


        }


    }

    // Init object

    restrofoodAdmin.init();

})(jQuery)