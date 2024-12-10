// Import required modules (if any, e.g., uuid for generating unique player IDs)
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Define the finite state machine class
class WordGameFSM {
  constructor() {
    this.states = {
      WAITING_FOR_PLAYERS: 'WAITING_FOR_PLAYERS',
      GAME_IN_PROGRESS: 'GAME_IN_PROGRESS',
      GAME_COMPLETED: 'GAME_COMPLETED',
    };

    this.currentState = this.states.WAITING_FOR_PLAYERS;
    this.players = [];
    this.words = [];
    this.currentWordIndex = 0;
  }

  // Add a player to the game
  addPlayer(displayName) {
    if (this.currentState !== this.states.WAITING_FOR_PLAYERS) {
      throw new Error('Cannot add players once the game has started.');
    }

    const player = { id: uuidv4(), displayName };
    this.players.push(player);
    return player;
  }

  // Add a word to the game
  addWord(word) {
    if (this.currentState !== this.states.WAITING_FOR_PLAYERS) {
      throw new Error('Cannot add words once the game has started.');
    }
    this.words.push(word);
  }

  // Start the game
  startGame() {
    if (this.players.length === 0) {
      throw new Error('At least one player is required to start the game.');
    }
    if (this.words.length === 0) {
      throw new Error('At least one word is required to start the game.');
    }

    this.currentState = this.states.GAME_IN_PROGRESS;
    this.currentWordIndex = 0;
    console.log('Game started! First word:', this.words[this.currentWordIndex]);
  }

  // Submit a word guess
  submitWord(playerId, guessedWord) {
    if (this.currentState !== this.states.GAME_IN_PROGRESS) {
      throw new Error('Game is not in progress.');
    }

    const currentWord = this.words[this.currentWordIndex];
    if (guessedWord === currentWord) {
      console.log(`Player ${playerId} guessed the correct word: ${guessedWord}`);
      this.currentWordIndex++;

      if (this.currentWordIndex >= this.words.length) {
        this.currentState = this.states.GAME_COMPLETED;
        console.log('Game completed! All words have been guessed.');
      }
    } else {
      console.log(`Player ${playerId} guessed incorrectly: ${guessedWord}`);
    }
  }

  // Get the current state
  getCurrentState() {
    return this.currentState;
  }

  // List players
  listPlayers() {
    return this.players;
  }

  // Get the current word
  getCurrentWord() {
    if (this.currentState !== this.states.GAME_IN_PROGRESS) {
      throw new Error('Game is not in progress.');
    }
    return this.words[this.currentWordIndex];
  }
}

const game = new WordGameFSM();

// REST API Endpoints

// Add a player
app.post('/players', (req, res) => {
  try {
    const { displayName } = req.body;
    const player = game.addPlayer(displayName);
    res.status(201).json(player);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add a word
app.post('/words', (req, res) => {
  try {
    const { word } = req.body;
    game.addWord(word);
    res.status(201).json({ message: `Word '${word}' added.` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start the game
app.post('/start', (req, res) => {
  try {
    game.startGame();
    res.status(200).json({ message: 'Game started!' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Submit a guess
app.post('/guess', (req, res) => {
  try {
    const { playerId, guessedWord } = req.body;
    game.submitWord(playerId, guessedWord);
    if (game.getCurrentState() === game.states.GAME_COMPLETED) {
      res.status(200).json({ message: 'Game completed! All words guessed.' });
    } else {
      res.status(200).json({ message: 'Correct guess!' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get the current state
app.get('/state', (req, res) => {
  res.status(200).json({ state: game.getCurrentState() });
});

// List players
app.get('/players', (req, res) => {
  res.status(200).json(game.listPlayers());
});

app.listen(port, () => {
  console.log(`Word game server is running on http://localhost:${port}`);
});