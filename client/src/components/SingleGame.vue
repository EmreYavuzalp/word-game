<template>
  <div class="container">
    <h1>{{ state.gameTitle || 'Word Game' }}</h1>

    <div v-if="state.currentState === 'WAITING_FOR_PLAYERS' && !spectatorMode" class="game-controls">
      <input type="text" v-model="gameTitle" placeholder="Set Game Title" />
      <input type="text" v-model="newWord" placeholder="Add Word" />
      <button @click="setGameTitle">Set Title</button>
      <button @click="addWord">Add Word</button>
      <button @click="startGame">Start Game</button>
    </div>

    <div v-if="state.currentState === 'GAME_IN_PROGRESS'" class="word-display">
      <div v-for="word in state.words" :key="word">
        <span>
          {{ guessedWords[word] ? word : word.charAt(0) + '_'.repeat(word.length - 1) }}
        </span>
        <span v-if="guessedWords[word]" class="guesser">({{ guessedWords[word].guesser }})</span>
      </div>
    </div>

    <div v-if="state.currentState === 'GAME_IN_PROGRESS' && !spectatorMode" class="guess-box">
      <input type="text" v-model="guess" @keypress.enter="submitGuess" placeholder="Your Guess" />
      <button @click="submitGuess">Submit Guess</button>
    </div>

    <div v-if="state.currentState === 'GAME_COMPLETED'">
      <h2>Game Over!</h2>
      <div class="winner">
        Winner: {{ winner.displayName }} (Score: {{ winner.score }})
      </div>
      <h3>Other Players:</h3>
      <div v-for="player in otherPlayers" :key="player.id" class="loser">
        {{ player.displayName }}: {{ player.score }}
      </div>
    </div>

    <div class="players-container">
      <div v-for="player in state.players" :key="player.id" class="card">
        <strong>{{ player.displayName }}</strong><br />
        Score: {{ player.score }}
      </div>

      <div v-if="gameId && spectatorMode && state.currentState !== 'GAME_COMPLETED'" class="card qr-code-card">
        <h3>Join the Game</h3>
        <div id="qr-code-container"></div>
      </div>
    </div>

    <div v-if="state.lastPlayed" class="card last-guess-card">
      <h3>Last Guess</h3>
      <p>
        <strong>Player:</strong> {{ state.lastPlayed.displayName }}<br />
        <strong>Guess:</strong> {{ state.lastPlayed.guessedWord }}<br />
        <strong>Result:</strong> {{ state.lastPlayed.correct ? 'Correct' : 'Incorrect' }}
      </p>
    </div>
    <div v-if="state.gameResponses.length" class="game-responses">
      <h3>Game Responses</h3>
      <ul>
        <li v-for="(response, index) in state.gameResponses" :key="index">
          <strong>{{ response.playerName }}</strong>: 
          "{{ response.guessedWord }}" 
          - {{ response.isGuessedRight ? "Correct" : "Incorrect" }} 
          <span class="roast-response">({{ response.roastResponse.openAiResponse }})</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import QRCode from 'qrcode';

