import { io } from 'socket.io-client';

export const socket = io('https://music-guessing-backend.vercel.app/?vercelToolbarCode=YZ8hFsteoPHekiC', {
  withCredentials: true,
  transports: ['websocket']
});
