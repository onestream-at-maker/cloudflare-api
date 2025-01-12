Questa è l'API di Zappr su Cloudflare Workers. Viene usata per far riprodurre al [frontend](https://github.com/ZapprTV/frontend) i canali trasmessi su Dailymotion e YouTube *(in base all'ID di un canale)*.

Per usarla, effettua una chiamata `GET` a `https://cloudflare-api.zappr.stream/api` e inserisci l'URL che vuoi "trasformare" come parametro.

Per esempio, per "trasformare" l'URL su Dailymotion di Radio Roma (`https://www.dailymotion.com/video/x96kfby`), bisognerebbe fare una richiesta a `https://cloudflare-api.zappr.stream/api?https://www.dailymotion.com/video/x96kfby`.

**Per i canali Rai e Babylon Cloud, usare l'[API su Vercel](https://github.com/ZapprTV/vercel-api).**

## URL supportati
- Dailymotion:
    - `*://(www.)dailymotion.com/video/XXXXXX`

- YouTube (in base all'ID di un canale):
    - `*://(www.)youtube.com/channel/UCxxxxxxxxxxxxxxx` (otterrà l'URL dell'ultima live avviata dal canale)
    - `*://(www.)youtube.com/channel/UCxxxxxxxxxxxxxx?Stringa` (otterrà l'URL della live che contiene nel titolo la stringa presente dopo il punto interrogativo nell'URL)