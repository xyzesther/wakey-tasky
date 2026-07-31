const { generateTasksFromText } = require("./taskGenerator");

module.exports = {
  getProvider: () => ({ taskParser: generateTasksFromText })
};
