const express = require("express");
const request = require("request");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
var dateFormat = require("dateformat");

const app = express();

app.use(bodyParser.json());

function safe(obj) {
  return new Proxy(obj, {
    get: function(target, name) {
      const result = target[name];
      if (!!result) {
        return result instanceof Object ? safe(result) : result;
      }
      return safe({});
    }
  });
}

app.post("/", (req, res) => {
  var sbody = safe(req.body);
  var txt = "mi spiace non ho capito";
  var segno = "";
  if (sbody.request.type === "LaunchRequest") {
    var day = dateFormat(new Date(), "dd/mm/yyyy");

    txt = "per quale segno vuoi l'oroscopo del giorno? " + day;
    res.send({
      version: "1.0",
      response: {
        shouldEndSession: false,
        outputSpeech: {
          type: "SSML",
          text: txt,
          ssml: "<speak>" + txt + "</speak>"
        }
      }
    });
  } else if (sbody.request.intent.name === "oroscopo") {
    segno = sbody.request.intent.slots.segno.value;
    var myDate = new Date();
    myDate.setTime(myDate.getTime() - 24 * 60 * 60 * 1000 * 364);
    var day = dateFormat(myDate, "dd/mm/yyyy/");
    var url =
      "https://astrologando.marieclaire.com/it/oroscopo/giorno/" +
      day +
      segno +
      ".html";
    request(url, function(error, response, html) {
      if (error) {
        res.send({
          version: "1.0",
          response: {
            shouldEndSession: true,
            outputSpeech: {
              type: "SSML",
              text:
                error +
                "mi spiace in questo momento non riesco a leggerti il tuo oroscopo",
              ssml:
                "<speak>mi spiace in questo momento non riesco a leggerti il tuo oroscopo</speak>"
            }
          }
        });
      } else {
        var $ = cheerio.load(html);
        txt = $("p")
          .first()
          .next()
          .text();

        res.send({
          version: "1.0",
          response: {
            shouldEndSession: false,
            outputSpeech: {
              type: "SSML",
              text:
                "https://astrologando.marieclaire.com/it/oroscopo/giorno/" +
                day +
                segno +
                ".html",
              ssml:
                "<speak>questo è l'oroscopo del giorno per il segno " +
                segno +
                ". " +
                txt +
                "</speak>"
            }
          }
        });
      }
    });
  } else {
    res.send({
      version: "1.0",
      response: {
        shouldEndSession: true,
        outputSpeech: {
          type: "SSML",
          text:
            "mi spiace in questo momento non riesco a leggere il tuo oroscopo",
          ssml:
            "<speak>mi spiace in questo momento non riesco a leggere il tuo oroscopo</speak>"
        }
      }
    });
  }
});
app.listen(8080, () => console.log("Example app listening on port 8080!"));
