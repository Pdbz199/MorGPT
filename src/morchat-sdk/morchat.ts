/* IMPORTS */

import axios from "axios"
import constants from "./constants"
import {
    type Chat,
    type Message
} from "./types"

/* FUNCTIONALITY */

export class AuthenticatedUser {
    /* STORAGE */

    public headers: any

    /* PUBLIC FUNCTIONS */

    public async getAllChats(): Promise<Chat[]> {
        return (await axios.get(
            `${constants.MORCHAT_API_URL}/chats`,
            { headers: this.headers }
        )).data
    }

    public async getChatMessages(chatId: number, limit=20): Promise<Message[]> {
        const messages: Message[] = []

        for (let i = 0; i < limit/20; i++) {
            const messagesResponse = await axios.get(
                `${constants.MORCHAT_API_URL}/chats/id/${chatId}/messages`,
                {
                    params: { "skip": i*20 },
                    headers: this.headers
                }
            )

            messages.push(...messagesResponse.data)
        }

        return messages.slice(0, limit).reverse()
    }

    public async login(emailOrUsername: string, password: string): Promise<void> {
        const loginResponse = await axios.post(
            `${constants.MORCHAT_API_URL}/login`,
            { emailOrUsername, password },
        )

        this.headers = { "cookie": loginResponse.headers["set-cookie"][0].split(";")[0] }
    }
}

/* DEFAULT EXPORTS */

export default {
    AuthenticatedUser,
}
