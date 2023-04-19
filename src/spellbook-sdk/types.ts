export interface TokenProbs {
    token_probs: any[]
    tokens: any[]
    top_probs: any[]
}

export interface InferenceResponse {
    text: string
    tokenProbs: TokenProbs
}