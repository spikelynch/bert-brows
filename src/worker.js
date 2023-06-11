
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
  console.log(`embedding length = ${queryEmbeddingLength}`);
  for (let i = 0; i < queryEmbeddingLength; i++) {
      dotProduct += queryEmbedding.data[i] * embedding.data[i];
      queryMagnitude += queryEmbedding.data[i] ** 2;
      embeddingMagnitude += embedding.data[i] ** 2;
  }
  console.log(`components ${dotProduct} ${queryMagnitude} ${embeddingMagnitude}`);
  return dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(embeddingMagnitude));
};


function doSearch(queryEmbedding) {
  const results = [];
  console.log(`search ${queryEmbedding} ${index}`);
  console.log(index);
  for (const item of index) {
   const csim = calculateCosineSimilarity(queryEmbedding, item["embedding"]);
   results.push([csim, item["text"], item["file"]]);
  }
  results.sort((a, b) => b[0] - a[0]);
  return results.map((r) => r[1]);
}


// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  // Retrieve the translation pipeline. When called for the first time,
  // this will load the pipeline and save it for future use.
  let indexer = await EmbeddingPipeline.getInstance(x => {
      // We also add a progress callback to the pipeline so that we can
      // track model loading.
      self.postMessage(x);
  });


  let op = event.data.operation;
  console.log("in worker", event.data);
  if( op === "index" ) {
    index.length = 0;
    console.log("building index");
    for await ( const text of event.data.texts ) {
      const name = text["name"];
      const embedding = await indexer(text["text"]);
      index.push({ "file": name, "text": text["text"], "embedding": embedding });
    }
    console.log("done");
    self.postMessage({
        status: 'ready',
    });
  } else {
    console.log("Search");
    const query = event.data.query;
    console.log(`Query = ${query}`);
    const qembedding = await indexer(query);
    console.log(`Embedding = ${qembedding}`);
    const matches = doSearch(qembedding);
    self.postMessage({
      status: 'complete',
      results: matches,
    })
  }
});



