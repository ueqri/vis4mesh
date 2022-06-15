import * as d3 from "d3";

const ActiveSVG: string = require("../../public/icon/ok.svg");

function generateEmojiListInHex() {
  let emoji = [];
  let start = parseInt("1f600", 16),
    end = parseInt("1f644", 16);
  for (let i = start; i <= end; i++) {
    emoji.push(i.toString(16) + ".svg");
  }
  // console.log(emoji);
  return emoji;
}

const emoji = generateEmojiListInHex();

const randomPick = Math.floor(Math.random() * emoji.length);

const emojiCDN = "https://fastly.jsdelivr.net/npm/twemoji@12.0.0/2/svg/";

d3.select("#dataport-status-icon").attr("src", emojiCDN + emoji[randomPick]);

export default function RenderDataPortStatus() {
  d3.select("#dataport-status-icon").attr("src", ActiveSVG);
}
