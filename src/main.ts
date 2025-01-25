/* IMPORTS */

import dotenv from "dotenv"
dotenv.config()

import io from "socket.io-client"
import morchat from "./morchat-sdk/morchat"
import { MessageReceipt, SocketMessage } from "./morchat-sdk/types"
import morgpt from "./morgpt-sdk/morgpt"
import ollama from "./ollama-sdk/ollama"
import { ChatModel as MorGPTChatModel } from "./morgpt-sdk/constants"
import { ChatModel as OllamaChatModel } from "./ollama-sdk/constants"

/* CONSTANTS */

// Create a new authenticated user
const user = new morchat.AuthenticatedUser()
let socket: any

// Save the timestamp of the last request for rate-limiting purposes
let lastRequestTimestamp = 0

/* HANLDER FUNCTIONS */

async function handleNewMessage(latestChatMessage: SocketMessage) {
    // If the last chat message has a "/tldr" command, give a summary
    if (latestChatMessage.message.content.startsWith("/tldr")) {
        // Check that date of message is past the cooldown time
        if (Date.parse(latestChatMessage.message.createdAt) / 1000 < lastRequestTimestamp + 30) return

        // Default message limit
        let messageLimit = 101

        try {
            // Try to parse an integer from the message
            messageLimit = parseInt(latestChatMessage.message.content.split(" ")[1])
            if (isNaN(messageLimit)) messageLimit = 100

            // Have a maximum number of messages allowed in the summary
            messageLimit = Math.min(messageLimit, 500)

            // Add 1 to ignore the most recent "/tldr" message
            messageLimit++
        } catch (err) {}

        // Get last messageLimit messages from the chat
        let chatMessages = await user.getChatMessages(latestChatMessage.chatId, messageLimit)

        // Filter out messages that that request the summary and that came from the AI
        chatMessages = chatMessages.filter(
            msg => !msg.content.startsWith("/tldr") &&
            !msg.content.startsWith("TL;DR: ")
        )

        // Check that there are messages to summarize
        if (chatMessages.length === 0) return

        // Send the messages as a single input to the OpenAI
        lastRequestTimestamp = Date.parse(latestChatMessage.message.createdAt) / 1000

        const textToSummarize = chatMessages.map(
            msg => `${msg.author.firstname} ${msg.author.lastname[0]} says "${msg.content}"`
        ).join("\n")

        const summary = await morgpt.getSummary(textToSummarize, MorGPTChatModel.GPT4o_mini)
        // const summary = await ollama.getSummary(textToSummarize, OllamaChatModel.llama32)

        // Output the response
        socket.emit("sendMessage", {
            chatId: latestChatMessage.chatId,
            content: summary.trim()
        })
    }
}

async function handleSentMessage(msgReceipt: MessageReceipt) {
    console.log(msgReceipt)
}

/* MAIN FUNCTION */

async function main() {
    // Authenticate user
    await user.login(process.env.MORCHAT_USERNAME!, process.env.MORCHAT_PASSWORD!)

    socket = await io("https://www.morteam.com/", {
        transportOptions: {
            polling: {
                extraHeaders: user.headers
            }
        }
    })

    socket.on("connect", () => {
        console.log("Connected!")
    })
    socket.on("disconnect", () => {
        console.log("Disconnected!")
    })
    socket.on("message", handleNewMessage)
    socket.on("message-sent", handleSentMessage)
}

main()
