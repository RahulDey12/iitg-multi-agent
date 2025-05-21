import {
    ChatPromptTemplate,
    MessagesPlaceholder,
} from "@langchain/core/prompts";
import { Runnable } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputToolsParser } from "@langchain/core/output_parsers/openai_tools";
import { z } from "zod";

export const createTeamSupervisor = async (
    llm: ChatOpenAI, 
    systemPrompt: string, 
    members: string[]
): Promise<Runnable> => {
    const options = ["FINISH", ...members];

    const routeTool = {
        name: "route",
        description: "Select the next role.",
        schema: z.object({
            reasoning: z.string(),
            next: z.enum(["FINISH", ...members]),
            instructions: z.string().describe(
                "The specific instructions of the sub-task the next role should accomplish.",
            ),
        }),
    };

    let prompt = ChatPromptTemplate.fromMessages([
        ["system", systemPrompt],
        new MessagesPlaceholder("messages"),
        [
            "system",
            "Given the conversation above, who should act next? Or should we FINISH? Select one of: {options}",
        ],
    ]);

    prompt = await prompt.partial({
        options: options.join(", "),
        team_members: members.join(", "),
    });

    const supervisor = prompt
        .pipe(
            llm.bindTools([routeTool], {
                tool_choice: "route",
            }),
        )
        .pipe(new JsonOutputToolsParser())
        // select the first one
        .pipe((x: [{args: z.infer<typeof routeTool.schema>}]) => ({
            next: x[0].args.next,
            instructions: x[0].args.instructions,
        }));

    return supervisor;
}
