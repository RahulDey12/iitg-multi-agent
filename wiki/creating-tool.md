# Creating Tool

```ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";

weatherSchema = z.object({
    location: z.string().describe('location for the weather.')
})

const weatherTool = tool(async (input: z.infer<typeof weatherSchema>) => {
    // Call Weather API

    return result // 26°C
}, {
    name: 'weather_tool',
    description: 'A tool that fetch the current weather of a given location.',
    schema: weatherSchema
})
```

```ts
const mySupremeTool = tool(async (input) => {
    const anotherToolResult = await anotherTool.invoke(input)

    // Do Something with the Result

    return result
}, {
    // Our Options
})
```

## Calling Tool

```ts
weatherTool.invoke({location: 'IIT Guwahati Campus'})
```
