import { tool } from "@langchain/core/tools";
import { z } from "zod";
import OpenAI from "openai";
import { storage } from "~~/io/Storage";
import { v4 as uuidv4 } from 'uuid';
import {Visibility} from '@flystorage/file-storage';
import { Buffer } from 'node:buffer';

const toolExecutor = async (input: { prompt: string, heading: string }) => {
    const { prompt, heading } = input;
    const uuid = uuidv4()
    const fileUuid = uuidv4()

    const client = new OpenAI();

    const imgResponse = await client.images.generate({
        model: "dall-e-3", // gpt-image-1
        prompt: prompt,
        response_format: 'b64_json',
        n: 1,
    }).catch((error) => { 
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image");
    });

    if (!imgResponse || !imgResponse.data || imgResponse.data.length === 0) {
        throw new Error("No image data returned");
    }

    const image_base64 = imgResponse.data[0].b64_json
    const buffer = Buffer.from(image_base64, 'base64');
    const filePath = `${uuid}/${fileUuid}.png`

    await storage.write(filePath, buffer, {
        visibility: Visibility.PUBLIC
    })

    return JSON.stringify({
        imageURL: await storage.temporaryUrl(filePath, {expiresAt: Date.now() + 24 * 60 * 1000}),
        heading,
    })
}

export const imageGenerator = tool(toolExecutor, {
        name: "generate_image",
        description: "Generate an image from a given prompt.",
        schema: z.object({
            prompt: z.string().describe("Prompt to generate the image."),
            heading: z.string().describe("Heading for the image."),
        })
    }
)