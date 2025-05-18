import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Grid, Paper, Typography } from '@mui/material';
import { Videocam, VideocamOff, Mic, MicOff, CallEnd } from '@mui/icons-material';

const VideoCall = ({ socket, roomId, isInitiator }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef(null);
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    initializeMedia();
    setupSocketListeners();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const setupSocketListeners = () => {
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(configuration);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          roomId,
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    peerConnection.current = pc;
  };

  const handleOffer = async (offer) => {
    if (!peerConnection.current) {
      createPeerConnection();
    }

    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit('answer', { answer, roomId });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer) => {
    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ice candidate:', error);
    }
  };

  const startCall = async () => {
    if (!peerConnection.current) {
      createPeerConnection();
    }

    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit('offer', { offer, roomId });
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    setLocalStream(null);
    setRemoteStream(null);
    socket.emit('end-call', { roomId });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Your Video</Typography>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', maxHeight: '300px', backgroundColor: '#000' }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Remote Video</Typography>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: '100%', maxHeight: '300px', backgroundColor: '#000' }}
            />
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="contained"
          color={isVideoEnabled ? 'primary' : 'error'}
          onClick={toggleVideo}
          startIcon={isVideoEnabled ? <Videocam /> : <VideocamOff />}
        >
          {isVideoEnabled ? 'Disable Video' : 'Enable Video'}
        </Button>
        <Button
          variant="contained"
          color={isAudioEnabled ? 'primary' : 'error'}
          onClick={toggleAudio}
          startIcon={isAudioEnabled ? <Mic /> : <MicOff />}
        >
          {isAudioEnabled ? 'Mute' : 'Unmute'}
        </Button>
        {isInitiator && (
          <Button
            variant="contained"
            color="primary"
            onClick={startCall}
          >
            Start Call
          </Button>
        )}
        <Button
          variant="contained"
          color="error"
          onClick={endCall}
          startIcon={<CallEnd />}
        >
          End Call
        </Button>
      </Box>
    </Box>
  );
};

export default VideoCall; 