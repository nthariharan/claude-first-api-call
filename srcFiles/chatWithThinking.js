import '@dotenvx/dotenvx/config';
import Anthropic from '@anthropic-ai/sdk';
import {addUserMessage} from "../utils/chatUtils.js"

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 *
 * @param {Anthropic} client
 */
async function createChatWithThinking(msg) {
    let params = {
        max_tokens: 3000,
        messages: msg,
        model: 'claude-haiku-4-5',  
        thinking: {             //Thinking is depreceated now. hence only old model supports them 4*
            type: "enabled",
            budget_tokens: 1024
        }
    }

  
    const message = await client.messages.create(params);
    // console.log(message);
    const modelResp = message.content.filter(resp => resp.type === "text").map(x => x.text).join("");
        return modelResp;
    }

    let messages = [];
    await addUserMessage(messages,"Wirte a one paragraph guide to recursion");
    console.log(await createChatWithThinking(messages));