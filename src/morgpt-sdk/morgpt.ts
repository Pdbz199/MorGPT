/* LOAD ENVIRONMENT FILE */

import dotenv from "dotenv"
dotenv.config()

/* IMPORTS */

import constants from "./constants"
import { ChatModel } from "./constants"
import {
    Configuration,
    OpenAIApi
} from "openai"

/* CONFIGURE OPENAI */

const configuration = new Configuration({
    organization: process.env.OPENAI_ORGANIZATION_ID,
    apiKey: process.env.OPENAI_API_KEY!
})
const openai = new OpenAIApi(configuration)

/* FUNCTIONS */

export async function getSummary(textToSummarize: string, model?: ChatModel): Promise<string> {
    console.log("Sending Request to OpenAI...")

    if (model !== undefined && model === ChatModel.GPT4) {
        try {
            const completion = await openai.createChatCompletion(
                {
                    model: model,
                    messages: [
                        { role: "system", content: constants.summarizerBotSystemPrompt },
                        { role: "user", content: textToSummarize }
                    ]
                }
            )
	        return completion.data.choices[0].message.content
        } catch (err) {
            console.log("Received Error from OpenAI API for GPT-4:", err)
        }
    } else {
        try {
            const completion = await openai.createChatCompletion(
                {
                    model: ChatModel.GPT3,
                    messages: [{
                        role: "user",
                        content: `${constants.summaryPromptTemplate}\n\`\`\`\n${textToSummarize}\n\`\`\``
                    }]
                }
            )
	        return completion.data.choices[0].message.content
        } catch (err) {
            console.log("Received Error from OpenAI API for GPT-3.5-turbo:", err)
        }
    }
}

export async function getBehaviorCloning(personToClone: string): Promise<string> {
    const completion = await openai.createChatCompletion(
        {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "user", content: constants.behaviorCloningPromptTemplate },
                { role: "user", content: personToClone }
            ]
        }
    )
    return completion.data.choices[0].message.content
}

/* DEFAULT EXPORT */

export default {
    getBehaviorCloning,
    getSummary
}