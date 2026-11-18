import "@dotenvx/dotenvx/config";
import Anthropic from '@anthropic-ai/sdk';
import { createChatWithStopSeq, addAssistantMessage, addUserMessage , createChat} from "./utils/chatUtils.js";



let message = [];
await addUserMessage(message, "Generate a very short event bridge rule as json");
await addAssistantMessage(message, "```json");
let chatResp = await createChatWithStopSeq(message);
console.log("Response from Claude:\n>>", chatResp);
await addAssistantMessage(message, chatResp);

let message2=[];
const userPrompt = `
Generate three different sample AWS CLI commands.Each should be very short
`
await addUserMessage(message2, userPrompt);
await addAssistantMessage(message2, "```bash");
let chatResp2 = await createChatWithStopSeq(message2);
console.log("Response from Claude:\n>>", chatResp2);
await addAssistantMessage(message2, chatResp2);

/*
//Expected output with stop sequences
>> Here are three short AWS CLI commands:

1. List your S3 buckets:
```bash
aws s3 ls
```

2. Check your configured identity:
```bash
aws sts get-caller-identity
```

3. List running EC2 instances:
```bash
aws ec2 describe-instances --filters "Name=instance-state-name,Values=running"

*/