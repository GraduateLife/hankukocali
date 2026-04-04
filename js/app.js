window.App = (function () {
  'use strict';

  var STORAGE_KEY = 'hankukocali_progress';

  function App() {
    this.canvas = null;
    this.recognizer = null;
    this.notification = null;
    this.currentLevel = 0;
    this.currentCharIndex = 0;
    this.guideOn = true;
  }

  App.prototype.init = function () {
    var self = this;

    // Wait for Korean font to load
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        self._setup();
      });
    } else {
      self._setup();
    }
  };

  App.prototype._setup = function () {
    var self = this;

    this.canvas = new window.DrawingCanvas(
      document.getElementById('canvas-container'),
      document.getElementById('drawing-canvas')
    );

    this.recognizer = new window.CharacterRecognizer();
    this.notification = new window.Notification_(document.getElementById('notification'));

    // Load saved progress
    this._loadProgress();

    // Bind buttons
    document.getElementById('btn-clear').addEventListener('click', function () {
      self.canvas.clear();
    });

    document.getElementById('btn-submit').addEventListener('click', function () {
      self._onSubmit();
    });

    var strokeSlider = document.getElementById('stroke-slider');
    var strokeValue = document.getElementById('stroke-value');
    strokeSlider.addEventListener('input', function () {
      var w = parseInt(this.value, 10);
      strokeValue.textContent = w;
      self.canvas.setStrokeWidth(w);
    });

    document.getElementById('guide-toggle').addEventListener('click', function () {
      self.guideOn = !self.guideOn;
      self.canvas.setGuide(self.guideOn);
      this.classList.toggle('off', !self.guideOn);
    });

    // Load first character
    this._loadCharacter();
  };

  App.prototype._getCurrentGroup = function () {
    return window.CHARACTERS[this.currentLevel];
  };

  App.prototype._getCurrentChar = function () {
    var group = this._getCurrentGroup();
    return group.chars[this.currentCharIndex];
  };

  App.prototype._loadCharacter = function () {
    var group = this._getCurrentGroup();
    var char = this._getCurrentChar();

    // Update header
    document.getElementById('level-label').textContent =
      'Level ' + group.level + ': ' + group.label;
    document.getElementById('progress').textContent =
      (this.currentCharIndex + 1) + ' / ' + group.chars.length;

    // Update romanization
    document.getElementById('roman-text').textContent = char.roman;

    // Set canvas character (also clears)
    this.canvas.setCharacter(char.korean);
  };

  App.prototype._onSubmit = function () {
    var self = this;

    if (this.canvas.isEmpty()) {
      this.notification.show('请先写一个字！', 'warning', 1500);
      return;
    }

    var char = this._getCurrentChar();
    var result = this.recognizer.compare(this.canvas, char.korean);

    var display = char.korean + '  ' + result.message +
      '  (' + Math.round(result.score * 100) + '%)';

    this.notification.show(display, result.tier, 2000);

    // Correct: auto advance after delay
    var isCorrect = result.tier === 'success' || result.tier === 'good';

    if (isCorrect) {
      setTimeout(function () {
        self._advance();
      }, 1800);
    } else {
      // Wrong: clear canvas after notification fades, let user retry
      setTimeout(function () {
        self.canvas.clear();
      }, 2000);
    }
  };

  App.prototype._advance = function () {
    var group = this._getCurrentGroup();

    if (this.currentCharIndex + 1 < group.chars.length) {
      // Next character in same level
      this.currentCharIndex++;
    } else if (this.currentLevel + 1 < window.CHARACTERS.length) {
      // Next level
      this.currentLevel++;
      this.currentCharIndex = 0;
      this.notification.show(
        'Level ' + window.CHARACTERS[this.currentLevel].level + ' 开始！',
        'good', 2000
      );
    } else {
      // All done!
      this.currentLevel = 0;
      this.currentCharIndex = 0;
      this.notification.show('全部完成！从头开始 🎉', 'success', 3000);
    }

    this._saveProgress();
    this._loadCharacter();
  };

  App.prototype._saveProgress = function () {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        level: this.currentLevel,
        charIndex: this.currentCharIndex
      }));
    } catch (e) { /* localStorage may be unavailable */ }
  };

  App.prototype._loadProgress = function () {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var data = JSON.parse(saved);
        if (data.level < window.CHARACTERS.length) {
          this.currentLevel = data.level;
          var group = window.CHARACTERS[this.currentLevel];
          if (data.charIndex < group.chars.length) {
            this.currentCharIndex = data.charIndex;
          }
        }
      }
    } catch (e) { /* ignore */ }
  };

  return App;
})();

// Start the app
document.addEventListener('DOMContentLoaded', function () {
  new window.App().init();
});
