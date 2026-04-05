/** Settings module - edit romanizations, add new characters */
window.Settings = (function () {
  'use strict';

  function Settings(container, characterManager, onCharsChanged) {
    this._container = container;
    this._charMgr = characterManager;
    this._onCharsChanged = onCharsChanged;
  }

  Settings.prototype.render = function () {
    var html = '';
    var characters = this._charMgr.characters;

    for (var li = 0; li < characters.length; li++) {
      var group = characters[li];
      html += '<div class="settings-section">';
      html += '<div class="settings-level-title">Level ' + group.level + ': ' + this._escHtml(group.label) + '</div>';

      for (var ci = 0; ci < group.chars.length; ci++) {
        var ch = group.chars[ci];
        html += '<div class="settings-char-row">';
        html += '<span class="settings-korean">' + this._escHtml(ch.korean) + '</span>';
        html += '<input class="settings-roman-input" type="text"'
          + ' data-level="' + li + '" data-char="' + ci + '"'
          + ' value="' + this._escAttr(ch.roman) + '"'
          + ' placeholder="romanization">';
        html += '</div>';
      }

      // Add new character row
      html += '<div class="settings-add-row">';
      html += '<input class="settings-new-korean" type="text"'
        + ' data-level="' + li + '"'
        + ' placeholder="韩文字" maxlength="2">';
      html += '<input class="settings-new-roman" type="text"'
        + ' data-level="' + li + '"'
        + ' placeholder="romanization">';
      html += '<button class="settings-add-btn" data-level="' + li + '">+</button>';
      html += '</div>';

      html += '</div>';
    }

    this._container.innerHTML = html;
    this._bindEvents();
  };

  Settings.prototype._bindEvents = function () {
    var self = this;

    // Romanization edits
    var inputs = this._container.querySelectorAll('.settings-roman-input');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener('change', function () {
        var li = parseInt(this.dataset.level, 10);
        var ci = parseInt(this.dataset.char, 10);
        var val = this.value.trim();
        if (val) {
          self._charMgr.updateRoman(li, ci, val);
          self._onCharsChanged();
        }
      });
    }

    // Add new character
    var addBtns = this._container.querySelectorAll('.settings-add-btn');
    for (var j = 0; j < addBtns.length; j++) {
      addBtns[j].addEventListener('click', function () {
        var li = parseInt(this.dataset.level, 10);
        var row = this.parentElement;
        var koreanInput = row.querySelector('.settings-new-korean');
        var romanInput = row.querySelector('.settings-new-roman');
        var korean = koreanInput.value.trim();
        var roman = romanInput.value.trim();

        if (!korean || !roman) return;

        self._charMgr.addChar(li, korean, roman);
        self._onCharsChanged();
        self.render();
      });
    }
  };

  Settings.prototype._escHtml = function (str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  Settings.prototype._escAttr = function (str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  };

  return Settings;
})();
