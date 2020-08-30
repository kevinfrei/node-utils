// @format
const child_proc = require('child_process');

const logger = require('@freik/simplelogger');

const log = logger.bind('olb');
logger.disable('olb');

module.exports = url => {
  const isMac = /^darwin/.test(process.platform);
  const isWin = /^win/.test(process.platform);

  if (!isWin && !isMac) {
    log(`open a brower to ${url} to launch the application`);
  } else {
    url = (isMac ? 'open ' : 'start ') + url;
    log(url);
    child_proc.exec(url, (err, stdout, stderr) => {
      log('stdout: ' + stdout.toString());
      log('stderr: ' + stderr.toString());

      if (err !== null && err !== undefined) {
        log(`exec error: ${JSON.stringify(err)}`);
      }
    });
  }
};
//# sourceMappingURL=OpenLocalBrowser.js.map