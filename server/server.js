// TODO: Need to be better at syncing all changes on player data on server. 
//       Server shall aways reflect state in clients.


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
const getStoryteller = () => gameState.currentStoryteller?getSocketPlayer(gameState.currentStoryteller):undefined

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

const setCurrentState = (newState) => {
  gameState.currentState = newState
  io.emit('updateGameState', newState)
}
const setCurrentStoryteller = (idOfStoryteller) => {
  gameState.currentStoryteller = idOfStoryteller
  gameState.players.forEach((p) => { p.isStoryteller = (p.socketId === idOfStoryteller) })
  io.emit('updateStoryteller', idOfStoryteller)
}
const setHint = (hint) => {
  gameState.currentHint = hint
  io.emit('setHint', hint)
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
      result: 0,
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
      setCurrentState('hint')
      setCurrentStoryteller( gameState.players.map((p) => p.socketId)[0] )
    }
  })

  socket.on('setHint', setHint)

  socket.on('selectedImage', (selectedImage) => {
    // Update the current players info
    const socketPlayer = getSocketPlayer(socket.id)
    socketPlayer.selectedImage = selectedImage
    // If it's the storyteller, they also vote on the same pic.
    socketPlayer.vote = socketPlayer.isStoryteller?selectedImage:undefined

    // If all players has selected an image, broadcast all images in a random order
    if (gameState.players.filter((p) => p.selectedImage).length === gameState.players.length) {
      io.emit('setSelectedImages', shuffleArray(gameState.players.map((p) => p.selectedImage)))
      setCurrentState('vote')
    }
  })

  socket.on('vote', (image) => {
    getSocketPlayer(socket.id).vote = image

    if (gameState.players.filter((p) => p.vote).length === gameState.players.length) {
      // Calculate score additions

      const votedImages = gameState.players.map((p) => p.vote)
      const storytellersImage = getStoryteller().selectedImage

      if (votedImages.every( (img) => img === storytellersImage )) {
        console.log('Alla röstade på berättarens bild');
        gameState.players.forEach((p) => { 
          if (!p.isStoryteller) {
            p.result = 2
            p.score += 2
          }
        })
      } else {
        gameState.players.filter((p) => !p.isStoryteller).forEach((p) => {
          if (p.vote === storytellersImage) {
            p.result += 3
            p.score += 3
            getStoryteller().score += 3
            getStoryteller().result += 3
          }
          votedImages.forEach((img) => {
            p.score += img === p.selectedImage?1:0
            p.result += img === p.selectedImage?1:0
          })
        })
      }

      setCurrentState('score')
      io.emit('playersUpdate', gameState.players)
    }
  })

  socket.on('nextSet', () => {
    gameState.players.forEach((p) => {
      p.result = 0
      p.images = p.images.filter((img) => img !== p.selectedImage)
      p.images.push(getRadomImages(1))
      p.selectedImage = undefined
      p.vote = undefined
    })
    io.emit('playersUpdate', gameState.players)
    setHint('')

    const playersIds = gameState.players.map((p) => p.socketId)
    setCurrentStoryteller(playersIds[(playersIds.indexOf(gameState.currentStoryteller) + 1) % playersIds.length])
    setCurrentState('hint')
  })
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});