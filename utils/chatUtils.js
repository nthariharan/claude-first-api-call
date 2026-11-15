import Anthropic from "@anthropic-ai/sdk";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";



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
async function createChat(client, msg) {
    const message = await client.messages.create({
        max_tokens: 1024,
        messages: msg,
        model: 'claude-haiku-5-5',
    });
    console.log(message)
    // console.log(message.content[0].text);
    return message.content[0].text;
}

export {addAssistantMessage, addUserMessage, createChat,getUserInput};