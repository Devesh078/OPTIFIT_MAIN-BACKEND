const sleepKnowledge =
require("../data/sleepKnowledge");

const proteinKnowledge =
require("../data/proteinKnowledge");

const recoveryKnowledge =
require("../data/recoveryKnowledge");

const getKnowledge = (question) => {

  const q = question.toLowerCase();

  let knowledge = [];

  if (
    q.includes("sleep") ||
    q.includes("tired") ||
    q.includes("fatigue")
  ) {
    knowledge.push(...sleepKnowledge);
  }

  if (
    q.includes("protein") ||
    q.includes("muscle")
  ) {
    knowledge.push(...proteinKnowledge);
  }

  if (
    q.includes("recovery") ||
    q.includes("sore")
  ) {
    knowledge.push(...recoveryKnowledge);
  }

  return knowledge;
};

module.exports = {
  getKnowledge
};