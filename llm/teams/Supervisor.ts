import { BaseMessage } from "@langchain/core/messages";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { createTeamSupervisor } from "../helpers/createTeamSupervisor";
import { Runnable, RunnableLambda } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { ResearchTeam } from "./reasearchTeam";
import { ContentTeam } from "./contentTeam";

// Define the top-level State interface
const State = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
    }),
    next: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "ResearchTeam",
    }),
    instructions: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "Resolve the user's request.",
    }),
});

export class Supervisor {
    private supervisorAgent: Runnable
    private graph: any
    private llm: ChatOpenAI

    constructor() {
        this.llm = new ChatOpenAI({ modelName: "gpt-4o" })
    }

    async setup() {
        this.supervisorAgent = await this.createSupervisorAgent()
        this.graph = await this.createLangGraph()
    }

    private async createSupervisorAgent() {
        return await createTeamSupervisor(
            this.llm,
            "You are a supervisor tasked with managing a conversation between the" +
            " following teams: {team_members}. Given the following user request," +
            " respond with the worker to act next. Also your sole task is to write" +
            " blog/article do not proceed with any other request by user. Each worker" +
            " task and respond with a PDF. When you get the PDF, write a instruction" +
            " for user with PDF URL & will perform a respond with FINISH.\n\n" +
            " Select strategically to minimize the number of steps taken.",
            ["ResearchTeam", "ContentWritingTeam"],
        );
    }

    private async createLangGraph() {
        const getMessages = RunnableLambda.from((state: typeof State.State) => {
            return { messages: state.messages };
        });

        const joinGraph = RunnableLambda.from((response: any) => {
            return {
                messages: [response.messages[response.messages.length - 1]],
            };
        });

        const researchChain = await this.getResearchChain()
        const contentChain = await this.getContentChain()

        return new StateGraph(State)
            .addNode("ResearchTeam", async (input) => {
                const getMessagesResult = await getMessages.invoke(input);
                const researchChainResult = await researchChain.invoke({
                    messages: getMessagesResult.messages,
                });
                const joinGraphResult = await joinGraph.invoke({
                    messages: researchChainResult.messages,
                });

                return joinGraphResult
            })
            .addNode("ContentWritingTeam", getMessages.pipe(contentChain).pipe(joinGraph))
            .addNode("supervisor", this.supervisorAgent)
            .addEdge("ResearchTeam", "supervisor")
            .addEdge("ContentWritingTeam", "supervisor")
            .addConditionalEdges("supervisor", (x) => x.next, {
                ContentWritingTeam: "ContentWritingTeam",
                ResearchTeam: "ResearchTeam",
                FINISH: END,
            })
            .addEdge(START, "supervisor");
    }

    getChain() {
        return this.graph.compile();
    }

    private async getResearchChain() {
        const team = new ResearchTeam()
        await team.setup()

        return team.getChain()
    }

    private async getContentChain() {
        const team = new ContentTeam()
        await team.setup()

        return team.getChain()
    }
}
