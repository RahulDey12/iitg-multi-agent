import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { Supervisor } from "~~/llm/teams/Supervisor";

const requestSchema = z.object({
  message: z.string().min(0, 'message is required'),
});

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, requestSchema.parse)

  const supervisor = new Supervisor()
  await supervisor.setup()
  const chain = supervisor.getChain()

  const res = await chain.invoke({
    messages:[new HumanMessage(query.message)],
  })

  return { res }
});
