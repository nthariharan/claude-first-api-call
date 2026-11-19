import "@dotenvx/dotenvx/config";
import { addAssistantMessage, addUserMessage, createChatWithStopSeq, createChat } from "./utils/chatUtils.js";
import fs from "node:fs/promises"
import { spawnSync } from "node:child_process";

let prompt = `
Generate an evaluation dataset for a prompt evaluation. The dataset will be used to evaluate prompts that generate Python, JSON, or Regex specifically for AWS-related tasks. Generate an array of JSON objects, each representing task that requires Python, JSON, or a Regex to complete.

Example output:
\`\`\`json
[
  {
    "task": "Description of task",
    "format": "python" | "json" | "regex",
    "solution-criteria": "key criteria for evaluating the solution",
  },
  ...additional
]
\`\`\`

* Focus on tasks that can be solved by writing a single Python function, a single JSON object, or a single regex
* Focus on tasks that do not require writing much code

Please generate 3 objects.
`
await generateDataset();
const evalOutput = await runEval();
console.log(evalOutput);
const avgScore = evalOutput.reduce((sum, r) => sum + Number(r.score), 0) / evalOutput.length;
console.log(`Average score: ${avgScore.toFixed(2)}`);
const avgCodeScore = evalOutput.reduce((sum, r) => sum + r.codeScore, 0) / evalOutput.length;
console.log(`Average code grading score: ${avgCodeScore.toFixed(2)}`);
const avgCombinedScore = evalOutput.reduce((sum, r) => sum + Number(r.score) + r.codeScore, 0) / (evalOutput.length * 2);
console.log(`Average combined score: ${avgCombinedScore.toFixed(2)}`);



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
    const evalOut = await runTestCase(test);
    results.push(evalOut);
  }
  return results;

}

async function runTestCase(data) {
  //let score = 10; //initial assumption. Grading tobe done.
  const promptOutput = await runPrompt(data);
  let scoreResp = await gradingByModel(data, promptOutput);
  const codeResp = gradingByCode(data, promptOutput);
  return {
    "output": promptOutput,
    "testcase": data,
    "score": scoreResp["score"],
    "modelReasoning": scoreResp["reasoning"],
    "codeScore": codeResp["score"],
    "codeReasoning": codeResp["reasoning"]
  };

}

async function runPrompt(data) {
  let prompt = `
  Please solve the following task:
  ${data["task"]}

  Respond with only the actual solution itself (e.g. the code, command, or JSON/regex requested).
  Do not include explanations, output format descriptions, example usages, sample outputs,
  headings, or any commentary before or after the solution.
  `
  //above prompt will take only the task from the json passed.

  let messages = [];
  await addUserMessage(messages, prompt);
  await addAssistantMessage(messages, "```code");
  let chatResp = await createChatWithStopSeq(messages); //Not adding any Asst msg prefilling for formatting
  return chatResp;
}

async function gradingByModel(testcase, output) {
  let evalPrompt = `
You are an expert AWS code reviewer. Your task is to evaluate the following AI-generated solution.

Original Task:
<task>
${testcase["task"]}
</task>

Solution Criteria:
<criteria>
${testcase["solution-criteria"]}
</criteria>

Solution to Evaluate:
<solution>
${output}
</solution>

Output Format
Provide your evaluation as a structured JSON object with the following fields, in this specific order:
- "strengths": An array of 1-3 key strengths
- "weaknesses": An array of 1-3 key areas for improvement
- "reasoning": A concise explanation of your overall assessment
- "score": A number between 1-10

Respond with JSON. Keep your response concise and direct.
Example response shape:
{{
    "strengths": string[],
    "weaknesses": string[],
    "reasoning": string,
    "score": number
}}
`
let evalMessages = [];
await addUserMessage(evalMessages, evalPrompt);
await addAssistantMessage(evalMessages, "```json");
let evalResp = await createChatWithStopSeq(evalMessages);
return JSON.parse(evalResp);

}

function validateJson(text) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

function validatePython(text) {
  // Ask Python to parse the code. It only checks syntax; the code is never run.
  const result = spawnSync("python", ["-c", "import ast, sys; ast.parse(sys.stdin.read())"], { input: text });
  return result.status === 0;
}

function validateRegex(text) {
  try {
    new RegExp(text);
    return true;
  } catch {
    return false;
  }
}

function gradingByCode(testcase, output) {
  const format = testcase["format"];
  let isValid = false;
  if (format === "json") {
    isValid = validateJson(output);
  } else if (format === "python") {
    isValid = validatePython(output);
  } else if (format === "regex") {
    isValid = validateRegex(output);
  } else {
    return { score: 0, reasoning: `No validator for format "${format}"` };
  }
  return {
    score: isValid ? 10 : 0,
    reasoning: isValid ? `Output is valid ${format}` : `Output is not valid ${format}`
  };
}
