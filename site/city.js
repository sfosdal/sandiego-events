// The city — every fact that makes this calendar San Diego's rather than
// another town's, in one place (2026-10-11: the fourth city on lqa-events,
// after Everett and Chicago). The browser (filter.js, app.js) and the build
// (scripts/*.mjs) both read it; nothing else names a venue or a team. The
// shared files (app.js, filter.js, styles.css bar its --v-* hues,
// scripts/*.mjs bar fetch-events.mjs and sources.mjs) are lqa-events' own,
// byte for byte — see README "Sister sites".
//
// Loaded before filter.js (a plain script, so the tests can share it): it
// sets globalThis.LQACity (the name is the shared code's, not the city's).
(function (global) {
  'use strict';

  // The home teams, matched on the event title whatever the venue. Order =
  // the Teams strip, left to right. Per team:
  //   re        the title match
  //   venue     the home building; schedule = the club's own schedule page
  //   sport     keys the strip icon (app.js SPORT_ICONS), the game clock,
  //             the leader categories
  //   colors    [primary, accent] — the season calendar's home cells and
  //             card frames
  //   espn      ESPN's sport/league/team id — the Padres, San Diego FC, the
  //             Wave and both Aztecs sides are on ESPN (season, form, news);
  //             the Padres' season comes from MLB's stats API (first-pitch
  //             times, the standings) as lqa's Mariners do; the Gulls' from
  //             the AHL's HockeyTech feed (season/form kind 'hockeytech')
  //   division  (baseball) the division rivals by the abbreviations the
  //             schedule carries, for the standings line
  //   club      the club's name on Ticketmaster; news the outlets' feeds;
  //             wiki the article; opens when the season usually starts
  var MLB = function (slug) { return ['https://www.mlb.com/' + slug + '/feeds/news/rss.xml', 'MLB.com']; };
  var AHL = { league: 'ahl', key: '50c2cd9b5e18e390' }; // the AHL's HockeyTech feed (client code and the key theahl.com's own pages carry); the shared adapter is Everett's WHL one
  var TEAMS = [
    { slug: 'padres', label: 'Padres', re: /\bpadres\b/i, sport: 'baseball', venue: 'Petco Park', colors: ['#2f241d', '#ffc425'],
      espn: { sport: 'baseball', league: 'mlb', id: '25' }, season: { kind: 'mlb', id: 135 }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/sd.png', schedule: 'https://www.mlb.com/padres/schedule',
      club: 'San Diego Padres', opens: 'late March', wiki: { title: 'San Diego Padres' },
      division: ['LAD', 'SF', 'ARI', 'COL'], // NL West
      news: [MLB('padres')] },
    { slug: 'sdfc', label: 'San Diego FC', re: /san diego fc/i, sport: 'soccer', venue: 'Snapdragon Stadium', colors: ['#111111', '#ff6b7a'],
      espn: { sport: 'soccer', league: 'usa.1', id: '22529' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/22529.png', schedule: 'https://www.sandiegofc.com/schedule',
      club: 'San Diego FC', opens: 'late February', wiki: { title: 'San Diego FC' } },
    { slug: 'wave', label: 'Wave', re: /san diego wave/i, sport: 'soccer', venue: 'Snapdragon Stadium', colors: ['#1e9fd6', '#f2735b'],
      espn: { sport: 'soccer', league: 'usa.nwsl', id: '21423' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/21423.png', schedule: 'https://sandiegowavefc.com/schedule/',
      club: 'San Diego Wave FC', opens: 'March', wiki: { title: 'San Diego Wave FC' } },
    // San Diego State: football at Snapdragon, men's basketball at Viejas — the
    // two title matches keep the sports apart ("Aztecs Football vs", "Aztecs Men's Basketball vs")
    { slug: 'aztecs', label: 'Aztecs', re: /aztecs(?!.*basketball)/i, sport: 'football', venue: 'Snapdragon Stadium', colors: ['#a6192e', '#000000'],
      espn: { sport: 'football', league: 'college-football', id: '21' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/21.png', schedule: 'https://goaztecs.com/sports/football/schedule',
      club: 'San Diego State Aztecs', opens: 'late August', wiki: { title: 'San Diego State Aztecs football', startYear: true } },
    { slug: 'aztecsmbb', label: 'Aztecs MBB', re: /aztecs.*basketball/i, sport: 'basketball', venue: 'Viejas Arena', colors: ['#a6192e', '#000000'],
      espn: { sport: 'basketball', league: 'mens-college-basketball', id: '21' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/21.png', schedule: 'https://goaztecs.com/sports/mens-basketball/schedule',
      club: 'San Diego State Aztecs', opens: 'early November', wiki: { title: "San Diego State Aztecs men's basketball" } },
    // AHL (Ducks affiliate), Pechanga Arena; the season from the league's HockeyTech feed like Everett's Silvertips
    { slug: 'gulls', label: 'Gulls', name: 'San Diego Gulls', abbr: 'SD', re: /\bgulls\b/i, sport: 'hockey', venue: 'Pechanga Arena', colors: ['#f47a38', '#0b1f3a'],
      season: { kind: 'hockeytech', league: AHL.league, key: AHL.key, id: 404, leagueName: 'AHL' }, form: { kind: 'hockeytech', league: AHL.league, key: AHL.key, id: 404 },
      logo: 'https://assets.leaguestat.com/ahl/logos/404.png', schedule: 'https://sandiegogulls.com/schedule',
      club: 'San Diego Gulls', opens: 'October', wiki: { title: 'San Diego Gulls', club: true } },
  ];

  // The venues, one record each — downtown and the stadiums first by size,
  // then the music rooms and the places around the county. Per venue:
  //   capacity how many people the place holds
  //   area     'town' for the music rooms across the city and the houses
  //            up and down the county (the panel's second group); absent =
  //            downtown and the stadiums
  //   type     the event type when the title decides nothing
  //   cssVar   the hue styles.css sets for it (dark block --v-*); color
  //            the same hue as a value, for the series graph
  //   url      the venue's own events listing — not a ticket vendor
  //   icon     a mark for listings without a team crest
  //   tm       its Ticketmaster Discovery listing (fetch-events.mjs reads
  //            the venue by id — every page). There is NO city sweep, as
  //            in Chicago: the rooms are read one by one
  //   alias    the other spellings the feeds use for it, folded to this name
  // No festivals yet, so the panel's Festivals group folds away (app.js).
  var VENUES = {
    // --- Downtown and the stadiums: Petco Park, Snapdragon, the arena, the Civic and Balboa, the Symphony's two homes, the Globe ---
    'Petco Park': {
      capacity: 40000,
      type: 'sports',
      cssVar: '--v-petco',
      color: '#ea8686',
      url: 'https://www.mlb.com/padres/schedule',
      icon: 'https://www.google.com/s2/favicons?domain=www.mlb.com&sz=128',
      tm: { id: 'KovZpa4cFe', match: 'petco park', fallbackUrl: 'https://www.mlb.com/padres/schedule', exclude: /parking|tour/i },
      alias: /petco park/i,
    },
    'Snapdragon Stadium': {
      capacity: 35000,
      type: 'sports',
      cssVar: '--v-snapdragon',
      color: '#86eaa3',
      url: 'https://www.snapdragonstadium.com/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.snapdragonstadium.com&sz=128',
      tm: { id: 'KovZ917AIoi', match: 'snapdragon', fallbackUrl: 'https://www.snapdragonstadium.com/events', exclude: /parking|tour/i },
      alias: /snapdragon stadium/i,
    },
    'Pechanga Arena': {
      capacity: 12920,
      type: 'concert',
      cssVar: '--v-pechanga',
      color: '#c086ea',
      url: 'https://www.pechangaarenasd.com/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.pechangaarenasd.com&sz=128',
      tm: { id: 'KovZpZAEd1EA', match: 'pechanga arena', fallbackUrl: 'https://www.pechangaarenasd.com/events', exclude: /parking/i },
      alias: /pechanga arena|valley view casino center|san diego sports arena/i,
    },
    'Viejas Arena': {
      capacity: 12414,
      type: 'sports',
      cssVar: '--v-viejas',
      color: '#eadd86',
      url: 'https://as.sdsu.edu/viejas_arena/events/',
      icon: 'https://www.google.com/s2/favicons?domain=as.sdsu.edu&sz=128',
      tm: { id: 'KovZpZA6AEdA', match: 'viejas', fallbackUrl: 'https://as.sdsu.edu/viejas_arena/events/' },
      alias: /viejas arena/i,
    },
    'San Diego Civic Theatre': {
      capacity: 2967,
      type: 'arts',
      cssVar: '--v-civic',
      color: '#86d9ea',
      url: 'https://sandiegotheatres.org/events/',
      icon: 'https://www.google.com/s2/favicons?domain=sandiegotheatres.org&sz=128',
      tm: { id: 'KovZpZAEA6kA', match: 'civic theatre', fallbackUrl: 'https://sandiegotheatres.org/events/' },
      alias: /civic theat/i,
    },
    'Balboa Theatre': {
      capacity: 1339,
      type: 'arts',
      cssVar: '--v-balboa',
      color: '#ea86bc',
      url: 'https://sandiegotheatres.org/events/',
      icon: 'https://www.google.com/s2/favicons?domain=sandiegotheatres.org&sz=128',
      tm: { id: 'KovZpZAEAlIA', match: 'balboa theatre', fallbackUrl: 'https://sandiegotheatres.org/events/' },
      alias: /balboa theat/i,
    },
    'Jacobs Music Center': {
      capacity: 1800,
      type: 'arts',
      cssVar: '--v-jacobs',
      color: '#9fea86',
      url: 'https://www.sandiegosymphony.org/',
      icon: 'https://www.google.com/s2/favicons?domain=www.sandiegosymphony.org&sz=128',
      tm: { id: 'KovZpZAJ6d1A', match: 'jacobs music center', fallbackUrl: 'https://www.sandiegosymphony.org/' },
      alias: /jacobs music center|copley symphony hall/i,
    },
    'The Rady Shell': {
      capacity: 10000,
      type: 'concert',
      cssVar: '--v-shell',
      color: '#8a86ea',
      url: 'https://www.theshell.org/',
      icon: 'https://www.google.com/s2/favicons?domain=www.theshell.org&sz=128',
      tm: { id: 'KovZ917AJ-O', match: 'rady shell', fallbackUrl: 'https://www.theshell.org/', exclude: /parking/i },
      alias: /rady shell/i,
    },
    'The Old Globe': {
      capacity: 600,
      type: 'arts',
      cssVar: '--v-globe',
      color: '#eaa786',
      url: 'https://www.theoldglobe.org/calendar/',
      icon: 'https://www.google.com/s2/favicons?domain=www.theoldglobe.org&sz=128',
      tm: { id: 'ZFr9jZe171', match: 'old globe', fallbackUrl: 'https://www.theoldglobe.org/calendar/' },
      alias: /old globe/i,
    },
    // --- Music rooms and around (`area: 'town'`): Shelter Island, the SDSU bowl, the clubs from North Park to Solana Beach, Chula Vista, Del Mar and Temecula ---
    'Humphreys Concerts by the Bay': {
      area: 'town',
      capacity: 1400,
      type: 'concert',
      cssVar: '--v-humphreys',
      color: '#86eac4',
      url: 'https://www.humphreysconcerts.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.humphreysconcerts.com&sz=128',
      tm: { id: 'KovZpZAJ7AIA', match: 'humphreys concerts', fallbackUrl: 'https://www.humphreysconcerts.com/' },
      alias: /humphreys concerts/i,
    },
    'Humphreys Backstage Live': {
      area: 'town',
      capacity: 300,
      type: 'concert',
      cssVar: '--v-backstage',
      color: '#e186ea',
      url: 'https://www.humphreysbackstagelive.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.humphreysbackstagelive.com&sz=128',
      tm: { id: 'KovZpZAEeFFA', match: 'backstage', fallbackUrl: 'https://www.humphreysbackstagelive.com/' },
      alias: /humphreys backstage/i,
    },
    'Cal Coast Open Air Theatre': {
      area: 'town',
      capacity: 4600,
      type: 'concert',
      cssVar: '--v-openair',
      color: '#d5ea86',
      url: 'https://as.sdsu.edu/openairtheatre/events/',
      icon: 'https://www.google.com/s2/favicons?domain=as.sdsu.edu&sz=128',
      tm: { id: 'KovZpZAJA6IA', match: 'open air theatre', fallbackUrl: 'https://as.sdsu.edu/openairtheatre/events/' },
      alias: /open air theat/i,
    },
    'North Island Credit Union Amphitheatre': {
      area: 'town',
      capacity: 20500,
      type: 'concert',
      cssVar: '--v-nicu',
      color: '#86b7ea',
      url: 'https://www.livenation.com/venue/KovZpa2WZe/north-island-credit-union-amphitheatre-events',
      icon: 'https://www.google.com/s2/favicons?domain=www.livenation.com&sz=128',
      tm: { id: 'KovZpa2WZe', match: 'north island', fallbackUrl: 'https://www.livenation.com/venue/KovZpa2WZe/north-island-credit-union-amphitheatre-events', exclude: /parking/i },
      alias: /north island credit union|mattress firm amphitheat|sleep train amphitheat/i,
    },
    'House of Blues': {
      area: 'town',
      capacity: 1100,
      type: 'concert',
      cssVar: '--v-hob',
      color: '#ea869a',
      url: 'https://www.houseofblues.com/sandiego',
      icon: 'https://www.google.com/s2/favicons?domain=www.houseofblues.com&sz=128',
      tm: { id: 'KovZpZAEAltA', match: 'house of blues san diego', fallbackUrl: 'https://www.houseofblues.com/sandiego' },
      alias: /^house of blues( san diego)?$/i,
    },
    'Voodoo Room': {
      area: 'town',
      capacity: 300,
      type: 'concert',
      cssVar: '--v-voodoo',
      color: '#86ea8e',
      url: 'https://www.houseofblues.com/sandiego',
      icon: 'https://www.google.com/s2/favicons?domain=www.houseofblues.com&sz=128',
      tm: { id: 'KovZ917AI8j', match: 'voodoo', fallbackUrl: 'https://www.houseofblues.com/sandiego' },
      alias: /voodoo room/i,
    },
    'The Observatory North Park': {
      area: 'town',
      capacity: 1100,
      type: 'concert',
      cssVar: '--v-observatory',
      color: '#ab86ea',
      url: 'https://www.observatorysd.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.observatorysd.com&sz=128',
      tm: { id: 'KovZ917AxAB', match: 'observatory', fallbackUrl: 'https://www.observatorysd.com/' },
      alias: /observatory north park/i,
    },
    'Belly Up': {
      area: 'town',
      capacity: 600,
      type: 'concert',
      cssVar: '--v-bellyup',
      color: '#eac886',
      url: 'https://bellyup.com/',
      icon: 'https://www.google.com/s2/favicons?domain=bellyup.com&sz=128',
      tm: { id: 'KovZpZAAAknA', match: 'belly up', fallbackUrl: 'https://bellyup.com/' },
      alias: /belly up/i,
    },
    'SOMA': {
      area: 'town',
      capacity: 2200,
      type: 'concert',
      cssVar: '--v-soma',
      color: '#86eae6',
      url: 'https://somasandiego.com/',
      icon: 'https://www.google.com/s2/favicons?domain=somasandiego.com&sz=128',
      tm: { id: 'KovZpZA1teEA', match: 'soma', fallbackUrl: 'https://somasandiego.com/' },
      alias: /^soma\b/i,
    },
    'Music Box': {
      area: 'town',
      capacity: 700,
      type: 'concert',
      cssVar: '--v-musicbox',
      color: '#ea86d0',
      url: 'https://musicboxsd.com/',
      icon: 'https://www.google.com/s2/favicons?domain=musicboxsd.com&sz=128',
      tm: { id: 'KovZ917AfM7', match: 'music box', fallbackUrl: 'https://musicboxsd.com/' },
      alias: /^(the )?music box$/i,
    },
    'Casbah': {
      area: 'town',
      capacity: 200,
      type: 'concert',
      cssVar: '--v-casbah',
      color: '#b3ea86',
      url: 'https://casbahmusic.com/',
      icon: 'https://www.google.com/s2/favicons?domain=casbahmusic.com&sz=128',
      tm: { id: 'KovZpZAaEveA', match: 'casbah', fallbackUrl: 'https://casbahmusic.com/' },
      alias: /casbah/i,
    },
    'The Magnolia': {
      area: 'town',
      capacity: 1200,
      type: 'concert',
      cssVar: '--v-magnolia',
      color: '#8696ea',
      url: 'https://themagnoliasd.com/',
      icon: 'https://www.google.com/s2/favicons?domain=themagnoliasd.com&sz=128',
      tm: { id: 'KovZ917AOww', match: 'magnolia', fallbackUrl: 'https://themagnoliasd.com/' },
      alias: /the magnolia/i,
    },
    'Brick by Brick': {
      area: 'town',
      capacity: 300,
      type: 'concert',
      cssVar: '--v-brick',
      color: '#ea9286',
      url: 'https://www.brickbybrick.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.brickbybrick.com&sz=128',
      tm: { id: 'KovZpZA67teA', match: 'brick by brick', fallbackUrl: 'https://www.brickbybrick.com/' },
      alias: /brick by brick/i,
    },
    'The Sound': {
      area: 'town',
      capacity: 1900,
      type: 'concert',
      cssVar: '--v-sound',
      color: '#86eab0',
      url: 'https://thesounddelmar.com/',
      icon: 'https://www.google.com/s2/favicons?domain=thesounddelmar.com&sz=128',
      tm: { id: 'KovZ917Atrk', match: 'the sound', fallbackUrl: 'https://thesounddelmar.com/' },
      alias: /^the sound$/i,
    },
    'Del Mar Fairgrounds': {
      area: 'town',
      capacity: 8000,
      type: 'community',
      cssVar: '--v-delmar',
      color: '#cd86ea',
      url: 'https://www.delmarfairgrounds.com/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.delmarfairgrounds.com&sz=128',
      tm: { id: 'KovZpZAEA6AA', match: 'del mar fairgrounds', fallbackUrl: 'https://www.delmarfairgrounds.com/events', exclude: /parking/i },
      alias: /del mar fairgrounds/i,
    },
    'Pechanga Resort Casino': {
      area: 'town',
      capacity: 1200,
      type: 'concert',
      cssVar: '--v-pechangaresort',
      color: '#e9ea86',
      url: 'https://www.pechanga.com/entertainment',
      icon: 'https://www.google.com/s2/favicons?domain=www.pechanga.com&sz=128',
      tm: { id: 'KovZpZA1vvlA', match: 'pechanga resort', fallbackUrl: 'https://www.pechanga.com/entertainment' },
      alias: /pechanga resort/i,
    },
  };

  // The usual view: every room on — nothing here lists nightly bar programs
  var DEFAULT_ON = ["Petco Park", "Snapdragon Stadium", "Pechanga Arena", "Viejas Arena", "San Diego Civic Theatre", "Balboa Theatre", "Jacobs Music Center", "The Rady Shell", "The Old Globe", "Humphreys Concerts by the Bay", "Humphreys Backstage Live", "Cal Coast Open Air Theatre", "North Island Credit Union Amphitheatre", "House of Blues", "Voodoo Room", "The Observatory North Park", "Belly Up", "SOMA", "Music Box", "Casbah", "The Magnolia", "Brick by Brick", "The Sound", "Del Mar Fairgrounds", "Pechanga Resort Casino"];
  var DEFAULT_OFF = [];
  var PREFS_KNOWN_FROM = null; // no default-off venue yet, so nothing for saved prefs to be told about

  // Event types: every event lands in exactly one, from its flags, title,
  // then venue. The rows the panel shows, in order.
  var TYPES = [
    { key: 'concert', label: 'Concerts', title: 'Live music — the amphitheatres to the clubs' },
    { key: 'sports', label: 'Sports', title: 'Padres, San Diego FC, Wave, Aztecs and Gulls home games' },
    { key: 'arts', label: 'Arts & Theater', title: 'Broadway San Diego, the Symphony, the Old Globe, comedy, dance' },
    { key: 'community', label: 'Community', title: 'The fairgrounds, festivals, family days' },
  ];
  var MOVIE_VENUE = null; // no cinema here

  // Share codes (?f=CODE): REGISTRY is every filterable key in a fixed
  // order and a code is a bitmask over it, so the list is APPEND-ONLY —
  // adding an entry adds a bit and every existing code keeps meaning what
  // it meant; removing or reordering one changes every link out there.
  // 39 slots from the first build: 8 base-36 digits.
  var CODE_LENGTH = 8;
  var REGISTRY = [
    ['venue', 'Petco Park'], ['venue', 'Snapdragon Stadium'], ['venue', 'Pechanga Arena'], ['venue', 'Viejas Arena'], ['venue', 'San Diego Civic Theatre'], ['venue', 'Balboa Theatre'], ['venue', 'Jacobs Music Center'], ['venue', 'The Rady Shell'], ['venue', 'The Old Globe'], ['venue', 'Humphreys Concerts by the Bay'], ['venue', 'Humphreys Backstage Live'], ['venue', 'Cal Coast Open Air Theatre'], ['venue', 'North Island Credit Union Amphitheatre'], ['venue', 'House of Blues'], ['venue', 'Voodoo Room'], ['venue', 'The Observatory North Park'], ['venue', 'Belly Up'], ['venue', 'SOMA'], ['venue', 'Music Box'], ['venue', 'Casbah'], ['venue', 'The Magnolia'], ['venue', 'Brick by Brick'], ['venue', 'The Sound'], ['venue', 'Del Mar Fairgrounds'], ['venue', 'Pechanga Resort Casino'],
    ['badge', 'concert'], ['badge', 'sports'], ['badge', 'arts'], ['badge', 'community'],
    ['team', 'padres'], ['team', 'sdfc'], ['team', 'wave'], ['team', 'aztecs'], ['team', 'aztecsmbb'], ['team', 'gulls'],
    ['cap', 'stadium'], ['cap', 'arena'], ['cap', 'hall'], ['cap', 'room'],
  ];

  // The words the page uses for the place
  var WORDS = {
    teamCity: 'San Diego', // the board drops it from the clubs' names ("San Diego Padres" → Padres)
    presetDefault: 'Every room — the ballpark, the stadium, the arenas, the theatres, the music rooms and the places around the county — every team and type',
    presetNeighborhood: 'Downtown and the stadiums only',
    presetBig: 'Only the places that hold 2,000 or more — the ballpark, the stadium, the arenas, the amphitheatres and the big theatres',
    phrases: { all: 'Showing everything.', none: 'Showing nothing yet — open Filter and pick some venues.', neighborhood: 'Showing downtown and the stadiums only.', big: 'Showing the big rooms only — the ballpark, the stadium, the arenas, the amphitheatres and the big theatres.' },
  };

  global.LQACity = {
    key: 'sandiego',
    name: 'San Diego',
    site: 'https://sandiego.here.events/',
    userAgent: 'Mozilla/5.0 (compatible; sandiego-events/1.0; +https://sandiego.here.events/)',
    tz: 'America/Los_Angeles', tzName: 'Pacific', // the city's time zone: the ICS feed's TZID, the game clocks, the poster's footer
    state: "California", stateOutline: 'M19.8 16.8L20.2 17.7L20.2 17.9L20.6 18.2L20.6 18.4L20.0 19.1L20.0 19.7L19.7 20.1L19.7 20.7L20.0 21.0L20.0 21.5L19.6 21.6L19.0 21.7L17.5 21.8L16.1 22.0L15.6 21.8L15.3 21.4L15.3 20.8L14.2 19.7L13.7 19.4L13.4 19.2L12.7 18.9L12.0 18.4L11.2 18.1L10.4 17.9L9.8 17.8L9.7 17.3L9.7 16.6L9.3 16.3L9.2 15.9L8.6 15.4L8.3 14.8L7.5 13.8L7.7 13.1L7.6 12.7L6.7 11.8L6.5 10.9L6.7 11.0L7.0 11.4L7.2 11.6L7.1 11.2L6.8 10.7L6.8 10.4L7.8 10.4L8.2 10.3L7.8 10.3L7.4 10.2L7.0 10.3L6.5 10.2L6.5 10.8L6.1 10.6L5.7 10.5L5.7 10.0L5.7 9.9L5.2 9.3L4.5 8.1L4.4 7.0L3.8 6.0L3.4 5.2L3.6 4.7L3.6 4.8L3.6 4.6L3.8 4.2L3.9 3.1L3.6 2.4L3.6 2.0L5.0 2.0L6.3 2.0L7.6 2.0L9.0 2.0L10.3 2.0L10.7 2.8L10.7 4.0L10.7 5.2L10.7 6.4L10.7 7.5L11.1 8.7L12.3 9.7L13.5 10.8L14.5 11.7L15.4 12.6L16.4 13.4L17.6 14.7L18.9 15.9Z', // the masthead's small state, linking to here.events (scripts/state-outline.mjs, Natural Earth 1:50m)
    // the calendar feed's header; the UID domain never changes (changing it
    // re-creates every event in subscribers' calendars)
    ics: { name: 'San Diego Events', short: 'San Diego Events', teams: 'San Diego home teams — every season', prodid: '-//here.events//sandiego-events//EN', uidDomain: 'fosdal.net', // the UID domain the whole family issues (the shared ics test pins it)
      desc: 'Upcoming events around San Diego\\, CA — Petco Park\\, Snapdragon Stadium\\, Pechanga Arena\\, the theatres and the music rooms' },
    teams: TEAMS,
    venues: VENUES,
    defaultOn: DEFAULT_ON,
    defaultOff: DEFAULT_OFF,
    prefsKnownFrom: PREFS_KNOWN_FROM,
    types: TYPES,
    movieVenue: MOVIE_VENUE,
    groundsVenue: null, // every listing is read by room, so nothing arrives under a name city.js lacks
    codeLength: CODE_LENGTH,
    registry: REGISTRY,
    words: WORDS,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
