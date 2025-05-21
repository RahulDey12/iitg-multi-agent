import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseMessage } from "@langchain/core/messages";
import { StructuredTool } from "@langchain/core/tools";
import { MessagesAnnotation } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { agentStateModifier } from "../helpers/agentStateModifier";
import { runAgentNode } from "../helpers/runAgentNode";
import { ResearchTeamState } from "../teams/reasearchTeam";
import { webScraperTool } from "../tools/webScraper";

export class ResearchNode {
    private tools: StructuredTool[]

    constructor(private llm: BaseChatModel) {
        const scrapeWebpage = webScraperTool

        this.tools = [scrapeWebpage];
    }

    getNode() {
        return (state: typeof ResearchTeamState.State) => this.getAgentNode(state);
    }
    
    addTool(tool: StructuredTool) {
        this.tools.push(tool);
        
        return this;
    }
    
    private getAgentNode(state: typeof ResearchTeamState.State) {
        return runAgentNode({
            state: state, 
            agent: this.getAgent(this.getStateModifier(state)), 
            name: "WebScraper" 
        })
    }

    private getAgent(stateModifier: (state: typeof MessagesAnnotation.State) => BaseMessage[]) {
        return createReactAgent({
            llm: this.llm,
            tools: this.tools,
            stateModifier,
        })
    }

    private getStateModifier(state: typeof ResearchTeamState.State) {
        return agentStateModifier(
            "You are a research assistant who can scrape specified urls for more detailed information using the scrapeWebpage function.",
            this.tools,
            state.team_members ?? ["WebScraper"],
        )
    }
}