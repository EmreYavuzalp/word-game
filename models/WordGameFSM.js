// models/WordGameFSM.js
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
        player = { id: require('uuid').v4(), displayName, score: 0 };
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
  
  module.exports = WordGameFSM;
  