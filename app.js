// Import required modules
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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
    this.gameTitle = '';
    this.lastPlayed = null;
    this.guessedWords = [];
  }

  setGameTitle(title) {
    if (this.currentState !== this.states.WAITING_FOR_PLAYERS) {
      throw new Error('Cannot set game title once the game has started.');
    }
    this.gameTitle = title;
  }

  addPlayer(displayName) {
    let player = this.players.find(p => p.displayName === displayName);
    if (!player) {
      player = { id: uuidv4(), displayName, score: 0 };
      this.players.push(player);
    }
    return player;
  }

  addWord(word) {
    if (this.currentState !== this.states.WAITING_FOR_PLAYERS) {
      throw new Error('Cannot add words once the game has started.');
    }
    this.words.push(word);
  }

  startGame() {
    if (this.players.length === 0) {
      throw new Error('At least one player is required to start the game.');
    }
    if (this.words.length === 0) {
      throw new Error('At least one word is required to start the game.');
    }

    this.currentState = this.states.GAME_IN_PROGRESS;
    this.currentWordIndex = 0;
    this.guessedWords = [];
  }

  submitWord(playerId, guessedWord) {
    if (this.currentState !== this.states.GAME_IN_PROGRESS) {
      throw new Error('Game is not in progress.');
    }

    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found.');
    }

    const currentWord = this.words[this.currentWordIndex];
    const isCorrect = guessedWord === currentWord;

    this.lastPlayed = {
      playerId: player.id,
      displayName: player.displayName,
      guessedWord,
      correct: isCorrect,
    };

    if (isCorrect) {
      player.score += 10;
      this.guessedWords.push({ word: guessedWord, guesser: player.displayName });
      this.currentWordIndex++;

      if (this.currentWordIndex >= this.words.length) {
        this.currentState = this.states.GAME_COMPLETED;
      }
    }
  }

  getCurrentState() {
    return {
      currentState: this.currentState,
      players: this.players.map(p => ({
        id: p.id,
        displayName: p.displayName,
        score: p.score,
      })),
      remainingWords: this.words.slice(this.currentWordIndex).length,
      guessedWords: this.guessedWords,
      gameTitle: this.gameTitle,
      lastPlayed: this.lastPlayed,
      words: this.words,
    };
  }

  printGameState() {
    console.log('Current Game State:', this.getCurrentState());
  }
}

const game = new WordGameFSM();

// API Endpoints
app.post('/game-title', (req, res) => {
  try {
    const { title } = req.body;
    game.setGameTitle(title);
    game.printGameState();
    res.status(200).json({ message: `Game title set to '${title}'.` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/players', (req, res) => {
  try {
    const { displayName } = req.body;
    const player = game.addPlayer(displayName);
    game.printGameState();
    res.status(201).json(player);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/words', (req, res) => {
  try {
    const { word } = req.body;
    game.addWord(word);
    game.printGameState();
    res.status(201).json({ message: `Word '${word}' added.` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/start', (req, res) => {
  try {
    game.startGame();
    game.printGameState();
    res.status(200).json({ message: 'Game started!' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/guess', (req, res) => {
  try {
    const { playerId, guessedWord } = req.body;
    game.submitWord(playerId, guessedWord);
    game.printGameState();
    res.status(200).json(game.getCurrentState());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/state', (req, res) => {
  res.status(200).json(game.getCurrentState());
});

app.get('/', (req, res) => {
  const playerName = req.query.playerName;
  if (playerName) {
    game.addPlayer(playerName);
  }
  game.printGameState();
  res.render('game', { state: game.getCurrentState() });
});

app.listen(port, () => {
  console.log(`Word game server is running on http://localhost:${port}`);
});
