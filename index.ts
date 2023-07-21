import express from 'express';
import http from 'http';
import cors from 'cors';
import * as socketIo from 'socket.io';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const server = http.createServer(app);
app.use(cors());
const io = new socketIo.Server(server);
const generateID = () => Math.random().toString(36).substring(2, 10);

const chatRooms: any = [];

io.on('connection', (socket) => {
  console.log(`${socket.id} user just connected`);

  socket.on('createRoom', (roomName) => {
    socket.join(roomName);
    chatRooms.unshift({ id: generateID(), name: roomName, messages: [] });
    socket.emit('roomList', chatRooms);
  });

  socket.on('findRoom', (id) => {
    const room = chatRooms.find((room: any) => room.id === id);

    socket.emit('foundRoom', room.messages);
  });

  socket.on('newMessage', (data) => {
    const { room_id, user, message, timestamp } = data;
    const room = chatRooms.find((item: any) => item.id === room_id);
    const newMessage = {
      id: generateID(),
      text: message,
      user,
      time: `${timestamp.hour}:${timestamp.mins}`,
    };
    // Updates the chatroom messages
    socket.to(room.name).emit('roomMessage', newMessage);
    room.messages.push(newMessage);

    // Trigger the events to reflect the new changes
    socket.emit('roomList', chatRooms);
    socket.emit('foundRoom', room.messages);
  });

  socket.on('disconnect', () => {
    socket.disconnect();
    console.log('A User disconnected');
  });
});

app.get('/', (_req, res) => {
  res.json(chatRooms);
});

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
