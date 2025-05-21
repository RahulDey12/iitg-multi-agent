import { BaseMessage } from "@langchain/core/messages";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { createTeamSupervisor } from "../helpers/createTeamSupervisor";
import { Runnable, RunnableLambda } from "@langchain/core/runnables";
import { NoteTakerNode } from "../nodes/NoteTakerNode";
import { CopyEditorNode } from "../nodes/CopyEditorNode";
import { DraftWriterNode } from "../nodes/DraftWriterNode";
import { DesignerNode } from "../nodes/DesignerNode";

export type ImageObject = {
    url: string;
    heading: string;
}

export const ContentTeamState = Annotation.Root({
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

export class ContentTeam {
    private llm: any;
    private supervisorAgent: Runnable
    private researchGraph: any

    constructor() {
        this.llm = new ChatOpenAI({ modelName: "gpt-4o" });
    }

    async setup() {
        this.supervisorAgent = await this.createSupervisorAgent();
        this.researchGraph = this.createLangGraph();
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
            ["NoteTaker", "DraftWriter", "Designer", "CopyEditor"],
        );
    }

    private createLangGraph() {
        return new StateGraph(ContentTeamState)
            .addNode<string>("NoteTaker", new NoteTakerNode(this.llm).getNode())
            .addNode("supervisor", this.supervisorAgent)
            .addNode("DraftWriter", new DraftWriterNode(this.llm).getNode())
            .addNode("Designer", new DesignerNode(this.llm).getNode())
            .addNode("CopyEditor", new CopyEditorNode(this.llm).getNode())
            // Define the control flow
            .addEdge("NoteTaker", "supervisor")
            .addEdge("DraftWriter", "supervisor")
            .addEdge("Designer", "supervisor")
            .addEdge("CopyEditor", "supervisor")
            .addConditionalEdges("supervisor", (x) => x.next, {
                NoteTaker: "NoteTaker",
                DraftWriter: "DraftWriter",
                Designer: "Designer",
                CopyEditor: "CopyEditor",
                FINISH: END,
            })
            .addEdge(START, "supervisor")
    }

    getChain() {
        return RunnableLambda.from(({messages}: {messages: BaseMessage[]}) => {
            return {
                messages: messages,
                team_members: ["NoteTaker", "DraftWriter", "Designer", "CopyEditor"],
            }
        }).pipe(this.researchGraph.compile());
    }
}
