
import { pipeline } from '@xenova/transformers';

class EmbeddingPipeline {
	static task = 'feature-extraction';
	static model = 'Xenova/all-MiniLM-L6-v2';
	static instance = null;

	static async getInstance(progress_callback = null) {
		if( this.instance === null ) {
			this.instance = pipeline(this.task, this.model, { progress_callback });
		}
		return this.instance;
	}
}



// let extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
// let result = await extractor('This is a simple test.', { pooling: 'mean', normalize: true });
// console.log(result);
// // Tensor {
// //     type: 'float32',
// //     data: Float32Array [0.09094982594251633, -0.014774246141314507, ...],
// //     dims: [1, 384]
// // }