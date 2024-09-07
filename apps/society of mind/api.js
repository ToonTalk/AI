// api.js

async function processMessage(agent, message, maxRetries = 3) {
    console.log(`Processing message for agent: ${agent.role}, LLM type: ${agent.llmType}`);
    console.log(`Message: ${message}`);
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            let response;

            switch (agent.llmType) {
                case 'geminiNano':
                    agent.messages.push(message);
                    const fullPrompt = agent.messages.join('\n');
                    console.log(`Sending prompt to Gemini Nano: ${fullPrompt}`);
                    response = await agent.session.prompt(fullPrompt);
                    console.log(`Received response from Gemini Nano: ${response}`);
                    agent.messages.push(response);
                    break;
                case 'gemini':
                    response = await callGeminiApi(agent.apiKey, [...agent.messages, message]);
                    agent.messages.push(message, response);
                    break;
                case 'cohere':
                    response = await callCohereApi(agent.apiKey, [...agent.messages, message]);
                    agent.messages.push(message, response);
                    break;
                case 'gpt4':
                    response = await callGpt4Api(agent.apiKey, [...agent.messages, {role: "user", content: message}]);
                    agent.messages.push({role: "user", content: message}, {role: "assistant", content: response});
                    break;
                default:
                    throw new Error(`Invalid LLM type: ${agent.llmType}`);
            }

            return response;
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed for ${agent.role}:`, error);
            if (attempt === maxRetries - 1) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

async function callGeminiApi(apiKey, messages) {
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    const formattedMessages = messages.map((msg, index) => ({
        role: index % 2 === 0 ? "user" : "model",
        parts: [{ text: msg }]
    }));

    const requestBody = {
        contents: formattedMessages,
        safetySettings: [
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_ONLY_HIGH"
            }
        ],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
        }
    };

    console.log('Gemini API Request:', JSON.stringify(requestBody, null, 2));

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('Gemini API Error Response:', responseData);
            throw new Error(`HTTP error! status: ${response.status}, message: ${responseData.error?.message || 'Unknown error'}`);
        }

        console.log('Gemini API Response:', responseData);
        return responseData.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw error;
    }
}

async function callCohereApi(apiKey, messages) {
    // Implementation for Cohere API
    // This is a placeholder. You'll need to implement the actual API call based on Cohere's documentation.
    console.log('Calling Cohere API with messages:', messages);
    return "Cohere API response placeholder";
}

async function callGpt4Api(apiKey, messages) {
    // Implementation for GPT-4 API
    // This is a placeholder. You'll need to implement the actual API call based on OpenAI's documentation.
    console.log('Calling GPT-4 API with messages:', messages);
    return "GPT-4 API response placeholder";
}