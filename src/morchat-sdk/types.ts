export interface User {
    id: number
    username: string
    firstname: string
    lastname: string
    email: string
    phone: string
    createdAt: string
    profPicUrl: string
}

export interface Chat {
    id: number
    creatorId: number
    isTwoPeople: boolean
    name: string
    createdAt: string
    updatedAt: string
    unreadMessages: number
    users: User[]
}

export interface Message {
    author: User
    chatId: number
    content: string
    createdAt: string
}

export interface MessageReceipt {
    chatId: number
    content: string
    timestamp: string
}

export interface SocketMessage {
    chatId: number
    message: Message
    isTwoPeople: boolean
    name: string
}
