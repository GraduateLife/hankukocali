/** Storage module - persists gallery thumbnails and character customizations */
window.Storage = (function () {
  'use strict';

  var GALLERY_PREFIX = 'hankukocali_gallery_';
  var CUSTOM_CHARS_KEY = 'hankukocali_custom_chars';

  function Storage() {}

  // --- Gallery ---

  Storage.prototype.saveDrawing = function (levelIndex, charIndex, dataUrl) {
    try {
      var key = GALLERY_PREFIX + levelIndex + '_' + charIndex;
      localStorage.setItem(key, dataUrl);
    } catch (e) { /* quota exceeded or unavailable */ }
  };

  Storage.prototype.getDrawing = function (levelIndex, charIndex) {
    try {
      return localStorage.getItem(GALLERY_PREFIX + levelIndex + '_' + charIndex);
    } catch (e) { return null; }
  };

  Storage.prototype.getAllDrawings = function () {
    var drawings = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf(GALLERY_PREFIX) === 0) {
          var rest = key.substring(GALLERY_PREFIX.length);
          drawings[rest] = localStorage.getItem(key);
        }
      }
    } catch (e) { /* ignore */ }
    return drawings;
  };

  // --- Character Customizations ---

  Storage.prototype.saveCustomChars = function (customData) {
    try {
      localStorage.setItem(CUSTOM_CHARS_KEY, JSON.stringify(customData));
    } catch (e) { /* ignore */ }
  };

  Storage.prototype.loadCustomChars = function () {
    try {
      var raw = localStorage.getItem(CUSTOM_CHARS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  };

  return Storage;
})();
