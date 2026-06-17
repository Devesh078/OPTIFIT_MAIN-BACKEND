const { GoogleGenerativeAI } =
require("@google/generative-ai");

const genAI =
new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model =
genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

const generateResponse = async (prompt) => {
  try {

    const result =
      await model.generateContent(prompt);

    const text =
      result.response.text();

    console.log("RAW AI RESPONSE:");
    console.log(text);

    return text;

  } catch (error) {

    console.log(error);

    return `
AI Coach is temporarily busy.

• Focus on sleep
• Hit protein target
• Recover properly
`;
  }
};
module.exports = {
  generateResponse
};