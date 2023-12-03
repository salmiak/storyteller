<script setup>

import { ref, reactive, computed } from 'vue'
import { io } from "socket.io-client"

const socket = io("http://localhost:3000");

const playerId = ref(null)
const players = ref([])
socket.on("playersUpdate", (incomingPlayers) => {
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
    players.value.forEach((p) => { p.isStoryteller = (idOfStoryteller === p.id) })
})

// SIGN IN
const gameState = ref('login') // Can be "hint" "vote" or "results"
const playerName = ref('')
const playerNameValidation = ref(undefined)
const currentPlayer = computed(() => players.value.find((p) => p.id === playerId.value))
const signInToGame = () => {        // TODO: Add support for game rooms
    if (!playerName.value) {
        return playerNameValidation.value = "Du måste ange ett namn"
    }
    socket.emit("newPlayer", playerName.value, (response) => {
        playerId.value = response.id
    })
    gameState.value = 'new'
}

// START GAME
const startGame = () => {
    socket.emit("startGame")
}

// HINT
const getImageSrc = ref((id) => 'https://picsum.photos/id/'+id+'/800/800')
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
    gameState.value = "voted"
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
        <input v-model="playerName" placeholder="What is you player name?">
        <button @click="signInToGame()">Join game</button><br/>
        {{ playerNameValidation }}
    </main>
    <main v-if="currentPlayer">
      <ul class="players">
        <li 
          v-for="player in players"
          :title="player.id">
          <span v-if="player.isStoryteller">S&nbsp;</span>
          {{ player.id===playerId?'You':player.name }}
          <span v-if="player.isWinner">WINNER!!</span>
          <span class="score">{{ player.score }}</span>
        </li>
      </ul>
      <p>Du heter: {{ currentPlayer.name }} och just nu ska vi {{ gameState }}</p>
    </main>

    <template v-if="gameState == 'new'">
        <button @click="startGame()" :disabled="players.length < 3">Start the game</button>
    </template>

    <template v-if="currentPlayer && gameState == 'hint'">
        <h2>Din hand</h2>
        <div class="image-container">
          <img 
            v-for="image in currentPlayer.images" 
            :src="getImageSrc(image)" 
            :id="'image-'+image" 
            @click="currentPlayer.selected=image"
            :class="{active: currentPlayer.selected==image}" />
        </div>

        <div v-if="currentPlayer.isStoryteller" class="footer">
          <template v-if="currentPlayer.selected">
            <input placeholder="Skriv en ledtråd" v-model="currentHint"/>
            <button :disabled="!currentHint" @click="submitHint()">Submit</button>
          </template>
          <p v-else class="hint">
            Välj en bild att skriva en ledtråd till...
          </p>
        </div>
        <div v-else class="footer">
            <p class="hint">{{ currentHint || 'Waiting for hint…' }}</p>
            <button :disabled="!currentPlayer.selected" @click="submitSelectedImage()">Submit</button>
            <p v-if="currentHint" class="small">
                Välj en bild för att komma vidare...
            </p>
        </div>
    </template>

    <template v-if="gameState == 'vote' || gameState == 'voted'">
        <template v-if="selectedImages">
            <h2>Kort att rösta på</h2>
            <div class="image-container">
                <img 
                    v-for="image in selectedImages" 
                    :src="getImageSrc(image)" 
                    :id="'image-'+image" 
                    @click="currentPlayer.vote = image"
                    :class="{disabled: currentPlayer.selected == image, active: currentPlayer.vote==image}" />
            </div>
            <button v-if="!currentPlayer.isStoryteller && gameState == 'vote'" :disabled="!currentPlayer.vote" @click="submitVote()">Rösta</button>
            <div v-else>Vänta på att dina medspelare röstar...</div>
        </template>
        <h2 v-else>Väntar på kort att rösta på</h2>
    </template>

    <template v-if="gameState == 'score'">
        <h2>Resultat av omgång...</h2>
        <ul>
            <li v-for="player in players">
                {{ player.name }} fick {{ player.result }} poäng.
            </li>
        </ul>

        <button @click="nextSet()">Fortsätt spelet</button>
    </template>


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
  }
  .players li {
    display: flex;
    margin: 10px;
    margin-left: 0px;
    padding-left: 15px;
    line-height: 26px;
    border-radius: 99px;
    background-color: gainsboro;
  }
  .players li .score {
    display: block;
    background-color: grey;
    color: white;
    font-weight: 700;
    padding: 0 5px;
    margin: 1px;
    margin-left: 10px;
    border-radius: 99px;
    line-height: 24px;
    min-width: 24px;
    text-align: center;
  }
  .players li.active {
    background-color: lightskyblue;
  }
  .players li.active .score {
    background-color: blue;
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
    box-shadow: 0 0 0 1px rgba(0,0,0,0.2);
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
  input, button {
    font-size: 24px;
    line-height: 1.5;
    border-radius: 4px;
    border: 0;
    padding: 0.3em 0.5em;
  }
  input {
    width: 60vmin;
    margin-right: 10px;
    background-color: rgba(255,255,255,0.7);
  }
  button {
    background-color: rgb(0, 139, 160);
  }
</style>