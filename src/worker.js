
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


function calculateCosineSimilarity(queryEmbedding, embedding) {
  let dotProduct = 0;
  let queryMagnitude = 0;
  let embeddingMagnitude = 0;
  let queryEmbeddingLength = queryEmbedding.length
  for (let i = 0; i < queryEmbeddingLength; i++) {
      dotProduct += queryEmbedding[i] * embedding[i];
      queryMagnitude += queryEmbedding[i] ** 2;
      embeddingMagnitude += embedding[i] ** 2;
  }
  return dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(embeddingMagnitude));
};


function doSearch(query, index) {
  const results = [];
  for (const name in index) {
   console.log(`Searching ${name}`);
   const csim = calculateCosineSimilarity(queryEmbedding, index[name]["embedding"]);
   console.log(`cosine sim = ${csim}`);
 //  results.push([0, name, index[name]["text"]);
  }
  //results.sort((a, b) => b[0] - a[0]);
  return results;
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

  // very naive - store the index in a variable here
  let index = {};






  let op = event.data.operation;
  console.log("in worker", event.data);
  if( op === "index" ) {
    index = {};
    console.log("building index");
    for await ( const text of event.data.texts ) {
      console.log(text["name"]);
      const name = text["name"];
      const embedding = await indexer(text["text"]);
      index[name] = { "text": text["text"], "embedding": embedding };
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
    const matches = doSearch(qembedding, index);
    self.postMessage({
      status: 'complete',
      results: matches,
    })
  }
});



  // const doSearch = (queryEmbedding) => {
  //   const results = [];
  //   for (const name in index) {
  //     const csim = calculateCosineSimilarity(queryEmbedding, index[name]["embedding"]);
  //     results.push([csim, name, index[name]["text"]);
  //   }
  //   results.sort((a, b) => b[0] - a[0]);
  //   return Array.slice(results, 0, 3);
  // };

