<?php
/**
 *
 * @package     RestroFood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 */

restrofood_page_permission('delivery_boy');
get_header();

$Components = new \Restrofood\Components();
?>
<div class="rb__wrapper">
    <div class="rb_container">
        <div class="rb_row">
            <div class="rb_col_12">
                <?php $Components->filter_area(); ?>
            </div>
            <div class="rb_col_12 restrofood-manager-data">
                <?php
                $obj = new \RestroFood\Admin_Sub_Menu_Templates();
                $obj->delivery_order_manage();
                ?>
            </div>
        </div>
    </div>
</div>
<?php
get_footer();