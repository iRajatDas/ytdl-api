const EventEmitter = require("events");

class ProgressEmitter extends EventEmitter {}

module.exports = new ProgressEmitter();
