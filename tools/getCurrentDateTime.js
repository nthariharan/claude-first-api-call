
function getCurrentDateTime(dateFormat = "YYYY-MM-DD HH:mm:ss") {
    if (!dateFormat) {
        throw new Error("dateFormat must be a non-empty string");
    }

    const now = new Date();
    const pad = (n, len = 2) => String(n).padStart(len, "0");

    const tokens = {
        YYYY: now.getFullYear(),
        MM: pad(now.getMonth() + 1),
        DD: pad(now.getDate()),
        HH: pad(now.getHours()),
        mm: pad(now.getMinutes()),
        ss: pad(now.getSeconds()),
    };

    return dateFormat.replace(/YYYY|MM|DD|HH|mm|ss/g, (t) => tokens[t]);
}


//Used claude prompt to generate Schema based on best practices mentioned in the site.

/** @type {import('@anthropic-ai/sdk').Anthropic.Tool} */
const getCurrentDateTimeSchema = {
  "name": "getCurrentDateTime",
  "description": "Returns the current local date and time of the server as a formatted string. Use this whenever the user asks for the current date, time, day, or year, or when a task depends on knowing 'now' (for example, calculating how many days until a deadline). Claude has no clock, so it must call this tool rather than guess. The time is the server's local time zone; the tool does not support other time zones or return UTC offsets.",
  "strict": true,
  "input_schema": {
    "type": "object",
    "properties": {
      "dateFormat": {
        "type": "string",
        "description": "Optional output format built from these case-sensitive tokens: YYYY (4-digit year), MM (month 01-12), DD (day 01-31), HH (hour 00-23), mm (minutes 00-59), ss (seconds 00-59). Any other characters are copied as-is. Note MM is month and mm is minutes. Must be non-empty if provided. Omit to use the default 'YYYY-MM-DD HH:mm:ss'. Examples: 'DD/MM/YYYY', 'HH:mm', 'YYYY-MM-DD'."
      }
    },
    "required": [],
    "additionalProperties": false
  }
}

//console.log(getCurrentDateTime("DD/MM/YYYY"));
// console.log(getCurrentDateTime("HH:mm:ss on DD-MM-YYYY"));
//console.log(getCurrentDateTime(""));

export { getCurrentDateTime, getCurrentDateTimeSchema };