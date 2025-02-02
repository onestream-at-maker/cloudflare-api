Questa è l'API di Zappr su Cloudflare Workers. Viene usata per far riprodurre al [frontend](https://github.com/ZapprTV/Zappr) i canali trasmessi su Dailymotion e Vimeo Livestream.

Per usarla, effettua una chiamata `GET` a `https://cloudflare-api.zappr.stream/api` e inserisci l'URL che vuoi "trasformare" come parametro.

Per esempio, per "trasformare" l'URL su Dailymotion di Radio Roma (`https://www.dailymotion.com/video/x96kfby`), bisognerebbe fare una richiesta a `https://cloudflare-api.zappr.stream/api?https://www.dailymotion.com/video/x96kfby`.

**Per i canali trasmessi su Babylon Cloud e i canali Rai _(senza geoblocking)_, usare l'[API su Vercel](https://github.com/ZapprTV/vercel-api).**

## URL supportati
- Dailymotion:
    - `*://(www.)dailymotion.com/video/XXXXXX`

- Vimeo Livestream:
    - `*://(www.)livestream.com/accounts/XXXXXX/events/XXXXXX`