// trace-requires.js
// Usage: npx electron -r ./trace-requires.js .
// Logs every require() / import resolved by Node into require-trace.log

const fs = require('fs');
const path = require('path');
const Module = require('module');

const OUT = path.join(process.cwd(), 'require-trace.log');
fs.writeFileSync(OUT, '', 'utf8');

function append(line) {
  try { fs.appendFileSync(OUT, line + '\n'); } catch (_) {}
}

const origLoad = Module._load;
const origResolve = Module._resolveFilename;

Module._resolveFilename = function(request, parent, isMain, options) {
  try {
    const resolved = origResolve.call(this, request, parent, isMain, options);
    return resolved;
  } catch (e) {
    return origResolve.call(this, request, parent, isMain, options);
  }
};

Module._load = function(request, parent, isMain) {
  const from = parent && parent.filename ? parent.filename : 'entry';
  let resolved = null;
  try {
    resolved = Module._resolveFilename(request, parent, isMain);
  } catch (_) {}
  // Only log once per module load event
  const relFrom = from.replace(process.cwd() + path.sep, '').replace(/\\/g, '/');
  const relRes = resolved ? resolved.replace(process.cwd() + path.sep, '').replace(/\\/g, '/') : request;
  append(`${relFrom} => ${relRes}`);
  return origLoad.apply(this, arguments);
};

append('# trace-requires.js active');