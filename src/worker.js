
import { pipeline } from '@xenova/transformers';

const index = [];

class EmbeddingPipeline {
	static task = 'embeddings';
	static model = 'Xenova/bert-base-uncased';
	static instance = null;

	static async getInstance(progress_callback = null) {
		if( this.instance === null ) {
			this.instance = pipeline(this.task, this.model, { progress_callback });
		}
		return this.instance;

	}


}


function calculateCosineSimilarity(queryEmbedding, embedding) {
  let dotProduct = 0;
  let queryMagnitude = 0;
  let embeddingMagnitude = 0;
  let queryEmbeddingLength = queryEmbedding.data.length;
  for (let i = 0; i < queryEmbeddingLength; i++) {
      dotProduct += queryEmbedding.data[i] * embedding.data[i];
      queryMagnitude += queryEmbedding.data[i] ** 2;
      embeddingMagnitude += embedding.data[i] ** 2;
  }
  return dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(embeddingMagnitude));
};


function doSearch(queryEmbedding) {
  const results = [];
  for (const item of index) {
   const csim = calculateCosineSimilarity(queryEmbedding, item["embedding"]);
   results.push([csim, item["text"], item["file"]]);
  }
  results.sort((a, b) => b[0] - a[0]);
  return results;
}


// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  // Retrieve the translation pipeline. When called for the first time,
  // this will load the pipeline and save it for future use.
  let indexer = await EmbeddingPipeline.getInstance(x => {
      // We also add a progress callback to the pipeline so that we can
      // track model loading.
    // the x is  - 
    //{status: 'progress', progress: 99.88990480095697, loaded: 134294723, total: 134442738, name: 'Xenova/bert-base-uncased', …}
      self.postMessage(x);
  });


  let op = event.data.operation;
  if( op === "index" ) {
    index.length = 0;
    let n = 0;
    self.postMessage({name: 'Indexing', status: 'initiate'});
    for await ( const text of event.data.texts ) {
      const name = text["name"];
      const embedding = await indexer(text["text"]);
      index.push({ "file": name, "text": text["text"], "embedding": embedding });
      n += 1;
      self.postMessage({
        name: 'Indexing',
        status: 'progress',
        loaded: n,
        total: event.data.texts.length,
        progress: 100 * n / event.data.texts.length,
      })
    }
    self.postMessage({name: 'Indexing', status: 'done'});
    self.postMessage({
        status: 'indexed',
    });
  } else {
    const query = event.data.query;
    const qembedding = await indexer(query);
    const matches = doSearch(qembedding);
    self.postMessage({
      status: 'complete',
      results: matches.slice(0, 5),
    })
  }
});



