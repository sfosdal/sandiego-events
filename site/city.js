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
      geo: [32.7071, -117.15681],
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
      geo: [32.78451, -117.1212],
      capacity: 35000,
      type: 'sports',
      cssVar: '--v-snapdragon',
      color: '#86eaa3',
      url: 'https://www.snapdragonstadium.com/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.snapdragonstadium.com&sz=128',
      tm: { id: 'KovZ917AIoi', match: 'snapdragon', fallbackUrl: 'https://www.snapdragonstadium.com/events', exclude: /parking|tour/i },
      // the stadium's own listing (Carbonhouse: /events/all is the whole list on one page; a club's season is one card with a date range, dropped — the home games come from the Teams schedules), secondary behind Ticketmaster (2026-10-27)
      feed: { kind: 'cards', secondary: true, url: 'https://www.snapdragonstadium.com/events/all', drop: /^san diego state football|^san diego fc\b|season tickets?|suites?\b/i,
        item: /<div class="eventItem entry/, title: /<h3 class="title[^"]*">\s*<a href="([^"]+)"[^>]*>([^<]+)</, when: /<div class="date">([\s\S]*?)<\/div>/ },
      alias: /snapdragon stadium/i,
    },
    'Pechanga Arena': {
      geo: [32.75527, -117.2122],
      capacity: 12920,
      type: 'concert',
      cssVar: '--v-pechanga',
      color: '#c086ea',
      url: 'https://www.pechangaarenasd.com/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.pechangaarenasd.com&sz=128',
      tm: { id: 'KovZpZAEd1EA', match: 'pechanga arena', fallbackUrl: 'https://www.pechangaarenasd.com/events', exclude: /parking/i },
      // the arena's own listing (Carbonhouse /events/all: every event, the date only — no clock on the list page and none machine-readable on the event pages; the RSS's clocks are 3 h off), secondary behind Ticketmaster; the Gulls' games come from the AHL schedule (2026-10-27)
      feed: { kind: 'cards', secondary: true, url: 'https://www.pechangaarenasd.com/events/all', drop: /^san diego gulls\b|parking/i,
        item: /<div class="eventItem entry/, title: /<h3 class="title[^"]*">\s*<a href="([^"]+)"[^>]*>([^<]+)</, when: /<div class="date">([\s\S]*?)<\/div>/ },
      alias: /pechanga arena|valley view casino center|san diego sports arena/i,
    },
    'Viejas Arena': {
      geo: [32.77229, -117.07192],
      capacity: 12414,
      type: 'sports',
      cssVar: '--v-viejas',
      color: '#eadd86',
      url: 'https://as.sdsu.edu/viejas_arena/events/',
      icon: 'https://www.google.com/s2/favicons?domain=as.sdsu.edu&sz=128',
      tm: { id: 'KovZpZA6AEdA', match: 'viejas', fallbackUrl: 'https://as.sdsu.edu/viejas_arena/events/' },
      // Associated Students' own list for the arena (one card a show: "February 28, 2027" + "8:00pm"), secondary behind Ticketmaster; the Aztecs' games come from the Teams schedules (2026-10-27)
      feed: { kind: 'cards', secondary: true, url: 'https://as.sdsu.edu/viejas_arena/events/', drop: /\b(aztecs?|sdsu|san diego state)\b/i,
        item: /<div class="bg-light event-card">/, title: /<a href="([^"]+)">[\s\S]*?<h2 class="text-danger[^"]*">([^<]+)<\/h2>/, when: /title="Calendar Icon:"><\/i>\s*([^<]+)<[\s\S]*?title="Scheduled Start Time:"><\/i>\s*([^<]+)</ },
      alias: /viejas arena/i,
    },
    'San Diego Civic Theatre': {
      geo: [32.71779, -117.162],
      capacity: 2967,
      type: 'arts',
      cssVar: '--v-civic',
      color: '#86d9ea',
      url: 'https://sandiegotheatres.org/events/',
      icon: 'https://www.google.com/s2/favicons?domain=sandiegotheatres.org&sz=128',
      tm: { id: 'KovZpZAEA6kA', match: 'civic theatre', fallbackUrl: 'https://sandiegotheatres.org/events/' },
      // San Diego Theatres' own list (Carbonhouse /events/all: both houses, the Civic's cards kept by `venues`; a Broadway run is one card with a date range), secondary behind Ticketmaster (2026-10-27)
      feed: { kind: 'cards', secondary: true, url: 'https://www.sandiegotheatres.org/events/all', venues: /civic/i,
        item: /<div class="eventItem entry/, title: /<h3 class="title[^"]*">\s*<a href="([^"]+)"[^>]*>([^<]+)</, when: /<div class="date">([\s\S]*?)<\/div>/, place: /<div class="venue_title"[^>]*>([^<]+)</ },
      alias: /civic theat/i,
    },
    'Balboa Theatre': {
      geo: [32.71433, -117.16123],
      capacity: 1339,
      type: 'arts',
      cssVar: '--v-balboa',
      color: '#ea86bc',
      url: 'https://sandiegotheatres.org/events/',
      icon: 'https://www.google.com/s2/favicons?domain=sandiegotheatres.org&sz=128',
      tm: { id: 'KovZpZAEAlIA', match: 'balboa theatre', fallbackUrl: 'https://sandiegotheatres.org/events/' },
      // San Diego Theatres' own list, the Balboa's cards (see the Civic), secondary behind Ticketmaster (2026-10-27)
      feed: { kind: 'cards', secondary: true, url: 'https://www.sandiegotheatres.org/events/all', venues: /balboa/i,
        item: /<div class="eventItem entry/, title: /<h3 class="title[^"]*">\s*<a href="([^"]+)"[^>]*>([^<]+)</, when: /<div class="date">([\s\S]*?)<\/div>/, place: /<div class="venue_title"[^>]*>([^<]+)</ },
      alias: /balboa theat/i,
    },
    'Jacobs Music Center': {
      geo: [32.71867, -117.1579],
      capacity: 1800,
      type: 'arts',
      cssVar: '--v-jacobs',
      color: '#9fea86',
      url: 'https://www.sandiegosymphony.org/',
      icon: 'https://www.google.com/s2/favicons?domain=www.sandiegosymphony.org&sz=128',
      tm: { id: 'KovZpZAJ6d1A', match: 'jacobs music center', fallbackUrl: 'https://www.sandiegosymphony.org/', secondary: true }, // Ticketmaster, read behind the Symphony's own calendar — every venue both ways (Steve, 2026-10-26)
      // the Symphony's own calendar (Tessitura: the page embeds every performance as a JS object — title, location, moreDetailsUrl, performanceDate as the hall's wall clock; its Civic Theatre and tour dates kept out by `venues`), LEADS (2026-10-27)
      feed: { kind: 'cards', url: 'https://www.sandiegosymphony.org/performances/performances-calendar', venues: /jacobs music center/i,
        item: /\{performanceId:/, title: /(?=[\s\S]*?moreDetailsUrl:"([^"]*)")[\s\S]*?\btitle:"([^"]*)"/, when: /performanceDate:"([^"]*)"/, place: /location:"([^"]*)"/ },
      alias: /jacobs music center|copley symphony hall/i,
    },
    'The Rady Shell': {
      geo: [32.70602, -117.16343],
      capacity: 10000,
      type: 'concert',
      cssVar: '--v-shell',
      color: '#8a86ea',
      url: 'https://www.theshell.org/',
      icon: 'https://www.google.com/s2/favicons?domain=www.theshell.org&sz=128',
      tm: { id: 'KovZ917AJ-O', match: 'rady shell', fallbackUrl: 'https://www.theshell.org/', exclude: /parking/i, secondary: true }, // Ticketmaster, read behind the Shell's own calendar — every venue both ways (Steve, 2026-10-26)
      // the Shell's own calendar (the Symphony's Tessitura page on theshell.org: every performance a JS object, performanceDate the wall clock), LEADS (2026-10-27)
      feed: { kind: 'cards', url: 'https://www.theshell.org/performances/rady-shell-calendar/', venues: /rady shell/i,
        item: /\{performanceId:/, title: /(?=[\s\S]*?moreDetailsUrl:"([^"]*)")[\s\S]*?\btitle:"([^"]*)"/, when: /performanceDate:"([^"]*)"/, place: /location:"([^"]*)"/ },
      alias: /rady shell/i,
    },
    'The Old Globe': {
      geo: [32.7253, -117.166],
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
      geo: [32.71698, -117.22363],
      area: 'town',
      capacity: 1400,
      type: 'concert',
      cssVar: '--v-humphreys',
      color: '#86eac4',
      url: 'https://www.humphreysconcerts.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.humphreysconcerts.com&sz=128',
      tm: { id: 'KovZpZAJ7AIA', match: 'humphreys concerts', fallbackUrl: 'https://www.humphreysconcerts.com/' },
      // the venue's own schedule page (ColdFusion rows: the show's name and Ticketmaster link as data attributes, "Tue, Oct 27 7:30 PM" printed; no year — the nearest forward), secondary behind Ticketmaster (2026-10-27)
      feed: { kind: 'cards', secondary: true, url: 'https://www.humphreysconcerts.com/schedule.cfm',
        item: /<!-- =+\s+BEGINNING OF EVENT ROW/, title: /(?=[\s\S]*?data-buytixlink="([^"]*)")[\s\S]*?data-eventname="([^"]*)"/, when: /<div class="text-center ">([^<]*)<\/div>/ },
      alias: /humphreys concerts/i,
    },
    'Humphreys Backstage Live': {
      geo: [32.7166, -117.2241],
      area: 'town',
      capacity: 300,
      type: 'concert',
      cssVar: '--v-backstage',
      color: '#e186ea',
      url: 'https://www.humphreysbackstagelive.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.humphreysbackstagelive.com&sz=128',
      tm: { id: 'KovZpZAEeFFA', match: 'backstage', fallbackUrl: 'https://www.humphreysbackstagelive.com/', secondary: true }, // Ticketmaster, read behind the club's own calendar — every venue both ways (Steve, 2026-10-26)
      // the club's own calendar (The Events Calendar REST; its "Open – No live Music" and bare "Concert Night" placeholders dropped), LEADS (2026-10-27)
      feed: { kind: 'tribe', url: 'https://www.humphreysbackstagelive.com/wp-json/tribe/events/v1/events', drop: /no live music|^concert night$|^(open|closed)\b|^private event/i },
      alias: /humphreys backstage/i,
    },
    'Cal Coast Open Air Theatre': {
      geo: [32.77479, -117.07123],
      area: 'town',
      capacity: 4600,
      type: 'concert',
      cssVar: '--v-openair',
      color: '#d5ea86',
      url: 'https://as.sdsu.edu/calcoast/', // as.sdsu.edu/openairtheatre/events/ went 404 (2026-10-27)
      icon: 'https://www.google.com/s2/favicons?domain=as.sdsu.edu&sz=128',
      tm: { id: 'KovZpZAJA6IA', match: 'open air theatre', fallbackUrl: 'https://as.sdsu.edu/calcoast/' },
      // Associated Students' page for the theatre (its upcoming shows as cards: "Fri, Oct 30, 2026, 8pm"; the same card twice — desktop and carousel — folds by eventKey), secondary behind Ticketmaster (2026-10-27)
      feed: { kind: 'cards', secondary: true, url: 'https://as.sdsu.edu/calcoast/',
        item: /<div class="card h-100">/, title: /<a href="([^"]+)" class="h-100"[^>]*>[\s\S]*?<h2 class="card-title">([^<]+)<\/h2>/, when: /<p class="card-date">([^<]+)<\/p>/ },
      alias: /open air theat/i,
    },
    'North Island Credit Union Amphitheatre': {
      geo: [32.5883, -117.00641],
      area: 'town',
      capacity: 20500,
      type: 'concert',
      cssVar: '--v-nicu',
      color: '#86b7ea',
      url: 'https://www.livenation.com/venue/KovZpa2WZe/north-island-credit-union-amphitheatre-events',
      icon: 'https://www.google.com/s2/favicons?domain=www.livenation.com&sz=128',
      tm: { id: 'KovZpa2WZe', match: 'north island', fallbackUrl: 'https://www.livenation.com/venue/KovZpa2WZe/north-island-credit-union-amphitheatre-events', exclude: /parking/i },
      // the amphitheatre's only listing is Live Nation's venue page (schema.org Event markup; the season-ticket waitlist dropped), secondary behind Ticketmaster (2026-10-27)
      feed: { kind: 'jsonld', secondary: true, url: 'https://www.livenation.com/venue/KovZpa2WZe/north-island-credit-union-amphitheatre-events', drop: /waitlist|season tickets?|parking/i },
      alias: /north island credit union|mattress firm amphitheat|sleep train amphitheat/i,
    },
    'House of Blues': {
      geo: [32.71637, -117.16009],
      area: 'town',
      capacity: 1100,
      type: 'concert',
      cssVar: '--v-hob',
      color: '#ea869a',
      url: 'https://www.houseofblues.com/sandiego',
      icon: 'https://www.google.com/s2/favicons?domain=www.houseofblues.com&sz=128',
      tm: { id: 'KovZpZAEAltA', match: 'house of blues san diego', fallbackUrl: 'https://www.houseofblues.com/sandiego' },
      // the venue's own site, the Music Hall's show page (schema.org Event markup, scoped to that room; the Voodoo Room has its own page), secondary behind Ticketmaster (2026-10-27)
      feed: { kind: 'jsonld', secondary: true, url: 'https://sandiego.houseofblues.com/shows/rooms/music-hall', drop: /add[- ]on|not an event ticket/i },
      alias: /^house of blues( san diego)?$/i,
    },
    'Voodoo Room': {
      geo: [32.71662, -117.15951],
      area: 'town',
      capacity: 300,
      type: 'concert',
      cssVar: '--v-voodoo',
      color: '#86ea8e',
      url: 'https://www.houseofblues.com/sandiego',
      icon: 'https://www.google.com/s2/favicons?domain=www.houseofblues.com&sz=128',
      tm: { id: 'KovZ917AI8j', match: 'voodoo', fallbackUrl: 'https://www.houseofblues.com/sandiego' },
      // the House of Blues site's Voodoo Room show page (schema.org Event markup, scoped to the room), secondary behind Ticketmaster (2026-10-27)
      feed: { kind: 'jsonld', secondary: true, url: 'https://sandiego.houseofblues.com/shows/rooms/voodoo-room', drop: /add[- ]on|not an event ticket/i },
      alias: /voodoo room/i,
    },
    'The Observatory North Park': {
      geo: [32.7481, -117.13121],
      area: 'town',
      capacity: 1100,
      type: 'concert',
      cssVar: '--v-observatory',
      color: '#ab86ea',
      url: 'https://www.observatorysd.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.observatorysd.com&sz=128',
      tm: { id: 'KovZ917AxAB', match: 'observatory', fallbackUrl: 'https://www.observatorysd.com/' },
      // the venue's own show page (schema.org Event markup; VIP add-ons dropped), secondary behind Ticketmaster (2026-10-27)
      feed: { kind: 'jsonld', secondary: true, url: 'https://www.observatorysd.com/shows', drop: /add[- ]on|not an event ticket|upgrade/i },
      alias: /observatory north park/i,
    },
    'Belly Up': {
      geo: [32.99052, -117.2705],
      area: 'town',
      capacity: 600,
      type: 'concert',
      cssVar: '--v-bellyup',
      color: '#eac886',
      url: 'https://bellyup.com/',
      icon: 'https://www.google.com/s2/favicons?domain=bellyup.com&sz=128',
      tm: { id: 'KovZpZAAAknA', match: 'belly up', fallbackUrl: 'https://bellyup.com/' },
      // the club's own shows page (TicketWeb widget cards: the date — no clock on the list — the headliner and the show page; its Belly Up Presents nights at other clubs kept out by `venues`), secondary behind Ticketmaster (2026-10-27)
      feed: { kind: 'cards', secondary: true, url: 'https://bellyup.com/shows/', venues: /^belly up/i,
        item: /<div class="showBox">/, title: /<a style="text-decoration: none" href="([^"]+)">\s*<div class="sws-show-content">[\s\S]*?<span class="tw-artist[^"]*">([^<]+)<\/span>/, when: /<span class="tw-event-date">([^<]+)<\/span>/, place: /<span class="pipeBreak"><br><\/span>\s*([^<]+?)\s*</ },
      alias: /belly up/i,
    },
    'SOMA': {
      geo: [32.75382, -117.20927],
      area: 'town',
      capacity: 2200,
      type: 'concert',
      cssVar: '--v-soma',
      color: '#86eae6',
      url: 'https://somasandiego.com/',
      icon: 'https://www.google.com/s2/favicons?domain=somasandiego.com&sz=128',
      tm: { id: 'KovZpZA1teEA', match: 'soma', fallbackUrl: 'https://somasandiego.com/' },
      // the venue's own events page (WordPress cards: month / day / year spans, "Mainstage - 7pm" or "Doors 6 pm" as the clock), secondary behind Ticketmaster (2026-10-27)
      feed: { kind: 'cards', secondary: true, url: 'https://www.somasandiego.com/events/',
        item: /<li class="event-(?:onsale|soldout)">/, title: /<h3><a href="([^"]+)">([^<]+)<\/a><\/h3>/, when: /<span class="event-month">([^<]+)<\/span>\s*<span class="event-day">([^<]+)<\/span>\s*<span class="event-year">([^<]+)<\/span>[\s\S]*?<div class="event-time">([^<]*)<\/div>/ },
      alias: /^soma\b/i,
    },
    'Music Box': {
      geo: [32.71938, -117.16813],
      area: 'town',
      capacity: 700,
      type: 'concert',
      cssVar: '--v-musicbox',
      color: '#ea86d0',
      url: 'https://musicboxsd.com/',
      icon: 'https://www.google.com/s2/favicons?domain=musicboxsd.com&sz=128',
      tm: { id: 'KovZ917AfM7', match: 'music box', fallbackUrl: 'https://musicboxsd.com/' },
      // the venue's own shows page (TicketWeb cards: "Wed, Oct 28" — no clock on the list — the headliner and the show page), secondary behind Ticketmaster (2026-10-27)
      feed: { kind: 'cards', secondary: true, url: 'https://musicboxsd.com/shows/',
        item: /<article class="event-card">/, title: /<div class="tw-opening-act">\s*<a href="([^"]+)">\s*<span class="tw-artist[^"]*">([^<]+)<\/span>/, when: /<div class="date">\s*([^<]+?)\s*<\/div>/ },
      alias: /^(the )?music box$/i,
    },
    'Casbah': {
      geo: [32.7303, -117.17179],
      area: 'town',
      capacity: 200,
      type: 'concert',
      cssVar: '--v-casbah',
      color: '#b3ea86',
      url: 'https://casbahmusic.com/',
      icon: 'https://www.google.com/s2/favicons?domain=casbahmusic.com&sz=128',
      tm: { id: 'KovZpZAaEveA', match: 'casbah', fallbackUrl: 'https://casbahmusic.com/', secondary: true }, // Ticketmaster, read behind the club's own calendar — every venue both ways (Steve, 2026-10-26)
      // the club's own calendar (SeeTickets list: "Wed Mar 3", the show time, "at Casbah" — its Casbah Presents nights at Soda Bar, the Music Box and the Belly Up kept out by `venues`), LEADS (2026-10-27)
      feed: { kind: 'cards', chrome: true, url: 'https://casbahmusic.com/calendar/', venues: /^casbah$/i,
        item: /<div\s+class="mdc-card display-flex mt-12 mb-12 seetickets-list-event-container/, title: /<p class="fs-18 bold mb-12 event-title"><a href="([^"]+)"[^>]*>([^<]+)<\/a>/, when: /event-date">([^<]*)<[\s\S]*?see-showtime[^>]*>([^<]*)</, place: /<p class="fs-12 venue">at ([^<]*)<\/p>/ },
      alias: /casbah/i,
    },
    'The Magnolia': {
      geo: [32.79563, -116.95955],
      area: 'town',
      capacity: 1200,
      type: 'concert',
      cssVar: '--v-magnolia',
      color: '#8696ea',
      url: 'https://www.livenation.com/venue/KovZ917AOww/the-magnolia-events', // themagnoliasd.com is a parked "Coming Soon" page (2026-10-27)
      icon: 'https://www.google.com/s2/favicons?domain=themagnoliasd.com&sz=128',
      tm: { id: 'KovZ917AOww', match: 'magnolia', fallbackUrl: 'https://www.livenation.com/venue/KovZ917AOww/the-magnolia-events' },
      // Live Nation's venue page, the theatre's only listing (schema.org Event markup; soundcheck add-ons dropped), secondary behind Ticketmaster (2026-10-27)
      feed: { kind: 'jsonld', secondary: true, url: 'https://www.livenation.com/venue/KovZ917AOww/the-magnolia-events', drop: /add[- ]on|not an event ticket|soundcheck/i },
      alias: /the magnolia/i,
    },
    'Brick by Brick': {
      geo: [32.76872, -117.20104],
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
      geo: [32.9758, -117.2583],
      area: 'town',
      capacity: 1900,
      type: 'concert',
      cssVar: '--v-sound',
      color: '#86eab0',
      url: 'https://thesoundsd.com/', // thesounddelmar.com does not resolve (2026-10-27)
      icon: 'https://www.google.com/s2/favicons?domain=thesounddelmar.com&sz=128',
      tm: { id: 'KovZ917Atrk', match: 'the sound', fallbackUrl: 'https://thesoundsd.com/' },
      // the venue's own site (TicketWeb widget cards: "Oct 27" — no clock on the list — the headliner and the event page; a show it presents elsewhere kept out by `venues`), secondary behind Ticketmaster (2026-10-27)
      feed: { kind: 'cards', secondary: true, url: 'https://thesoundsd.com/', venues: /the sound/i,
        item: /<div class="showBox">/, title: /<div class='mainAct'><a href='([^']+)'><span class="tw-artist[^"]*">([^<]+)<\/span>/, when: /<span class="tw-event-date">([^<]+)<\/span>/, place: /line-height: \.25em">\s*\|\s*([^<]+?)\s*</ },
      alias: /^the sound$/i,
    },
    'Del Mar Fairgrounds': {
      geo: [32.97449, -117.25985],
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
      // the resort's own Entertain page (one tile a show: "Oct 30, 2026", "8PM", the show page), secondary behind Ticketmaster (2026-10-27)
      feed: { kind: 'cards', secondary: true, url: 'https://www.pechanga.com/entertain',
        item: /<li class="grid-item content-tile/, title: /<h2 class="heading-small">\s*<a href="([^"]+)"[^>]*>\s*([^<]+?)\s*<\/a>/, when: /<ul class="details-list">\s*<li>\s*([^<]+?)\s*<\/li>\s*<span class="bar"><\/span>\s*<li>([^<]*)<\/li>/ },
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
    presetDefault: 'Every venue — the ballpark, the stadium, the arenas, the theatres, the music venues and the places around the county — every team and type',
    presetNeighborhood: 'Downtown and the stadiums only',
    presetBig: 'Only the places that hold 2,000 or more — the ballpark, the stadium, the arenas, the amphitheatres and the big theatres',
    phrases: { all: 'Showing everything.', none: 'Showing nothing yet — open Filter and pick some venues.', neighborhood: 'Showing downtown and the stadiums only.', big: 'Showing the big venues only — the ballpark, the stadium, the arenas, the amphitheatres and the big theatres.' },
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
    map: { // the Map view (local-map.js; the ground drawn once by scripts/build-local-map.mjs from OpenStreetMap, committed as site/local-map.json) — every city gets one, Steve, 2026-10-26
      kind: 'urban',
      bbox: [32.528, -117.317, 33.051, -116.913], // south, west, north, east — every room, with a margin
      home: [32.686, -117.247, 32.804, -117.037], // the view at first: the city's own rooms; the fit button shows the whole frame
      roads: ['motorway', 'trunk', 'primary'],
      tolerance: 0.8,
      labels: [
        { name: 'San Diego', lat: 32.716, lon: -117.161, anchor: 'middle' },
        { name: 'Chula Vista', lat: 32.64005, lon: -117.08419, anchor: 'middle' },
        { name: 'Solana Beach', lat: 32.99191, lon: -117.26781, anchor: 'middle' },
        { name: 'El Cajon', lat: 32.79477, lon: -116.96253, anchor: 'middle' },
        { name: 'Del Mar', lat: 32.95949, lon: -117.26531, anchor: 'middle' },
      ],
    },
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
