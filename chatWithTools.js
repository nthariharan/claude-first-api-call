import {addUserMessage, runConversation, textFromMessage} from './utils/chatUtils.js';

let messages=[];

// await addUserMessage(messages,"What is the exact time in the format HH:mm:ss?. Also give me the date in DD/MM format.");
await addUserMessage(messages,"Set a reminder for my doctors appointment. Its 177 days after Jan 1st,2050");
const response = await runConversation(messages);
/* await addAssistantMessage(messages,response);
const result = getCurrentDateTime(response.content[0].input.dateFormat);
await addToolResultMessage(messages,response.content[0].id,result);
console.log("result",result);
console.log(JSON.stringify(messages)); */
console.log("Model response:", textFromMessage(response));
console.log(JSON.stringify(messages, null, 2));