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
let isRefreshingAuth = false

// Save the timestamp of the last request for rate-limiting purposes
let lastRequestTimestamp = 0

/* HANLDER FUNCTIONS */

async function handleNewMessage(latestChatMessage: SocketMessage) {
    try {
        const messageContent = latestChatMessage.message.content.trim()
        // console.log(`Incoming message in chat ${latestChatMessage.chatId}: ${messageContent}`)
        // If the last chat message has a "/tldr" command, give a summary
        if (messageContent.toLowerCase().startsWith("/tldr")) {
            // Check that date of message is past the cooldown time
            if (Date.parse(latestChatMessage.message.createdAt) / 1000 < lastRequestTimestamp + 30) return

            // Default message limit
            let messageLimit = 101

            try {
                // Try to parse an integer from the message
                messageLimit = parseInt(messageContent.split(" ")[1])
                if (isNaN(messageLimit)) messageLimit = 100

                // Have a maximum number of messages allowed in the summary
                messageLimit = Math.min(messageLimit, 500)

                // Add 1 to ignore the most recent "/tldr" message
                messageLimit++
            } catch (err) {}

            // Get last messageLimit messages from the chat
            console.log(`Fetching up to ${messageLimit} messages for /tldr`)
            let chatMessages = await user.getChatMessages(latestChatMessage.chatId, messageLimit)
            console.log(`Fetched ${chatMessages.length} messages before filtering`)

            // Filter out messages that that request the summary and that came from the AI
            chatMessages = chatMessages.filter(
                msg => !msg.content.startsWith("/tldr") &&
                !msg.content.startsWith("TL;DR: ")
            )
            console.log(`Kept ${chatMessages.length} messages after filtering`)

            // Check that there are messages to summarize
            if (chatMessages.length === 0) return

            // Send the messages as a single input to the OpenAI
            lastRequestTimestamp = Date.parse(latestChatMessage.message.createdAt) / 1000

            const textToSummarize = chatMessages.map(
                msg => `${msg.author.firstname} ${msg.author.lastname?.[0] || "?"} says "${msg.content}"`
            ).join("\n")

            console.log("Requesting summary from OpenAI")
            const summary = await morgpt.getSummary(textToSummarize, MorGPTChatModel.GPT5_MINI)
            // const summary = await ollama.getSummary(textToSummarize, OllamaChatModel.qwen3_14b)

            if (!summary || !summary.trim()) {
                socket.emit("sendMessage", {
                    chatId: latestChatMessage.chatId,
                    content: "TL;DR: I could not generate a summary right now. Please try again.",
                })
                return
            }

            // Output the response
            console.log("Sending TL;DR response to chat")
            socket.emit("sendMessage", {
                chatId: latestChatMessage.chatId,
                content: summary.trim()
            })
        } else if (messageContent.toLowerCase().startsWith("/ask")) {
            // Check that date of message is past the cooldown time
            if (Date.parse(latestChatMessage.message.createdAt) / 1000 < lastRequestTimestamp + 30) return

            socket.emit("sendMessage", {
                chatId: latestChatMessage.chatId,
                content: "Ask function currently unavailable",
            })
            // const response = await morgpt.searchLogs(latestChatMessage.message.content.split("/ask")[1])
            // socket.emit("sendMessage", {
            //     chatId: latestChatMessage.chatId,
            //     content: response.trim(),
            // })
        }
    } catch (err: any) {
        const errMsg = err?.message || "Unknown error"
        console.error("Error while handling message:", errMsg)

        // Avoid silent failures for users when /tldr processing fails.
        if (latestChatMessage.message.content.trim().toLowerCase().startsWith("/tldr")) {
            socket.emit("sendMessage", {
                chatId: latestChatMessage.chatId,
                content: "TL;DR: I could not fetch recent messages in time. Please try /tldr with a smaller number (for example /tldr 40).",
            })
        }
    }
}

async function handleSentMessage(msgReceipt: MessageReceipt) {
    console.log(msgReceipt)
}

async function refreshSocketAuthHeaders() {
    if (isRefreshingAuth) return
    isRefreshingAuth = true

    try {
        await user.login(process.env.MORCHAT_USERNAME!, process.env.MORCHAT_PASSWORD!)
        console.log("Refreshed MorChat session")

        if (socket?.io?.opts?.transportOptions?.polling) {
            socket.io.opts.transportOptions.polling.extraHeaders = user.headers
        }
        if (socket?.io?.opts?.transportOptions?.websocket) {
            socket.io.opts.transportOptions.websocket.extraHeaders = user.headers
        }
    } catch (err) {
        console.error("Failed to refresh MorChat session:", err)
    } finally {
        isRefreshingAuth = false
    }
}

/* MAIN FUNCTION */

async function main() {
    // Authenticate user
    await user.login(process.env.MORCHAT_USERNAME!, process.env.MORCHAT_PASSWORD!)

    socket = await io("https://www.morteam.com/", {
        withCredentials: true,
        transportOptions: {
            polling: {
                extraHeaders: user.headers
            },
            websocket: {
                extraHeaders: user.headers
            },
        },
    })

    socket.on("connect", () => {
        console.log("Connected!")
    })
    socket.on("disconnect", (reason: string) => {
        console.log("Disconnected!", reason)
    })
    socket.on("connect_error", (err: any) => {
        const errMessage = typeof err?.message === "string" ? err.message : String(err || "unknown")
        console.error("Socket connection error:", errMessage)
        if (errMessage.toLowerCase().includes("server error")) {
            void refreshSocketAuthHeaders()
        }
    })
    socket.on("reconnect_attempt", (attempt: number) => {
        console.log("Reconnect attempt:", attempt)
        if (attempt <= 2) {
            void refreshSocketAuthHeaders()
        }
    })
    socket.on("message", handleNewMessage)
    socket.on("message-sent", handleSentMessage)
}

main()
