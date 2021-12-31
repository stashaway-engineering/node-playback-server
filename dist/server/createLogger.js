"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/* eslint-disable no-console */
const LOG_LEVEL = {
  TRACE: 1,
  DEBUG: 2,
  INFO: 3,
  WARN: 4,
  ERROR: 5
};

class Logger {
  constructor({
    loglevel,
    tag
  }) {
    this._tag = tag;
    this._loglevel = loglevel || LOG_LEVEL.INFO;
  }

  trace(string) {
    if (this._loglevel <= LOG_LEVEL.TRACE) console.log(`${this._tag} ${string}`);
  }

  debug(string) {
    if (this._loglevel <= LOG_LEVEL.DEBUG) console.log(`${this._tag} ${string}`);
  }

  info(string) {
    if (this._loglevel <= LOG_LEVEL.INFO) console.log(`${this._tag} ${string}`);
  }

  warn(string) {
    if (this._loglevel <= LOG_LEVEL.WARN) console.log(`${this._tag} ${string}`);
  }

  error(string) {
    if (this._loglevel <= LOG_LEVEL.ERROR) console.log(`${this._tag} ${string}`);
  }

}

var _default = (...args) => new Logger(...args);

exports.default = _default;