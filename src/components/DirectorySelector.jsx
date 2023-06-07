
import React, { useState } from 'react';

const DirectorySelector = () => {
  const [selectedDirectory, setSelectedDirectory] = useState(null);

  const handleDirectoryPick = async () => {
    try {
      const directoryHandle = await window.showDirectoryPicker();
      setSelectedDirectory(directoryHandle);
    } catch (error) {
      console.error('Error selecting directory:', error);
    }
  };

  return (
    <div>
      <button onClick={handleDirectoryPick}>Select Directory</button>
      {selectedDirectory && (
        <p>Selected Directory: {selectedDirectory.name}</p>
      )}
    </div>
  );
};

export default DirectorySelector;

