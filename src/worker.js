
import { pipeline } from '@xenova/transformers';



class EmbeddingPipeline {
	static task = 'feature-extraction';
	static model = 'Xenova/bert-base-uncased';
	static instance = null;

	static async getInstance(progress_callback = null) {
		if( this.instance === null ) {
			this.instance = pipeline(this.task, this.model, { progress_callback });
		}
		return this.instance;

	}


}



// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  	console.log("Got message in worker:", event.data.src_dir.name);
  // Retrieve the translation pipeline. When called for the first time,
  // this will load the pipeline and save it for future use.
  let indexer = await EmbeddingPipeline.getInstance(x => {
      // We also add a progress callback to the pipeline so that we can
      // track model loading.
      self.postMessage(x);
  });

  let src_dir = event.data.src_dir;


  //let outputTensor = await indexer('Fix me');
  //let outputArray = outputTensor.tolist();

  // Send the output back to the main thread
  self.postMessage({
      status: 'complete',
      output: "foo",
  });
});

// let extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
// let result = await extractor('This is a simple test.', { pooling: 'mean', normalize: true });
// console.log(result);
// // Tensor {
// //     type: 'float32',
// //     data: Float32Array [0.09094982594251633, -0.014774246141314507, ...],
// //     dims: [1, 384]
// // }