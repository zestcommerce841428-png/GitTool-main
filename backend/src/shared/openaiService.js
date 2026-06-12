import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const callOpenAI = async (prompt, model = "gpt-5-nano-2025-08-07") => {
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: prompt }],
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI Service Error:", error);
        throw new Error("Failed to generate AI response.");
    }
};
