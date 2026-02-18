/* CONSTANTS */

// URL
export const OLLAMA_API_URL = "http://127.0.0.1:11434"

/* TYPES */

export enum ChatModel {
    llama32 = "llama3.2:1b",
    smollm = "smollm:360m",
    tinyllama = "tinyllama",
    qwen25_05b = "qwen2.5:0.5b",
    qwen25_15b = "qwen2.5:1.5b",
    deepseek_distilled_qwen15b = "deepseek-r1:1.5b-qwen-distill-q4_K_M",
}

/* DEFAULT EXPORT */

export default {
    OLLAMA_API_URL,
}
