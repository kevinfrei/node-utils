// @format
const child_proc = require('child_process');

const {
  Logger: logger
} = require('my-utils');

module.exports = url => {
  const isMac = /^darwin/.test(process.platform);
  const isWin = /^win/.test(process.platform);

  if (!isWin && !isMac) {
    logger(0, `open a brower to ${url} to launch the application`);
  } else {
    url = (isMac ? 'open ' : 'start ') + url;
    logger(0, url);
    child_proc.exec(url, (err, stdout, stderr) => {
      logger(2, 'stdout: ' + stdout.toString());
      logger(2, 'stderr: ' + stderr.toString());

      if (err !== null) {
        logger(0, 'exec error: ' + JSON.stringify(err));
      }
    });
  }
};
//# sourceMappingURL=OpenLocalBrowser.js.map