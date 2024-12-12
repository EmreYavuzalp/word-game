// routes/api.js
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();
const games = new Map();
const WordGameFSM = require("../models/WordGameFSM");
const { introduceGame, playGame } = require("../roast-api/roaster");

// Enhanced Response Model Definition
class GameResponse {
  constructor(playerName, guessedWord, isGuessedRight, roastResponse) {
    this.playerName = playerName;
    this.guessedWord = guessedWord;
    this.isGuessedRight = isGuessedRight;
    this.roastResponse = roastResponse;
  }
}

// Create a random game
router.post("/create-random-game/:gameId", (req, res) => {
  fs.readFile(path.join(__dirname, "../pipes.txt"), "utf-8", (err, data) => {
    if (err) return res.status(500).json({ error: "Failed to read pipes.txt" });

    const lines = data.split("\n").filter((line) => line.includes("|"));
    const randomLine = lines[Math.floor(Math.random() * lines.length)];
    const [gameTitle, wordsString] = randomLine.split("|");
    const words = wordsString.split(",").map((w) => w.trim());

    const gameId = req.params.gameId || uuidv4();
    const game = new WordGameFSM(gameId);
    game.setGameTitle(gameTitle);
    game.addPlayer(req.body.displayName);
    words.forEach((word) => game.addWord(word));
    games.set(gameId, game);

    // Introduce the game to the Roast API
    const introResponse = introduceGame("INTRODUCE", gameTitle, wordsString);

    game.startGame();
    res.status(201).json({
      gameId,
      gameTitle,
      words,
      introResponse,
      message: "Random game created and started successfully.",
    });
  });
});

// Get the list of games
router.get("/games", (req, res) => {
  const gameList = Array.from(games.values()).map((game) => ({
    id: game.gameId,
    title: game.gameTitle || "Untitled Game",
  }));
  res.status(200).json({ games: gameList });
});

// Update game title
router.post("/:gameId/game-title", (req, res) => {
  try {
    const game = games.get(req.params.gameId);
    if (!game) throw new Error("Game not found.");
    game.setGameTitle(req.body.title);
    res.status(200).json({ message: `Game title set to '${req.body.title}'.` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add a player
router.post("/:gameId/players", (req, res) => {
  try {
    const game = games.get(req.params.gameId);
    if (!game) throw new Error("Game not found.");
    const player = game.addPlayer(req.body.displayName);
    res.status(201).json(player);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add a word
router.post("/:gameId/words", (req, res) => {
  try {
    const game = games.get(req.params.gameId);
    if (!game) throw new Error("Game not found.");
    game.addWord(req.body.word);
    res.status(201).json({ message: `Word '${req.body.word}' added.` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start the game
router.post("/:gameId/start", (req, res) => {
  try {
    const game = games.get(req.params.gameId);
    if (!game) throw new Error("Game not found.");
    game.startGame();
    res.status(200).json({ message: "Game started!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Submit a guess
router.post("/:gameId/guess", async (req, res) => {
  try {
    const game = games.get(req.params.gameId);
    if (!game) throw new Error("Game not found.");

    const { playerId, guessedWord } = req.body;

    // Use submitWord method
    game.submitWord(playerId, guessedWord);
    const { displayName, correct } = game.lastPlayed;

    // Use Roast API's play method
    const roastResponse = await playGame(
      "PLAY",
      displayName,
      guessedWord,
      correct
    );

    // Update game state
    const response = new GameResponse(
      playerId,
      guessedWord,
      correct,
      roastResponse
    );
    game.addResponse(response);

    res.status(200).json({ gameState: game.getCurrentState(), roastResponse });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get game state
router.get("/:gameId/state", (req, res) => {
  const game = games.get(req.params.gameId);
  if (!game) return res.status(404).json({ error: "Game not found." });
  res.status(200).json(game.getCurrentState());
});

module.exports = router;
