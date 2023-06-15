
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
    <button onClick={handleDirectoryPick}>Build index</button>
  );
};

export default DirectorySelector;

