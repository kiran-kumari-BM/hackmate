const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const teamRoutes = require('./routes/team');
const chatRoutes = require('./routes/chat');
const matchRoutes = require('./routes/match');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hackmate';
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/match', matchRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// lightweight socket auth
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    socket.userId = payload.id;
  } catch (e) {
    // ignore, allow anonymous connections for demo
  }
  next();
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id, 'userId:', socket.userId);

  socket.on('joinThread', ({ threadId }) => {
    socket.join(`thread_${threadId}`);
  });

  socket.on('leaveThread', ({ threadId }) => {
    socket.leave(`thread_${threadId}`);
  });

  socket.on('sendMessage', (data) => {
    // broadcast to room; server persistence handled via REST endpoint in demo flow
    io.to(`thread_${data.threadId}`).emit('message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
