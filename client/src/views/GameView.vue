<script setup>
import { ref, reactive, computed } from 'vue'
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000')

const playerId = ref(null)
const players = ref([])
socket.on('playersUpdate', (incomingPlayers) => {
  // reset list of players
  players.value.length = 0
  incomingPlayers.forEach((player) => {
    players.value.push(player)
  })
})
socket.on('updateGameState', (newState) => {
  gameState.value = newState
})
socket.on('updateStoryteller', (idOfStoryteller) => {
  players.value.forEach((p) => {
    p.isStoryteller = idOfStoryteller === p.id
  })
})

// SIGN IN
const gameState = ref('login') // Can be "hint" "vote" or "results"
const playerName = ref('')
const playerNameValidation = ref(undefined)
const currentPlayer = computed(() => players.value.find((p) => p.id === playerId.value))
const signInToGame = () => {
  // TODO: Add support for game rooms
  if (!playerName.value) {
    return (playerNameValidation.value = 'Du måste ange ett namn')
  }
  socket.emit('newPlayer', playerName.value, (response) => {
    playerId.value = response.id
  })
  gameState.value = 'new'
}

// START GAME
const startGame = () => {
  socket.emit('startGame')
}

// HINT
const getImageSrc = ref((id) => 'https://picsum.photos/id/' + id + '/800/800')
const currentHint = ref(undefined)
const selectedImages = ref(undefined)
const submitHint = () => {
  socket.emit('setHint', currentHint.value)
  submitSelectedImage()
}
socket.on('setHint', (hint) => {
  currentHint.value = hint
})
const submitSelectedImage = () => {
  socket.emit('selectedImage', currentPlayer.value.selected)
  gameState.value = 'selected'
}

// VOTE
socket.on('setSelectedImages', (images) => {
  selectedImages.value = images
})
const submitVote = () => {
  socket.emit('vote', currentPlayer.value.vote)
  gameState.value = 'voted'
}

socket.on('score', () => {
  gameState.value = 'score'
})

const nextSet = () => {
  socket.emit('nextSet')
}
</script>

