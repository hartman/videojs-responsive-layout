# videojs-responsive-layout

[![Current version](https://img.shields.io/npm/v/videojs-responsive-layout.svg)](https://www.npmjs.com/package/videojs-responsive-layout) [![Dependencies](https://img.shields.io/versioneye/d/nodejs/videojs-responsive-layout.svg)](https://www.versioneye.com/nodejs/videojs-responsive-layout)

A plugin that reacts to the width of your player to change the layout of your Video.js player.

This plugin changes the layout of the controlbar of your Video.js player, based on the width of the player. When it has calculated that not all controls will fit inside the player, it applies one of 3 different layout classes, which are provided by the default skin of Video.js.
```
* vjs-layout-tiny
* vjs-layout-x-small
* vjs-layout-small
```

## Getting started
Simply install from npm, using `npm install videojs-responsive-layout`.
Now add the `dist/videojs-responsive-layout.js` or `dist/videojs-responsive-layout.min.js` to your page and make sure it loads after the main `videojs` javascript.

Now configure it like:
```javascript
var player = videojs( 'really-cool-video',
  {
    controlBar: {
      volumeMenuButton: {
          inline: false
      }
    },
    plugins: {
      responsiveLayout: {}
    }
  },
  function() {
    console.log('Good to go!');
    this.play();
  }
);
```
The `inline:false` option is important, because the plugin cannot deal with an inline and horizontal volume control at this time.


## Advanced options
Will follow soon...

## Contributing
I really appreciate any help in maintaining and advancing this library. Check out the [contributing guide](CONTRIBUTING.md).

## License

MIT and Apache-2.0.
Copyright (c) Derk-Jan Hartman
