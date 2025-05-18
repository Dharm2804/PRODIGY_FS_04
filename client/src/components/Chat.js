import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Typography,
  Box,
  List,
  ListItem,
  Divider,
  IconButton,
  AppBar,
  Toolbar,
  Drawer,
  ListItemText,
  ListItemButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Send as SendIcon,
  Logout as LogoutIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const loadRooms = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rooms', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRooms(response.data);
      if (response.data.length > 0 && !currentRoom) {
        setCurrentRoom(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  }, [currentRoom]);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('user_connected', user.userId);

    socketRef.current.on('receive_message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    loadRooms();

    return () => {
      socketRef.current.disconnect();
    };
  }, [user.userId, loadRooms]);

  useEffect(() => {
    if (currentRoom) {
      loadMessages(currentRoom._id);
      socketRef.current.emit('join_room', currentRoom._id);
    }
  }, [currentRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (roomId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/messages/${roomId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && currentRoom) {
      const messageData = {
        sender: user.userId,
        content: newMessage,
        room: currentRoom._id,
        type: 'text'
      };

      socketRef.current.emit('send_message', messageData);
      setNewMessage('');
    }
  };

  const handleCreateRoom = async () => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/rooms',
        {
          name: newRoomName,
          description: newRoomDescription,
          isPrivate
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setRooms([...rooms, response.data]);
      setCreateRoomOpen(false);
      setNewRoomName('');
      setNewRoomDescription('');
      setIsPrivate(false);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleJoinRoom = async (room) => {
    try {
      await axios.post(
        `http://localhost:5000/api/rooms/${room._id}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setCurrentRoom(room);
      setDrawerOpen(false);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container maxWidth="xl" sx={{ height: '100vh', py: 2 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <AddIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {currentRoom ? currentRoom.name : 'Select a Room'}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', mt: 2 }}>
        <Paper
          elevation={3}
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              p: 2,
              backgroundColor: '#f5f5f5',
            }}
          >
            <List>
              {messages.map((message, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    sx={{
                      justifyContent:
                        message.sender._id === user.userId ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1,
                        backgroundColor:
                          message.sender._id === user.userId ? '#e3f2fd' : '#fff',
                        maxWidth: '70%',
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        {message.sender._id === user.userId ? 'You' : message.sender.username}
                      </Typography>
                      <Typography variant="body1">{message.content}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
              <div ref={messagesEndRef} />
            </List>
          </Box>

          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  size="small"
                  disabled={!currentRoom}
                />
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  Send
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Chat Rooms
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setCreateRoomOpen(true)}
            sx={{ mb: 2 }}
          >
            Create New Room
          </Button>
          <List>
            {rooms.map((room) => (
              <ListItemButton
                key={room._id}
                selected={currentRoom?._id === room._id}
                onClick={() => handleJoinRoom(room)}
              >
                <ListItemText
                  primary={room.name}
                  secondary={room.description}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Dialog open={createRoomOpen} onClose={() => setCreateRoomOpen(false)}>
        <DialogTitle>Create New Room</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Room Name"
            fullWidth
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            value={newRoomDescription}
            onChange={(e) => setNewRoomDescription(e.target.value)}
          />
          <Button
            onClick={() => setIsPrivate(!isPrivate)}
            color={isPrivate ? 'primary' : 'default'}
            sx={{ mt: 2 }}
          >
            {isPrivate ? 'Private Room' : 'Public Room'}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRoomOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateRoom} disabled={!newRoomName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Chat; 