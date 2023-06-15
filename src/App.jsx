import { useEffect, useRef, useState } from 'react'

import DirectorySelector from './components/DirectorySelector';
import Progress from './components/Progress';

import './App.css'


import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

const TOKEN_LENGTH = 100;

function App() {


 // Model loading
  const [ready, setReady] = useState(null);
  const [searchDisabled, setSearchDisabled] = useState(true);
  const [progressItems, setProgressItems] = useState([]);
  const [sourceDir, setSourceDir] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);


  const worker = useRef(null);

  useEffect(() => {
    if (!worker.current) {
      // Create the worker if it does not yet exist.
      worker.current = new Worker(new URL('./worker.js', import.meta.url), {
          type: 'module'
      });
    }

    const onMessageReceived = (e) => {
      switch (e.data.status) {
        case 'initiate':
        // Model file start load: add a new progress item to the list.
          setReady(false);
          setProgressItems(prev => [...prev, e.data]);
          break;

        case 'progress':
          // Model file progress: update one of the progress items.
          setProgressItems(
            prev => prev.map(item => {
              if (item.file === e.data.file) {
                return { ...item, progress: e.data.progress }
              }
              return item;
           })
          );
          break;

        case 'done':
          // Model file loaded: remove the progress item from the list.
          setProgressItems(
            prev => prev.filter(item => item.file !== e.data.file)
          );
          break;

        case 'ready':
          console.log("Who sent me a ready message?");
          break;

        case 'indexed':
          console.log("Indexing is done");
          setSearchDisabled(false);
          break;


        case 'complete':
          // Search results are back
          console.log("results", e.data.results);
          setResults(e.data.results);
          setSearchDisabled(false);
          break;
      }
    };



    // Attach the callback function as an event listener.
    worker.current.addEventListener('message', onMessageReceived);

    // Define a cleanup function for when the component is unmounted.
    return () => worker.current.removeEventListener('message', onMessageReceived);
  });


// 


const readPdfText = async (pdfBytes) => {
  const chunks = [];
  const pdf = await pdfjsLib.getDocument(pdfBytes).promise;
  for ( let i = 1; i < pdf.numPages; i++ ) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    chunks.push(textContent.items.map((s) => s.str).join(''));
  }
  return chunks.join('');
};



const loadPDFs = async (directory) => {
  const texts = [];
  for await (const entry of directory.values()) {
    if( entry.name.endsWith(".pdf") ) {
      const pdf = await entry.getFile();
      const pdfstr = await pdf.text();
      const text = await readPdfText({data: pdfstr});
      console.log("File:", entry.name);
      console.log("PDF text:", text);
      texts.push([entry.name, text]);
    }
  }
  return texts;
};

const splitSubstrings = (str, length) => {
  const words = str.split(' ');
  const chunks = [];

  for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (chunks.length === 0 || chunks[chunks.length - 1].length + word.length + 1 > length) {
        chunks.push(word);
      } else {
        chunks[chunks.length - 1] += ' ' + word;
      }
  }
  return chunks;
}


const loadTextDocs = async (directory) => {
  const texts = [];
  for await (const entry of directory.values()) {
    if( entry.name.endsWith(".txt") ) {
      const textFile = await entry.getFile();
      const text = await textFile.text();
//      const chunks = splitSubstrings(text, TOKEN_LENGTH);
      const chunks = text.split('.');
      for (const chunk of chunks ) {
        texts.push({"name": entry.name, "text": chunk});
        console.log(entry.name, chunk);
      }
    }
  }
  return texts;
};





  // const index = async () => {
  //   const texts = await loadTextDocs(sourceDir);
  //   console.log(`Loaded texts: ${texts}`)
  //   worker.current.postMessage({
  //       operation: "index",
  //       texts: texts,
  //   });
  // };

  const search = async () => {
    setSearchDisabled(true);
    worker.current.postMessage({
      operation: "search",
      query: query,
    });
  };


  const selectDirectory = async (directoryHandle) => {
    // setSourceDir(directoryHandle);
    // console.log("selectDirectory");
    const texts = await loadTextDocs(directoryHandle);
    console.log(`Loaded texts: ${texts}`)
    worker.current.postMessage({
        operation: "index",
        texts: texts,
    });
  };


  return (
  <>
    <h1>BERT-Brows</h1>

    <p>Select a directory containing *.txt files for in-browser BERT embeddings
    and search</p>

    <div className='container'>
      <div className='header-container'>
        <div className='dirselect-container'>
          <DirectorySelector selectDirectory={selectDirectory} />
        </div>  
        <div className='query-container'>
          <input className='query-input' value={query} onChange={e => setQuery(e.target.value)} />
          <button disabled={searchDisabled} onClick={search}>Search</button>
        </div>
      </div>

      <div className='progress-bars-container'>
        {progressItems.map(data => (
          <div key={data.file}>
            <Progress text={data.file} percentage={data.progress} />
          </div>
        ))}
      </div>

      <div className='results-container'>
        {results.map(result => (
        <div className="search-result">
          <div className="search-doc"><p className="search-text">{result[2]}</p></div>
          <div className="search-result"><p className="search-text">{result[1]}</p></div>
        </div>
        ))
      }
      </div>
    </div>

  </>
)


}


export default App
