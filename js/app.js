/** App controller - coordinates state, canvas, recognition, and UI */
window.App = (function () {
  'use strict';

  // --- DOM references (collected once) ---
  var DOM = {};

  function cacheDom() {
    DOM.levelLabel = document.getElementById('level-label');
    DOM.progress = document.getElementById('progress');
    DOM.romanText = document.getElementById('roman-text');
    DOM.btnClear = document.getElementById('btn-clear');
    DOM.btnSubmit = document.getElementById('btn-submit');
    DOM.btnCalibrate = document.getElementById('btn-calibrate');
    DOM.guideToggle = document.getElementById('guide-toggle');
    DOM.strokeSlider = document.getElementById('stroke-slider');
    DOM.strokeValue = document.getElementById('stroke-value');
    DOM.canvasContainer = document.getElementById('canvas-container');
    DOM.drawingCanvas = document.getElementById('drawing-canvas');
    DOM.notification = document.getElementById('notification');
  }

  // --- App constructor ---

  function App() {
    this.state = null;
    this.canvas = null;
    this.recognizer = null;
    this.notification = null;
    this._pendingTimer = null;
  }

  App.prototype.init = function () {
    var self = this;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { self._boot(); });
    } else {
      this._boot();
    }
  };

  App.prototype._boot = function () {
    cacheDom();

    this.state = new window.GameState(window.CHARACTERS);
    this.canvas = new window.DrawingCanvas(DOM.canvasContainer, DOM.drawingCanvas);
    this.recognizer = new window.CharacterRecognizer();
    this.notification = new window.Notification_(DOM.notification);

    this._bindEvents();
    this._renderCurrentChar();
  };

  // --- Event binding (pure delegation, no logic) ---

  App.prototype._bindEvents = function () {
    var self = this;

    DOM.btnClear.addEventListener('click', function () {
      self._handleClear();
    });

    DOM.btnSubmit.addEventListener('click', function () {
      self._handleSubmit();
    });

    DOM.btnCalibrate.addEventListener('click', function () {
      self._handleCalibrate();
    });

    DOM.strokeSlider.addEventListener('input', function () {
      self._handleStrokeChange(parseInt(this.value, 10));
    });

    DOM.guideToggle.addEventListener('click', function () {
      self._handleGuideToggle();
    });
  };

  // --- Event handlers ---

  App.prototype._handleClear = function () {
    this._cancelPending();
    this.canvas.clear();
    this._setCalibrateVisible(false);
  };

  App.prototype._handleSubmit = function () {
    if (this.canvas.isEmpty()) {
      this.notification.show('请先写一个字！', 'warning', 1500);
      return;
    }

    var char = this.state.getCurrentChar();
    var result = this.recognizer.compare(this.canvas, char.korean);

    this._showResult(char.korean, result);
    var isCorrect = result.tier === 'success' || result.tier === 'good';

    this._setCalibrateVisible(!isCorrect);

    if (isCorrect) {
      this._scheduleAdvance(1800);
    }
  };

  App.prototype._handleCalibrate = function () {
    if (this.canvas.isEmpty()) return;

    var char = this.state.getCurrentChar();
    var result = this.recognizer.calibratedCompare(this.canvas, char.korean);

    this._showResult(char.korean, result, '校准后: ');
    var isCorrect = result.tier === 'success' || result.tier === 'good';

    if (isCorrect) {
      this._setCalibrateVisible(false);
      this._scheduleAdvance(2200);
    }
  };

  App.prototype._handleStrokeChange = function (width) {
    DOM.strokeValue.textContent = width;
    this.canvas.setStrokeWidth(width);
  };

  App.prototype._handleGuideToggle = function () {
    var isOn = DOM.guideToggle.classList.toggle('off');
    this.canvas.setGuide(!isOn);
  };

  // --- Game flow ---

  App.prototype._scheduleAdvance = function (delay) {
    var self = this;
    this._cancelPending();
    this._pendingTimer = setTimeout(function () {
      self._pendingTimer = null;
      self._doAdvance();
    }, delay);
  };

  App.prototype._cancelPending = function () {
    if (this._pendingTimer) {
      clearTimeout(this._pendingTimer);
      this._pendingTimer = null;
    }
  };

  App.prototype._doAdvance = function () {
    var result = this.state.advance();

    if (result === 'next_level') {
      var group = this.state.getCurrentGroup();
      this.notification.show('Level ' + group.level + ' 开始！', 'good', 2000);
    } else if (result === 'all_done') {
      this.notification.show('全部完成！从头开始', 'success', 3000);
    }

    this._renderCurrentChar();
  };

  // --- UI updates ---

  App.prototype._renderCurrentChar = function () {
    var group = this.state.getCurrentGroup();
    var char = this.state.getCurrentChar();

    DOM.levelLabel.textContent = 'Level ' + group.level + ': ' + group.label;
    DOM.progress.textContent = (this.state.currentCharIndex + 1) + ' / ' + group.chars.length;
    DOM.romanText.textContent = char.roman;

    this.canvas.setCharacter(char.korean);
    this._setCalibrateVisible(false);
  };

  App.prototype._showResult = function (korean, result, prefix) {
    var display = korean + '  ' + (prefix || '') + result.message +
      '  (' + Math.round(result.score * 100) + '%)';
    this.notification.show(display, result.tier, 2000);
  };

  App.prototype._setCalibrateVisible = function (visible) {
    DOM.btnCalibrate.classList.toggle('hidden', !visible);
  };

  return App;
})();

document.addEventListener('DOMContentLoaded', function () {
  new window.App().init();
});
