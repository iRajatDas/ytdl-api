// utils/progressEmitter.js
const EventEmitter = require("events");

class ProgressEmitter extends EventEmitter {}

module.exports = new ProgressEmitter();
