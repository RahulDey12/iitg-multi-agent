import { storage } from "~~/io/Storage"
import { readFile } from 'node:fs/promises'
import { pdfBuilderTool } from "~~/llm/tools/pdfBuilder"
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import type { Document } from "@langchain/core/documents";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

const requestSchema = z.object({
  message: z.string().min(0, 'Message is required'),
});

export default defineEventHandler(async (event) => {
    const body = await readValidatedBody(event, requestSchema.parse)

    const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
    });

    const document1: Document = {
        pageContent: "The first Indian Institute of Technology (IIT) was established in Kharagpur, West Bengal on August 18, 1951.",
        metadata: { source: "https://example.com" },
    }

    const document2: Document = {
        pageContent: "Indian Institute of Technology (IIT) Bombay was established with the assistance of the Soviet Union.",
        metadata: { source: "https://example.com" },
    }

    const document3: Document = {
        pageContent: "The IIT-JEE (Joint Entrance Exam) is often cited as one of the toughest exams in the world.",
        metadata: { source: "https://example.com" },
    }

    const documents = [document1, document2, document3]

    const vectorStore = await MemoryVectorStore.fromDocuments(
        documents,
        new OpenAIEmbeddings()
    );

    const template = `Answer the question based only on the following context:
        {context}

        Question: {question}
    `;

    const prompt = ChatPromptTemplate.fromTemplate(template);

   const retriever = vectorStore.asRetriever()

   const retrievalChain = RunnableSequence.from([
        {
            context: retriever.pipe((docs) =>  {
                if(! docs.length) return ""

                return docs[0].pageContent
            }),
            question: new RunnablePassthrough(),
        },
        prompt,
        llm,
        new StringOutputParser(),
    ]);

    return retrievalChain.invoke(body.message)
})