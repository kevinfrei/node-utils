# node-utils

A set of utilities I use when doing silly stuff in nodejs.

Some of it is completely outdated and unused, but some of it is used by things
I'm trying to expose for the music player.

Someday, I'll add some tests for this stuff...

## AppConfig

This is a simplistic API for getting and saving 'configuration' data as simple
JSON files. It provies synchronous & asynchronous api's to get configuration
data (load from a file), and set configuration data (write to a file), as well
as a function to get the path to the file for a given piece of data.

For my own silliness of naming, everything comes in lots of names, but they are
all completely interchangeable:

```typescript
// aliases: GetSync, Read, ReadSync, Load, and LoadSync
function Get(name:string) => unknown | void;
// aliases: ReadAsync, LoadAsync
function GetAsync(name:string) => Promise<unknown | void>;
```

Given a _string_ name, return an optional data type, or a promise containing
that (for the Async version).

```typescript
// aliases: SetSync, Write, WriteSync, Save, SaveSync
function Set(name: string, data: unknown) => void;
// aliases: SaveAsync, WriteAsync
function SetAsync(name: string, data: unknown) => Promise<void>;
```

Given a _string_ name and an unknown type, saves that value for future
`Get`ting.

## OpenLocalBrowser

This takes a string URL and tries to open a browser to that location. It
currently only works on MacOS and Windows, because I have no idea how to do this
on Linux, and only have a Raspberry Pi to do anything that's actually linux (I
use WSL for a lovely Ubuntu-ish command line on Windows, but that's not the same
thing...)

## FileUtil

A few helpful functions:

```typescript
function size(filePath:string) => number;
function sizeAsync(filePath:string) => Promise<number>;
```

Return the file size for the _string_ path provided.

```typescript
function arrayToTextFile(arr:Array<string>, filePath:string) => void;
function arrayToTextFileAsync(arr:Array<string>, filePath:string) => Promise<void>;
```

Writes the array of strings to the file provided, separated by newlines
apropriate for the platform you're on (LF's or CRLF's).

```typescript
function textFileToArray(filePath:string) => Array<string>;
function textFileToArrayAsync(filePath:string) => Promise<Array<string>>;
```

Reads the filePath provided and returns the array of lines of text from the
file.

## PathUtil

A couple helpers for path name creation & manipulation:

```typescript
function getTemp(name:string, ext:?string) => string;
```

Given a name, and an optional file extension, return a _likely_ unique path to
use as a temp file.

```typescript
function getExtNoDot(fileName:string) => string;
```

Returns the file extension of `fileName` _without_ a leading '.' because that's
annoying...

```typescript
function changeExt(fileName:string, newExt:string) => string;
```

Switches the file extension to `newExt` for the path `fileName`.

## ProcUtil

3 helpers for spawning processes.

```typescript
// Exported from the node-freik-utils module
type spawnResult = {
  output: Array<string>,   // Array of results from stdio output.
  stdout: Buffer | string, // The contents of output[1].
  stderr: Buffer | string, // The contents of output[2].
  signal: string | null,   // The signal that terminated the output
  status: number | null,   // The exit code of the subprocess or
                           // null if the subprocess terminated due to a signal.
  error?: Object           // The error
};

// sO == child_process$spawnOpts
// sSO == child_process$spawnSyncOpts
function spawnAsync(command:string, args: ?Array<string>, options:?sO) => Promise<spawnResult>;
function spawnRes(command:string, args: ?Array<string>, options:?sSO) => boolean;
function spawnResAsync(command:string, args:?Array<string>, options:?sO) => Promise<boolean>;
```

These three helpers wrap process spawning from `node.child_process` in
self-contained blobs. I'm clearly getting sick of writing documentation...
