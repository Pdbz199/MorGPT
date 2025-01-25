/* IMPORTS */

import axios from "axios"
import constants from "./constants"
import {
    type InferenceResponse
} from "./types"

/* FUNCTIONS */

export async function getSpellbookResponse(modelInputText: string): Promise<InferenceResponse> {
    return (await axios.post(
        `${constants.SPELLBOOK_API_URL}${constants.SPELLBOOK_APP_ENDPOINT}`,
        { "input": modelInputText },
        { headers: constants.SPELLBOOK_HEADERS }
    )).data
}

/* DEFAULT EXPORTS */

export default {
    getSpellbookResponse,
}