
import React, { useState } from 'react';

const DirectorySelector = ({selectDirectory}) => {

  const handleDirectoryPick = async () => {
    try {
      const directoryHandle = await window.showDirectoryPicker();
      selectDirectory(directoryHandle);
    } catch (error) {
      console.error('Error selecting directory:', error);
    }
  };

  return (
    <div>
      <button onClick={handleDirectoryPick}>Select Directory</button>
    </div>
  );
};

export default DirectorySelector;

