/* POPULATE ENV VARIABLES */

import dotenv from "dotenv"
dotenv.config()

/* CONSTANTS */

// URL
export const SPELLBOOK_API_URL = "https://dashboard.scale.com/spellbook/api"

// Endpoints
export const SPELLBOOK_APP_ENDPOINT = `/app/${process.env.SPELLBOOK_APP_ID!}`

// Headers
export const SPELLBOOK_HEADERS = {
    "Authorization": `Basic ${process.env.SPELLBOOK_BASIC_AUTH!}`
}

/* DEFAULT EXPORT */

export default {
    SPELLBOOK_API_URL,
    SPELLBOOK_APP_ENDPOINT,
    SPELLBOOK_HEADERS,
}