<template>
  <div class="container">
    <h1>Welcome to the Word Game</h1>
    
    <form @submit.prevent="createGame">
      <label for="playerName">Player Name:</label>
      <input 
        type="text" 
        id="playerName" 
        v-model="playerName" 
        placeholder="Enter your name" 
        required 
      />
      <button type="submit" :disabled="gameCreated">Create Game</button>
    </form>

    <p v-if="gameCreated">Game created successfully!</p>
    <p v-if="gameId">Game ID: {{ gameId }}</p>
  </div>
</template>

<script>
export default {
  name: 'CreateGame',
  data() {
    return {
      playerName: '',
      gameId: new URLSearchParams(window.location.search).get('gameId') || null,
      gameCreated: false
    };
  },
  methods: {
    async createGame() {
      if (!this.playerName) {
        alert("Player name is required!");
        return;
      }

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
  }
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
form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
label {
  font-size: 16px;
  font-weight: bold;
}
input {
  padding: 10px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
}
button {
  background-color: #0066cc;
  color: white;
  border: none;
  padding: 10px 20px;
  margin-top: 10px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
}
button:disabled {
  background-color: #999;
  cursor: not-allowed;
}
button:hover:not(:disabled) {
  background-color: #004080;
}
</style>
