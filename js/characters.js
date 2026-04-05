/** Character data + manager for customizations (edit roman, add chars) */
window.CharacterManager = (function () {
  'use strict';

  var DEFAULT_CHARACTERS = [
    {
      level: 1,
      label: 'Basic Consonants',
      chars: [
        { korean: 'ㄱ', roman: 'g / k' },
        { korean: 'ㄴ', roman: 'n' },
        { korean: 'ㄷ', roman: 'd / t' },
        { korean: 'ㄹ', roman: 'r / l' },
        { korean: 'ㅁ', roman: 'm' },
        { korean: 'ㅂ', roman: 'b / p' },
        { korean: 'ㅅ', roman: 's' },
        { korean: 'ㅇ', roman: 'ng' },
        { korean: 'ㅈ', roman: 'j' },
        { korean: 'ㅊ', roman: 'ch' },
        { korean: 'ㅋ', roman: 'k' },
        { korean: 'ㅌ', roman: 't' },
        { korean: 'ㅍ', roman: 'p' },
        { korean: 'ㅎ', roman: 'h' }
      ]
    },
    {
      level: 2,
      label: 'Basic Vowels',
      chars: [
        { korean: 'ㅏ', roman: 'a' },
        { korean: 'ㅑ', roman: 'ya' },
        { korean: 'ㅓ', roman: 'eo' },
        { korean: 'ㅕ', roman: 'yeo' },
        { korean: 'ㅗ', roman: 'o' },
        { korean: 'ㅛ', roman: 'yo' },
        { korean: 'ㅜ', roman: 'u' },
        { korean: 'ㅠ', roman: 'yu' },
        { korean: 'ㅡ', roman: 'eu' },
        { korean: 'ㅣ', roman: 'i' }
      ]
    },
    {
      level: 3,
      label: 'Double Consonants',
      chars: [
        { korean: 'ㄲ', roman: 'kk' },
        { korean: 'ㄸ', roman: 'tt' },
        { korean: 'ㅃ', roman: 'pp' },
        { korean: 'ㅆ', roman: 'ss' },
        { korean: 'ㅉ', roman: 'jj' }
      ]
    },
    {
      level: 4,
      label: 'Compound Vowels',
      chars: [
        { korean: 'ㅐ', roman: 'ae' },
        { korean: 'ㅒ', roman: 'yae' },
        { korean: 'ㅔ', roman: 'e' },
        { korean: 'ㅖ', roman: 'ye' },
        { korean: 'ㅘ', roman: 'wa' },
        { korean: 'ㅙ', roman: 'wae' },
        { korean: 'ㅚ', roman: 'oe' },
        { korean: 'ㅝ', roman: 'wo' },
        { korean: 'ㅞ', roman: 'we' },
        { korean: 'ㅟ', roman: 'wi' },
        { korean: 'ㅢ', roman: 'ui' }
      ]
    },
    {
      level: 5,
      label: 'Basic Syllables',
      chars: [
        { korean: '가', roman: 'ga' },
        { korean: '나', roman: 'na' },
        { korean: '다', roman: 'da' },
        { korean: '라', roman: 'ra' },
        { korean: '마', roman: 'ma' },
        { korean: '바', roman: 'ba' },
        { korean: '사', roman: 'sa' },
        { korean: '아', roman: 'a' },
        { korean: '자', roman: 'ja' },
        { korean: '하', roman: 'ha' }
      ]
    }
  ];

  function CharacterManager(storage) {
    this._storage = storage;
    this.characters = this._buildCharacters();
  }

  CharacterManager.prototype._buildCharacters = function () {
    var chars = JSON.parse(JSON.stringify(DEFAULT_CHARACTERS));
    var custom = this._storage.loadCustomChars();
    if (!custom) return chars;

    // Apply roman edits
    if (custom.romanEdits) {
      for (var key in custom.romanEdits) {
        var parts = key.split('_');
        var li = parseInt(parts[0], 10);
        var ci = parseInt(parts[1], 10);
        if (chars[li] && chars[li].chars[ci]) {
          chars[li].chars[ci].roman = custom.romanEdits[key];
        }
      }
    }

    // Append added characters
    if (custom.addedChars) {
      for (var i = 0; i < custom.addedChars.length; i++) {
        var added = custom.addedChars[i];
        var levelIdx = added.levelIndex;
        if (chars[levelIdx]) {
          chars[levelIdx].chars.push({ korean: added.korean, roman: added.roman, custom: true });
        }
      }
    }

    return chars;
  };

  CharacterManager.prototype.reload = function () {
    this.characters = this._buildCharacters();
  };

  CharacterManager.prototype.updateRoman = function (levelIndex, charIndex, newRoman) {
    var custom = this._storage.loadCustomChars() || { romanEdits: {}, addedChars: [] };
    if (!custom.romanEdits) custom.romanEdits = {};
    custom.romanEdits[levelIndex + '_' + charIndex] = newRoman;
    this._storage.saveCustomChars(custom);
    this.characters[levelIndex].chars[charIndex].roman = newRoman;
  };

  CharacterManager.prototype.addChar = function (levelIndex, korean, roman) {
    var custom = this._storage.loadCustomChars() || { romanEdits: {}, addedChars: [] };
    if (!custom.addedChars) custom.addedChars = [];
    custom.addedChars.push({ levelIndex: levelIndex, korean: korean, roman: roman });
    this._storage.saveCustomChars(custom);
    this.characters[levelIndex].chars.push({ korean: korean, roman: roman, custom: true });
  };

  CharacterManager.prototype.getDefaultCharacters = function () {
    return DEFAULT_CHARACTERS;
  };

  return CharacterManager;
})();
