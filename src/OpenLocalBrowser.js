// @flow
// @format

const child_proc = require('child_process');
const logger = require('simplelogger');

const log = logger.bind('olb');
logger.disable('olb');

type BufStr = string | Buffer;

module.exports = (url: string) => {
  const isMac = /^darwin/.test(process.platform);
  const isWin = /^win/.test(process.platform);
  if (!isWin && !isMac) {
    log(`open a brower to ${url} to launch the application`);
  } else {
    url = (isMac ? 'open ' : 'start ') + url;
    log(url);
    child_proc.exec(
      url,
      (err: ?child_process$Error, stdout: BufStr, stderr: BufStr) => {
        log('stdout: ' + stdout.toString());
        log('stderr: ' + stderr.toString());
        if (err !== null && err !== undefined) {
          log(`exec error: ${JSON.stringify(err)}`);
        }
      }
    );
  }
};
