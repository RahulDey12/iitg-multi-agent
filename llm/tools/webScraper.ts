import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

const toolExecutor = async (input: { url: string }) => {
    const { url } = input;
    const loader = new CheerioWebBaseLoader(url, {
        selector: 'body'
    });
    const docs = await loader.load();
    const formattedDocs = docs.map(doc => `<Document name="${doc.metadata?.title}">\n${doc.pageContent}\n</Document>`);

    return formattedDocs.join("\n\n");
}

export const webScraperTool = tool(toolExecutor, {
        name: "scrape_webpage",
        description: "Scrape the contents a given URL.",
        schema: z.object({
            url: z.string().url().describe("The URL to scrape the content from."),
        })
    }
)