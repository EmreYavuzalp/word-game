// Import required modules
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Define the finite state machine class
class WordGameFSM {
  constructor(gameId) {
    this.gameId = gameId;
    this.states = {
      WAITING_FOR_PLAYERS: 'WAITING_FOR_PLAYERS',
      GAME_IN_PROGRESS: 'GAME_IN_PROGRESS',
      GAME_COMPLETED: 'GAME_COMPLETED',
    };

    this.currentState = this.states.WAITING_FOR_PLAYERS;
    this.players = [];
    this.words = [];
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
    this.guessedWords = [];
  }

  submitWord(playerId, guessedWord) {
    if (this.currentState !== this.states.GAME_IN_PROGRESS) {
      throw new Error('Game is not in progress.');
    }

    const player = this.players.find(p => p.displayName === playerId);
    if (!player) {
      throw new Error('Player not found.');
    }

    const isCorrect = this.words.includes(guessedWord);

    this.lastPlayed = {
      playerId: player.id,
      displayName: player.displayName,
      guessedWord,
      correct: isCorrect,
    };

    if (isCorrect && !this.guessedWords.some(w => w.word === guessedWord)) {
      player.score += 10;
      this.guessedWords.push({ word: guessedWord, guesser: player.displayName });
    }

    if (this.guessedWords.length >= this.words.length) {
      this.currentState = this.states.GAME_COMPLETED;
    }
  }

  getCurrentState() {
    return {
      gameId: this.gameId,
      currentState: this.currentState,
      players: this.players.map(p => ({
        id: p.id,
        displayName: p.displayName,
        score: p.score,
      })),
      guessedWords: this.guessedWords,
      gameTitle: this.gameTitle,
      lastPlayed: this.lastPlayed,
      words: this.words,
    };
  }
}

const games = new Map();

// API Endpoints
app.post('/create-random-game/:gameId', (req, res) => {
  fs.readFile(path.join(__dirname, 'pipes.txt'), 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read pipes.txt' });

    const lines = data.split('\n').filter(line => line.includes('|'));
    const randomLine = lines[Math.floor(Math.random() * lines.length)];
    const [gameTitle, wordsString] = randomLine.split('|');
    const words = wordsString.split(',').map(w => w.trim());

    const gameId = req.params.gameId || uuidv4();
    const game = new WordGameFSM(gameId);
    game.setGameTitle(gameTitle);
    game.addPlayer(req.body.displayName);
    words.forEach(word => game.addWord(word));
    games.set(gameId, game);

    game.startGame();
    res.status(201).json({ gameId, gameTitle, words, message: 'Random game created and started successfully.' });
  });
});
app.post('/:gameId/game-title', (req, res) => {
  try {
    const game = games.get(req.params.gameId);
    if (!game) throw new Error('Game not found.');
    game.setGameTitle(req.body.title);
    res.status(200).json({ message: `Game title set to '${req.body.title}'.` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/:gameId/players', (req, res) => {
  try {
    const game = games.get(req.params.gameId);
    if (!game) throw new Error('Game not found.');
    const player = game.addPlayer(req.body.displayName);
    res.status(201).json(player);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/:gameId/words', (req, res) => {
  try {
    const game = games.get(req.params.gameId);
    if (!game) throw new Error('Game not found.');
    game.addWord(req.body.word);
    res.status(201).json({ message: `Word '${req.body.word}' added.` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/:gameId/start', (req, res) => {
  try {
    const game = games.get(req.params.gameId);
    if (!game) throw new Error('Game not found.');
    game.startGame();
    res.status(200).json({ message: 'Game started!' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


app.post('/:gameId/guess', (req, res) => {
  try {
    const game = games.get(req.params.gameId);
    if (!game) throw new Error('Game not found.');
    game.submitWord(req.body.playerId, req.body.guessedWord);
    res.status(200).json(game.getCurrentState());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/:gameId/state', (req, res) => {
  const game = games.get(req.params.gameId);
  if (!game) return res.status(404).json({ error: 'Game not found.' });
  res.status(200).json(game.getCurrentState());
});

// View all games
app.get('/games', (req, res) => {
  const playerName = req.query.playerName || 'Guest';
  const gameList = Array.from(games.values()).map(game => ({
    id: game.gameId,
    title: game.gameTitle || 'Untitled Game',
  }));
  console.log('gggggggg', gameList);

  res.render('view_games', { games: gameList, playerName });
});

// Redirect to game page
app.get('/game', (req, res) => {
  const { gameId, playerName } = req.query;
  const game = games.get(gameId);

  if (!game) {
    return res.status(404).json({ error: 'Game not found.' });
  }

  game.addPlayer(playerName);
  res.redirect(`/game/${gameId}?playerName=${encodeURIComponent(playerName)}`);
});
app.get('/game/:gameId', (req, res) => {
  const gameId = req.params.gameId || null;
  const playerName = req.query.playerName || null;

  if (!gameId || !games.has(gameId)) {
    return res.status(404).json({ error: 'Game not found.' });
  }

  const game = games.get(gameId);

  if (playerName && !game.players.some(p => p.name === playerName)) {
    game.addPlayer(playerName);
  }

  const state = game.getCurrentState();
  console.log('state', state);
  res.render('game', { state });
});


app.listen(port, () => {
  console.log(`Word game server is running on http://localhost:${port}`);
});
