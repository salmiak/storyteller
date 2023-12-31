// TODO: Need to be better at syncing all changes on player data on server. 
//       Server shall aways reflect state in clients.


const express = require("express");
const path = require("path");
const fs = require('fs');
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

// Define the path to your images folder
const imagesFolderPath = path.join(__dirname, 'images'); // Adjust the folder structure as needed

// Set up a route to handle image requests
app.get('/images/:id.jpg', (req, res) => {
  const { id } = req.params;
  const imagePath = path.join(imagesFolderPath, `${id}.jpg`);

  // Send the image file
  res.sendFile(imagePath, (err) => {
    if (err) {
      // Handle errors, such as file not found
      console.error(err);
      res.status(404).send('Image not found');
    }
  });
});

const imagesArray = []

fs.readdir(imagesFolderPath, (err, files) => {
  if (err) {
    return console.log('Error reading folder');
  }
  files.filter(file => path.extname(file).toLowerCase() === '.jpg').forEach(file => imagesArray.push(path.parse(file).name));
  console.log(imagesArray);
});


// Game constants
const nbrOfCards = 6
const endOfGameScore = 10

let gameState = {
  currentStoryteller: 0,
  currentHint: undefined,
  currentState: 'new', // Can be "hint" "vote" or "results"
  playedImages: new Array(),
  players: new Array()
};

// Utils
const getRandomNumber = (max) => Math.floor(Math.random() * max)
const getRandomValueFromArray = (array) => {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array
}
const getRadomImages = (nbrOfImages) => {
  const outputImagesArray = new Array()
  for (var i = 0; i < nbrOfImages; i++) {
    let img = getRandomValueFromArray(imagesArray)
    while (
      outputImagesArray.indexOf(img) !== -1 || 
      gameState.playedImages.indexOf(img) !== -1
      ) {
      img = getRandomValueFromArray(imagesArray)
    }
    gameState.playedImages.push(img)
    outputImagesArray.push(img)
  }
  return nbrOfImages===1?outputImagesArray[0]:outputImagesArray
}
const getSocketPlayer = (id) => gameState.players.find((p) => p.id === id)
const getStoryteller = () => gameState.currentStoryteller?getSocketPlayer(gameState.currentStoryteller):undefined

// Update and emit game states
const setCurrentState = (newState) => {
  gameState.currentState = newState
  io.emit('updateGameState', newState)
}
const setCurrentStoryteller = (idOfStoryteller) => {
  gameState.currentStoryteller = idOfStoryteller
  gameState.players.forEach((p) => { p.isStoryteller = (p.id === idOfStoryteller) })
  io.emit('updateStoryteller', idOfStoryteller)
}
const setHint = (hint) => {
  gameState.currentHint = hint
  io.emit('setHint', hint)
}

// Game states
io.on('connection', (socket) => {
  socket.on('newPlayer', (playerName, callback) => {

    const playerInfo = {
      id: socket.id,
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
    console.log('Someone left the game...');
  })

  socket.on('startGame', () => {
    if (gameState.currentState === 'new') {
      setCurrentState('hint')
      setCurrentStoryteller( gameState.players.map((p) => p.id)[0] )
    }
  })

  socket.on('setHint', setHint)

  socket.on('selectedImage', (selectedImage) => {
    getSocketPlayer(socket.id).selectedImage = selectedImage

    // If all players has selected an image, broadcast all images in a random order
    if (gameState.players.filter((p) => p.selectedImage).length === gameState.players.length) {
      io.emit('setSelectedImages', shuffleArray(gameState.players.map((p) => p.selectedImage)))
      setCurrentState('vote')
    }
  })

  socket.on('vote', (image) => {
    getSocketPlayer(socket.id).vote = image

    // If everyone except the storyteller has voted.
    if (gameState.players.filter((p) => p.vote).length === gameState.players.length - 1) {
      const votedImages = gameState.players.filter((p) => !p.isStoryteller).map((p) => p.vote)
      const storytellersImage = getStoryteller().selectedImage

      if (votedImages.every( (img) => img === storytellersImage )) {
        // Everyone voted on the storyteller
        gameState.players.forEach((p) => { 
          if (!p.isStoryteller) {
            p.result = 2
            p.score += 2
          }
        })
      } else {
        // Not everyone voted on storyteller
        gameState.players.filter((p) => !p.isStoryteller).forEach((p) => {
          if (p.vote === storytellersImage) {
            // If correct vote, give points to player and storyteller
            p.result += 3
            p.score += 3
            getStoryteller().score += 3
            getStoryteller().result += 3
          } else {
            // Give points to all votes on non storyteller-image
            const pointReceiver = gameState.players.find((a) => a.selectedImage === p.vote)
            pointReceiver.score += 1
            pointReceiver.result += 1
          }
        })
      }

      setCurrentState('score')
      io.emit('playersUpdate', gameState.players)
    }
  })

  socket.on('nextSet', () => {

    const winners = gameState.players.filter((p) => p.score >= endOfGameScore)
    if (winners && winners.length) {
      winners.forEach((p) => {p.isWinner = true})
      io.emit('playersUpdate', gameState.players)
      setCurrentState('winner')
      return false;
    }

    gameState.players.forEach((p) => {
      p.result = 0
      p.images = p.images.filter((img) => img !== p.selectedImage)
      p.images.push(getRadomImages(1))
      p.selectedImage = undefined
      p.vote = undefined
    })
    io.emit('playersUpdate', gameState.players)
    setHint('')

    const playersIds = gameState.players.map((p) => p.id)
    setCurrentStoryteller(playersIds[(playersIds.indexOf(gameState.currentStoryteller) + 1) % playersIds.length])
    setCurrentState('hint')
  })
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});