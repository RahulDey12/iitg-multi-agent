# Rag Chain

## Initialize Our LLM

```ts
    import { ChatOpenAI } from "@langchain/openai";

    const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
    });

```

## Initializing Document Retriever

```ts
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import type { Document } from "@langchain/core/documents";

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

const retriever = vectorStore.asRetriever()
```

## Creating Our System Prompt

```ts
const template = `Answer the question based only on the following context:
    {context}

    Question: {question}
`;

const prompt = ChatPromptTemplate.fromTemplate(template);
```

## Creating Our Chain(Agent)

```ts
const retrievalChain = RunnableSequence.from([
    {
        context: retriever.pipe((docs) =>  {
            if(! docs.length) return "" // If no documents exists

            return docs[0].pageContent
        }),
        question: new RunnablePassthrough(),
    },
    prompt,
    llm,
    new StringOutputParser(),
]);

return retrievalChain.invoke('where was the first IIT established')
```
