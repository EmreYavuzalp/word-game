<template>
  <div class="container">
    <h1>Join the Word Game</h1>
    <form @submit.prevent="joinGame">
      <label for="playerName">Player Name:</label>
      <input 
        type="text" 
        id="playerName" 
        v-model="playerName" 
        placeholder="Enter your name" 
        required
      />

      <label for="gameId">Game ID (Optional):</label>
      <input 
        type="text" 
        id="gameId" 
        v-model="gameId" 
        placeholder="Enter Game ID" 
      />

      <button type="submit">Join Game</button>
    </form>
    <p v-if="joinError" class="error">{{ joinError }}</p>
  </div>
</template>

<script>
export default {
  name: 'JoinGame',
  data() {
    return {
      playerName: new URLSearchParams(window.location.search).get('playerName') || '',
      gameId: new URLSearchParams(window.location.search).get('gameId') || '',
      joinError: '',
    };
  },
  methods: {
    async joinGame() {
      if (!this.playerName) {
        this.joinError = 'Player name is required!';
        return;
      }
      try {
        const url = `/api/${this.gameId}/players`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ displayName: this.playerName }),
        });

        if (!response.ok) throw new Error('Failed to join or create game');
        
        const data = await response.json();
        console.log(data);
        window.location.href = `/game/${this.gameId}?playerName=${this.playerName}`;
      } catch (error) {
        console.error('Error joining game:', error);
        this.joinError = 'Failed to join the game. Please try again later.';
      }
    },
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
  max-width: 600px;
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

button:hover {
  background-color: #004080;
}

.error {
  color: #ff6666;
  font-weight: bold;
}
</style>