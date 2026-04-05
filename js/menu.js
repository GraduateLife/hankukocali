/** Menu module - hamburger menu panel with tab switching */
window.MenuPanel = (function () {
  'use strict';

  function MenuPanel(onTabChange) {
    this._overlay = document.getElementById('menu-overlay');
    this._btnOpen = document.getElementById('menu-btn');
    this._btnClose = document.getElementById('menu-close');
    this._tabs = document.querySelectorAll('.menu-tab');
    this._galleryView = document.getElementById('gallery-view');
    this._settingsView = document.getElementById('settings-view');
    this._activeTab = 'gallery';
    this._onTabChange = onTabChange || function () {};

    this._bindEvents();
  }

  MenuPanel.prototype._bindEvents = function () {
    var self = this;

    this._btnOpen.addEventListener('click', function () {
      self.open();
    });

    this._btnClose.addEventListener('click', function () {
      self.close();
    });

    this._overlay.addEventListener('click', function (e) {
      if (e.target === self._overlay) self.close();
    });

    for (var i = 0; i < this._tabs.length; i++) {
      this._tabs[i].addEventListener('click', function () {
        self._switchTab(this.dataset.tab);
      });
    }
  };

  MenuPanel.prototype.open = function () {
    this._overlay.classList.remove('hidden');
    this._onTabChange(this._activeTab);
  };

  MenuPanel.prototype.close = function () {
    this._overlay.classList.add('hidden');
  };

  MenuPanel.prototype.isOpen = function () {
    return !this._overlay.classList.contains('hidden');
  };

  MenuPanel.prototype._switchTab = function (tabName) {
    this._activeTab = tabName;

    for (var i = 0; i < this._tabs.length; i++) {
      this._tabs[i].classList.toggle('active', this._tabs[i].dataset.tab === tabName);
    }

    this._galleryView.classList.toggle('hidden', tabName !== 'gallery');
    this._settingsView.classList.toggle('hidden', tabName !== 'settings');

    this._onTabChange(tabName);
  };

  return MenuPanel;
})();
