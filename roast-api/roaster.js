require("dotenv").config();
const axios = require("axios");

let gameState = {
  title: "",
  words: [],
};

/**
 * Introduces a new game with a title and words.
 * @param {string} command - The command type (should be "INTRODUCE").
 * @param {string} title - The title of the game.
 * @param {string} words - Comma-separated words for the game.
 * @returns {object} - Result message or error.
 */
function introduceGame(command, title, words) {
  if (command === "INTRODUCE") {
    gameState.title = title;
    gameState.words = words.split(",");
    return { message: `Oyun tanımlandı: ${title}` };
  } else {
    return { error: "Geçersiz komut" };
  }
}

/**
 * Simulates playing the game by interacting with OpenAI API.
 * @param {string} command - The command type (should be "PLAY").
 * @param {string} playerName - The player's name.
 * @param {string} word - The guessed word.
 * @param {boolean} isGuessedRight - Whether the guess is correct.
 * @returns {Promise<object>} - API response or error message.
 */
async function playGame(command, playerName, word, isGuessedRight) {
  if (command !== "PLAY") {
    return { error: "Geçersiz komut" };
  }

  const prompt = {
    role: "system",
    content: `Sen bir oyun tezahüratçısısın. Bu bir kelime oyunu. Kelime oyunlarında bir başlık ve kelimeler olur. Oyuncular da her bir turn'de kelimeleri bilir. Ben ilk başta kelime oyununu tanımlayacağım, sonra da kelimeleri vereceğim. Başlıyoruz. \rOyun başlığı: ${
      gameState.title
    }. \rKelimeler: ${gameState.words.join(
      ","
    )}. Oyuncu: ${playerName}\rKelime: ${word}\rDoğru mu: ${isGuessedRight}\rKomik bir tezahürat yapacaksın, ama 10 kelimeyi geçmemeli. Bilmeyenlerle sarkastik bir şekilde dalga geçmelisin. Yanlışsa doğru kelimeyi söylememen lazım.`,
  };

  try {
    const response = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        model: "grok-beta",
        stream: false,
        temperature: 0,
        messages: [prompt],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    return {
      openAiResponse: response.data.choices[0].message.content.trim(),
    };
  } catch (error) {
    console.error(error);
    return { error: "OpenAI API isteği başarısız oldu" };
  }
}

module.exports = {
  introduceGame,
  playGame,
};
