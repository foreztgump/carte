/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import { SelectControl, Disabled } from '@wordpress/components';

export const Edit = () => {
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<Disabled>
				<SelectControl
					label={ __( 'Delivery Time', 'orderable' ) }
					options={ [
						{
							value: '1430',
							label: __( '2:30 PM', 'orderable' ),
						},
						{
							value: '1500',
							label: __( '3:00 PM', 'orderable' ),
						},
					] }
				/>
			</Disabled>
		</div>
	);
};
