window.DrawingCanvas = (function () {
  'use strict';

  function DrawingCanvas(containerEl, canvasEl) {
    this.container = containerEl;
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.isDrawing = false;
    this.showGuide = true;
    this.currentChar = '';
    this.strokeWidth = 20;
    this._resizeObserver = null;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);

    this._init();
  }

  DrawingCanvas.prototype._init = function () {
    this.canvas.addEventListener('pointerdown', this._onPointerDown);
    this.canvas.addEventListener('pointermove', this._onPointerMove);
    this.canvas.addEventListener('pointerup', this._onPointerUp);
    this.canvas.addEventListener('pointercancel', this._onPointerUp);
    this.canvas.addEventListener('pointerleave', this._onPointerUp);

    // Prevent default touch behavior
    this.canvas.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
    this.canvas.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });

    this._resizeObserver = new ResizeObserver(this._resize.bind(this));
    this._resizeObserver.observe(this.container);

    this._resize();
  };

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
    this.isDrawing = true;
    var pos = this._getPos(e);

    if (!this._strokes) this._strokes = [];
    this._strokes.push([pos]);

    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  };

  DrawingCanvas.prototype._onPointerMove = function (e) {
    if (!this.isDrawing) return;
    var pos = this._getPos(e);

    var currentStroke = this._strokes[this._strokes.length - 1];
    if (currentStroke) currentStroke.push(pos);

    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  };

  DrawingCanvas.prototype._onPointerUp = function () {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.ctx.beginPath();
  };

  DrawingCanvas.prototype._redraw = function () {
    var rect = this.container.getBoundingClientRect();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, rect.width, rect.height);

    if (this.showGuide && this.currentChar) {
      this._drawGhost(this.currentChar, rect.width, rect.height);
    }

    // Replay strokes
    if (this._strokes && this._strokes.length > 0) {
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
    }
  };

  DrawingCanvas.prototype._drawGhost = function (char, w, h) {
    var fontSize = Math.min(w, h) * 0.7;
    this.ctx.save();
    this.ctx.font = '700 ' + fontSize + 'px "Noto Sans KR", sans-serif';
    this.ctx.fillStyle = 'rgba(200, 200, 200, 0.35)';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(char, w / 2, h / 2);
    this.ctx.restore();
  };

  DrawingCanvas.prototype.clear = function () {
    this._strokes = [];
    this._redraw();
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
    return !this._strokes || this._strokes.length === 0;
  };

  DrawingCanvas.prototype.getCanvasElement = function () {
    return this.canvas;
  };

  DrawingCanvas.prototype.getDimensions = function () {
    var rect = this.container.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  };

  return DrawingCanvas;
})();
