/*---------------------------------------------
package       :  RestroFood
Version       :  3.4.0
Author        :  ThemeLooks
Author url    :  http://themelooks.com

NOTE:
------
Please DO NOT EDIT THIS JS, you may need to use "custom.js" file for writing your custom js.
We may release future updates so it will overwrite this file. it's better and safer to use "custom.js".

[Table of Content]

    01: SVG Image
    02: Top 50
----------------------------------------------*/

(function ($) {
    "use strict";

    let h, u = {};

    u = {

        classCheckoutOrderPlaceArea: function() {
            return '.fb-checkout-order-place-area';
        },
        classCheckoutAvailabilityCheckerWrapper: function() {
            return '.fb-checkout-availability-checker-wrapper';
        }

    }

    h = {

        deliveryTimeSlotStatusEvent: function( $val ) {

            let $index   = $val.indexOf("no");

            if( $index != -1 ) {
                $('.fb-checkout-availability-checker-wrapper').hide();
                $('.fb-checkout-order-place-area').hide();
            } else {
                $('.fb-checkout-availability-checker-wrapper').show();
                $('.fb-checkout-order-place-area').show();
            }

        }

    }




}(jQuery))