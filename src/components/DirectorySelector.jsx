
import { useRef } from 'react';

export function default DirectorySelector() {
  const fileInputRef = useRef(null);

  const handleDirectorySelect = () => {
    fileInputRef.current.directory = true;
    fileInputRef.current.click();
  };

  const handleFileSelect = (event) => {
    const selectedDirectory = event.target.files[0].path;
    // Do something with the selected directory
    console.log('Selected directory:', selectedDirectory);
  };

  return (
    <div>
      <button onClick={handleDirectorySelect}>Select Directory</button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </div>
  );
}
