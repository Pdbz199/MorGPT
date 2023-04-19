import { encode, decode } from "gpt-3-encoder"

// const str = "This is an example sentence to try encoding out on!"
const str = "This is a string that I am going to put through ChatGPT!"

const encoded = encode(str)
console.log("Encoded this string looks like:", encoded)
console.log("Number of words in the string:", str.split(" ").length)
console.log("Number of tokens in the string:", encoded.length)

console.log("We can look at each token and what it represents")
for (let token of encoded) {
    console.log({token, string: decode([token])})
}

const decoded = decode(encoded)
console.log("We can decode it back into:\n", decoded)
