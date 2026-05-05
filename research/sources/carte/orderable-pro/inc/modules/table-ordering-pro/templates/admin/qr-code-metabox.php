<?php
/**
 * QR Code Metabox Template.
 *
 * This template can be overridden by copying it to yourtheme/orderable/table-ordering-pro/qr-code-metabox.php
 *
 * HOWEVER, on occasion Orderable will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @package Orderable_Pro/Templates
 *
 * @var Orderable_Table_Ordering_Pro_Table $table Table instance.
 */

defined( 'ABSPATH' ) || exit;

$qr_id = $table ? $table->get_meta_qr_id() : false; ?>

<?php if ( $qr_id ) { ?>
	<?php $src = wp_get_attachment_image_src( $qr_id, 'full' ); ?>
	<?php echo wp_get_attachment_image( $qr_id, 'full', false, array( 'style' => 'max-width: 100%; height: auto;' ) ); ?>
	<div style="text-align: right">
		<a href="<?php echo esc_url( $src[0] ); ?>" class="button button-primary" download><?php esc_html_e( 'Download', 'orderable-pro' ); ?></a>
	</div>
<?php } else { ?>
<div style="border: 1px dashed #ccc; border-radius: 10px; margin: 12px 0 0; background: #F6F7F7; height: 100%; position: relative; padding: 0 0 100%;">
	<p style="color: #666; padding: 30px; text-align: center; position: absolute; top: 0; left: 0; right: 0; top: 50%; transform: translateY( -50% ); margin: 0;">
	<?php esc_html_e( 'Publish this table to generate a QR code automatically.', 'orderable-pro' ); ?>
	</p>
</div>
<?php } ?>
