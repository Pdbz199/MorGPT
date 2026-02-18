/* LOAD ENVIRONMENT FILE */

import dotenv from "dotenv"
dotenv.config()

/* IMPORTS */

import {
    DistanceStrategy,
    PGVectorStore,
    PGVectorStoreArgs,
} from "@langchain/community/vectorstores/pgvector"
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama"
import constants from "./constants"
import { ChatModel } from "./constants"
import { ChatModel as OllamaChatModels } from "../ollama-sdk/constants"
import OpenAI from "openai"
import { PoolConfig } from "pg"

const embedder = new OllamaEmbeddings({ model: "nomic-embed-text" })
const vectorStoreConfig: PGVectorStoreArgs = {
    postgresConnectionOptions: {
        type: "postgres",
	host: "127.0.0.1",
	port: 5432,
	user: "postgres",
	password: process.env.LOG_DB_PASSWORD!,
	database: "postgres",
    } as PoolConfig,
    tableName: "langchain_pg_embedding",
    collectionName: "im_evil_chat_logs",
    collectionTableName: "langchain_pg_collection",
    columns: {
        vectorColumnName: "embedding",
        contentColumnName: "document",
        idColumnName: "id",
        metadataColumnName: "cmetadata",
    },
    distanceStrategy: "cosine" as DistanceStrategy,
}
const ollama_llm = new ChatOllama({ model: OllamaChatModels.qwen25_15b })
// const ollama_llm = new ChatOllama({ model: OllamaChatModels.deepseek_distilled_qwen15b })

/* CONFIGURE OPENAI */

const openai = new OpenAI({
    organization: process.env.OPENAI_ORGANIZATION_ID,
    apiKey: process.env.OPENAI_API_KEY!,
})

/* FUNCTIONS */

async function makeMemoryClearRequest(model_name: OllamaChatModels) {
    try {
        const response = await fetch("http://127.0.0.1:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: model_name, keep_alive: 0 })
        })
        const data = await response.json()
        console.log(data)
    } catch (error) {
        console.error('Error:', error)
    }
}

export async function getSummary(textToSummarize: string, model: ChatModel): Promise<string> {
    console.log("Sending request to OpenAI...")

    const modelFallbacks = [model, "gpt-4.1-mini"] as const

    for (const modelName of modelFallbacks) {
        try {
            const completion = await openai.chat.completions.create({
                model: modelName,
                messages: [
                    { role: "system", content: constants.summarizerBotSystemPrompt },
                    { role: "user", content: textToSummarize },
                ]
            })

            const content = completion.choices?.[0]?.message?.content?.trim()
            if (content) {
                return content
            }
        } catch (err) {
            console.log(`Received error from OpenAI API for ${modelName} model:`, err)
        }
    }

    return "TL;DR: I could not generate a summary right now."
}

export async function getBehaviorCloning(personToClone: string): Promise<string> {
    const completion = await openai.chat.completions.create({
        model: ChatModel.GPT5_MINI,
        messages: [
            { role: "user", content: constants.behaviorCloningPromptTemplate },
            { role: "user", content: personToClone }
        ]
    })
    return completion.choices[0].message.content
}

export async function searchLogs(query: string): Promise<string> {
    console.log("Generating search key words...")
    const searchTextForQuery = await ollama_llm.invoke([
	    ["system", "You are a language model that specializes in converting text into a unique comma-separated set of key words. Please make sure you always use the same language as your input. You must never ask any follow up questions and you must ensure that your response is a set of unique words. Here is an example:\nINPUT: Did I ever talk about database migration with Ben?\nOUTPUT: database, migration, postgres, Ben"],
        ["user", "INPUT: " + query],
    ])
    console.log(ollama_llm.model as OllamaChatModels)
    await makeMemoryClearRequest(ollama_llm.model as OllamaChatModels)
    console.log(searchTextForQuery.content.toString())
    console.log("Searching logs...")
    const vectorStore = await PGVectorStore.initialize(embedder, vectorStoreConfig)
    const searchResults = await vectorStore.similaritySearch(searchTextForQuery.content.toString(), 10)
    console.log(embedder.model as OllamaChatModels)
    await makeMemoryClearRequest(embedder.model as OllamaChatModels)
    let context = "```"
    for (const searchResult of searchResults) {
        context += `\n${searchResult.metadata['sender_full_name']} said "${searchResult.pageContent}" at ${searchResult.id}`
    }
    context += "\n```"
    console.log(context)
    const queryResponse = await ollama_llm.invoke([
        ["system", `You are a language model that specializes in question answering. The user will be asking you a question based on logs from a group chat they are in. You are given a set of the most relevant messages that have been shared in that group chat. Please provide a helpful answer to the user with the given set of messages. The format of each message is as follows: "<SENDER_FULL_NAME> said <MESSAGE_CONTENT> at <ISO8601_TIMESTAMP>". Please always tell the user what date and time the relevant messages were sent so that they can look up the messages themselves. Also, please make sure that you respond in the same language as the users query.\nHere is the set of relevant group chat messages:\n${context}`],
	    ["user", query],
    ])
    await makeMemoryClearRequest(ollama_llm.model as OllamaChatModels)
    return queryResponse.content.toString()
}

/* DEFAULT EXPORT */

export default {
    getBehaviorCloning,
    getSummary,
    searchLogs,
}
