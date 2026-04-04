window.Notification_ = (function () {
  'use strict';

  function Notification_(el) {
    this.el = el;
    this._timer = null;
  }

  Notification_.prototype.show = function (message, tier, duration) {
    var self = this;
    duration = duration || 2000;

    clearTimeout(this._timer);

    this.el.textContent = message;
    this.el.className = tier;

    // Force reflow for animation restart
    void this.el.offsetWidth;
    this.el.classList.add('show');

    this._timer = setTimeout(function () {
      self.hide();
    }, duration);
  };

  Notification_.prototype.hide = function () {
    this.el.classList.remove('show');
    clearTimeout(this._timer);
  };

  return Notification_;
})();
