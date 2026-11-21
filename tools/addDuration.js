import "@dotenvx/dotenvx/config";

// Tools and Schemas

function addDurationToDatetime(datetimeStr, duration = 0, unit = "days") {
    // Date-only strings (YYYY-MM-DD) are treated as local midnight
    const date = new Date(datetimeStr.length === 10 ? datetimeStr + "T00:00:00" : datetimeStr);
    if (isNaN(date)) {
        throw new Error(`Invalid datetime: ${datetimeStr}`);
    }

    const msPerUnit = {
        seconds: 1000,
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000,
        weeks: 7 * 24 * 60 * 60 * 1000,
    };

    let newDate;
    if (unit in msPerUnit) {
        newDate = new Date(date.getTime() + duration * msPerUnit[unit]);
    } else if (unit === "months" || unit === "years") {
        const months = unit === "years" ? duration * 12 : duration;
        const day = date.getDate();
        newDate = new Date(date.getFullYear(), date.getMonth() + months, 1, date.getHours(), date.getMinutes(), date.getSeconds());
        // Keep the day, but not past the end of the new month
        const lastDay = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
        newDate.setDate(Math.min(day, lastDay));
    } else {
        throw new Error(`Unsupported time unit: ${unit}`);
    }

    // e.g. "Thursday, April 03, 2025 10:30:00 AM"
    const datePart = newDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "2-digit", year: "numeric" });
    const timePart = newDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    return `${datePart} ${timePart}`;
}

function setReminder(content, timestamp) {
    console.log(`----\nSetting the following reminder for ${timestamp}:\n${content}\n----`);
    return `Reminder set for ${timestamp}`;
}

const addDurationToDatetimeSchema = {
    name: "addDurationToDatetime",
    description: "Adds a specified duration to a datetime string and returns the resulting datetime in a detailed format (e.g., 'Thursday, April 03, 2025 10:30:00 AM'). Supports seconds, minutes, hours, days, weeks, months, and years.",
    input_schema: {
        type: "object",
        properties: {
            datetime_str: {
                type: "string",
                description: "The input datetime string, e.g. '2025-04-03'.",
            },
            duration: {
                type: "number",
                description: "The amount of time to add. Can be negative for past dates. Defaults to 0.",
            },
            unit: {
                type: "string",
                description: "One of: 'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'. Defaults to 'days'.",
            },
        },
        required: ["datetime_str"],
    },
};

const setReminderSchema = {
    name: "setReminder",
    description: "Creates a timed reminder that notifies the user at the specified time with the provided content.",
    input_schema: {
        type: "object",
        properties: {
            content: {
                type: "string",
                description: "The message text of the reminder, e.g. 'Take medication'.",
            },
            timestamp: {
                type: "string",
                description: "When the reminder should trigger, as an ISO 8601 timestamp (YYYY-MM-DDTHH:MM:SS) or a Unix timestamp.",
            },
        },
        required: ["content", "timestamp"],
    },
};

const batchToolSchema = {
    name: "batch_tool",
    description: "Invoke multiple other tool calls simultaneously",
    input_schema: {
        type: "object",
        properties: {
            invocations: {
                type: "array",
                description: "The tool calls to invoke",
                items: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "The name of the tool to invoke",
                        },
                        arguments: {
                            type: "string",
                            description: "The arguments to the tool, encoded as a JSON string",
                        },
                    },
                    required: ["name", "arguments"],
                },
            },
        },
        required: ["invocations"],
    },
};

export {
    addDurationToDatetime,
    setReminder,
    addDurationToDatetimeSchema,
    setReminderSchema,
    batchToolSchema,
};
