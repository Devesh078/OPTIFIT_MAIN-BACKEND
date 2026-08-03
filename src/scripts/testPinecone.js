require("dotenv").config();

const index = require("../services/pineconeService");

async function test() {
  try {
    const stats = await index.describeIndexStats();

    console.log("✅ Pinecone Connected");
    console.log(stats);
  } catch (err) {
    console.error("❌ Connection Failed");
    console.error(err);
  }
}

test();