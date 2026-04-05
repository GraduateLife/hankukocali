/** Drawing canvas module - handles pointer input, rendering, ghost guide */
window.DrawingCanvas = (function () {
  'use strict';

  var DEFAULT_STROKE_WIDTH = 24;

  function DrawingCanvas(containerEl, canvasEl) {
    this.container = containerEl;
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.strokeWidth = DEFAULT_STROKE_WIDTH;
    this.showGuide = true;
    this.currentChar = '';

    this._isDrawing = false;
    this._strokes = [];

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);

    this._bindEvents();
    this._setupResize();
    this._resize();
  }

  // --- Public API ---

  DrawingCanvas.prototype.clear = function () {
    this._strokes = [];
    this._fullClear();
    this._drawGuideIfNeeded();
  };

  DrawingCanvas.prototype.setCharacter = function (char) {
    this.currentChar = char;
    this.clear();
  };

  DrawingCanvas.prototype.setStrokeWidth = function (w) {
    this.strokeWidth = w;
    this._applyStrokeStyle();
  };

  DrawingCanvas.prototype.setGuide = function (on) {
    this.showGuide = on;
    this._redraw();
  };

  DrawingCanvas.prototype.isEmpty = function () {
    return this._strokes.length === 0;
  };

  DrawingCanvas.prototype.getCanvasElement = function () {
    return this.canvas;
  };

  DrawingCanvas.prototype.getDimensions = function () {
    var rect = this.container.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  };

  DrawingCanvas.prototype.toThumbnail = function (size) {
    size = size || 80;
    var tmp = document.createElement('canvas');
    tmp.width = size;
    tmp.height = size;
    var tmpCtx = tmp.getContext('2d');
    tmpCtx.drawImage(this.canvas, 0, 0, size, size);
    return tmp.toDataURL('image/png');
  };

  // --- Private: setup ---

  DrawingCanvas.prototype._bindEvents = function () {
    this.canvas.addEventListener('pointerdown', this._onPointerDown);
    this.canvas.addEventListener('pointermove', this._onPointerMove);
    this.canvas.addEventListener('pointerup', this._onPointerUp);
    this.canvas.addEventListener('pointercancel', this._onPointerUp);
    this.canvas.addEventListener('pointerleave', this._onPointerUp);

    this.canvas.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
    this.canvas.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  };

  DrawingCanvas.prototype._setupResize = function () {
    this._resizeObserver = new ResizeObserver(this._resize.bind(this));
    this._resizeObserver.observe(this.container);
  };

  // --- Private: rendering ---

  DrawingCanvas.prototype._resize = function () {
    var rect = this.container.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._applyStrokeStyle();
    this._redraw();
  };

  DrawingCanvas.prototype._applyStrokeStyle = function () {
    this.ctx.lineWidth = this.strokeWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#111111';
  };

  DrawingCanvas.prototype._fullClear = function () {
    var dpr = window.devicePixelRatio || 1;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  };

  DrawingCanvas.prototype._drawGuideIfNeeded = function () {
    if (!this.showGuide || !this.currentChar) return;
    var rect = this.container.getBoundingClientRect();
    var fontSize = Math.min(rect.width, rect.height) * 0.7;
    this.ctx.save();
    this.ctx.font = '700 ' + fontSize + 'px "Noto Sans KR", sans-serif';
    this.ctx.fillStyle = 'rgba(200, 200, 200, 0.35)';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.currentChar, rect.width / 2, rect.height / 2);
    this.ctx.restore();
  };

  DrawingCanvas.prototype._replayStrokes = function () {
    if (this._strokes.length === 0) return;
    this._applyStrokeStyle();
    for (var i = 0; i < this._strokes.length; i++) {
      var stroke = this._strokes[i];
      if (stroke.length < 1) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(stroke[0].x, stroke[0].y);
      for (var j = 1; j < stroke.length; j++) {
        this.ctx.lineTo(stroke[j].x, stroke[j].y);
      }
      this.ctx.stroke();
    }
    this.ctx.beginPath();
  };

  DrawingCanvas.prototype._redraw = function () {
    this._fullClear();
    this._drawGuideIfNeeded();
    this._replayStrokes();
  };

  // --- Private: pointer handling ---

  DrawingCanvas.prototype._getPos = function (e) {
    var rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  DrawingCanvas.prototype._onPointerDown = function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    this.canvas.setPointerCapture(e.pointerId);
    this._isDrawing = true;
    var pos = this._getPos(e);
    this._strokes.push([pos]);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  };

  DrawingCanvas.prototype._onPointerMove = function (e) {
    if (!this._isDrawing) return;
    var pos = this._getPos(e);
    var currentStroke = this._strokes[this._strokes.length - 1];
    if (currentStroke) currentStroke.push(pos);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  };

  DrawingCanvas.prototype._onPointerUp = function () {
    if (!this._isDrawing) return;
    this._isDrawing = false;
    this.ctx.beginPath();
  };

  return DrawingCanvas;
})();
