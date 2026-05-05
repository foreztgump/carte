<?php
/**
 * Layout: Tabs.
 *
 * This template can be overridden by copying it to yourtheme/orderable/layouts-pro/tabs.php
 *
 * HOWEVER, on occasion Orderable will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @package Orderable_Pro/Templates
 *
 * @var $products array Produces array.
 */

defined( 'ABSPATH' ) || exit;

if ( ! in_array( $args['sections'], array( 'top_tabs', 'side_tabs' ), true ) || isset( $products[0] ) ) {
	return;
} ?>

<div class="orderable-main__tabs orderable-tabs" data-orderable-tabs='{ "wrapper": ".orderable-main", "sections": ".orderable-main__group" }'>
	<ul class="orderable-tabs__list">
		<?php $i = 0; ?>
		<?php
		foreach ( $products as $product_group ) {
			$category = $product_group['category'];
			$classes  = Orderable_Layouts_Pro::get_tab_item_classes( $i, $category );
			?>
			<li class="<?php echo esc_attr( implode( ' ', $classes ) ); ?>" role="tab">
				<a href="#category-<?php echo esc_attr( urldecode( $category['slug'] ) ); ?>" class="orderable-tabs__link"><?php echo wp_kses_post( $category['name'] ); ?></a>
			</li>
			<?php ++$i; ?>
		<?php } ?>
	</ul>

	<button class="orderable-tabs__arrow orderable-tabs__arrow-left">
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->
			<path d="M438.6 278.6l-160 160C272.4 444.9 264.2 448 256 448s-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L338.8 288H32C14.33 288 .0016 273.7 .0016 256S14.33 224 32 224h306.8l-105.4-105.4c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160C451.1 245.9 451.1 266.1 438.6 278.6z" />
		</svg>
	</button>

	<button class="orderable-tabs__arrow orderable-tabs__arrow-right">
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->
			<path d="M438.6 278.6l-160 160C272.4 444.9 264.2 448 256 448s-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L338.8 288H32C14.33 288 .0016 273.7 .0016 256S14.33 224 32 224h306.8l-105.4-105.4c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160C451.1 245.9 451.1 266.1 438.6 278.6z" />
		</svg>
	</button>
</div>
