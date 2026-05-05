import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function Edit() {
	return (
		<div { ...useBlockProps() }>
			<div className="wc-block-components-totals-wrapper">
				<div className="wc-block-components-totals-item">
					<span className="wc-block-components-totals-item__label">
						{ __( 'Table', 'orderable-pro' ) }
					</span>
					<span className="wc-block-components-totals-item__value">
						{ __( ' #1', 'orderable-pro' ) }
					</span>
				</div>
			</div>
		</div>
	);
}
