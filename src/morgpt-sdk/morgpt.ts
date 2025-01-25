/* LOAD ENVIRONMENT FILE */

import dotenv from "dotenv"
dotenv.config()

/* IMPORTS */

import constants from "./constants"
import { ChatModel } from "./constants"
import OpenAI from "openai"

/* CONFIGURE OPENAI */

const openai = new OpenAI({
    organization: process.env.OPENAI_ORGANIZATION_ID,
    apiKey: process.env.OPENAI_API_KEY!,
})

/* FUNCTIONS */

export async function getSummary(textToSummarize: string, model?: ChatModel): Promise<string> {
    console.log("Sending request to OpenAI...")

    // if (model !== undefined && model === ChatModel.GPT4) {
    if (model !== undefined && model === ChatModel.GPT4o) {
        try {
            const completion = await openai.chat.completions.create({
                model: model,
                messages: [
                    { role: "user", content: constants.summarizerBotSystemPrompt },
                    { role: "user", content: textToSummarize },
                ]
            })
            return completion.choices[0].message.content
        } catch (err) {
            console.log("Received error from OpenAI API for GPT-4 model:", err)
        }
    } else {
        try {
            const completion = await openai.chat.completions.create({
                // model: ChatModel.GPT3,
                model: ChatModel.GPT4o_mini,
                messages: [{
                    role: "user",
                    content: `${constants.summaryPromptTemplate}\n\`\`\`\n${textToSummarize}\n\`\`\``
                }]
            })
	        return completion.choices[0].message.content
        } catch (err) {
            // console.log("Received error from OpenAI API for GPT-3.5-turbo model:", err)
            console.log("Received error from OpenAI API for GPT-4o-mini model:", err)
        }
    }
}

export async function getBehaviorCloning(personToClone: string): Promise<string> {
    const completion = await openai.chat.completions.create({
        model: ChatModel.GPT4o_mini,
        messages: [
            { role: "user", content: constants.behaviorCloningPromptTemplate },
            { role: "user", content: personToClone }
        ]
    })
    return completion.choices[0].message.content
}

/* DEFAULT EXPORT */

export default {
    getBehaviorCloning,
    getSummary,
}