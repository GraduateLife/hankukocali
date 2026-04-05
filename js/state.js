/** State management module - handles progress, level/char tracking, persistence */
window.GameState = (function () {
  'use strict';

  var STORAGE_KEY = 'hankukocali_progress';

  function GameState(characters) {
    this.characters = characters;
    this.currentLevel = 0;
    this.currentCharIndex = 0;
    this._load();
  }

  GameState.prototype.getCurrentGroup = function () {
    return this.characters[this.currentLevel];
  };

  GameState.prototype.getCurrentChar = function () {
    return this.getCurrentGroup().chars[this.currentCharIndex];
  };

  GameState.prototype.advance = function () {
    var group = this.getCurrentGroup();

    if (this.currentCharIndex + 1 < group.chars.length) {
      this.currentCharIndex++;
      this._save();
      return 'next_char';
    }

    if (this.currentLevel + 1 < this.characters.length) {
      this.currentLevel++;
      this.currentCharIndex = 0;
      this._save();
      return 'next_level';
    }

    this.currentLevel = 0;
    this.currentCharIndex = 0;
    this._save();
    return 'all_done';
  };

  GameState.prototype._save = function () {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        level: this.currentLevel,
        charIndex: this.currentCharIndex
      }));
    } catch (e) { /* localStorage may be unavailable */ }
  };

  GameState.prototype._load = function () {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      var data = JSON.parse(saved);
      if (data.level < this.characters.length) {
        this.currentLevel = data.level;
        var group = this.characters[this.currentLevel];
        if (data.charIndex < group.chars.length) {
          this.currentCharIndex = data.charIndex;
        }
      }
    } catch (e) { /* ignore */ }
  };

  return GameState;
})();
