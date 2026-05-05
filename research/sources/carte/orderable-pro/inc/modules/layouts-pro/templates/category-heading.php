<?php
/**
 * Layout: Category heading.
 *
 * This template can be overridden by copying it to yourtheme/orderable/layouts-pro/category-heading.php
 *
 * HOWEVER, on occasion Orderable will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @package Orderable_Pro/Templates
 *
 * @var $category array Category array.
 */

defined( 'ABSPATH' ) || exit;

?>

<?php
if ( empty( $category ) ) {
	return;
}
?>

<div class="orderable-category-heading orderable-category-heading--depth-<?php echo esc_attr( $category['depth'] ); ?>">
	<?php if ( 0 === $category['depth'] ) { ?>
		<h2 class="orderable-category-heading__title"><?php echo $category['name']; ?></h2>
	<?php } else { ?>
		<h3 class="orderable-category-heading__title orderable-category-heading__title--sub-category"><?php echo $category['name']; ?></h3>
	<?php } ?>

	<?php if ( ! empty( $category['description'] ) ) { ?>
		<p class="orderable-category-heading__description"><?php echo $category['description']; ?></p>
	<?php } ?>
</div>