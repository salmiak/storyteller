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


    <template v-if="gameState == 'hint'">
        <h2>Din hand</h2>
        <div class="image-container">
          <img 
            v-for="image in currentPlayer.images" 
            :src="getImageSrc(image)" 
            :id="'image-'+image" 
            @click="currentPlayer.selected=image"
            :class="{active: currentPlayer.selected==image}" />
        </div>
    </template>

    <!--
    <template v-if="gameState == 'vote'">
        <h2>Rösta på ett kort</h2>
        <img 
            v-for="image in selectedImages" 
            :src="getImageSrc(image)" 
            :id="'image-'+image" 
            @click="(player.selected !== image) ? player.vote=image : undefined"
            :class="{disabled: player.selected == image, active: player.vote==image}" />
    </template>
    -->

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