export default {
  data() {
    return {
      state: {},
      lastSpokenResponseId: null, // Track last spoken response
      gameId: null,
      playerName: null,
      spectatorMode: new URLSearchParams(window.location.search).get('spectatorMode') === 'true',
      gameTitle: '',
      newWord: '',
      guess: '',
      guessedWords: {},
      gameInterval: null, // Store interval ID
      spokenResponses: new Set(), // Track spoken responses
    };
  },
  computed: {
    winner() {
      return this.state.players.reduce((a, b) => (a.score > b.score ? a : b), {});
    },
    otherPlayers() {
      return this.state.players.filter((p) => p.id !== this.winner.id);
    },
    qrLink() {
      return `http://qr-games.com/join-game/?gameId=${this.gameId}`;
    },
  },
  methods: {
    async generateQRCode() {
      this.$nextTick(() => {
        const qrCodeContainer = document.getElementById('qr-code-container');
        if (!qrCodeContainer || !this.gameId) {
          console.error('QR code container not found or gameId is missing');
          return;
        }
        try {
          const landingPageUrl = this.qrLink;
          QRCode.toCanvas(landingPageUrl, { width: 100 }, (error, canvas) => {
            if (error) {
              console.error('QR code generation failed:', error);
            } else {
              qrCodeContainer.innerHTML = '';
              qrCodeContainer.appendChild(canvas);
            }
          });
        } catch (error) {
          console.error('QR code generation failed:', error);
        }
      });
    },
    fetchState() {
      fetch(`/api/${this.gameId}/state`)
      .then((res) => res.json())
      .then((data) => {
        this.state = data;
          if (this.state.currentState === 'GAME_COMPLETED') {
            clearInterval(this.gameInterval);
            this.redirectToMainPage();
          }
        this.guessedWords = this.state.guessedWords.reduce((acc, word) => {
          acc[word.word] = word;
          return acc;
        }, {});
        if (this.spectatorMode){
          this.handleRoastResponses();
        }
      })
      .catch((error) => console.error('Error fetching game state:', error));
    },
    handleRoastResponses() {
      this.state.gameResponses.forEach((response) => {
        if (response.id > this.lastSpokenResponseId) {
          this.speakMessage(response.roastResponse.openAiResponse);
          
          // Update last spoken response ID
          this.lastSpokenResponseId = response.id;
        }
      });
    },
    speakMessage(message) {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'tr-TR'; // Set language if needed
        window.speechSynthesis.speak(utterance);
      } else {
        console.error("Speech Synthesis not supported in this browser.");
      }
    },
    addPlayer() {
      if (!this.spectatorMode && this.state.currentState !== 'GAME_COMPLETED') {
        fetch(`/api/${this.gameId}/players`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ displayName: this.playerName }),
        })
          .then((res) => res.json())
          .then(() => this.fetchState())
          .catch((error) => console.error("Error adding player:", error));
      }
    },
    xhrRequest(endpoint, method, data) {
      fetch(`/api/${this.gameId}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((res) => res.json())
        .then(() => this.fetchState());
    },
    setGameTitle() {
      this.xhrRequest(`/game-title`, "POST", { title: this.gameTitle });
    },
    addWord() {
      this.xhrRequest(`/words`, "POST", { word: this.newWord });
    },
    startGame() {
      this.xhrRequest(`/start`, "POST", {});
    },
    submitGuess() {
      this.xhrRequest("/guess", "POST", {
        playerId: this.playerName,
        guessedWord: this.guess,
      });
      this.guess = "";
    },
  },
  mounted() {
    const urlParams = new URLSearchParams(window.location.search);
    this.gameId = this.$route.params.gameId;
    this.playerName = urlParams.get("playerName");
    this.spectatorMode = urlParams.get("spectatorMode") === "true";
    this.addPlayer();
    this.fetchState();
    this.generateQRCode();

    // Refresh the game state every 5 seconds, only if the game is not ended
    this.gameInterval = setInterval(() => {
      if (this.state.currentState !== 'GAME_COMPLETED') {
        this.fetchState();
      } else {
        clearInterval(this.gameInterval);
      }
    }, 5000);
  },
  beforeUnmount() {
    // Clear the interval when the component is destroyed
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
    }
  }
};
</script>

<style scoped>
body {
  font-family: Arial, sans-serif;
  text-align: center;
  margin: 20px;
  background: linear-gradient(to bottom, #123456, #89abcd);
  color: white;
}
.container {
  max-width: 900px;
  margin: auto;
  padding: 30px;
  background: #112233;
  border-radius: 15px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.6);
}
.word-display {
  font-size: 38px;
  margin: 25px 0;
  line-height: 2;
}
.guesser {
  font-size: 14px;
  color: #dddddd;
}
.guess-box {
  margin: 25px 0;
}
button {
  background-color: #0055aa;
  color: white;
  border: none;
  padding: 12px 25px;
  margin: 5px;
  border-radius: 8px;
  cursor: pointer;
}
button:hover {
  background-color: #003377;
}
.card {
  background: #223344;
  padding: 12px 25px;
  margin: 8px;
  border-radius: 10px;
  color: white;
  text-align: left;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
}
.players-container {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.last-guess-card {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 260px;
}
.winner {
  font-size: 42px;
  font-weight: bold;
  color: gold;
}
.loser {
  font-size: 20px;
  color: #aaaaaa;
}
.card {
  background: #223344;
  padding: 12px 25px;
  margin: 8px;
  border-radius: 10px;
  color: white;
  text-align: left;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
}

.qr-code-card {
  text-align: center;
  width: 100px; 
  margin: 10px auto;
  padding: 3px;
}

#qr-code-container {
  width: 100px;
  height: 100px;
  margin: 0 auto;
}

#qr-code-container canvas {
  width: 100% !important;
  height: 100% !important;
}

.game-responses {
  margin-top: 20px;
  padding: 15px;
  background: #334455;
  border-radius: 10px;
  color: white;
}

.roast-response {
  font-style: italic;
  color: #ffcc00;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  padding: 8px 0;
  border-bottom: 1px solid #555;
}

li:last-child {
  border-bottom: none;
}
</style>
