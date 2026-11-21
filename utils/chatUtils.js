import "@dotenvx/dotenvx/config";
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { getCurrentDateTime, getCurrentDateTimeSchema } from "../tools/getCurrentDateTime.js";
import {addDurationToDatetime,addDurationToDatetimeSchema,batchToolSchema,setReminder,setReminderSchema} from "../tools/addDuration.js";


const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY, // This is the default and can be omitted
    /* defaultHeaders:{
        "anthropic-version" :"2023-06-01"
    } */
});

/**
 * Logs the tokens spent on one API call.
 * @param {object} message - the Message object returned by the API
 */
function logTokenUsage(message) {
    const { input_tokens, output_tokens } = message.usage;
    console.log(`[Tokens] input: ${input_tokens} | output: ${output_tokens} | total: ${input_tokens + output_tokens}`);
}

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
    let userMessage = { "role": "user", "content": text };
    messages.push(userMessage);
}


/**
 * 
 * @param {json[]} messages 
 * @param {string} text 
 */
async function addAssistantMessage(messages, message) {
    // Same check as the Python helper: an API response contributes its .content
    // (the array of text / tool_use blocks); anything else is stored as-is.
    const content = (typeof message === "object" && message !== null && "content" in message)
        ? message.content
        : message;
    let assistantMessage = { "role": "assistant", "content": content };
    messages.push(assistantMessage);
}

/**
 * 
 * @param {json[]} messages 
 * @param {string} text 
 */
async function addToolResultMessage(messages, toolId, result) {
    let assistantMessage = {
        "role": "user",
        "content": [
            {
                "type": "tool_result",
                "tool_use_id": toolId,
                "content": `${result}`,
                "isError": false
            }
        ]
    };

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
    logTokenUsage(message);
    //console.log(message);
    const modelResp = message.content.filter(resp => resp.type === "text").map(x => x.text).join("");
    //console.log("Model REsponse =>\n",modelResp);
    return modelResp;
}

async function chatStream(msg, systemPrompt = undefined) {
    let params = {
        max_tokens: 2000,
        messages: msg,
        model: 'claude-haiku-4-5',
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
    console.log(); // newline after streamed text
    logTokenUsage(message);

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
        max_tokens: 2000,
        messages: msg,
        model: 'claude-haiku-4-5',  //Using Older models since new model does not support stop seq.
        stop_sequences: stopSeq
    }

    const message = await client.messages.create(params);
    logTokenUsage(message);
    const modelResp = message.content.filter(resp => resp.type === "text").map(x => x.text).join("");
    return modelResp;
}


/**
 * 
 * @param {Anthropic} client 
 */
async function createChatWithTools(msg, tools = [getCurrentDateTimeSchema,addDurationToDatetimeSchema,setReminderSchema]) {
    let params = {
        max_tokens: 1024,
        messages: msg,
        model: 'claude-haiku-4-5',
        tools: tools
    }

    const message = await client.messages.create(params);
    logTokenUsage(message);
    // const modelResp = message.content.filter(resp => resp.type === "text").map(x => x.text).join("");
    // //console.log("Model REsponse =>\n",modelResp);
    // return modelResp;

    return message;
}

/**
 * Returns the text of a model response, skipping non-text blocks (e.g. tool_use).
 * Same as the Python text_from_message helper: text blocks joined by "\n".
 * @param {object} message - the Message object returned by the API
 */
function textFromMessage(message) {
    return message.content
        .filter(block => block.type === "text")
        .map(block => block.text)
        .join("\n");
}


async function runConversation(messages) {
    let response = [];
    while (true) {
        response = await createChatWithTools(messages);
        await addAssistantMessage(messages, response);
        console.log(textFromMessage(response));

        if (response.stop_reason != "tool_use") {
            break;
        }

        const toolResults = await runTools(response);
        messages.push({ "role": "user", "content": toolResults });


    }

    return response;
}


/**
 * Returns the tools the model can use, keyed by the tool name used in the schema.
 * To add a tool: implement it, add its schema to the tools list, and add an entry here.
 * @returns {Object<string, Function>}
 */
function getToolFunctions() {
    return {
        "getCurrentDateTime": (input) => getCurrentDateTime(input.dateFormat),
        "addDurationToDatetime": (input) => addDurationToDatetime(input.datetime_str, input.duration, input.unit),
        "setReminder": (input) => setReminder(input.content, input.timestamp),
    };
}

/**
 * Runs every tool_use block in the response and returns the matching tool_result blocks.
 * @param {object} message - the Message object returned by the API
 * @returns {Promise<object[]>} tool_result blocks, one per tool_use block
 */
async function runTools(message) {
    const toolFunctions = getToolFunctions();
    const toolRequests = message.content.filter(block => block.type === "tool_use");
    const toolResultBlocks = [];

    for (const toolRequest of toolRequests) {
        try {
            // Look up the tool by name; an unknown name throws and is reported as an error result
            const toolFunction = toolFunctions[toolRequest.name];
            if (!toolFunction) {
                throw new Error(`Unknown tool: ${toolRequest.name}`);
            }
            const toolOutput = toolFunction(toolRequest.input);
            const toolResultBlock = {
                "type": "tool_result",
                "tool_use_id": toolRequest.id,
                "content": String(toolOutput),
                "is_error": false
            };
            toolResultBlocks.push(toolResultBlock);
        } catch (error) {
            const toolResultBlock = {
                "type": "tool_result",
                "tool_use_id": toolRequest.id,
                "content": `Error: ${error.message}`,
                "is_error": true
            };
            toolResultBlocks.push(toolResultBlock);
        }
    }

    return toolResultBlocks;
}

export { addAssistantMessage, addUserMessage, createChat, getUserInput, chatStream, createChatWithStopSeq, logTokenUsage, createChatWithTools, addToolResultMessage, textFromMessage, runConversation };