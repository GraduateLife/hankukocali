/** Gallery module - displays past drawings organized by level */
window.Gallery = (function () {
  'use strict';

  function Gallery(container, storage, characterManager, onNavigate) {
    this._container = container;
    this._storage = storage;
    this._charMgr = characterManager;
    this._onNavigate = onNavigate;
  }

  Gallery.prototype.render = function () {
    var html = '';
    var characters = this._charMgr.characters;
    var drawings = this._storage.getAllDrawings();

    for (var li = 0; li < characters.length; li++) {
      var group = characters[li];
      html += '<div class="gallery-section">';
      html += '<div class="gallery-level-title" data-level="' + li + '">';
      html += 'Level ' + group.level + ': ' + this._escHtml(group.label);
      html += '<span class="gallery-restart">restart</span>';
      html += '</div>';
      html += '<div class="gallery-grid">';

      for (var ci = 0; ci < group.chars.length; ci++) {
        var ch = group.chars[ci];
        var drawingKey = li + '_' + ci;
        var thumb = drawings[drawingKey];

        html += '<div class="gallery-card" data-level="' + li + '" data-char="' + ci + '">';
        if (thumb) {
          html += '<img class="gallery-thumb" src="' + thumb + '" alt="' + this._escHtml(ch.korean) + '">';
        } else {
          html += '<div class="gallery-empty">?</div>';
        }
        html += '<div class="gallery-ref">' + this._escHtml(ch.korean) + '</div>';
        html += '</div>';
      }

      html += '</div></div>';
    }

    if (!html) {
      html = '<div class="gallery-empty-msg">No characters practiced yet.</div>';
    }

    this._container.innerHTML = html;
    this._bindEvents();
  };

  Gallery.prototype._bindEvents = function () {
    var self = this;

    var levelTitles = this._container.querySelectorAll('.gallery-level-title');
    for (var i = 0; i < levelTitles.length; i++) {
      levelTitles[i].addEventListener('click', function () {
        var level = parseInt(this.dataset.level, 10);
        self._onNavigate(level, 0);
      });
    }

    var cards = this._container.querySelectorAll('.gallery-card');
    for (var j = 0; j < cards.length; j++) {
      cards[j].addEventListener('click', function () {
        var level = parseInt(this.dataset.level, 10);
        var charIdx = parseInt(this.dataset.char, 10);
        self._onNavigate(level, charIdx);
      });
    }
  };

  Gallery.prototype._escHtml = function (str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  return Gallery;
})();
