window.CharacterRecognizer = (function () {
  'use strict';

  var GRID_SIZE = 32;
  var INK_THRESHOLD = 180;
  var SCORE_EXCELLENT = 0.80;
  var SCORE_GOOD = 0.65;
  var SCORE_ALMOST = 0.50;

  function CharacterRecognizer() {
    this._offscreen = document.createElement('canvas');
    this._offCtx = this._offscreen.getContext('2d');
  }

  CharacterRecognizer.prototype.compare = function (drawingCanvas, targetChar) {
    var dims = drawingCanvas.getDimensions();
    var w = dims.width;
    var h = dims.height;
    var dpr = window.devicePixelRatio || 1;
    var pw = Math.round(w * dpr);
    var ph = Math.round(h * dpr);

    // Get user drawing pixels
    var userCtx = drawingCanvas.getCanvasElement().getContext('2d');
    var userImageData = userCtx.getImageData(0, 0, pw, ph);

    // Render reference character
    this._offscreen.width = pw;
    this._offscreen.height = ph;
    this._offCtx.fillStyle = '#ffffff';
    this._offCtx.fillRect(0, 0, pw, ph);
    var fontSize = Math.min(pw, ph) * 0.7;
    this._offCtx.font = '700 ' + fontSize + 'px "Noto Sans KR", sans-serif';
    this._offCtx.fillStyle = '#111111';
    this._offCtx.textAlign = 'center';
    this._offCtx.textBaseline = 'middle';
    this._offCtx.fillText(targetChar, pw / 2, ph / 2);
    var refImageData = this._offCtx.getImageData(0, 0, pw, ph);

    // Normalize both to bounding boxes then downscale to grid
    var userGrid = this._toGrid(userImageData, pw, ph);
    var refGrid = this._toGrid(refImageData, pw, ph);

    if (!userGrid || !refGrid) {
      return { score: 0, tier: 'danger', message: '再练习一下' };
    }

    var score = this._computeSimilarity(userGrid, refGrid);
    return this._classify(score);
  };

  CharacterRecognizer.prototype._toGrid = function (imageData, w, h) {
    var data = imageData.data;
    // Convert to grayscale and find bounding box of ink
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

    // No ink found
    if (maxX < minX || maxY < minY) return null;

    // Add small padding
    var pad = Math.max(2, Math.round(Math.max(maxX - minX, maxY - minY) * 0.05));
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad);
    maxY = Math.min(h - 1, maxY + pad);

    // Make bounding box square (centered)
    var bw = maxX - minX + 1;
    var bh = maxY - minY + 1;
    var side = Math.max(bw, bh);
    var cx = minX + bw / 2;
    var cy = minY + bh / 2;
    minX = Math.max(0, Math.round(cx - side / 2));
    minY = Math.max(0, Math.round(cy - side / 2));
    maxX = Math.min(w - 1, minX + side - 1);
    maxY = Math.min(h - 1, minY + side - 1);
    bw = maxX - minX + 1;
    bh = maxY - minY + 1;

    // Downscale to GRID_SIZE x GRID_SIZE
    var grid = new Uint8Array(GRID_SIZE * GRID_SIZE);
    for (var gy = 0; gy < GRID_SIZE; gy++) {
      for (var gx = 0; gx < GRID_SIZE; gx++) {
        var srcX = Math.round(minX + (gx / GRID_SIZE) * bw);
        var srcY = Math.round(minY + (gy / GRID_SIZE) * bh);
        srcX = Math.min(srcX, w - 1);
        srcY = Math.min(srcY, h - 1);
        grid[gy * GRID_SIZE + gx] = gray[srcY * w + srcX] < INK_THRESHOLD ? 1 : 0;
      }
    }

    return grid;
  };

  CharacterRecognizer.prototype._computeSimilarity = function (grid1, grid2) {
    var total = GRID_SIZE * GRID_SIZE;
    var inkPixels1 = 0;
    var inkPixels2 = 0;
    var intersection = 0;
    var union = 0;

    for (var i = 0; i < total; i++) {
      var a = grid1[i];
      var b = grid2[i];
      if (a) inkPixels1++;
      if (b) inkPixels2++;
      if (a && b) intersection++;
      if (a || b) union++;
    }

    if (union === 0) return 0;

    // Use IoU (Intersection over Union) as the primary metric
    var iou = intersection / union;

    // Also consider pixel agreement (both ink and both background)
    var agreement = 0;
    for (var j = 0; j < total; j++) {
      if (grid1[j] === grid2[j]) agreement++;
    }
    var agreementRatio = agreement / total;

    // Weighted combination: IoU matters more for shape matching
    return iou * 0.6 + agreementRatio * 0.4;
  };

  CharacterRecognizer.prototype._classify = function (score) {
    if (score >= SCORE_EXCELLENT) {
      return { score: score, tier: 'success', message: '太棒了！ Perfect!' };
    } else if (score >= SCORE_GOOD) {
      return { score: score, tier: 'good', message: '不错！ Good!' };
    } else if (score >= SCORE_ALMOST) {
      return { score: score, tier: 'warning', message: '差一点，再试试！' };
    } else {
      return { score: score, tier: 'danger', message: '再练习一下' };
    }
  };

  return CharacterRecognizer;
})();
