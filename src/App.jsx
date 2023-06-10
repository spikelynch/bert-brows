import { useEffect, useRef, useState } from 'react'

import DirectorySelector from './components/DirectorySelector';
import Progress from './components/Progress';

import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

function App() {


 // Model loading
  const [ready, setReady] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [progressItems, setProgressItems] = useState([]);

  // Inputs and outputs
  const [sourceDir, setSourceDir] = useState(null);
  const [output, setOutput] = useState('');


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
          // Pipeline ready: the worker is ready to accept messages.
          setReady(true);
          break;

        case 'update':
          // Generation update: update the output text.
          console.log("Got back output", e)
          setOutput(e.data.output);
          break;

        case 'complete':
          // Generation complete: re-enable the "Translate" button
          setDisabled(false);
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





  const index = async () => {
    setDisabled(true);
    const texts = await loadPDFs(sourceDir);
    //worker.current.postMessage({
      //texts: texts,
    //});
  };

  const selectDirectory = (directoryHandle) => {
    setSourceDir(directoryHandle);
  };


  return (
  <>
    <h1>BERT-Brows</h1>

    <div className='container'>
      <div className='dirselect-container'>
        <DirectorySelector selectDirectory={selectDirectory} />
        <p>Source directory is: {sourceDir ? sourceDir.name : ""}</p>
      </div>

      <div className='textbox-container'>
        <textarea value={output} rows={3} readOnly></textarea>
      </div>
    </div>

    <button disabled={disabled} onClick={index}>Index</button>

    <div className='progress-bars-container'>
      {ready === false && (
        <label>Loading models... (only run once)</label>
      )}
      {progressItems.map(data => (
        <div key={data.file}>
          <Progress text={data.file} percentage={data.progress} />
        </div>
      ))}
    </div>
  </>
)


}


export default App
