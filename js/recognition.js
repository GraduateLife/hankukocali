/** Recognition module - pixel comparison engine with calibration support */
window.CharacterRecognizer = (function () {
  'use strict';

  var GRID_SIZE = 32;
  var INK_THRESHOLD = 180;

  var TIERS = {
    excellent: { min: 0.70, tier: 'success', message: '太棒了！ Perfect!' },
    good:      { min: 0.55, tier: 'good',    message: '不错！ Good!' },
    almost:    { min: 0.40, tier: 'warning',  message: '差一点，再试试！' },
    fail:      { min: 0,    tier: 'danger',   message: '再练习一下' }
  };

  var CALIBRATION_SCALES = [0.75, 0.85, 0.95, 1.05, 1.15, 1.25];
  var CALIBRATION_OFFSETS = [-4, -2, 0, 2, 4];

  function CharacterRecognizer() {
    this._offscreen = document.createElement('canvas');
    this._offCtx = this._offscreen.getContext('2d');
  }

  // --- Public API ---

  CharacterRecognizer.prototype.compare = function (drawingCanvas, targetChar) {
    var grids = this._extractGrids(drawingCanvas, targetChar);
    if (!grids) return this._classify(0);
    var score = this._computeSimilarity(grids.user, grids.ref);
    return this._classify(score);
  };

  CharacterRecognizer.prototype.calibratedCompare = function (drawingCanvas, targetChar) {
    var grids = this._extractGrids(drawingCanvas, targetChar);
    if (!grids) return this._classify(0);

    var bestScore = this._computeSimilarity(grids.user, grids.ref);

    for (var si = 0; si < CALIBRATION_SCALES.length; si++) {
      for (var dx = 0; dx < CALIBRATION_OFFSETS.length; dx++) {
        for (var dy = 0; dy < CALIBRATION_OFFSETS.length; dy++) {
          var transformed = this._transformGrid(
            grids.user, CALIBRATION_SCALES[si],
            CALIBRATION_OFFSETS[dx], CALIBRATION_OFFSETS[dy]
          );
          var s = this._computeSimilarity(transformed, grids.ref);
          if (s > bestScore) bestScore = s;
        }
      }
    }

    return this._classify(bestScore);
  };

  // --- Private: grid extraction ---

  CharacterRecognizer.prototype._extractGrids = function (drawingCanvas, targetChar) {
    var dims = drawingCanvas.getDimensions();
    var dpr = window.devicePixelRatio || 1;
    var pw = Math.round(dims.width * dpr);
    var ph = Math.round(dims.height * dpr);

    var userCtx = drawingCanvas.getCanvasElement().getContext('2d');
    var userImageData = userCtx.getImageData(0, 0, pw, ph);

    var refImageData = this._renderReference(targetChar, pw, ph);

    var userGrid = this._imageToGrid(userImageData, pw, ph);
    var refGrid = this._imageToGrid(refImageData, pw, ph);

    if (!userGrid || !refGrid) return null;
    return { user: userGrid, ref: refGrid };
  };

  CharacterRecognizer.prototype._renderReference = function (char, pw, ph) {
    this._offscreen.width = pw;
    this._offscreen.height = ph;
    this._offCtx.fillStyle = '#ffffff';
    this._offCtx.fillRect(0, 0, pw, ph);

    var fontSize = Math.min(pw, ph) * 0.7;
    this._offCtx.font = '700 ' + fontSize + 'px "Noto Sans KR", sans-serif';
    this._offCtx.fillStyle = '#111111';
    this._offCtx.textAlign = 'center';
    this._offCtx.textBaseline = 'middle';
    this._offCtx.fillText(char, pw / 2, ph / 2);

    return this._offCtx.getImageData(0, 0, pw, ph);
  };

  // --- Private: image processing ---

  CharacterRecognizer.prototype._imageToGrid = function (imageData, w, h) {
    var data = imageData.data;
    var minX = w, minY = h, maxX = 0, maxY = 0;
    var gray = new Uint8Array(w * h);

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var idx = (y * w + x) * 4;
        var g = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        gray[y * w + x] = g;
        if (g < INK_THRESHOLD) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) return null;

    var bbox = this._squareBBox(minX, minY, maxX, maxY, w, h);
    return this._downsample(gray, w, bbox);
  };

  CharacterRecognizer.prototype._squareBBox = function (minX, minY, maxX, maxY, w, h) {
    var pad = Math.max(2, Math.round(Math.max(maxX - minX, maxY - minY) * 0.05));
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad);
    maxY = Math.min(h - 1, maxY + pad);

    var bw = maxX - minX + 1;
    var bh = maxY - minY + 1;
    var side = Math.max(bw, bh);
    var cx = minX + bw / 2;
    var cy = minY + bh / 2;

    return {
      x: Math.max(0, Math.round(cx - side / 2)),
      y: Math.max(0, Math.round(cy - side / 2)),
      w: Math.min(w, side),
      h: Math.min(h, side)
    };
  };

  CharacterRecognizer.prototype._downsample = function (gray, imgWidth, bbox) {
    var grid = new Uint8Array(GRID_SIZE * GRID_SIZE);
    for (var gy = 0; gy < GRID_SIZE; gy++) {
      for (var gx = 0; gx < GRID_SIZE; gx++) {
        var srcX = Math.min(Math.round(bbox.x + (gx / GRID_SIZE) * bbox.w), imgWidth - 1);
        var srcY = Math.round(bbox.y + (gy / GRID_SIZE) * bbox.h);
        grid[gy * GRID_SIZE + gx] = gray[srcY * imgWidth + srcX] < INK_THRESHOLD ? 1 : 0;
      }
    }
    return grid;
  };

  // --- Private: comparison ---

  CharacterRecognizer.prototype._computeSimilarity = function (grid1, grid2) {
    var total = GRID_SIZE * GRID_SIZE;
    var intersection = 0;
    var union = 0;
    var agreement = 0;

    for (var i = 0; i < total; i++) {
      var a = grid1[i];
      var b = grid2[i];
      if (a && b) intersection++;
      if (a || b) union++;
      if (a === b) agreement++;
    }

    if (union === 0) return 0;
    var iou = intersection / union;
    var agreementRatio = agreement / total;
    return iou * 0.6 + agreementRatio * 0.4;
  };

  CharacterRecognizer.prototype._transformGrid = function (grid, scale, offsetX, offsetY) {
    var G = GRID_SIZE;
    var result = new Uint8Array(G * G);
    var center = G / 2;

    for (var gy = 0; gy < G; gy++) {
      for (var gx = 0; gx < G; gx++) {
        var srcX = Math.round((gx - center - offsetX) / scale + center);
        var srcY = Math.round((gy - center - offsetY) / scale + center);
        if (srcX >= 0 && srcX < G && srcY >= 0 && srcY < G) {
          result[gy * G + gx] = grid[srcY * G + srcX];
        }
      }
    }
    return result;
  };

  CharacterRecognizer.prototype._classify = function (score) {
    if (score >= TIERS.excellent.min) return { score: score, tier: TIERS.excellent.tier, message: TIERS.excellent.message };
    if (score >= TIERS.good.min) return { score: score, tier: TIERS.good.tier, message: TIERS.good.message };
    if (score >= TIERS.almost.min) return { score: score, tier: TIERS.almost.tier, message: TIERS.almost.message };
    return { score: score, tier: TIERS.fail.tier, message: TIERS.fail.message };
  };

  return CharacterRecognizer;
})();
