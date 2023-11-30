const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { v4: uuid } = require('uuid');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173"]
  }
});

// Game utils
const getRandomNumber = (max) => Math.floor(Math.random() * max)
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array
}

// Game constants
const nbrOfCards = 6
const endOfGameScore = 30

let gameState = {
  nbrOfPlayers: 0,
  currentStoryteller: 0,
  currentHint: undefined,
  gameState: 'new', // Can be "hint" "vote" or "results"
  playedImages: new Array(),
  players: new Array()
};

const getRadomImages = (nbrOfImages) => {
  const outputImagesArray = new Array()
  for (var i = 0; i < nbrOfImages; i++) {
    let id = getRandomNumber(300)
    while (
      outputImagesArray.indexOf(id) !== -1 || 
      gameState.playedImages.indexOf(id) !== -1
      ) {
      id = getRandomNumber(300)
    }
    gameState.playedImages.push(id)
    outputImagesArray.push(id)
  }
  return nbrOfImages===1?outputImagesArray[0]:outputImagesArray
}

io.on('connection', (socket) => {
  socket.on('newPlayer', (playerName, callback) => {
    const playerInfo = {
      id: uuid(),
      socketId: socket.id,
      name: playerName,
      images: getRadomImages(nbrOfCards),
      selected: undefined,
      vote: undefined,
      score: 0,
      isWinner: false
    }
    callback({
      id: playerInfo.id
    })

    gameState.players.push(playerInfo)
    io.emit("playersUpdate", gameState.players)
  })

  socket.on('disconnect', () => {
    gameState.players = gameState.players.filter((player) => player.socketId !== socket.id)
    io.emit("playersUpdate", gameState.players)
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});