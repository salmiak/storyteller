import { defineStore } from 'pinia';
import { io } from 'socket.io-client';

export const socketStore = defineStore('socket', {
  state: () => ({
    socket: null,
  }),

  actions: {
    initializeSocket() {
      this.socket = io('http://localhost:3000'); // Replace with your server URL

      // Add event listeners or other logic here, for example:
      this.socket.on('connect', () => {
        console.log('Connected to server');
      });

      // Handle other events as needed
    },

    // Add other socket-related actions here
  },
});