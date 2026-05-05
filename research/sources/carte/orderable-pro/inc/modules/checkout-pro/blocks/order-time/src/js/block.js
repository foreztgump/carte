/**
 * External dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { SelectControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { ValidationInputError } from '@woocommerce/blocks-components'; // eslint-disable-line import/no-unresolved
import { filter, keys, isEmpty } from 'lodash';

export const Block = ( { checkoutExtensionData, extensions, validation } ) => {
	const { setExtensionData } = checkoutExtensionData;
	const { getValidationError, setValidationErrors, clearValidationError } =
		validation;

	const serviceDates =
		extensions?.[ 'orderable/order-service-date' ]?.serviceDates;
	const serviceTimeLabel =
		extensions?.[ 'orderable-pro/order-service-time' ]?.serviceTimeLabel;

	const serviceDateSelected = useSelect( ( select ) => {
		return select( 'wc/store/checkout' ).getExtensionData()?.[
			'orderable/order-service-date'
		]?.timestamp;
	} );
	const serviceTimeSelected = useSelect( ( select ) => {
		return select( 'wc/store/checkout' ).getExtensionData()?.[
			'orderable-pro/order-service-time'
		]?.time;
	} );

	const [
		shouldSelectFirstAvailableTime,
		setShouldSelectFirstAvailableTime,
	] = useState( false );

	const shouldSelectFirstAvailableDate =
		extensions?.[ 'orderable/order-service-date' ]
			?.shouldSelectFirstAvailableDate;

	const serviceTimes = serviceDates?.[ serviceDateSelected ]?.slots;

	const isDisabled = useSelect( ( select ) => {
		return (
			select( 'wc/store/cart' ).isShippingRateBeingSelected() ||
			select( 'wc/store/cart' ).isCustomerDataUpdating()
		);
	} );

	const hasNoServiceTimesAvailable = getValidationError(
		'orderable-pro/order-service-time'
	);
	const hasNoServiceTimeSelected = getValidationError(
		'orderable-pro/order-no-service-time-selected'
	);

	useEffect( () => {
		if ( shouldSelectFirstAvailableDate ) {
			setShouldSelectFirstAvailableTime( true );
		}
	}, [ shouldSelectFirstAvailableDate ] );

	useEffect( () => {
		if ( shouldSelectFirstAvailableTime && ! isDisabled ) {
			const key = filter( keys( serviceTimes ).sort() )?.[ 1 ];
			const time = serviceTimes?.[ key ]?.label;

			if ( ! time ) {
				return;
			}

			setExtensionData(
				'orderable-pro/order-service-time',
				'time',
				time
			);

			setShouldSelectFirstAvailableTime( false );
		}
	}, [
		shouldSelectFirstAvailableTime,
		isDisabled,
		serviceTimes,
		setExtensionData,
	] );

	useEffect( () => {
		if (
			serviceDateSelected &&
			'asap' !== serviceDateSelected &&
			! serviceTimes
		) {
			setValidationErrors( {
				'orderable-pro/order-service-time': {
					message: __(
						'Sorry, there are currently no slots available.',
						'orderable-pro'
					),
					hidden: false,
				},
			} );

			return;
		}

		clearValidationError( 'orderable-pro/order-service-time' );
	}, [
		serviceDateSelected,
		serviceTimes,
		setValidationErrors,
		clearValidationError,
	] );

	useEffect( () => {
		if (
			! isEmpty( serviceTimes ) &&
			! serviceTimeSelected &&
			serviceDateSelected &&
			'asap' !== serviceDateSelected
		) {
			setValidationErrors( {
				'orderable-pro/order-no-service-time-selected': {
					message: __( 'Please select a service time', 'orderable' ),
					hidden: true,
				},
			} );

			return;
		}

		clearValidationError( 'orderable-pro/order-no-service-time-selected' );
	}, [
		serviceTimeSelected,
		setValidationErrors,
		clearValidationError,
		serviceDateSelected,
		serviceTimes,
	] );

	useEffect( () => {
		if ( ! serviceTimeSelected ) {
			return;
		}

		if ( ! serviceTimes?.[ serviceTimeSelected ] ) {
			return;
		}

		if ( ! serviceTimes[ serviceTimeSelected ]?.time_slot_id ) {
			return;
		}

		setExtensionData(
			'orderable-pro/order-service-time',
			'time-slot-id',
			serviceTimes[ serviceTimeSelected ].time_slot_id
		);
	}, [ serviceTimeSelected, serviceTimes, setExtensionData ] );

	return (
		<div
			className={ `wp-block-orderable-checkout__service-time ${
				hasNoServiceTimeSelected ? 'has-error' : ''
			}` }
		>
			{ hasNoServiceTimesAvailable?.message && (
				<ValidationInputError
					errorMessage={ hasNoServiceTimesAvailable.message }
				/>
			) }

			{ serviceDateSelected && serviceTimes && (
				<>
					<SelectControl
						label={ serviceTimeLabel }
						disabled={ isDisabled }
						value={ serviceTimeSelected }
						options={ Object.keys( serviceTimes )
							.sort()
							.map( ( key ) => serviceTimes[ key ] ) }
						onChange={ ( value ) => {
							setExtensionData(
								'orderable-pro/order-service-time',
								'time',
								value
							);
						} }
					/>
					{ hasNoServiceTimeSelected &&
						! hasNoServiceTimeSelected.hidden && (
							<ValidationInputError
								errorMessage={
									hasNoServiceTimeSelected.message
								}
							/>
						) }
				</>
			) }
		</div>
	);
};
