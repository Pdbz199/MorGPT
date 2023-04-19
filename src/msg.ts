import dotenv from "dotenv"
dotenv.config()

// import { io } from "socket.io-client"
import io from "socket.io-client"
import morchat from "./morchat-sdk/morchat"

async function main() {
    const user = new morchat.AuthenticatedUser()
    await user.login(process.env.MORCHAT_USERNAME!, process.env.MORCHAT_PASSWORD!)

    const socket = await io("https://www.morteam.com/", {
        transportOptions: {
            polling: {
                extraHeaders: user.headers
            }
        }
    })

    socket.on("message", msg => {
        console.log(msg)
    })

    socket.on("message-sent", receipt => {
        console.log(receipt)
    })

    // Id for the "im evil" chat on MorChat
    // const imEvilChatId = 80

    // Send message to "im evil" chat on MorChat
    // socket.emit("sendMessage", {
    //     chatId: imEvilChatId,
    //     content: "BEANS!"
    // })
}

main()