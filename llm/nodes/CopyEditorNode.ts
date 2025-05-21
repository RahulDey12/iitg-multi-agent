import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseMessage } from "@langchain/core/messages";
import { StructuredTool } from "@langchain/core/tools";
import { MessagesAnnotation } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { agentStateModifier } from "../helpers/agentStateModifier";
import { runAgentNode } from "../helpers/runAgentNode";
import { ContentTeamState } from "../teams/contentTeam";
import { imageGenerator } from "../tools/imageGenerator";
import { pdfBuilderTool } from "../tools/pdfBuilder";

export class CopyEditorNode {
    private tools: StructuredTool[] = []

    constructor(private llm: BaseChatModel) {
        this.tools = [imageGenerator, pdfBuilderTool]
    }

    getNode() {
        return (state: typeof ContentTeamState.State) => this.getAgentNode(state);
    }
    
    addTool(tool: StructuredTool) {
        this.tools.push(tool);
        
        return this;
    }
    
    private getAgentNode(state: typeof ContentTeamState.State) {
        return runAgentNode({
            state: state, 
            agent: this.getAgent(this.getStateModifier(state)), 
            name: "CopyEditor" 
        })
    }

    private getAgent(stateModifier: (state: typeof MessagesAnnotation.State) => BaseMessage[]) {
        return createReactAgent({
            llm: this.llm,
            tools: this.tools,
            stateModifier,
        })
    }

    private getStateModifier(state: typeof ContentTeamState.State) {
        return agentStateModifier(
            "You are an expert senior Copy Editor tasked with re-writing article with better structure "+
            "based on draft article and use images. After that, create a PDF of the article.",
            this.tools,
            state.team_members ?? [],
        )
    }
}