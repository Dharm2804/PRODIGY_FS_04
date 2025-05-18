import React, { useState } from 'react';
import { Button, Dialog } from '@mui/material';
import { Videocam } from '@mui/icons-material';
import VideoCall from './VideoCall';

const VideoCallButton = ({ socket, roomId, isInitiator, onClose }) => {
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);

  const handleOpenVideoCall = () => {
    setIsVideoCallOpen(true);
  };

  const handleCloseVideoCall = () => {
    setIsVideoCallOpen(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<Videocam />}
        onClick={handleOpenVideoCall}
        sx={{ 
          mr: 1,
          backgroundColor: '#1976d2',
          '&:hover': {
            backgroundColor: '#1565c0',
          },
        }}
      >
        Video Call
      </Button>

      <Dialog
        open={isVideoCallOpen}
        onClose={handleCloseVideoCall}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '80vh',
            maxHeight: '90vh',
          },
        }}
      >
        <VideoCall
          socket={socket}
          roomId={roomId}
          isInitiator={isInitiator}
          onClose={handleCloseVideoCall}
        />
      </Dialog>
    </>
  );
};

export default VideoCallButton; 