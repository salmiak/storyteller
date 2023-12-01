<script setup>

import { ref, reactive, computed } from 'vue'
import { io } from "socket.io-client"

const socket = io("http://localhost:3000");

const playerId = ref(null)
const playerName = ref('')
const playerNameValidation = ref(undefined)

const signInToGame = () => {        // TODO: Add support for game rooms
    if (!playerName.value) {
        return playerNameValidation.value = "Du måste ange ett namn"
    }
    socket.emit("newPlayer", playerName.value, (response) => {
        playerId.value = response.id
    })
}

const players = ref([])

socket.on("playersUpdate", (incomingPlayers) => {
    // reset list of players
    players.value.length = 0
    incomingPlayers.forEach((player) => {
        players.value.push(player)
    })
})

const currentPlayer = computed(() => players.value.find((p) => p.id === playerId.value))

const gameState = ref('hint') // Can be "hint" "vote" or "results"
const getImageSrc = ref((id) => 'https://picsum.photos/id/'+id+'/800/800')

const currentHint = ref(undefined)

// DEBUG AUTO PLAY:
playerName.value = "John Doe"
signInToGame()

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
          :title="player.socketId">
          {{ player.id===playerId?'You':player.name }}
          <span v-if="player.isWinner">WINNER!!</span>
          <span class="score">{{ player.score }}</span>
        </li>
      </ul>
      <p>Du heter: {{ currentPlayer.name }}</p>
    </main>
</template>