import React from 'react';
import { Box, Typography, Paper, Link } from '@mui/material';
import { InsertDriveFile } from '@mui/icons-material';

const Message = ({ message, isOwnMessage }) => {
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    return <InsertDriveFile />;
  };

  const renderContent = () => {
    if (message.type === 'file') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getFileIcon(message.fileName)}
          <Link
            href={message.content}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: 'inherit', textDecoration: 'none' }}
          >
            {message.fileName}
          </Link>
        </Box>
      );
    }
    return message.content;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 1,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: 1,
          maxWidth: '70%',
          backgroundColor: isOwnMessage ? 'primary.main' : 'grey.100',
          color: isOwnMessage ? 'white' : 'text.primary',
          borderRadius: 2,
        }}
      >
        <Typography variant="body1">{renderContent()}</Typography>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Message; 