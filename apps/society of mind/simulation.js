// simulation.js

let currentLLMType = '';

async function runDecentralizedSystem(initialPrompt, maxIterations = 10) {
    console.log("Starting runDecentralizedSystem");
    console.log(`Initial prompt: ${initialPrompt}`);
    console.log(`Max iterations: ${maxIterations}`);

    let currentAgent = getRandomAgent();
    console.log(`Initial agent selected: ${currentAgent.role}`);

    let currentPrompt = initialPrompt;
    let output = '';
    let interactionLog = '';
    let errorLog = '';

    const summaryDiv = document.getElementById('summary');
    summaryDiv.innerHTML = window.md.render(`## Problem: ${initialPrompt}\n\n## Iteration Summaries:`);

    for (let i = 0; i < maxIterations; i++) {
        console.log(`\nStarting iteration ${i + 1}`);
        output += `\n## Iteration ${i + 1}:\n`;
        output += `${currentAgent.role} processing: ${currentPrompt}\n`;
        
        try {
            console.log(`Sending prompt to ${currentAgent.role}: ${currentPrompt}`);
            const response = await processMessage(currentAgent, currentPrompt);
            
            if (!response) {
                console.error(`Empty response received from agent ${currentAgent.role}`);
                errorLog += `Error in iteration ${i + 1}: Empty response from agent ${currentAgent.role}\n`;
                continue;
            }

            console.log(`Received response from ${currentAgent.role}: ${response}`);
            output += `${currentAgent.role} response: ${response}\n`;
            interactionLog += `${currentAgent.role} -> ${response}\n`;
            
            const summaryAgent = agents.find(agent => agent.role === 'Summary');
            if (summaryAgent) {
                console.log("Generating iteration summary");
                const iterationSummaryPrompt = `Summarize the key points and contributions of the following interaction. Ensure your summary captures all important details:\n${currentAgent.role}: ${response}`;
                const iterationSummary = await processMessage(summaryAgent, iterationSummaryPrompt);
                
                console.log(`Iteration summary: ${iterationSummary}`);
                const iterationSummaryHTML = window.md.render(`### Iteration ${i + 1} (${currentAgent.role}):\n${iterationSummary}`);
                summaryDiv.innerHTML += iterationSummaryHTML;
            } else {
                console.log("No Summary agent found, skipping iteration summary");
            }
            
            currentAgent = getRandomAgent();
            console.log(`Next agent selected: ${currentAgent.role}`);
            currentPrompt = `Previous interactions:\n${interactionLog}\nYour task: ${getAgentTask(currentAgent.role)}`;
        } catch (error) {
            console.error(`Error in iteration ${i + 1}:`, error);
            errorLog += `Error in iteration ${i + 1}: ${error.message}\n`;
            currentAgent = getRandomAgent();
            console.log(`Error occurred. New agent selected: ${currentAgent.role}`);
            currentPrompt = initialPrompt;
        }
    }

    console.log("Iterations complete. Generating final summary and decision.");

    const summaryAgent = agents.find(agent => agent.role === 'Summary');
    let summary = '';
    if (summaryAgent) {
        console.log("Summary agent found. Generating final summary.");
        const summaryPrompt = `Provide a comprehensive summary of the solution to the following problem based on the agents' interactions. Ensure you capture all key components of the solution:\n\nProblem: "${initialPrompt}"\n\nInteractions:\n${interactionLog}`;
        try {
            summary = await processMessage(summaryAgent, summaryPrompt);
            console.log(`Final summary generated: ${summary}`);
        } catch (error) {
            console.error("Error generating final summary:", error);
            errorLog += `Error generating final summary: ${error.message}\n`;
        }
    } else {
        console.error("No Summary agent found. This should not happen.");
    }

    const decisionAgent = agents.find(agent => agent.role === 'Decision');
    let finalDecision = '';
    if (decisionAgent) {
        console.log("Decision agent found. Generating final decision.");
        const decisionPrompt = `Evaluate if a satisfactory solution has been found for the following problem. Provide a detailed explanation of how well the solution addresses the initial problem:\n\nProblem: ${initialPrompt}\n\nFinal summary of solution: ${summary}\n\nRespond with YES or NO and your explanation.`;
        try {
            finalDecision = await processMessage(decisionAgent, decisionPrompt);
            console.log(`Final decision generated: ${finalDecision}`);
        } catch (error) {
            console.error("Error generating final decision:", error);
            errorLog += `Error generating final decision: ${error.message}\n`;
        }
    } else {
        console.error("No Decision agent found. This should not happen.");
    }

    console.log("Updating summary div with final results");
    let finalHTML = '';
    if (summary) {
        finalHTML += `\n\n## Final Solution:\n${summary}`;
    }
    if (finalDecision) {
        finalHTML += `\n\n## Final Decision: ${finalDecision}`;
    }
    if (finalHTML) {
        summaryDiv.innerHTML += window.md.render(finalHTML);
    } else {
        console.log("No final solution or decision to render.");
        summaryDiv.innerHTML += "<p>No final solution or decision was generated.</p>";
    }

    console.log("runDecentralizedSystem completed");
    return { fullLog: output, errorLog };
}

function runSimulation() {
    const problem = document.getElementById('problem').value;
    const maxIterations = parseInt(document.getElementById('maxIterations').value);
    const summaryDiv = document.getElementById('summary');
    const fullLogDiv = document.getElementById('fullLog');
    const errorLogDiv = document.getElementById('errorLog');

    const essentialAgents = ['Summary', 'Decision'];
    const missingAgents = essentialAgents.filter(role => !agents.some(agent => agent.role === role));
    if (missingAgents.length > 0) {
        console.error(`Missing essential agents: ${missingAgents.join(', ')}`);
        alert(`Cannot run simulation. Missing essential agents: ${missingAgents.join(', ')}`);
        return;
    }

    if (currentLLMType !== 'geminiNano' && !document.getElementById('apiKeyInput').value) {
        alert('Please enter an API key for the selected LLM.');
        return;
    }

    const selectedAgents = Array.from(document.querySelectorAll('.agent-checkbox:checked')).map(checkbox => checkbox.value);
    if (selectedAgents.length === 0) {
        alert('Please select at least one agent type.');
        return;
    }

    summaryDiv.textContent = 'Initializing agents...';
    fullLogDiv.textContent = '';
    errorLogDiv.textContent = '';
    
    initializeAgents().then(() => {
        summaryDiv.textContent = 'Running simulation...';
        return runDecentralizedSystem(problem, maxIterations);
    }).then(({ fullLog, errorLog }) => {
        fullLogDiv.innerHTML = window.md.render(fullLog);
        errorLogDiv.textContent = errorLog || 'No errors occurred during the simulation.';
    }).catch(error => {
        summaryDiv.innerHTML = `<span class="error">An error occurred: ${error.message}</span>`;
        errorLogDiv.textContent = `Detailed error: ${error.stack}`;
    });
}