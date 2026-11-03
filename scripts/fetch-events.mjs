#!/usr/bin/env node
/**
 * Aggregates upcoming events in San Diego into site/events.json and site/events.ics. Runs in CI (see
 * .github/workflows/events.yml) and locally for preview. The build itself is the shared scripts/build.mjs
 * (lqa-events' file, like every scripts/*.mjs here); only what is below and site/city.js are this city's.
 */
import './failures.mjs'; // first: every outside call retried, the ones still failing written to failures.json (Steve, 2026-10-29)
import { build } from './build.mjs';

await build({
  feedUrl: 'https://sandiego.here.events/events.json',
  archiveUrl: 'https://raw.githubusercontent.com/sfosdal/sandiego-events/archive/events-archive.json',
});
