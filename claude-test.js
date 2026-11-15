import Anthropic from '@anthropic-ai/sdk';
import { loadEnvFile } from "node:process";
import { addAssistantMessage, addUserMessage, createChat, getUserInput } from "./utils/chatUtils.js";


loadEnvFile();

const client = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

let message = [];
let userInput = [];

while (true) {
    let text = await getUserInput();
    if ([' ', "q", "quit", "exit"].includes(text)) {
        console.log("Exiting...");
        process.exit(0);
    } else {
        await addUserMessage(message, text);
        let chatResp = await createChat(client, message);
        console.log("Response from Claude:\n>>", chatResp);
        await addAssistantMessage(message, chatResp);
    }
}

/*
await addUserMessage(message, "What is quantum computing? answer in one sentence");
let chatResp = await createChat(client, message);
console.log("Chat response =>", chatResp);
await addAssistantMessage(message, chatResp);
await addUserMessage(message, "Write one more sentence");
chatResp = await createChat(client, message);
console.log("Chat response =>", chatResp);
await addAssistantMessage(message, chatResp);
*/