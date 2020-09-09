import child_proc from 'child_process';
import { Logger } from '@freik/core-utils';

const log = Logger.bind('olb');
Logger.disable('olb');

type BufStr = string | Buffer;

export default function (url: string): void {
  const isMac = /^darwin/.test(process.platform);
  const isWin = /^win/.test(process.platform);
  if (!isWin && !isMac) {
    log(`open a brower to ${url} to launch the application`);
  } else {
    url = (isMac ? 'open ' : 'start ') + url;
    log(url);
    child_proc.exec(url, (err, stdout: BufStr, stderr: BufStr) => {
      log('stdout: ' + stdout.toString());
      log('stderr: ' + stderr.toString());
      if (err !== null && err !== undefined) {
        log(`exec error: ${JSON.stringify(err)}`);
      }
    });
  }
}
