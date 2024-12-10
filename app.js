// Import required modules (if any, e.g., uuid for generating unique player IDs)
const { v4: uuidv4 } = require('uuid');

// Define the finite state machine class
class WordGameFSM {
  constructor(words) {
    this.states = {
      WAITING_FOR_PLAYERS: 'WAITING_FOR_PLAYERS',
      GAME_IN_PROGRESS: 'GAME_IN_PROGRESS',
      GAME_COMPLETED: 'GAME_COMPLETED',
    };

    this.currentState = this.states.WAITING_FOR_PLAYERS;
    this.players = [];
    this.words = words;
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

  // Start the game
  startGame() {
    if (this.players.length === 0) {
      throw new Error('At least one player is required to start the game.');
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
      } else {
        console.log('Next word:', this.words[this.currentWordIndex]);
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

// Example usage
const words = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
const game = new WordGameFSM(words);

// Add players
game.addPlayer('Alice');
game.addPlayer('Bob');

// Start the game
game.startGame();

// Submit guesses
game.submitWord(game.players[0].id, 'apple');
game.submitWord(game.players[1].id, 'orange');
game.submitWord(game.players[0].id, 'banana');
