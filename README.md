# San Diego Events

Event feed and calendar for San Diego: Petco Park, Snapdragon Stadium,
Pechanga Arena, Viejas Arena, the Civic and Balboa theatres, the Symphony
(Jacobs Music Center and the Rady Shell), the Old Globe, the music rooms from
Shelter Island to Solana Beach, and Chula Vista, Del Mar and Temecula — with
the home teams' seasons (Padres, San Diego FC, Wave, Aztecs football and
basketball, Gulls) in a Teams view.

Live at **https://sandiego.here.events/** once the domain is wired (GitHub
Pages, built by the Actions workflow once a day at noon Pacific).

The fourth city on the lqa-events codebase, after Everett and Chicago:
everything that makes this San Diego's is `site/city.js` (every team, venue,
type, default, share-code registry and string), `site/index.html`,
`scripts/fetch-events.mjs` (the sources), `site/embed.js`, `outlook.json`,
`scripts/data/postseason.json`, `channels.json`, the manifest and icons (a sun
over the bay, rendered from `favicon.svg`). Everything else is lqa-events' own,
byte for byte — copy from there, never edit here.

## Embed

```html
<div id="sandiego-events"></div>
<script src="https://sandiego.here.events/embed.js" data-max="8" defer></script>
```

## Sources

- **Ticketmaster Discovery API** — every room by its venue id (every page):
  25 rooms, from the ballpark to the 200-seat Casbah. There is no city sweep,
  as in Chicago. Church events are left out (`isChurch`).
- **Seasons** — ESPN for San Diego FC, the Wave and both Aztecs sides; MLB's
  stats API for the Padres; the AHL's HockeyTech feed for the Gulls
  (`scripts/schedules.mjs`, shared with lqa — the HockeyTech adapter is
  Everett's WHL one with the AHL's client code).

Next to add: the rooms whose shows Ticketmaster never lists (the Casbah's and
Soda Bar's own box office, the Rady Shell's full season, the La Jolla
Playhouse), the county fair and the festivals, and the Legion (Major League
Rugby — lqa's Seawolves parser is site-specific).

## Local run

```sh
cp .env.example .env   # TICKETMASTER_API_KEY=…
ALLOW_NO_ARCHIVE=1 node scripts/fetch-events.mjs   # ALLOW_NO_ARCHIVE only until the site has published once
node --test scripts/*.test.mjs
```
