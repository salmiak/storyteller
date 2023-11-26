<script setup>
// import TheWelcome from '../components/TheWelcome.vue'
import { ref, computed } from 'vue'

const getRandomNumber = (max) => {
  return Math.floor(Math.random() * max)
}

const nbrOfPlayers = 4
const nbrOfCards = 6
const currentUserId = ref(0)
const currentStoryteller = ref(0)

const playerInfo = new Array()

for (var idx = 0; idx < nbrOfPlayers; idx++) {
  const imagesArray = new Array()
  for (var i = 0; i < nbrOfCards; i++) {
    const id = getRandomNumber(300)
    imagesArray.push({ id: id, src: 'https://picsum.photos/id/'+id+'/200/200' })
  }
  playerInfo.push({
    id: idx,
    images: imagesArray,
    selected: undefined,
    vote: undefined
  })
}

const players = ref(playerInfo)
const currentHint = ref(undefined)
const gameState = ref('hint') // Can be "hint" or "vote"

const progressGame = () => {
  const nextPlayer = playerInfo[(currentUserId.value + 1) % nbrOfPlayers]

  if (gameState.value == 'hint' && !nextPlayer.selected) {
    currentUserId.value = nextPlayer.id
  } else if (gameState.value == 'hint') {
    gameState.value = 'vote'
    progressGame()
  }
}

const selectedImages = computed(() => {
  console.log('hj');
  return players.value.map((p) => {
    return p.selected
  })
})
</script>

<template>
  <main>
    <h2>{{ gameState }}</h2>
    {{ selectedImages }}

    <ul>
      <li v-for="player in players">
        <span v-if="currentUserId == player.id">--> </span>
        Spelare no. {{ player.id }} ({{ player.selected }})
        <span v-if="currentStoryteller == player.id">Storyteller</span>
      </li>
    </ul>

    <template v-for="player in players">
      <div v-if="currentUserId == player.id">

        <div class="image-container">
          <img 
            v-for="image in player.images" 
            :src="image.src" 
            :id="'image-'+image.id" 
            @click="player.selected=image.id"
            :class="{active: player.selected==image.id}" />
        </div>

        <template v-if="currentStoryteller == player.id">
          <template v-if="player.selected">
            <input placeholder="Skriv en ledtråd" v-model="currentHint"/>
            <button @click="progressGame()">Vidare</button>
          </template>
          <p v-else>
            Välj en bild att skriva en ledtråd till...
          </p>
        </template>
        <template v-else>
          <p>{{ currentHint }}</p>
          <template v-if="player.selected">
            <button @click="progressGame()">Vidare</button>
          </template>
          <p v-else>
            Välj en bild för att komma vidare...
          </p>
        </template>
        
      </div>
    </template>
  </main>
</template>

<style>
  .image-container {
    display: flex;
    width: 100vw;
    flex-wrap: wrap;
    flex-direction: row;
    justify-content: center;
  }
  img {
    border: 3px solid transparent;
    display: block;
    width: 30vw;
    height: 30vw;
  }
  .active {
    border: 3px solid red;
  }
</style>