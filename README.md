[<img src="logo.png" align="right" width="200">](https://github.com/frc1418/VictiScout)
# VictiScout
Application for FRC scouting. Written using [Electron](http://electron.atom.io/) for easy customization.

Get the newest compiled version [here](https://github.com/frc1418/VictiScout/releases)!

Download `vs`, a convenient CLI app for processing VictiScout data, [here](https://github.com/frc1418/vs).

![Screenshot](screenshot.png)

## Development dependencies
* [Node.js](https://nodejs.org)
* [npm](https://npmjs.com)

## Development Installation
1. `cd` into `VictiScout` directory
2. Run `npm install` to install node dependencies.

## Usage in Development
While in `VictiScout` directory, run

    npm start

## Packaging
While in `VictiScout` directory, run

    npm run-script package-mac
    npm run-script package-win
    npm run-script package-linux

Choose the suffix appropriate for your target OS.

See [here](https://github.com/electron-userland/electron-packager#readme) for an explanation of how to modify your packaging settings.

## Authors
This software was created by [Erik Boesen](https://github.com/ErikBoesen) for [Team 1418](https://github.com/frc1418). See [Contributors](https://github.com/frc1418/VictiScout/graphs/contributors) for further information.

## License
VictiScout is available under the [MIT License](LICENSE).
