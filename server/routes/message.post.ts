import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { Supervisor } from "~~/llm/teams/Supervisor";

const requestSchema = z.object({
  message: z.string().min(0, 'Message is required'),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, requestSchema.parse)

  const supervisor = new Supervisor()
  await supervisor.setup()
  const chain = supervisor.getChain()

  const res = await chain.invoke({
    messages:[new HumanMessage(body.message)],
  })

  return { res }
});
