import { BaseMessage } from "@langchain/core/messages";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { createTeamSupervisor } from "../helpers/createTeamSupervisor";
import { Runnable } from "@langchain/core/runnables";
import { SearchNode } from "../nodes/SearchNode";
import { ResearchNode } from "../nodes/ResearchNode";

export const ResearchTeamState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
    }),
    team_members: Annotation<string[]>({
        reducer: (x, y) => x.concat(y),
    }),
    next: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "supervisor",
    }),
    instructions: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "Solve the human's question.",
    }),
});

export class ResearchTeam {
    private supervisorAgent: Runnable
    private researchGraph: any
    private llm: ChatOpenAI

    constructor() {
        this.llm = new ChatOpenAI({ modelName: "gpt-4o" })
    }

    async setup () {
        this.supervisorAgent = await this.createSupervisorAgent()
        this.researchGraph = this.createLangGraph()
    }

    private async createSupervisorAgent() {
        return await createTeamSupervisor(
            this.llm,
            "You are a supervisor tasked with managing a conversation between the" +
                " following workers:  {team_members}. Given the following user request," +
                " respond with the worker to act next. Each worker will perform a" +
                " task and respond with their results and status. When finished," +
                " respond with FINISH.\n\n" +
                " Select strategically to minimize the number of steps taken.",
            ["Search"],
        );
    }

    private createLangGraph() {
        return new StateGraph(ResearchTeamState)
            .addNode<string>("Search", new SearchNode(this.llm).getNode())
            .addNode("supervisor", this.supervisorAgent)
            // .addNode("WebScraper", new ResearchNode(this.llm).getNode())
            // Define the control flow
            .addEdge("Search", "supervisor")
            // .addEdge("WebScraper", "supervisor")
            .addConditionalEdges("supervisor", (x) => x.next, {
                Search: "Search",
                // WebScraper: "WebScraper",
                FINISH: END,
            })
            .addEdge(START, "supervisor")
    }

    getChain() {
        return this.researchGraph.compile();
    }
}
