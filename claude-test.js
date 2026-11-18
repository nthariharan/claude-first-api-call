import "@dotenvx/dotenvx/config";
import Anthropic from '@anthropic-ai/sdk';
import { addAssistantMessage, addUserMessage, createChat, getUserInput, chatStream } from "./utils/chatUtils.js";



let message = [];

while (true) {
    let text = await getUserInput();
    if ([' ', "q", "quit", "exit"].includes(text)) {
        console.log("Exiting...");
        process.exit(0);
    } else {
        await addUserMessage(message, text);
    /*     const systemPrompt = `You are a patient math tutor.
    Do not directly answer a student's questions.
    Guide them to a solution step by step.
    ` */
   /*  const systemPrompt = `You are a coding expert in providing programming solutions in a concise 
    manner. so when user requests for a solution you provide them solutions that are very short and concise. Sample usage can be short too. 
    No long explanatios needed` */
    
        //let chatResp = await createChat(message);
        let chatResp = await chatStream(message);

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