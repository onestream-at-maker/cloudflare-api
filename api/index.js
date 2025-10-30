export default {
  async fetch(request, env, ctx) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    const urlRegex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
    const supportedURLRegexes = {
      dailymotion: /^https?:\/\/(?:www\.)?dailymotion\.com\/video\/[a-zA-Z0-9]+$/g,
      livestream: /^https?:\/\/(?:www\.)?livestream\.com\/accounts\/[0-9]+\/events\/[0-9]+$/g,
      netplus: /^https?:\/\/viamotionhsi\.netplus\.ch\/live\/eds\/.*\/browser-.*\/.*\..*$/g,
      arezzotv: /^https?:\/\/(?:www\.)?arezzotv\.it.*$/g,
      schauefern: /^https?:\/\/(?:www\.)?schauefern\.com\/yayin\/.*$/g
    };

    const vercelURLRegexes = {
      rai: /^https?:\/\/mediapolis.rai.it\/relinker\/relinkerServlet.htm\?cont=[0-9]{1,}$/g,
      babylon: /^https?:\/\/(?:www\.)?[a-zA-Z0-9]{1,}\.[a-z]{2,}\/video\/viewlivestreaming\?rel=[a-zA-Z0-9]+&cntr=0$/g
    };

    const requestURL = new URL(request.url);
    const specifiedURL = decodeURIComponent(requestURL.search.slice(1));

    let testResults = { matched: false, matchedRegex: "" };
    let vercelTestResults = { matched: false, matchedRegex: "" };
    let requestStatus;
    let response = "";
    let errorJSON = "";
    let errorStatus = 0;

    const testURL = (url) => {
      if (urlRegex.test(url)) {
        for (const regex in supportedURLRegexes) {
          if (supportedURLRegexes[regex].test(url)) {
            testResults = { matched: true, matchedRegex: regex };
            break;
          }
        }
      }
    };

    const testURLforVercel = (url) => {
      if (urlRegex.test(url)) {
        for (const regex in vercelURLRegexes) {
          if (vercelURLRegexes[regex].test(url)) {
            vercelTestResults = { matched: true, matchedRegex: regex };
            break;
          }
        }
      }
    };

    const returnErrorHeaders = (errorStatus) => ({
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      status: errorStatus
    });

    if (request.method === "GET" && requestURL.pathname === "/api") {
      if (requestURL.search.length > 0) {
        testURL(specifiedURL);
        testURLforVercel(specifiedURL);

        if (vercelTestResults.matched) {
          return new Response(
            JSON.stringify({
              error:
                "You're using the Cloudflare API, but the specified URL requires the Vercel API. Read more at https://github.com/ZapprTV/cloudflare-api#readme.",
              info: specifiedURL
            }),
            returnErrorHeaders(400)
          );
        } else if (testResults.matched) {
          try {
            switch (testResults.matchedRegex) {
              case "dailymotion":
                await fetch(
                  specifiedURL.replaceAll("/video/", "/player/metadata/video/")
                )
                  .then((response) => response.json())
                  .then(async (json) => {
                    await fetch(json.qualities.auto[0].url)
                      .then((response) => response.text())
                      .then((playlist) => {
                        requestStatus = "hls";
                        response = playlist;
                      });
                  });
                break;

              case "livestream":
                await fetch(
                  `https://player-api.new.livestream.com${new URL(specifiedURL).pathname}/stream_info`
                )
                  .then((response) => response.json())
                  .then(async (json) => {
                    await fetch(json.secure_m3u8_url)
                      .then((response) => response.url)
                      .then((url) => {
                        requestStatus = "redirect";
                        response = url;
                      });
                  });
                break;

              case "netplus":
                await fetch(specifiedURL)
                  .then((netplusResponse) => {
                    requestStatus = "redirect";
                    response = netplusResponse.url;
                  });
                break;

              case "arezzotv":
                await fetch(specifiedURL)
                  .then((res) => res.text())
                  .then((html) => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, "text/html");
                    const iframe = doc.querySelector("iframe");
                    if (iframe) {
                      const youtubeEmbedURL =
                        iframe.src +
                        "?autoplay=1&modestbranding=1&rel=0&hl=it-it";
                      requestStatus = "redirect";
                      response = youtubeEmbedURL;
                    } else {
                      throw new Error("No iframe found");
                    }
                  });
                break;

              case "schauefern":
                await fetch(specifiedURL, {
                  headers: {
                    Origin: "https://www.schauefern.com",
                    Referer: "https://www.schauefern.com/"
                  }
                })
                  .then((res) => res.text())
                  .then((html) => {
                    // NEW: find m3u8 URL in the HTML using regex
                    const m3u8Match = html.match(/https?:\/\/[^"' ]+\.m3u8/g);
                    if (m3u8Match && m3u8Match.length > 0) {
                      requestStatus = "redirect";
                      response = m3u8Match[0];
                    } else {
                      throw new Error("Couldn't find HLS stream");
                    }
                  });
                break;
            }
          } catch (err) {
            requestStatus = false;
            errorJSON = JSON.stringify({
              error: "Unable to retrieve stream URL.",
              info: specifiedURL,
              details: err.message
            });
            errorStatus = 500;
          }

          if (requestStatus === "redirect") {
            return new Response(null, {
              status: 302,
              headers: {
                ...headers,
                location: response
              }
            });
          } else if (requestStatus === "hls") {
            return new Response(response, {
              status: 200,
              headers: {
                ...headers,
                "Content-Type": "application/vnd.apple.mpegurl"
              }
            });
          } else {
            return new Response(errorJSON, returnErrorHeaders(errorStatus));
          }
        } else {
          return new Response(
            JSON.stringify({
              error:
                "Invalid or unsupported URL. See supported formats at https://github.com/ZapprTV/cloudflare-api#readme.",
              info: specifiedURL
            }),
            returnErrorHeaders(400)
          );
        }
      } else {
        return new Response(
          JSON.stringify({
            error: "No URL specified in query string."
          }),
          returnErrorHeaders(400)
        );
      }
    } else if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: headers
      });
    } else {
      return new Response(
        JSON.stringify({
          error: "Invalid method or endpoint.",
          info: request.url
        }),
        returnErrorHeaders(405)
      );
    }
  }
};
