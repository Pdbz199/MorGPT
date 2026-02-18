/* IMPORTS */

import morgpt_constants from "../morgpt-sdk/constants"
import { ChatModel, OLLAMA_API_URL } from "./constants"
import { Ollama } from "ollama"

const ollama = new Ollama({ host: OLLAMA_API_URL })

/* FUNCTIONS */

export async function getSummary(textToSummarize: string, model: ChatModel): Promise<string> {
    console.log("Sending request to ollama...")
    try {
        const completion = await ollama.chat({
            model: ChatModel.smollm,
            messages: [
                { role: "system", content: morgpt_constants.summarizerBotSystemPrompt },
                { role: "user", content: textToSummarize },
            ],
            stream: false,
        })

        return completion.message.content
    } catch (err) {
        console.log(`Received error from ollama API for ${model} model:`, err)
    }
}

export default {
    getSummary,
}
