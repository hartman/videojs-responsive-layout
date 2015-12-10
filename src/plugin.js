/* jshint esnext:true */
import videojs from 'video.js';
const debounce = require('throttle-debounce').debounce;

// Default options for the plugin.
const defaults = {
  debounceDelay: 400
};

/**
 * Retrieve the outerWidth of an element, including margins
 *
 * @function getElementOuterWidth
 * @param    {Element} el to measure
 * @return   {number} the width of the element in pixels
 */
const getElementOuterWidth = (el) => {
  let width = el.offsetWidth;
  let style = getComputedStyle(el);

  width += parseInt(style.marginLeft, 10) + parseInt(style.marginRight, 10);
  return width;
};

/**
 * Retrieve the width an element
 *
 * @function getElementWidth
 * @param    {Element} el to measure
 * @return   {number} the width of the element in pixels
 */
const getElementWidth = (el) => {
  return parseInt(getComputedStyle(el).width, 10);
};

/**
 * Check if an element is currently visible.
 *
 * Use this to filter on elements that should be taken into account during calculations.
 *
 * @function isElementVisible
 * @param    {Element} el to test
 * @return   {boolean} true if el is visible
 */
const isElementVisible = (el) => {
  return (el.offsetWidth > 0 || el.offsetHeight > 0);
};

/**
 * Set a video.js layout class on an element
 *
 * A layout can be: vjs-layout-tiny, vjs-layout-x-small, vjs-layout-small.
 * Anything else will reset back to defaults
 *
 * @function setVideoJsLayout
 * @param    {Player} player to apply the layout to
 * @param    {string} layoutClass name of the class to be set
 * @return   {boolean} true if el is visible
 */
const setVideoJsLayout = (player, layoutClass) => {
  let el = player.el();

  if (layoutClass === 'vjs-layout-tiny') {
    videojs.addClass(el, 'vjs-layout-tiny');
    videojs.removeClass(el, 'vjs-layout-small');
    videojs.removeClass(el, 'vjs-layout-x-small');
  } else if (layoutClass === 'vjs-layout-x-small') {
    videojs.addClass(el, 'vjs-layout-x-small');
    videojs.removeClass(el, 'vjs-layout-tiny');
    videojs.removeClass(el, 'vjs-layout-small');
  } else if (layoutClass === 'vjs-layout-small') {
    videojs.addClass(el, 'vjs-layout-small');
    videojs.removeClass(el, 'vjs-layout-tiny');
    videojs.removeClass(el, 'vjs-layout-x-small');
  } else {
    videojs.removeClass(el, 'vjs-layout-tiny');
    videojs.removeClass(el, 'vjs-layout-x-small');
    videojs.removeClass(el, 'vjs-layout-small');
  }
};

const makeBigger = (player) => {
  let el = player.el();

  if (videojs.hasClass(el, 'vjs-layout-tiny')) {
    setVideoJsLayout(player, 'vjs-layout-x-small');
  } else if (videojs.hasClass(el, 'vjs-layout-x-small')) {
    setVideoJsLayout(player, 'vjs-layout-small');
  } else if (videojs.hasClass(el, 'vjs-layout-small')) {
    setVideoJsLayout(player, 'default');
  } else {
    return;
  }
  player.trigger('resize');
};

const makeSmaller = (player) => {
  let el = player.el();

  if (videojs.hasClass(el, 'vjs-layout-tiny')) {
    return;
  } else if (videojs.hasClass(el, 'vjs-layout-x-small')) {
    setVideoJsLayout(player, 'vjs-layout-tiny');
  } else if (videojs.hasClass(el, 'vjs-layout-small')) {
    setVideoJsLayout(player, 'vjs-layout-x-small');
  } else {
    setVideoJsLayout(player, 'vjs-layout-small');
  }
  player.trigger('resize');
};

const updateVideoJsLayout = (layouter, playerWidth, controlBarWidth, controlWidth) => {
  let progressWidth = getElementOuterWidth(
    layouter.el.querySelectorAll('.vjs-progress-control')[0]
  );

  if (controlBarWidth > playerWidth) {
    makeSmaller(layouter.player);
  } else if ((videojs.hasClass(layouter.el, 'vjs-layout-x-small') ||
               videojs.hasClass(layouter.el, 'vjs-layout-small')) &&
               // progressbar more that twice it's default size
               progressWidth > controlWidth * 2
  ) {
    makeBigger(layouter.player);
  } else if (playerWidth > controlBarWidth + controlWidth &&
             !videojs.hasClass(layouter.el, 'vjs-layout-x-small') &&
             !videojs.hasClass(layouter.el, 'vjs-layout-small')
  ) {
    makeBigger(layouter.player);
  }
};

