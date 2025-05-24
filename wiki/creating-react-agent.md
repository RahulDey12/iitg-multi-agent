# React Agent Introduction


## Initialize Our LLM

```ts
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
}); // Can Be Bedrock, Llama, Google Vertex AI
```

## Create Our Reactive Agent

```ts
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const tools = [weatherTool, mathTool]

const agent = createReactAgent({
    llm,
    tools,
});

await agent.invoke('question')
```
