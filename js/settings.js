/** Settings module - edit romanizations, add custom level */
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
      html += '<div class="settings-level-title">Level ' + group.level + ': ' + this._esc(group.label) + '</div>';
      html += '<div class="settings-grid">';

      for (var ci = 0; ci < group.chars.length; ci++) {
        var ch = group.chars[ci];
        html += '<div class="settings-cell">';
        html += '<span class="settings-korean">' + this._esc(ch.korean) + '</span>';
        html += '<input class="settings-roman-input" type="text"'
          + ' data-level="' + li + '" data-char="' + ci + '"'
          + ' value="' + this._escAttr(ch.roman) + '">';
        html += '</div>';
      }

      html += '</div></div>';
    }

    // Custom level add section
    html += '<div class="settings-section settings-custom">';
    html += '<div class="settings-level-title">Add Custom Characters</div>';
    html += '<div class="settings-add-row">';
    html += '<input class="settings-new-korean" type="text" id="custom-korean" placeholder="韩文" maxlength="2">';
    html += '<input class="settings-new-roman" type="text" id="custom-roman" placeholder="发音">';
    html += '<button class="settings-add-btn" id="custom-add-btn">+</button>';
    html += '</div>';

    // Show existing custom chars
    var customLevel = this._charMgr.getCustomLevel();
    if (customLevel && customLevel.chars.length > 0) {
      html += '<div class="settings-grid" style="margin-top:8px">';
      for (var k = 0; k < customLevel.chars.length; k++) {
        var cc = customLevel.chars[k];
        html += '<div class="settings-cell">';
        html += '<span class="settings-korean">' + this._esc(cc.korean) + '</span>';
        html += '<span class="settings-roman-label">' + this._esc(cc.roman) + '</span>';
        html += '</div>';
      }
      html += '</div>';
    }

    html += '</div>';

    this._container.innerHTML = html;
    this._bindEvents();
  };

  Settings.prototype._bindEvents = function () {
    var self = this;

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

    var addBtn = document.getElementById('custom-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var koreanInput = document.getElementById('custom-korean');
        var romanInput = document.getElementById('custom-roman');
        var korean = koreanInput.value.trim();
        var roman = romanInput.value.trim();
        if (!korean || !roman) return;

        self._charMgr.addCustomChar(korean, roman);
        self._onCharsChanged();
        self.render();
      });
    }
  };

  Settings.prototype._esc = function (str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  Settings.prototype._escAttr = function (str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  };

  return Settings;
})();
