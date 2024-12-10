#!/bin/bash

# Base URL of the server
BASE_URL="http://localhost:3000"

# Set the game title
echo "Setting the game title..."
curl -s -X POST $BASE_URL/game-title -H "Content-Type: application/json" -d '{"title": "Tek kullanımlık nesneler"}'
echo "Game title set."

# Add words
echo "Adding words..."
curl -s -X POST $BASE_URL/words -H "Content-Type: application/json" -d '{"word": "Islak mendil"}'
curl -s -X POST $BASE_URL/words -H "Content-Type: application/json" -d '{"word": "Plastik tabak"}'
curl -s -X POST $BASE_URL/words -H "Content-Type: application/json" -d '{"word": "Plastik bardak"}'
curl -s -X POST $BASE_URL/words -H "Content-Type: application/json" -d '{"word": "Tuvalet kağıdı"}'
curl -s -X POST $BASE_URL/words -H "Content-Type: application/json" -d '{"word": "Plastik çatal"}'
echo "Words added."

# Add players
echo "Adding players..."
ALICE=$(curl -s -X POST $BASE_URL/players -H "Content-Type: application/json" -d '{"displayName": "Alice"}' | jq -r '.id')
BOB=$(curl -s -X POST $BASE_URL/players -H "Content-Type: application/json" -d '{"displayName": "Bob"}' | jq -r '.id')
echo "Alice ID: $ALICE"
echo "Bob ID: $BOB"

# Start the game
echo "Starting the game..."
curl -s -X POST $BASE_URL/start
echo "Game started."

# Submit guesses
echo "Submitting guesses..."
curl -s -X POST $BASE_URL/guess -H "Content-Type: application/json" -d "{\"playerId\": \"$ALICE\", \"guessedWord\": \"Islak mendil\"}" | jq
curl -s -X POST $BASE_URL/guess -H "Content-Type: application/json" -d "{\"playerId\": \"$BOB\", \"guessedWord\": \"Plastik bardak\"}" | jq
curl -s -X POST $BASE_URL/guess -H "Content-Type: application/json" -d "{\"playerId\": \"$ALICE\", \"guessedWord\": \"Plastik tabak\"}" | jq

# Fetch final game state
echo "Fetching game state..."
curl -s -X GET $BASE_URL/state | jq