const dimensionsCheck = function() {
  if (!this.el) {
    return;
  }
  let playerWidth = this.getPlayerWidth();
  let controlWidth = this.getControlWidth();
  let controlBarWidth = this.getControlBarWidth();

  if (this.options.updateVideoJsLayout) {
    this.options.updateVideoJsLayout(this, playerWidth, controlBarWidth, controlWidth);
  } else {
    updateVideoJsLayout(this, playerWidth, controlBarWidth, controlWidth);
  }
};

const installStylesheet = function() {
  let style = document.getElementById('vjs-responsive-layout');

  if (!style) {
    let styleRule = `
      .vjs-responsive-layout .vjs-progress-control {
        min-width: 4em;
      }
    `;
    let head = document.getElementsByTagName('head')[0];

    style = document.createElement('style');
    style.id = 'vjs-responsive-layout';

    if (style.styleSheet) {
      style.styleSheet.cssText = styleRule;
    } else {
      style.textContent = styleRule;
    }
    head.insertBefore(style, head.firstChild);
  }
};

class Layouter {
  constructor(player, options) {
    this.player_ = player;
    this.options_ = options;
    this.debouncedCheckSize_ = debounce(options.debounceDelay, dimensionsCheck);
  }

  ready() {
    installStylesheet();
    this.player.addClass('vjs-responsive-layout');

    this.windowResizeListener_ = window.addEventListener(
      'resize',
      () => this.debouncedCheckSize_()
    );

    this.player.on(['play', 'resize'], () => this.debouncedCheckSize_());
    this.player.on('dispose', function() {
      window.removeEventListener('resize', this.windowResizeListener_);
    });

    // Let's do the first measure
    this.player.trigger('resize');
  }

  /**
   * Retrieve player to which this Layouter object belongs
   *
   * @property player
   * @return   {number} the width of the controlbar in pixels
   */
  get player() {
    return this.player_;
  }

  get el() {
    return this.player_.el();
  }

  get options() {
    return this.options_;
  }

  /**
   * Retrieve current width of a control in the video.js controlbar
   *
   * This function relies on the presence of the play control. If you
   * mess with it's visibility, things likely will break :)
   *
   * @function getControlBarWidth
   * @return   {number} the width of the controlbar in pixels
   */
  getControlWidth() {
    return getElementOuterWidth(this.el.querySelectorAll('.vjs-play-control')[0]);
  }

  /**
   * Retrieve current width of the video.js controlbar
   *
   * @function getControlBarWidth
   * @return   {number} the width of the controlbar in pixels
   */
  getControlBarWidth() {
    let controlBarWidth = 0;
    let cbElements = this.el.querySelectorAll('.vjs-control-bar > *');

    Array.from(cbElements).forEach(function(el) {
      if (isElementVisible(el)) {
        controlBarWidth += getElementOuterWidth(el);
      }
    });
    return controlBarWidth;
  }

  /**
   * Retrieve current width of the video.js player element
   *
   * @function getPlayerWidth
   * @return   {number} the width of the player in pixels
   */
  getPlayerWidth() {
    return getElementWidth(this.el);
  }

  /**
   * Retrieve the outerWidth of an element, including margins
   *
   * @function outerWidth
   * @param    {Element} el to measure
   * @return   {number} the width of the element in pixels
   */
  static getElementOuterWidth(el) {
    return getElementOuterWidth(el);
  }

  /**
   * Retrieve the width an element
   *
   * @function getElementWidth
   * @param    {Element} el to measure
   * @return   {number} the width of the element in pixels
   */
  static getElementWidth(el) {
    return getElementWidth(el);
  }

  /**
   * Check if an element is currently visible.
   *
   * Use this to filter on elements that should be taken into account during calculations.
   *
   * @function isElementVisible
   * @param    {Element} el to test
   * @return   {boolean} true if el is visible
   */
  static isElementVisible(el) {
    return isElementVisible(el);
  }
}

/**
 * A video.js plugin.
 *
 * In the plugin function, the value of `this` is a video.js `Player`
 * instance. You cannot rely on the player being in a "ready" state here,
 * depending on how the plugin is invoked. This may or may not be important
 * to you; if not, remove the wait for "ready"!
 *
 * @function responsiveLayout
 * @param    {Object} [options={}]
 *           An object of options left to the plugin author to define.
 */
const responsiveLayout = function(options) {
  let layout = new Layouter(this, videojs.mergeOptions(defaults, options));

  this.ready(() => {
    layout.ready();
  });
};

// Register the plugin with video.js.
videojs.plugin('responsiveLayout', responsiveLayout);

export default responsiveLayout;
