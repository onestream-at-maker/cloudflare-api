// add to supportedURLRegexes:
// decanli: /^https?:\/\/(?:www\.)?de\.canli\.co\/yayin\/.*$/g

case "decanli":
  await fetch(specifiedURL, {
    headers: {
      Origin: "https://www.de.canli.co",
      Referer: "https://www.de.canli.co/"
    }
  })
    .then((res) => res.text())
    .then((html) => {
      // try DOM parsing first (like the original Livetvuk logic)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const source = doc.querySelector("source");

      if (source && source.src) {
        requestStatus = "redirect";
        response = source.src.replaceAll(/&remote=no_check_ip.*/g, "");
      } else {
        // fallback: search raw HTML for any .m3u8 URL (useful if the page builds the source via JS)
        const m3u8Match = html.match(/https?:\/\/[^"' ]+\.m3u8(\?[^"' ]*)?/g);
        if (m3u8Match && m3u8Match.length > 0) {
          requestStatus = "redirect";
          response = m3u8Match[0];
        } else {
          throw new Error("Couldn't find stream URL");
        }
      }
    })
    .catch((err) => {
      requestStatus = false;
      errorJSON = JSON.stringify({
        error: "Couldn't get the stream URL.",
        info: err.message
      });
      errorStatus = 500;
    });
  break;
