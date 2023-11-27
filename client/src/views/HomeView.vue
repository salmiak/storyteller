<script setup>
// import TheWelcome from '../components/TheWelcome.vue'
import { ref, computed } from 'vue'

const getRandomNumber = (max) => Math.floor(Math.random() * max)
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array
}

const nbrOfPlayers = 5
const nbrOfCards = 6
const endOfGameScore = 30
const currentUserId = ref(0)
const currentStoryteller = ref(0)
const currentHint = ref(undefined)
const gameState = ref('hint') // Can be "hint" "vote" or "results"
const playedImages = new Array()

const getRadomImages = (nbrOfImages) => {
  const imagesArray = new Array()
  for (var i = 0; i < nbrOfImages; i++) {
    let id = getRandomNumber(300)
    while (
      imagesArray.indexOf(id) !== -1 || 
      playedImages.indexOf(id) !== -1
      ) {
      id = getRandomNumber(300)
    }
    playedImages.push(id)
    imagesArray.push(id)
  }
  return nbrOfImages===1?imagesArray[0]:imagesArray
}

const playerInfo = new Array()
for (var idx = 0; idx < nbrOfPlayers; idx++) {
  
  playerInfo.push({
    id: idx,
    images: getRadomImages(nbrOfCards),
    selected: undefined,
    vote: undefined,
    score: 0,
    isWinner: false
  })
}
const players = ref(playerInfo)

const listeners = computed(() => players.value.filter((p) => p.id !== currentStoryteller.value))

const getImageSrc = ref((id) => 'https://picsum.photos/id/'+id+'/800/800')

const selectedImages = computed(() => shuffleArray(players.value.map((p) => p.selected)))
const votedImages = computed(() => listeners.value.map((p) => p.vote))


const progressGame = () => {
  const nextPlayer = playerInfo[(currentUserId.value + 1) % nbrOfPlayers]

  if (gameState.value == 'hint' && !nextPlayer.selected) {
    currentUserId.value = nextPlayer.id
  } else if (gameState.value == 'hint') {
    gameState.value = 'vote'
    currentUserId.value = currentStoryteller.value
    progressGame()
  } else if (gameState.value == 'vote' && nextPlayer.id === currentStoryteller.value) {
    countScores()
  } else if (gameState.value == 'vote' && !nextPlayer.vote) {
    currentUserId.value = nextPlayer.id
  }
}

const countScores = () => {
  gameState.value = 'results'
  const storyteller = playerInfo[currentStoryteller.value]
  const storytellersImage = storyteller.selected
  
  if (votedImages.value.every( (img) => img === storytellersImage )) {
    console.log('Alla röstade på berättarens bild');
    playerInfo.forEach((p) => { if (p.id !== storyteller.id) p.score+=2 })
  } else {
    playerInfo.forEach((p) => {
      if (p.vote === storytellersImage) {
        p.score += 3
        storyteller.score += 2
      }
    })
    votedImages.value.forEach((img) => {
      playerInfo.find((p) => p.selected === img).score++
    })
  }
}

const goToNextPlayer = () => {
  playerInfo.forEach((p) => {
    p.isWinner = p.score >= endOfGameScore
    p.images.splice(p.images.indexOf(p.selected), 1)
    p.images.push(getRadomImages(1))
    p.vote = undefined
    p.selected = undefined
  })
  if (playerInfo.filter((p) => p.isWinner).length) {
    return gameState.value = 'winner'
  }
  currentStoryteller.value = (currentStoryteller.value + 1) % nbrOfPlayers
  currentUserId.value = currentStoryteller.value
  currentHint.value = ""
  gameState.value = 'hint'
}

</script>

<template>
  <main>
    <ul class="players">
      <li 
        v-for="player in players"
        :class="{active: currentUserId == player.id}">
        <span v-if="currentStoryteller == player.id">S&nbsp;</span> 
        Player {{ (player.id + 1) }}
        <span v-if="player.isWinner">WINNER!!</span>
        <span class="score">{{ player.score }}</span>
      </li>
    </ul>

    <template v-if="gameState == 'winner'">
      <p class="hint">We have a winner!!</p>
    </template>
    <template v-else-if="gameState == 'results'">
      <div class="footer">
        <p class="hint">Vi har ett resultat!!</p>
        <button @click="goToNextPlayer()">Vidare</button>
      </div>
    </template>
    <template v-else v-for="player in players">
      <div v-if="currentUserId == player.id">

        <div class="image-container">
          <img 
            v-if="gameState == 'hint'"
            v-for="image in player.images" 
            :src="getImageSrc(image)" 
            :id="'image-'+image" 
            @click="player.selected=image"
            :class="{active: player.selected==image}" />
          <img 
            v-if="gameState == 'vote'"
            v-for="image in selectedImages" 
            :src="getImageSrc(image)" 
            :id="'image-'+image" 
            @click="(player.selected !== image) ? player.vote=image : undefined"
            :class="{disabled: player.selected == image, active: player.vote==image}" />
        </div>

        <div v-if="currentStoryteller == player.id" class="footer">
          <template v-if="player.selected">
            <input placeholder="Skriv en ledtråd" v-model="currentHint"/>
            <button :disabled="!currentHint" @click="progressGame()">Vidare</button>
          </template>
          <p v-else class="hint">
            Välj en bild att skriva en ledtråd till...
          </p>
        </div>
        <div v-else class="footer">
          <p class="hint">{{ currentHint }}</p>
          <button v-if="gameState == 'hint' && player.selected" @click="progressGame()">Vidare</button>
          <button v-else-if="gameState == 'vote' && player.vote" @click="progressGame()">Rösta</button>
          <p v-else class="small">
            Välj en bild för att komma vidare...
          </p>
        </div>
        
      </div>
    </template>
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