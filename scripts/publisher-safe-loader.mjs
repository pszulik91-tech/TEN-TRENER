import './ts-loader.mjs';
import {registerHooks} from 'node:module';
globalThis.__PUBLISHER_SAFE__=true;
registerHooks({resolve(specifier,context,next){return next(specifier.endsWith('/league-catalog.mjs')?new URL('../lib/publisher-catalog.mjs',import.meta.url).href:specifier,context);}});
