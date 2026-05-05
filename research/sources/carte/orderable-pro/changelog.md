**v1.15.0** (22 Jul 2024)  
[fix] Use the shipping postcode to find a location when "Ship to a different address" field is checked  
[fix] Product from being added to the cart without required addon  
[fix] Location Selector block being shown when there is only one location  
[fix] Check if the order time selected is greater than the current time and takes into account the lead time for the slot  
[fix] Checkout page reloading when selecting Pickup method on the Location Selector popup  

**v1.14.0** (12 Jun 2024)  
[new] Ability to pause Delivery and Pickup orders  
[new] Filter by Table service on Live Order View  
[fix] Product price not including tax on the product page and the side drawer  
[fix] Adding product to the cart taking a longer time  
[fix] Unwanted HTML showing on email field when stripe payment gateway is active  

**v1.13.0** (11 Apr 2024)  
[new] Compatibility with WooCommerce Checkout block  
[update] Filter out cancelled, refunded and failed orders to determine the remaining slots  
[update] Prevent QR code table orders when the store is closed  
[fix] QR Code image generation  
[fix] "Apply coupon" button layout issue on iOS devices  
[fix] Locations getting duplicated  
[fix] Delivery title in the custom checkout when the option Shipping destination is set to `Force shipping to the customer billing address`  
[fix] Hide the shipping row when the pickup method is selected on the Checkout page  

**v1.12.0** (08 Feb 2024)  
[fix] `Enable Custom Checkout` option for Checkout block  

**v1.11.0** (29 Jan 2024)  
[new] WooCommerce Subscriptions plugin integration  
[new] WooCommerce Points and Rewards plugin integration  
[fix] Checkout page reloading when selecting another shipping method from another location  
[fix] Orderable custom post types parameters  
[fix] Add addons fees to the order line item meta  

**v1.10.1** (12 Dec 2023)  
[fix] Location search results sort in Location Picker  
[fix] Use your current location  
[fix] Max Orders (slot) field when custom orders table (HPOS) is enabled  
[fix] Admin screen compatibility issue with Iconic Delivery Slots  

**v1.10.0** (20 Sep 2023)  
[new] Sort products in the Product Layout  
[fix] Location popup selector not showing up on the checkout page even if specified in the Pages field  
[fix] Product Info button not showing when the product image is not displayed in the Product Layout  
[fix] Duplicated emails sent to the customer about the same order status  

**v1.9.1** (09 Aug 2023)  
[fix] Quick editing of product labels  
[fix] Notification to the main location  
[fix] Fatal error on the checkout page when selecting ASAP for the date field  

**v1.9.0** (25 Jul 2023)  
[new] Compatibility with High-Performance Order Storage (HPOS)  

**v1.8.3** (20 Jul 2023)  
[new] Filters `orderable_should_select_eta_in_date_field` and `orderable_should_select_eta_target_date`  
[fix] Timed products hidden appearing as cross-sell products in the side drawer  
[fix] Custom order status email notification to the customer  
[fix] Inserting a non-valid postcode and selecting pickup  
[fix] Limit the size of the order status slug field  
[fix] Shipping options not showing correctly when the zone regions are limited by the state/country  

**v1.8.2** (27 Jun 2023)  
[new] Filter `orderable_pro_timing_disable_auto_select_date_time` to disable auto selection of first date/time  
[fix] Bug where location title doesn't appear in custom order status  
[fix] Location name in Order Details  
[fix] WooCommerce PayPal Payments validation for multi-location  

**v1.8.1** (18 May 2023)  
[fix] Fatal error caused on ASAP delivery  
[fix] Add to Cart button when the product is out of stock and has addons  

