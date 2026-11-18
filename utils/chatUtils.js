import Anthropic from "@anthropic-ai/sdk";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY, // This is the default and can be omitted
    /* defaultHeaders:{
        "anthropic-version" :"2023-06-01"
    } */
});

async function getUserInput() {
    const rl = readline.createInterface(input, output);
    const userInput = await rl.question("Please enter your input to the model below :\n>>");
    rl.close();
    return userInput;
}


/**
 * 
 * @param {json[]} messages 
 * @param {string} text 
 */
async function addUserMessage(messages, text) {
    let userMessage = { "role": "user", "content": `${text}` };
    messages.push(userMessage);
}


/**
 * 
 * @param {json[]} messages 
 * @param {string} text 
 */
async function addAssistantMessage(messages, text) {
    let assistantMessage = { "role": "assistant", "content": `${text}` };
    messages.push(assistantMessage);
}

/**
 * 
 * @param {Anthropic} client 
 */
async function createChat(msg, systemPrompt = undefined) {
    // const models = await client.models.list();
    // console.log("Available models :",models);

    let params = {
        max_tokens: 1024,
        messages: msg,
        model: 'claude-haiku-5-5',
        //model: 'claude-sonnet-4-5-20250929',
        //temperature : 0.0
    }
    if (systemPrompt !== undefined) {
        params.system = systemPrompt;
    }
    const message = await client.messages.create(params);
    //console.log(message);
    const modelResp = message.content.filter(resp => resp.type === "text").map(x => x.text).join("");
    //console.log("Model REsponse =>\n",modelResp);
    return modelResp;
}

async function chatStream(msg, systemPrompt = undefined) {
    let params = {
        max_tokens: 1024,
        messages: msg,
        model: 'claude-haiku-5-5',
        stream: true
    };
    if (systemPrompt !== undefined) {
        params.system = systemPrompt;
    }

    const stream = client.messages.stream(params)
        .on("text", (text) => {
            process.stdout.write(text);
        });
    const message = await stream.finalMessage();

    // const textBlock = message.content.find((block) => block.type === "text");
    // if (textBlock && textBlock.type === "text") {
    //     console.log(textBlock.text);
    // }

    const modelResp = message.content.filter(resp => resp.type === "text").map(x => x.text).join("");
    return modelResp;
}

/**
 * 
 * @param {Anthropic} client 
 */
async function createChatWithStopSeq(msg, stopSeq = ["```"]) {
    let params = {
        max_tokens: 1024,
        messages: msg,
        model: 'claude-sonnet-5-5',  //Using Older models since new model does not support stop seq.
        stop_sequences : stopSeq
    }
    
    const message = await client.messages.create(params);
    const modelResp = message.content.filter(resp => resp.type === "text").map(x => x.text).join("");
    return modelResp;
}

export { addAssistantMessage, addUserMessage, createChat, getUserInput, chatStream , createChatWithStopSeq };