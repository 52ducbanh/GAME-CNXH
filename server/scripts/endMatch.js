import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  socket.emit('join_room', {
    roomCode: 'HANOI_01',
    playerName: 'Host Admin',
    isHost: true
  });
});

socket.on('joined_room', (data) => {
  console.log('Ending match for results screen capture, hostToken:', data.hostToken);
  socket.emit('host_command', {
    command: 'END',
    hostToken: data.hostToken
  }, (ack) => {
    console.log('END ack:', ack);
    setTimeout(() => {
      socket.disconnect();
      process.exit(0);
    }, 500);
  });
});
