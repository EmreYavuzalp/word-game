#!/bin/bash

# Base URL of the server
BASE_URL="http://localhost:3000"

# Add players
echo "Adding players..."
ALICE=$(curl -s -X POST $BASE_URL/players -H "Content-Type: application/json" -d '{"displayName": "Alice"}' | jq -r '.id')
BOB=$(curl -s -X POST $BASE_URL/players -H "Content-Type: application/json" -d '{"displayName": "Bob"}' | jq -r '.id')
echo "Alice ID: $ALICE"
echo "Bob ID: $BOB"

# Add words
echo "Adding words..."
curl -s -X POST $BASE_URL/words -H "Content-Type: application/json" -d '{"word": "apple"}'
curl -s -X POST $BASE_URL/words -H "Content-Type: application/json" -d '{"word": "banana"}'
curl -s -X POST $BASE_URL/words -H "Content-Type: application/json" -d '{"word": "cherry"}'
echo "Words added."

# Start the game
echo "Starting the game..."
curl -s -X POST $BASE_URL/start

# Submit guesses
echo "Submitting guesses..."
curl -s -X POST $BASE_URL/guess -H "Content-Type: application/json" -d "{\"playerId\": \"$ALICE\", \"guessedWord\": \"apple\"}"
curl -s -X POST $BASE_URL/guess -H "Content-Type: application/json" -d "{\"playerId\": \"$BOB\", \"guessedWord\": \"orange\"}"
curl -s -X POST $BASE_URL/guess -H "Content-Type: application/json" -d "{\"playerId\": \"$ALICE\", \"guessedWord\": \"banana\"}"

# Fetch game state
echo "Fetching game state..."
curl -s -X GET $BASE_URL/state | jq
