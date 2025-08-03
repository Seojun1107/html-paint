const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const nicknames = {};

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('유저 접속:', socket.id);

  socket.on('join', (name) => {
    nicknames[socket.id] = name;
    socket.broadcast.emit('notice', `${name}님이 입장하셨습니다`);
  });

  socket.on('disconnect', () => {
    const name = nicknames[socket.id] || '익명';
    socket.broadcast.emit('notice', `${name}님이 퇴장하셨습니다`);
    delete nicknames[socket.id];
    socket.broadcast.emit('cursor-remove', socket.id);
    console.log('유저 나감:', socket.id);
  });


  socket.on('draw', (data) => {
    socket.broadcast.emit('draw', data);
  });

  socket.on('clear', () => {
    socket.broadcast.emit('clear');
  });

  socket.on('cursor', (data) => {
    socket.broadcast.emit('cursor', { id: socket.id, ...data });
  });

  socket.on('notice', (msg) => {
  showNotice(msg);
});
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});