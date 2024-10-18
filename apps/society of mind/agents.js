// agents.js

let agents = [];

async function createAgent(role, systemPrompt, llmType, apiKey) {
    console.log(`Attempting to create agent: ${role} with LLM type: ${llmType}`);
    const baseAgent = { 
        role, 
        llmType,
        apiKey, 
        messages: [`You are a ${role} agent in Minsky's Society of Mind. ${systemPrompt}`] 
    };

    if (llmType === 'geminiNano') {
        try {
            console.log(`Creating Gemini Nano session for ${role}`);
            const session = await ai.assistant.create({
                systemPrompt: `You are a ${role} agent in Minsky's Society of Mind. ${systemPrompt}`
            });
            console.log(`Gemini Nano session created successfully for ${role}`);
            return { ...baseAgent, session };
        } catch (error) {
            console.error(`Error creating Gemini Nano session for ${role}:`, error);
            throw error;
        }
    }

    console.log(`Agent created successfully: ${role}`);
    return baseAgent;
}

async function initializeAgents() {
    const llmSelect = document.getElementById('llmSelect');
    const apiKeyInput = document.getElementById('apiKeyInput');
    currentLLMType = llmSelect.value;
    const apiKey = currentLLMType === 'geminiNano' ? null : apiKeyInput.value;
    console.log(`Initializing agents with LLM type: ${currentLLMType}`);

    const agentRoles = [
        { role: 'K-line', prompt: 'Your role is to store and retrieve specific memories or knowledge. When asked a question, provide relevant information from your knowledge base. If you don\'t have specific information, say so.' },
        { role: 'Neme', prompt: 'You are a basic memory element. Your task is to recognize and respond to specific patterns or stimuli.' },
        { role: 'Frame', prompt: 'You represent a structured collection of information about a particular concept or situation. Provide context and details when called upon.' },
        { role: 'Trans-frame', prompt: 'Your job is to handle transitions between different frames or states. Suggest how to move from one situation to another.' },
        { role: 'Polyneme', prompt: 'You are responsible for connecting multiple ideas or concepts. When presented with information, find and explain relationships between different elements.' },
        { role: 'Microneme', prompt: 'You represent small, context-specific bits of information. Provide subtle contextual cues that might influence thinking or decision-making.' },
        { role: 'Censor', prompt: 'Your role is to inhibit or prevent certain thoughts or actions. When presented with ideas, evaluate if they should be suppressed and explain why.' },
        { role: 'Suppressor', prompt: 'Similar to a Censor, but you actively work to reduce the influence of certain thoughts or memories. Suggest alternative focuses when presented with information.' },
        { role: 'Recognizer', prompt: 'Your job is to identify patterns, concepts, or relevant information in any input you receive. Analyze the input and describe any patterns or important elements you recognize.' },
        { role: 'Difference-engine', prompt: 'Your task is to compare the current state of a situation to the desired state and suggest actions to bridge the gap. Analyze the situation presented to you, identify discrepancies, and propose solutions.' },
        { role: 'Summary', prompt: 'Your task is to generate concise summaries of the interactions between other agents. Highlight key points and progression towards the solution.' },
        { role: 'Decision', prompt: 'Your role is to evaluate the current state of the problem-solving process and decide if a satisfactory solution has been found. Consider the initial problem and the proposed solutions.' }
    ];

    const selectedAgents = Array.from(document.querySelectorAll('.agent-checkbox:checked')).map(checkbox => checkbox.value);
    
    // Ensure Summary and Decision agents are always created
    const essentialAgents = ['Summary', 'Decision'];
    const agentsToCreate = [...new Set([...selectedAgents, ...essentialAgents])];

    agents = await Promise.all(agentRoles
        .filter(({role}) => agentsToCreate.includes(role))
        .map(({ role, prompt }) => createAgent(role, prompt, currentLLMType, apiKey))
    );

    console.log("Initialized agents:", agents.map(agent => agent.role));
}

function getRandomAgent() {
    return agents[Math.floor(Math.random() * agents.length)];
}

function getAgentTask(role) {
    switch (role) {
        case 'K-line':
            return 'Provide relevant information from your knowledge base.';
        case 'Neme':
            return 'Recognize and respond to specific patterns or stimuli in the current situation.';
        case 'Frame':
            return 'Provide context and details about the current concept or situation.';
        case 'Trans-frame':
            return 'Suggest how to transition from the current state to a desired state.';
        case 'Polyneme':
            return 'Find and explain relationships between different elements in the current situation.';
        case 'Microneme':
            return 'Provide subtle contextual cues that might influence thinking or decision-making in this situation.';
        case 'Censor':
            return 'Evaluate if any ideas should be suppressed and explain why.';
        case 'Suppressor':
            return 'Suggest alternative focuses to reduce the influence of certain thoughts or memories.';
        case 'Recognizer':
            return 'Identify patterns or concepts in the current situation.';
        case 'Difference-engine':
            return 'Compare the current state to the desired state and suggest actions to bridge the gap.';
        default:
            return 'Analyze the situation and provide insights based on your role.';
    }
}