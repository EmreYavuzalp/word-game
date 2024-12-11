<template>
  <div class="container">
    <h1>Welcome to the Word Game</h1>
    <p>Player: {{ playerName }}</p>
    <p v-if="gameId">Game ID: {{ gameId }}</p>
    <button v-if="!gameCreated" @click="createGame">Create Game</button>
  </div>
</template>

<script>
export default {
  name: 'CreateGame',
  data() {
    return {
      playerName: new URLSearchParams(window.location.search).get('playerName') || 'Anonymous',
      gameId: new URLSearchParams(window.location.search).get('gameId') || null,
      gameCreated: false
    };
  },
  methods: {
    async createGame() {
      const gameId = this.gameId || this.generateUUID();
      const url = `/api/create-random-game/${gameId}`;

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
        this.gameCreated = true;
        window.location.href = `/game/${data.gameId}?playerName=${this.playerName}`;
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
    }
  },
  mounted() {
    if (!this.gameId) {
      this.createGame();
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
</style>
