import fs from "node:fs";
import { addUserMessage, createChatHaiku45 } from "../utils/chatUtils.js";

const prompt="How were Earth's atomosphere and oceans formed?";

const messages = [];

const fileBase64 = fs.readFileSync("PDF/earth.pdf").toString("base64");


await addUserMessage(messages, [
  // Image Block
  {
    type: "document",
    source: {
      type: "base64",
      media_type: "application/pdf",
      data: fileBase64,
    },
    title : "earth.pdf",
    citations : {"enabled": true}
  },
  // Text Block
  {
    type: "text",
    //text: "What do you see in this image?",
    text: prompt
  },
]);

console.log(await createChatHaiku45(messages));
