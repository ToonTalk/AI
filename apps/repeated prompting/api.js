// api.js

async function processMessage(agent, message, maxRetries = 3) {
    console.log(`Processing message for agent: ${agent.role}, LLM type: ${agent.llmType}`);
    console.log(`Message: ${message}`);
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            let response;

            switch (agent.llmType) {
                case 'geminiNano':
                    console.log(`Sending prompt to Gemini Nano: ${message}`);
                    response = await agent.session.prompt(message);
                    console.log(`Received response from Gemini Nano: ${response}`);
                    agent.messages.push(response);
                    
                    // Destroy the session after receiving the response to free resources
                    agent.session.destroy();
                    console.log("Session destroyed for Gemini Nano.");
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
            const COHERE_API_URL = 'https://api.cohere.com/v1/chat';
            
            const chatHistory = messages.slice(0, -1).map(msg => ({
                role: msg.startsWith('You are a') ? 'SYSTEM' : 'USER',
                message: msg
            }));

            const requestBody = {
                message: messages[messages.length - 1],
                model: 'command-r-plus-08-2024',
                chat_history: chatHistory,
                temperature: 0.3,
                max_tokens: 500,
            };

            console.log('Cohere API Request:', JSON.stringify(requestBody, null, 2));

            try {
                const response = await fetch(COHERE_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'X-Client-Name': 'Minsky Agents Simulation'
                    },
                    body: JSON.stringify(requestBody)
                });

                const responseData = await response.json();

                if (!response.ok) {
                    console.error('Cohere API Error Response:', responseData);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${responseData.message || 'Unknown error'}`);
                }

                console.log('Cohere API Response:', responseData);
                return responseData.text;
            } catch (error) {
                console.error('Error calling Cohere API:', error);
                throw error;
            }
        }

        async function callGpt4Api(apiKey, messages) {
            const GPT4_API_URL = 'https://api.openai.com/v1/chat/completions';
            
            const requestBody = {
                model: "gpt-4o-mini", 
                messages: messages,
                max_tokens: 500,
                temperature: 0.7,
            };

            console.log('GPT-4 API Request:', JSON.stringify(requestBody, null, 2));

            try {
                const response = await fetch(GPT4_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(requestBody)
                });

                const responseData = await response.json();

                if (!response.ok) {
                    console.error('GPT-4 API Error Response:', responseData);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${responseData.error?.message || 'Unknown error'}`);
                }

                console.log('GPT-4 API Response:', responseData);
                return responseData.choices[0].message.content;
            } catch (error) {
                console.error('Error calling GPT-4 API:', error);
                throw error;
            }
        }