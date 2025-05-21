import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { mdToPdf } from 'md-to-pdf'
import { v4 as uuidv4 } from 'uuid';
import { storage } from "~~/io/Storage";

const toolExecutor = async (input: { md: string; filename: string; title: string }) => {
    const { md, filename, title } = input;
    const uuid = uuidv4()

    // Convert markdown to PDF
    const pdf = await mdToPdf({ content: md }, { document_title: title });

    // Save the PDF file
    const filePath = `${uuid}/${filename}.pdf`;
    await storage.write(filePath, pdf.content)

    const fileUrl = await storage.temporaryUrl(filePath, {expiresAt: Date.now() + 24 * 60 * 1000})

    return `PDF file saved as ${fileUrl}`;
}

export const pdfBuilderTool = tool(toolExecutor, {
    name: "generate_pdf",
    description: "A tool to build a PDF file from a given md.",
    schema: z.object({
        md: z.string().describe("The markdown content to be converted to PDF. Also DO NOT change image URLs."),
        filename: z.string().describe("The name of the PDF file to be created."),
        title: z.string().describe("The title of the PDF file."),
    })
})


