import { useEffect, useRef, useState } from 'react'

import DirectorySelector from './components/DirectorySelector';
import Progress from './components/Progress';

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


  const index = () => {
    setDisabled(true);
    worker.current.postMessage({
      src_dir: sourceDirectory,
    });
  }



  return (
  <>
    <h1>BERT-Brows</h1>
    <h2>ML-powered semantic document search</h2>

    <div className='container'>
      <div className='dirselect-container'>
        <DirectorySelector onChange={x => setSourceDir(x.target.value)} />
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
