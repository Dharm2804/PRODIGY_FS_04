import React, { useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { AttachFile } from '@mui/icons-material';
import axios from 'axios';

const FileUpload = ({ onFileUpload, roomId }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      onFileUpload({
        type: 'file',
        content: response.data.fileUrl,
        fileName: response.data.fileName,
        roomId
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Error uploading file');
    } finally {
      setUploading(false);
      event.target.value = null; // Reset file input
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <input
        type="file"
        id="file-upload"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={uploading}
      />
      <label htmlFor="file-upload">
        <Button
          component="span"
          variant="contained"
          startIcon={uploading ? <CircularProgress size={20} /> : <AttachFile />}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Attach File'}
        </Button>
      </label>
      {error && (
        <Typography color="error" variant="caption">
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default FileUpload; 