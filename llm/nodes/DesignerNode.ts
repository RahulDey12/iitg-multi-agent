import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseMessage } from "@langchain/core/messages";
import { StructuredTool } from "@langchain/core/tools";
import { MessagesAnnotation } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { agentStateModifier } from "../helpers/agentStateModifier";
import { runAgentNode } from "../helpers/runAgentNode";
import { ContentTeamState } from "../teams/contentTeam";
import { imageGenerator } from "../tools/imageGenerator";

export class DesignerNode {
    private tools: StructuredTool[] = []

    constructor(private llm: BaseChatModel) {
        this.tools = [imageGenerator]
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
            name: "Designer" 
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
            "You are an expert Designer tasked with creating images based on draft article" +
            " create a featured image for the article and images for each section(h2) of the article.",
            this.tools,
            state.team_members ?? ["Designer"],
        )
    }
}