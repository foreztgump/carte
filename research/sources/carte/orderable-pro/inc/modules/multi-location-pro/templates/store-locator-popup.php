<?php
/**
 * Store locator popup main template.
 *
 * @package Orderable_Pro
 **/

$classes = '';
if ( Orderable_Multi_Location_Pro::is_popup_closable() ) {
	$classes .= ' opml-popup--closable';
}

if ( Orderable_Multi_Location_Pro::open_popup_on_pageload() ) {
	$classes .= ' opml-popup--openonload';
}
?>
<div class="opml-popup <?php echo esc_attr( $classes ); ?>" >
	<div class="opml-popup__content">
		<div class="opml-popup__form">
			<?php
				require Orderable_Helpers::get_template_path( 'templates/store-locator-content.php', 'multi-location-pro', true );
			?>
		</div>

		<?php
		if ( Orderable_Multi_Location_Pro::is_popup_closable() ) {
			?>
			<div class="opml-popup__close" opml-store-popup-close>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M15 1L1 15" stroke="#16110E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M15 15L1 1" stroke="#16110E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</div>
			<?php
		}
		?>
	</div>
</div>