<template>
  <main v-if="!playerId">
    <input v-model="playerName" placeholder="What is you player name?" />
    <button @click="signInToGame()">Join game</button><br />
    {{ playerNameValidation }}
  </main>

  <main v-if="currentPlayer">
    <ul class="players">
      <li v-for="player in players" :title="player.id">
        <span v-if="player.isStoryteller">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-6 h-6"
          >
            <path
              d="M16.881 4.346A23.112 23.112 0 018.25 6H7.5a5.25 5.25 0 00-.88 10.427 21.593 21.593 0 001.378 3.94c.464 1.004 1.674 1.32 2.582.796l.657-.379c.88-.508 1.165-1.592.772-2.468a17.116 17.116 0 01-.628-1.607c1.918.258 3.76.75 5.5 1.446A21.727 21.727 0 0018 11.25c0-2.413-.393-4.735-1.119-6.904zM18.26 3.74a23.22 23.22 0 011.24 7.51 23.22 23.22 0 01-1.24 7.51c-.055.161-.111.322-.17.482a.75.75 0 101.409.516 24.555 24.555 0 001.415-6.43 2.992 2.992 0 00.836-2.078c0-.806-.319-1.54-.836-2.078a24.65 24.65 0 00-1.415-6.43.75.75 0 10-1.409.516c.059.16.116.321.17.483z"
            />
          </svg>
        </span>
        {{ player.id === playerId ? 'Du' : player.name }}
        <span v-if="player.isWinner">WINNER!!</span>
        <span class="score">{{ player.score }}</span>
      </li>
    </ul>

    <template v-if="gameState == 'new'">
      <button @click="startGame()" :disabled="players.length < 3">Start the game</button>
    </template>

    <template v-if="currentPlayer && gameState == 'hint'">
      <h2>Din hand</h2>
      <div class="image-container">
        <img
          v-for="image in currentPlayer.images"
          :src="getImageSrc(image)"
          :id="'image-' + image"
          @click="currentPlayer.selected = image"
          :class="{ active: currentPlayer.selected == image }"
        />
      </div>

      <div v-if="currentPlayer.isStoryteller" class="footer">
        <template v-if="currentPlayer.selected">
          <input placeholder="Skriv en ledtråd" v-model="currentHint" />
          <button :disabled="!currentHint" @click="submitHint()">Submit</button>
        </template>
        <p v-else class="hint">Välj en bild att skriva en ledtråd till...</p>
      </div>
      <div v-else class="footer">
        <template v-if="!currentHint"> Väntar på ledtråd </template>
        <template v-else>
          <p class="hint">{{ currentHint || 'Waiting for hint…' }}</p>
          <button :disabled="!currentPlayer.selected" @click="submitSelectedImage()">Submit</button>
          <p v-if="currentHint" class="small">Välj en bild för att komma vidare...</p>
        </template>
      </div>
    </template>

    <template v-if="gameState == 'vote' || gameState == 'voted'">
      <template v-if="selectedImages">
        <h2>Kort att rösta på</h2>
        <div class="image-container">
          <img
            v-for="image in selectedImages"
            :src="getImageSrc(image)"
            :id="'image-' + image"
            @click="currentPlayer.vote = image"
            :class="{
              disabled: currentPlayer.selected == image,
              active: currentPlayer.vote == image
            }"
          />
        </div>
        <button
          v-if="!currentPlayer.isStoryteller && gameState == 'vote'"
          :disabled="!currentPlayer.vote"
          @click="submitVote()"
        >
          Rösta
        </button>
        <div v-else>Vänta på att dina medspelare röstar...</div>
      </template>
      <h2 v-else>Väntar på kort att rösta på</h2>
    </template>

    <template v-if="gameState == 'score'">
      <h2>Resultat av omgång...</h2>
      <ul>
        <li v-for="player in players">{{ player.name }} fick {{ player.result }} poäng.</li>
      </ul>

      <button @click="nextSet()">Fortsätt spelet</button>
    </template>

    <template v-if="gameState === 'winner'"> We have a winner!! </template>
  </main>
</template>

<style>
.players {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  list-style: none;
  margin-block-start: 0em;
  margin-block-end: 0em;
  margin-inline-start: 0px;
  margin-inline-end: 0px;
  padding-inline-start: 0px;
  margin-bottom: 20px;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  background: var(--foreground-color);
}
.players li {
  display: flex;
  margin: 10px;
  margin-left: 0px;
  padding-left: 15px;
  line-height: 26px;
  border-radius: 99px;
  background-color: var(--background-color);
  font-weight: 700;
}
.players li svg {
  width: 1.1em;
  height: 1.1em;
  vertical-align: text-top;
  margin-right: 0.5em;
  margin-left: -0.25em;
}
.players li .score {
  display: block;
  border: 2px solid var(--foreground-color);
  font-weight: 700;
  padding: 0 8px;
  margin: 2px;
  margin-left: 10px;
  border-radius: 99px;
  line-height: 18px;
  min-width: 34px;
  text-align: center;
}
.image-container {
  display: flex;
  width: 96vmin;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: center;
  margin: 0 auto;
}
img {
  border: 2px solid white;
  display: block;
  width: 30vmin;
  height: 30vmin;
  border-radius: 13px;
  overflow: hidden;
  margin: 1vmin;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}
img.active {
  border: 2px solid red;
}
img.disabled {
  opacity: 0.7;
}
.footer {
  width: 90vmin;
  margin: 3vmin auto;
  text-align: center;
}
p.hint {
  font-size: 36px;
  text-align: center;
  margin: 3vmin 0;
  font-weight: 300;
}
p.small {
  font-size: 18px;
  text-align: center;
  margin-top: 3vmin;
  font-weight: 300;
}
input,
button {
  font-size: 24px;
  line-height: 1.5;
  border-radius: 4px;
  border: 0;
  padding: 0.3em 0.5em;
}
input {
  width: 60vmin;
  margin-right: 10px;
  background-color: rgba(255, 255, 255, 0.7);
}
button {
  background-color: rgb(0, 139, 160);
}
</style>
