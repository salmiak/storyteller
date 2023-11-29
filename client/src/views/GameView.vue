<script setup>

import { ref, reactive, computed } from 'vue'
import { io } from "socket.io-client"

const socket = io("http://localhost:3000");

const player = reactive({
    isLoading: true
})
socket.emit("newPlayer", "Glenn", (response) => {
    Object.assign(player, response.playerInfo)
    player.isLoading = false
})

const players = ref([])
socket.on("playersUpdate", (incomingPlayers) => {
    console.log('playersUpdate');
    console.log(incomingPlayers);
    players.value.length = 0
    console.log(players.value)
    incomingPlayers.forEach((player) => {
        players.value.push(player)
    })
    console.log(players.value)
})
const gameState = ref('loading') // Can be "loading", "hint" "vote" or "results"
const getImageSrc = ref((id) => 'https://picsum.photos/id/'+id+'/800/800')




const currentHint = ref(undefined)

</script>

<template>
    <main>
      <ul class="players">
        <li 
          v-for="player in players">
          {{ player.socketId }}
          <span v-if="player.isWinner">WINNER!!</span>
          <span class="score">{{ player.score }}</span>
        </li>
      </ul>

      {{ player.socketId }}
    </main>
</template>