import "@dotenvx/dotenvx/config";
import { addAssistantMessage, addUserMessage, createChatWithStopSeq, createChat } from "./utils/chatUtils.js";
import fs from "node:fs/promises"

let prompt = `
Generate an evaluation dataset for a prompt evaluation. The dataset will be used to evaluate prompts that generate Python, JSON, or Regex specifically for AWS-related tasks. Generate an array of JSON objects, each representing task that requires Python, JSON, or a Regex to complete.

Example output:
\`\`\`json
[
  {
    "task": "Description of task",
  },
  ...additional
]
\`\`\`

* Focus on tasks that can be solved by writing a single Python function, a single JSON object, or a single regex
* Focus on tasks that do not require writing much code

Please generate 3 objects.
`

const evalOutput = await runEval();
console.log(evalOutput);



async function generateDataset() {
  let messages = [];
  await addUserMessage(messages, prompt);
  await addAssistantMessage(messages, "```json");
  let chatResp = await createChatWithStopSeq(messages);
  await fs.writeFile("testdata.json", chatResp.trim());
}


async function runEval() {
  let results = [];
  let input = await fs.readFile("testdata.json", "utf8");
  const testData = JSON.parse(input)
  for (const test of testData) {
    const evalOut = JSON.stringify(await runTestCase(test));
    results.push(JSON.parse(evalOut));
  }
  return results;

}

async function runTestCase(data) {
  let score = 10; //initial assumption. Grading tobe done.
  const promptOutput = await runPrompt(data);
  return {
    "output": promptOutput,
    "testcase": data,
    "score": score
  };

}

async function runPrompt(data) {
  let prompt = `
  Please solve the following task:
  ${data["task"]}
  `
  //above prompt will take only the task from the json passed.

  let messages = [];
  await addUserMessage(messages, prompt);
  let chatResp = await createChat(messages); //Not adding any Asst msg prefilling for formatting
  //console.log(chatResp);
  return chatResp;
}