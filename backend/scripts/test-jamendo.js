#!/usr/bin/env node
/*
  Jamendo API smoketest using existing service functions.
  Usage:
    # Set env first (Windows PowerShell example):
    #   $env:JAMENDO_CLIENT_ID="<your_client_id>"; node scripts/test-jamendo.js --all
    # Or pass inline: JAMENDO_CLIENT_ID=... node scripts/test-jamendo.js

    node scripts/test-jamendo.js --popular
    node scripts/test-jamendo.js --albums
    node scripts/test-jamendo.js --album 139340
    node scripts/test-jamendo.js --search "lofi"
    node scripts/test-jamendo.js --bycat rock,pop --per 3
    node scripts/test-jamendo.js --all
*/

process.env.CACHE_DRIVER = process.env.CACHE_DRIVER || 'memory';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { getPopular, getAlbums, getAlbumById, searchTracks, getAlbumsByCategories } = require('../services/jamendoService');
const axios = require('axios');

const log = (...args) => console.log('[jamendo:test]', ...args);
const err = (...args) => console.error('[jamendo:test]', ...args);

const arg = (name, def) => {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx === -1) return def;
  const v = process.argv[idx + 1];
  if (!v || v.startsWith('--')) return true; // boolean flag
  return v;
};

(async () => {
  const clientId = process.env.JAMENDO_CLIENT_ID;
  if (!clientId) {
    err('Missing JAMENDO_CLIENT_ID in environment.');
    process.exit(2);
  }

  const wantAll = !!arg('all', false);
  const wantDebug = !!arg('debug', false);

  let failures = 0;

  const run = async (label, fn) => {
    try {
      const t0 = Date.now();
      const data = await fn();
      const ms = Date.now() - t0;
      const count = Array.isArray(data) ? data.length : (data ? 1 : 0);
      log(`${label} -> OK in ${ms}ms; count=${count}`);
      if (Array.isArray(data) && count) {
        const sample = data[0];
        log(`${label} sample:`, JSON.stringify(sample, null, 2).slice(0, 800));
      } else if (data && typeof data === 'object') {
        log(`${label} object:`, Object.keys(data).slice(0, 10));
      }
    } catch (e) {
      failures++;
      err(`${label} FAILED:`, e.message);
    }
  };

  const tasks = [];
  if (wantDebug) {
    tasks.push(run('DEBUG raw /tracks ping', async () => {
      const res = await axios.get('https://api.jamendo.com/v3.0/tracks', {
        params: { client_id: clientId, format: 'json', limit: 1 }
      });
      const hdr = res?.data?.headers || {};
      log('headers:', hdr);
      return res?.data?.results || [];
    }));
    tasks.push(run('DEBUG raw /tracks namesearch=lofi', async () => {
      const res = await axios.get('https://api.jamendo.com/v3.0/tracks', {
        params: { client_id: clientId, format: 'json', limit: 3, namesearch: 'lofi' }
      });
      const hdr = res?.data?.headers || {};
      log('headers:', hdr);
      return res?.data?.results || [];
    }));
  }
  if (wantAll || arg('popular', false)) tasks.push(run('getPopular()', () => getPopular()));
  if (wantAll || arg('albums', false)) tasks.push(run('getAlbums()', () => getAlbums()));

  const albumId = arg('album', null);
  if (wantAll || albumId) tasks.push(run(`getAlbumById(${albumId || 'sample'})`, async () => {
    const id = albumId || '139340'; // fallback sample id
    return getAlbumById(id);
  }));

  const searchQ = arg('search', null);
  if (wantAll || searchQ) tasks.push(run(`searchTracks(${JSON.stringify(searchQ || 'lofi')})`, () => searchTracks(searchQ || 'lofi')));

  const cats = arg('bycat', null);
  const per = Number(arg('per', 3));
  if (wantAll || cats) tasks.push(run(`getAlbumsByCategories(${cats || 'rock,pop'}, per=${per})`, () => getAlbumsByCategories(cats || 'rock,pop', per)));

  // Run sequentially to keep logs tidy
  for (const t of tasks) {
    // eslint-disable-next-line no-await-in-loop
    await t;
  }

  if (!tasks.length) {
    log('No tests selected. Use --all or one of --popular --albums --album <id> --search <q> --bycat <tags> [--per N]');
  }

  process.exit(failures ? 1 : 0);
})();
