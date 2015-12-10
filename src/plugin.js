/* jshint esnext:true */
import videojs from 'video.js';
const debounce = require('throttle-debounce').debounce;

// Default options for the plugin.
const defaults = {};

/**
 * Function to invoke when the player is ready.
 *
 * This is a great place for your plugin to initialize itself. When this
 * function is called, the player will have its DOM and child components
 * in place.
 *
 * @function onPlayerReady
 * @param    {Player} player
 * @param    {Object} [options={}]
 */
const onPlayerReady = (player, options) => {
  player.addClass('vjs-responsive-layout');
  player.trigger('resize');
  player.RLwindowListener_ = window.addEventListener('resize', debouncedCheckSize);
};

/**
 * Retrieve the outerWidth of an element, including margins
 *
 * @function outerWidth
 * @param    {Element} el to measure
 * @return   {number} the width of the element in pixels
 */
const outerWidth = (el) => {
  let width = el.offsetWidth;
  let style = getComputedStyle(el);

  width += parseInt(style.marginLeft, 10) + parseInt(style.marginRight, 10);
  return width;
};

/**
 * Retrieve the width an element
 *
 * @function width
 * @param    {Element} el to measure
 * @return   {number} the width of the element in pixels
 */
const width = (el) => {
  return parseInt(getComputedStyle(el).width, 10);
};

/**
 * Check if an element is currently visible
 *
 * @function isVisible
 * @param    {Element} el to test
 * @return   {boolean} true if el is visible
 */
const isVisible = (el) => {
  return (el.offsetWidth > 0 || el.offsetHeight > 0);
};

/**
 * Set a layout class on an element
 *
 * A layout can be: vjs-layout-tiny, vjs-layout-x-small, vjs-layout-small.
 * Anything else will reset back to defaults
 *
 * @function isVisible
 * @param    {Element} el to apply the layout to
 * @param    {string} layout class to set
 * @return   {boolean} true if el is visible
 */
const setLayout = (el, layout) => {
  if (layout === 'vjs-layout-tiny') {
    videojs.addClass(el, 'vjs-layout-tiny');
    videojs.removeClass(el, 'vjs-layout-small');
    videojs.removeClass(el, 'vjs-layout-x-small');
  } else if (layout === 'vjs-layout-x-small') {
    videojs.addClass(el, 'vjs-layout-x-small');
    videojs.removeClass(el, 'vjs-layout-tiny');
    videojs.removeClass(el, 'vjs-layout-small');
  } else if (layout === 'vjs-layout-small') {
    videojs.addClass(el, 'vjs-layout-small');
    videojs.removeClass(el, 'vjs-layout-tiny');
    videojs.removeClass(el, 'vjs-layout-x-small');
  } else {
    videojs.removeClass(el, 'vjs-layout-tiny');
    videojs.removeClass(el, 'vjs-layout-x-small');
    videojs.removeClass(el, 'vjs-layout-small');
  }
};

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
  let player = this;
  let el_ = player.el();

  const makeBigger = () => {
    if (videojs.hasClass(el_, 'vjs-layout-tiny')) {
      setLayout(el_, 'vjs-layout-x-small');
    } else if (videojs.hasClass(el_, 'vjs-layout-x-small')) {
      setLayout(el_, 'vjs-layout-small');
    } else if (videojs.hasClass(el_, 'vjs-layout-small')) {
      setLayout(el_, 'default');
    } else {
      return;
    }
    player.trigger('resize');
  };
  const makeSmaller = () => {
    if (videojs.hasClass(el_, 'vjs-layout-tiny')) {
      return;
    } else if (videojs.hasClass(el_, 'vjs-layout-x-small')) {
      setLayout(el_, 'vjs-layout-tiny');
    } else if (videojs.hasClass(el_, 'vjs-layout-small')) {
      setLayout(el_, 'vjs-layout-x-small');
    } else {
      setLayout(el_, 'vjs-layout-small');
    }
    player.trigger('resize');
  };

  const checkSize = () => {
    if (!el_) {
      return;
    }
    let playerWidth = width(el_);
    let controlWidth = outerWidth(el_.querySelectorAll('.vjs-play-control')[0]);
    let controlBarWidth = 0;
    let progressWidth = outerWidth(el_.querySelectorAll('.vjs-progress-control')[0]);

    let cbElements = el_.querySelectorAll('.vjs-control-bar > *');
    Array.from(cbElements).forEach(function(el) {
      if (isVisible(el)) {
        controlBarWidth += outerWidth(el);
      }
    });

    if (controlBarWidth > playerWidth) {
      makeSmaller();
    } else if ((videojs.hasClass(el_, 'vjs-layout-x-small') ||
                 videojs.hasClass(el_, 'vjs-layout-small')) &&
                 // progressbar more that twice it's default size
                 progressWidth > controlWidth * 2
    ) {
      makeBigger();
    } else if (playerWidth > controlBarWidth + controlWidth &&
               !videojs.hasClass(el_, 'vjs-layout-x-small') &&
               !videojs.hasClass(el_, 'vjs-layout-small')
    ) {
      makeBigger();
    }
  };
  const debouncedCheckSize = debounce(200, checkSize);

  player.on(['play', 'resize'], debouncedCheckSize);
  player.on('dispose', function() {
    window.removeEventListener(player.RLwindowListener_);
  });

  this.ready(() => {
    let options = videojs.mergeOptions(defaults, options);
    player.addClass('vjs-responsive-layout');
    player.trigger('resize');
    player.RLwindowListener_ = window.addEventListener('resize', debouncedCheckSize);
  });
};

// Register the plugin with video.js.
videojs.plugin('responsiveLayout', responsiveLayout);

export default responsiveLayout;
