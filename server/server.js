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

// Game constants
const nbrOfCards = 6
const endOfGameScore = 30

let gameState = {
  nbrOfPlayers: 0,
  currentStoryteller: 0,
  currentHint: undefined,
  currentState: 'new', // Can be "hint" "vote" or "results"
  playedImages: new Array(),
  players: new Array()
};

// Utils
const getRandomNumber = (max) => Math.floor(Math.random() * max)
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array
}

// Game utils
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

const getSocketPlayer = (socketId) => gameState.players.find((p) => p.socketId === socketId)
const nextStoryteller = () => {
  if (!gameState.players.length) 
    return
  const currentStoryteller = gameState.players.find((p) => p.isStoryteller)
  if (!currentStoryteller) {
    gameState.players[0].isStoryteller = true
  } else {
    const socketIdArray = gameState.players.map((p) => p.socketId)
    const indexOfNextStoryteller = (socketIdArray.indexOf(currentStoryteller.socketId) + 1) % gameState.players.length
    gameState.players[indexOfNextStoryteller].isStoryteller = true
    currentStoryteller.isStoryteller = false
  }
  io.emit("playersUpdate", gameState.players)
}

io.on('connection', (socket) => {
  socket.on('newPlayer', (playerName, callback) => {

    const playerInfo = {
      id: uuid(),
      socketId: socket.id,
      name: playerName,
      images: getRadomImages(nbrOfCards),
      selectedImage: undefined,
      vote: undefined,
      score: 0,
      isWinner: false,
      isStoryteller: false
    }
    callback({
      id: playerInfo.id
    })

    gameState.players.push(playerInfo)
    io.emit("playersUpdate", gameState.players)
  })

  socket.on('disconnect', () => {
    if (getSocketPlayer(socket.id) && getSocketPlayer(socket.id).isStoryteller) nextStoryteller()
    gameState.players = gameState.players.filter((player) => player.socketId !== socket.id)
    io.emit("playersUpdate", gameState.players)
  })

  socket.on('startGame', () => {
    if (gameState.currentState === 'new') {
      gameState.currentState = 'hint'
      io.emit('gameStart', gameState.players.map((p) => p.socketId)[0])
    }
  })

  socket.on('setHint', (hint) => {
    gameState.currentHint = hint
    io.emit('setHint', hint)
  })

  socket.on('selectedImage', (selectedImage) => {
    getSocketPlayer(socket.id).selectedImage = selectedImage
    if (gameState.players.filter((p) => p.selectedImage).length === gameState.players.length) {
      io.emit('setSelectedImages', shuffleArray(gameState.players.map((p) => p.selectedImage)))
    }
  })
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});