**v1.8.0** (15 May 2023)  
[new] [Multi-location functionality](https://orderable.com/docs/how-to-set-up-multiple-locations/)  
[update] Generate a random table ID if the field is left blank  
[update] Compatibility with Flux Checkout  
[fix] Parameter typo in `orderable_{$post_type}_applicable_groups` filter  
[fix] Tab filter in the product layouts when the category slug is an invalid selector  
[fix] Add French and German language files  

**v1.7.1** (04 Jan 2023)  
[fix] Checkout page reloading when a coupon is applied  
[fix] Cache invalidation in product add-ons  
[fix] Percentage tip when the value is greater than 999.99  
[fix] Infinite loop on the checkout page when Max Orders (Slot) field is set to zero  

**v1.7.0** (16 Nov 2022)  
[new] Product Labels  
[fix] Prevent undefined index notice in the checkout fields  

**v1.6.1** (19 Oct 2022)  
[fix] Issue where default tip won't work  
[fix] Delivery amount beside the total on the checkout page  
[fix] Saving the nutritional info when saving the product  
[fix] Empty product addons in the order  

**v1.6.0** (23 Sep 2022)  
[new] Added filters: `orderable_orderable_addons_applicable_groups` & `orderable_timed_prod_condition_applicable_groups`  
[new] Add Allergens and Nutritional Info to the "Additional Information" section on the product page  
[update] Add missing translations  
[update] Added filter to modify product addon image size `orderable_product_addon_image_size`  
[fix] Text domain for strings in Custom Checkout   
[fix] Check if Title/Label field is empty before saving it in Product Addons   
[fix] Delivery address fields hidden when the option "Shipping destination" is set to "Default to customer shipping address"  

**v1.5.0** (3 Aug 2022)  
[new] Orderable Tip shortcode `[orderable_tip]`  
[new] Added new shortcode: `[orderable_addons]`  
[update] Make addon fees work with variable products  
[update] Allow templates files to be overridden by theme/child theme  
[fix] Order notes missing while table ordering  

**v1.4.0** (20 Jun 2022)  
[new] Allergen info tab  
[new] Table Ordering and QR Code Generation  
[new] SMS and WhatsApp notification  
[fix] Product price on checkout page  
[fix] Shipping method fields on mobile  
[fix] PHP warning in layout module  
[fix] On mobile move shipping method section after address  
[fix] Compatibility with Fluid checkout  
[fix] Remove WooCommerce styles only if custom checkout is enabled  

**v1.3.0** (13 Apr 2022)  
[new] Add nutritional information to your products
[new] Custom order statuses with notifications
[new] Compatibility with WPC product timer  
[new] Ability to limit number of add on choices  
[update] Make product layout tabs mobile friendly with scrolling functionality  
[update] Update text domain for strings in custom checkout  
[update] Make tabs reusable (developer update)  
[fix] Fix issue with the Tip module and WooFunnel plugin  
[fix] Make validation work on single product page  

**v1.2.0** (26 Jan 2022)  
[update] Move ASAP slot setting to Pro  
[update] Remove placeholder settings when Pro is active  
[update] Ability to choose which page checkout logo links to  
[update] Remove shipping subtotal duplication at checkout  
[update] Added inline currency symbol to custom tip field  
[update] Allow negative addon fees  
[fix] Conflict where payment extensions were not visible at checkout  
[fix] Fixed server errors   
[fix] Use separate meta key for Timed products and Addons conditions  
[fix] Issue with incorrect ASAP Timeslot time on order after checking out  
[fix] Issue where incorrect price is displayed when multiple addons apply to same product  
[fix] Add missing RTL styles for Orderable Pro modules  
[fix] Issue where image upload button in addons page won't work  

**v1.1.0** (30 Nov 2021)  
[update] Update POT file  
[fix] Conflict with payment extensions  
[fix] Fixed server errors  

**v1.0.1** (08 Nov 2021)  
[fix] product addons not working correctly  

**v1.0.0** (08 Nov 2021)  
[new] New Pro Module: Custom Checkout - enable a custom and optimized checkout design  
[new] New Pro Module: Timed Products - set product visibility based on time conditions  
[new] Added 'text' field type for Product addons  
[new] Added more CSS classes to product layouts  
[update] Add "Type to search..." message for conditions dropdown  
[fix] Tip text overflowing container  

**v0.2.1** (27 Sep 2021)  
[fix] Fix issue where selected option for radio and dropdown fields cant be changed  

**v0.2.0** (24 Sep 2021)  
[new] ASAP delivery slots  
[update] Move Condition component separate from the Addons module  
[fix] Error if time slot not set  
[fix] Translations not rendering  
[fix] showing order bump for out of stock items  
[fix] Issue with cutoff date  
[fix] Ensure free is activated before running Pro code  

**v0.1.4** (30 Jul 2021)  
[fix] Ensure special characters save for addons  
[fix] Refresh order bumps after cart quantity updated  

**v0.1.3** (5 Jul 2021)  
[new] Tipping feature at checkout  
[update] Fix text domain in translation strings  
[update] Include POT file  
[update] Allow store managers to edit product add ons  
[update] Add "orderable-tabs__item--has-children" class to tab items with children  
[fix] Error when date/time format were in another language  
[fix] Addon fees not displaying when decimal values  

**v0.1.2** (16 Jun 2021)  
[fix] Ensure required addons are validated correctly  
[update] Add required field asterisk  

**v0.1.1** (10 Jun 2021)  
[fix] Fix category headings  

**v0.1.0** (10 Jun 2021)  
Soft Release