import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to server');
  socket.emit('join_room', {
    roomCode: 'HANOI_01',
    playerName: 'Host Admin',
    isHost: true
  });
});

socket.on('joined_room', (data) => {
  console.log('Joined room, hostToken:', data.hostToken);
  socket.emit('host_command', {
    command: 'START',
    hostToken: data.hostToken
  }, (ack) => {
    console.log('START ack:', ack);
    socket.emit('host_command', {
      command: 'SKIP_BRIEFING',
      hostToken: data.hostToken
    }, (ack2) => {
      console.log('SKIP_BRIEFING ack:', ack2);
      socket.emit('host_command', {
        command: 'SKIP_PRACTICE',
        hostToken: data.hostToken
      }, (ack3) => {
        console.log('SKIP_PRACTICE ack (Match is RUNNING):', ack3);
        setTimeout(() => {
          socket.disconnect();
          process.exit(0);
        }, 500);
      });
    });
  });
});
