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

export async function getSummary(textToSummarize: string, model: ChatModel): Promise<string> {
    console.log("Sending request to OpenAI...")

    try {
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: constants.summarizerBotSystemPrompt },
                { role: "user", content: textToSummarize },
            ]
        })
        return completion.choices[0].message.content
    } catch (err) {
        console.log(`Received error from OpenAI API for ${model} model:`, err)
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
