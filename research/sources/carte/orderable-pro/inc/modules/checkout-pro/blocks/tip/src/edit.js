import { useBlockProps } from '@wordpress/block-editor';
import './editor.scss';
import { __ } from "@wordpress/i18n";

export default function Edit() {
	return (
		<div { ...useBlockProps() }>
			<div className="orderable-tip-checkout-block wc-block-components-totals-wrapper">
				<div className="wc-block-components-totals-item">
					<div id="orderable-tip" className="orderable-tip">
						<strong className="orderable-tip__title">
							{ __( 'Tip Amount', 'orderable-pro' ) }
						</strong>
						<div className="orderable-tip__row orderable-tip__row--predefined">
							<button
								type="button"
								className="orderable-button orderable-button--tip orderable-tip__button"
							>
								1
							</button>
							<button
								type="button"
								className="orderable-button orderable-button--tip orderable-tip__button"
							>
								2
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
