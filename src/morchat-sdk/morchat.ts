/* IMPORTS */

import axios from "axios"
import constants from "./constants"
import {
    type Chat,
    type Message
} from "./types"

const MORCHAT_REQUEST_TIMEOUT_MS = 45000
const MORCHAT_MAX_RETRIES = 3
const MORCHAT_RETRY_DELAY_MS = 1200

/* FUNCTIONALITY */

export class AuthenticatedUser {
    /* STORAGE */

    public headers: any

    /* PUBLIC FUNCTIONS */

    private async delay(ms: number): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, ms))
    }

    private async getWithRetry<T>(url: string, config: any): Promise<T> {
        let lastError: any

        for (let attempt = 1; attempt <= MORCHAT_MAX_RETRIES; attempt++) {
            try {
                const response = await axios.get(url, config)
                return response.data as T
            } catch (err: any) {
                lastError = err
                const isTimeout = err?.code === "ECONNABORTED"
                const status = err?.response?.status
                const shouldRetry = isTimeout || (typeof status === "number" && status >= 500)

                if (!shouldRetry || attempt === MORCHAT_MAX_RETRIES) break
                await this.delay(MORCHAT_RETRY_DELAY_MS * attempt)
            }
        }

        throw lastError
    }

    public async getAllChats(): Promise<Chat[]> {
        return await this.getWithRetry<Chat[]>(
            `${constants.MORCHAT_API_URL}/chats`,
            {
                headers: this.headers,
                timeout: MORCHAT_REQUEST_TIMEOUT_MS,
            }
        )
    }

    public async getChatMessages(chatId: number, limit=20): Promise<Message[]> {
        const messages: Message[] = []

        for (let i = 0; i < limit/20; i++) {
            const messageBatch = await this.getWithRetry<Message[]>(
                `${constants.MORCHAT_API_URL}/chats/id/${chatId}/messages`,
                {
                    params: { "skip": i*20 },
                    headers: this.headers,
                    timeout: MORCHAT_REQUEST_TIMEOUT_MS,
                }
            )

            messages.push(...messageBatch)
        }

        return messages.slice(0, limit).reverse()
    }

    public async login(emailOrUsername: string, password: string): Promise<void> {
        const loginResponse = await axios.post(
            `${constants.MORCHAT_API_URL}/login`,
            { emailOrUsername, password },
            { timeout: MORCHAT_REQUEST_TIMEOUT_MS }
        )

        this.headers = { "cookie": loginResponse.headers["set-cookie"][0].split(";")[0] }
    }
}

/* DEFAULT EXPORTS */

export default {
    AuthenticatedUser,
}
