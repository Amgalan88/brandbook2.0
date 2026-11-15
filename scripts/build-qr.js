// Bundle the local QR helper for the static page. The browser never calls a QR API.
import esbuild from 'esbuild';
import { mkdirSync } from 'node:fs';

mkdirSync('js', { recursive: true });
await esbuild.build({
  entryPoints: ['lib/branch-qr.js'],
  bundle: true,
  format: 'iife',
  globalName: 'MGLQR',
  outfile: 'js/branch-qr.js',
  platform: 'browser',
  target: ['es2018'],
  legalComments: 'none'
});
console.log('wrote js/branch-qr.js');
