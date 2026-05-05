import { useBlockProps } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';
import metadata from './block.json';

export default function Edit() {
	return (
		<div { ...useBlockProps() }>
			<ServerSideRender block={ metadata.name } />
		</div>
	);
}
