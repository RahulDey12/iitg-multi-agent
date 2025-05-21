import { HumanMessage } from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";

export type AgentNodeParams = {
    state: any;
    agent: Runnable;
    name: string;
};

export const runAgentNode = async ({ state, agent, name }: AgentNodeParams) => {
    const result = await agent.invoke({
        messages: state.messages,
    });
    
    const lastMessage = result.messages[result.messages.length - 1];
    
    return {
        messages: [new HumanMessage({ content: lastMessage.content, name })],
    };
}
