/* CONSTANTS */

export const summaryPromptTemplate =
    "Please summarize the following block of text and include " +
    "\"TL;DR: \" at the beginning of your response:"

export const summarizerBotSystemPrompt =
    "You are a summarizer bot. You will do nothing but " +
    "summarize the user's input text. Please make sure the " +
    "summary is brief and not too verbose. Also, make sure " +
    "your response message always starts with \"TL;DR: \""

export const behaviorCloningPromptTemplate =
    "Pretend that you are cloning a particular user's behavior.\n\n" +
    "Use this format:\n\n" +
    "Text: <text>\n" +
    "<username>: <reply>\n\n" +
    "Begin:\n\n" +
    "Text: $query\n" +
    "<username>:"

/* TYPES */

export enum ChatModel {
    GPT3 = "gpt-3.5-turbo",
    GPT4 = "gpt-4"
}

/* DEFAULT EXPORT */

export default {
    // Constants
    behaviorCloningPromptTemplate,
    summarizerBotSystemPrompt,
    summaryPromptTemplate,

    // Types
    ChatModel
}
