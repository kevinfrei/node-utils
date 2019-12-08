'use strict';

const cp = require('child_process');

const util = require('util');

const spawnAsync = (command, args, options) => {
  const res = new Promise((resolve, reject) => {
    const sr = {
      output: [],
      stdout: '',
      stderr: '',
      signal: null,
      status: null
    };
    const child = cp.spawn(command, args ? args : options, args ? options : undefined);
    child.stdout.on('data', data => {
      // 'close', 'end'
      sr.stdout = sr.stdout.toString() + data.toString();
    });
    child.stderr.on('data', data => {
      // 'close', 'end'
      sr.stderr = sr.stderr.toString() + data.toString();
    });
    child.on('close', (code, signal) => {
      if (signal) {
        reject(signal);
      } else {
        sr.status = code;
        sr.signal = signal;
        sr.output = ['', sr.stdout.toString(), sr.stderr.toString()];
        resolve(sr);
      }

      ;
    });
    child.on('error', err => {
      reject(err);
    });
  });
  return res;
}; // Process spawning stuff


const spawnRes = (command, args, options) => {
  if (!args) {
    args = [];
  }

  if (!options) {
    options = {
      cwd: process.cwd()
    };
  } else if (!options.cwd) {
    options.cwd = process.cwd();
  }

  const spawnResult = cp.spawnSync(command, args ? args : options, args ? options : undefined);

  if (!spawnResult.error && !spawnResult.status) {
    // && !spawnResult.stderr.toString()) {
    return true;
  } // console.log("stderr:");
  // console.log(spawnResult.stderr.toString());
  // console.log(`Error from spawnRes ${command}: ${spawnResult.error}`);


  return false;
}; // Process spawning stuff


const spawnResAsync = async (command, args, options) => {
  if (!args) {
    args = [];
  }

  if (!options) {
    options = {
      cwd: process.cwd()
    };
  } else if (!options.cwd) {
    options.cwd = process.cwd();
  }

  const spawnResult = await spawnAsync(command, args, options);

  if (!spawnResult.error && !spawnResult.status) {
    // && !spawnResult.stderr.toString()) {
    return true;
  } // console.log("stderr:");
  // console.log(spawnResult.stderr.toString());
  // console.log(`Error from spawnRes ${command}: ${spawnResult.error}`);


  return false;
};

module.exports = {
  spawnAsync,
  spawnRes,
  spawnResAsync
};
//# sourceMappingURL=process.js.map