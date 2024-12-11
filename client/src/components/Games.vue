<template>
  <div class="container">
    <div v-if="expertMode"  >
      <h1>Create a New Word Game</h1>

      <button @click="createRandomGame">Create Random Game</button>

      <h2>Existing Games</h2>
      <div id="game-container">
        <div v-if="games.length > 0">
          <div v-for="game in games" :key="game.id" class="game-card">
            <p><strong>Game Title:</strong> {{ game.title }}</p>
            <p><strong>Game ID:</strong> {{ game.id }}</p>
            <p>
              <a :href="`/game/${game.id}?playerName=${playerName}`">Go to Game</a>
            </p>
          </div>
        </div>
        <p v-else>No games available. Create one now!</p>
      </div>
    </div>

    <div id="qr-code-container" style="margin-top: 20px;"></div>
  </div>

  
</template>

<script>
import QRCode from 'qrcode';

export default {
  name: 'ViewGames',
  data() {
    return {
      playerName: new URLSearchParams(window.location.search).get('playerName') || 'Guest',
      games: [],
      expertMode: new URLSearchParams(window.location.search).get('expertMode') === 'true',
    };
  },
  methods: {
    async fetchGames() {
      try {
        const response = await fetch('/api/games');
        if (!response.ok) throw new Error('Failed to fetch games');

        const data = await response.json();
        this.games = data.games;
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    },
    async createRandomGame() {
      const newGameId = this.generateUUID();
      const url = `/api/create-random-game/${newGameId}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ displayName: this.playerName }),
        });

        if (!response.ok) throw new Error('Failed to create game');

        const data = await response.json();
        this.games.push({ id: data.gameId, title: data.gameTitle });
      } catch (error) {
        console.error('Error creating game:', error);
      }
    },
    generateUUID() {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },
  },
  mounted() {
    const qrCodeContainer = document.getElementById('qr-code-container');
    const newGameId = this.generateUUID();
    const landingPageUrl = `http://qr-games.onrender.com/create-game?gameId=${newGameId}&playerName=${encodeURIComponent(this.playerName)}`;

    QRCode.toCanvas(landingPageUrl, { width: 200 }, (error, canvas) => {
      if (error) console.error(error);
      qrCodeContainer.appendChild(canvas);

      const urlText = document.createElement('p');
      urlText.textContent = `Landing Page URL: ${landingPageUrl}`;
      urlText.style.color = 'white';
      //if (this.expertMode) {
        qrCodeContainer.appendChild(urlText);
      //}
    });

    if (this.expertMode) {
      this.fetchGames();
      setInterval(this.fetchGames, 60000);
    }
  },
};
</script>

<style>
body {
  font-family: Arial, sans-serif;
  text-align: center;
  margin: 20px;
  background: linear-gradient(to bottom, #004c99, #66b3ff);
  color: white;
}
.container {
  max-width: 800px;
  margin: auto;
  padding: 20px;
  background: #00264d;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}
button {
  background-color: #0066cc;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 5px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
}
button:hover {
  background-color: #004080;
}
.game-card {
  background: #004080;
  padding: 15px;
  margin: 10px;
  border-radius: 8px;
  color: white;
  text-align: left;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}
a {
  color: #ffcc00;
  text-decoration: none;
  font-weight: bold;
}
a:hover {
  text-decoration: underline;
}
</style>