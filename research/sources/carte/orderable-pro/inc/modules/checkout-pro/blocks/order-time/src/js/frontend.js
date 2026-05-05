/**
 * External dependencies
 */
import { registerCheckoutBlock } from '@woocommerce/blocks-checkout'; // eslint-disable-line import/no-unresolved
/**
 * Internal dependencies
 */
import { Block } from './block';
import metadata from './block.json';

registerCheckoutBlock( {
	metadata,
	component: Block,
} );
