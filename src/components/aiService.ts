import axios from 'axios';


const generateAIResponse = async (prompt: string): Promise<{ story: string, choices: string[] }> => {

    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_AI === 'true') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return mockResponseGeneration(prompt);
    }

    try {
        const API_URL = "https://api.groq.com/openai/v1/chat/completions";
        const API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
        const enhancedPrompt = `
You are an AI assistant creating content for a military strategy game. Generate a mission briefing based on the following details:

${prompt}

IMPORTANT FORMATTING INSTRUCTIONS:
1. DO NOT include any thinking, reasoning, or step-by-step process in your response
2. DO NOT use tags like <thinking> or similar
3. Start directly with the mission briefing narrative
4. Write a mission briefing narrative (200-300 words)
5. Then, write "TACTICAL OPTIONS:" on a new line
6. Then list exactly 3 tactical options, each on a new line starting with "- "

Example format:
Alpha Company, this is Command. [Your mission briefing narrative here...]

TACTICAL OPTIONS:
- [First tactical option]
- [Second tactical option]
- [Third tactical option]

Make the tactical options distinct and meaningful choices that would affect how the mission proceeds.
`;

        const response = await axios.post(
            API_URL,
            {
                model: "llama-3.1-8b-instant", 
                messages: [
                    {
                        role: "system",
                        content: "You are a military strategy game AI that creates immersive mission briefings and tactical options."
                    },
                    {
                        role: "user",
                        content: enhancedPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const generatedText = response.data.choices[0]?.message?.content || '';

        // Parse the response with improved logic
        return parseAIResponse(generatedText);
    } catch (error) {
        console.error("Error generating AI response:", error);

        if (axios.isAxiosError(error)) {
            console.error("API Error Details:", {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
        }

        return mockResponseGeneration(prompt);
    }
};



const parseAIResponse = (text: string): { story: string, choices: string[] } => {
    try {
     
        if (text.includes("TACTICAL OPTIONS:")) {
            const [storyPart, optionsPart] = text.split("TACTICAL OPTIONS:");

        
            const story = storyPart.trim();

            const optionsText = optionsPart.trim();
            const options = optionsText
                .split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.trim().substring(2).trim());

            
            if (options.length > 0) {
             
                const finalOptions = ensureThreeOptions(options);
                return { story, choices: finalOptions };
            }
        }

        const numberedOptionsRegex = /(?:^|\n)(\d+\.\s+.+?)(?=\n\d+\.|\n\n|$)/gs;
        const numberedMatches = Array.from(text.matchAll(numberedOptionsRegex));

        if (numberedMatches.length >= 2) {
       
            const options = numberedMatches.map(match =>
                match[1].replace(/^\d+\.\s+/, '').trim()
            );

            const firstOptionIndex = text.indexOf(numberedMatches[0][0]);
            const story = text.substring(0, firstOptionIndex).trim();

       
            const finalOptions = ensureThreeOptions(options);
            return { story, choices: finalOptions };
        }

        const optionPrefixRegex = /(?:^|\n)(?:Option|Choice)(?:\s+\d+)?:\s+(.+?)(?=\n(?:Option|Choice)|$)/gs;
        const prefixMatches = Array.from(text.matchAll(optionPrefixRegex));

        if (prefixMatches.length >= 2) {
         
            const options = prefixMatches.map(match => match[1].trim());

          
            const firstOptionIndex = text.indexOf(prefixMatches[0][0]);
            const story = text.substring(0, firstOptionIndex).trim();

            const finalOptions = ensureThreeOptions(options);
            return { story, choices: finalOptions };
        }

 
        const paragraphs = text.split('\n\n');

        if (paragraphs.length >= 4) { 
            const story = paragraphs.slice(0, paragraphs.length - 3).join('\n\n').trim();
            const options = paragraphs.slice(paragraphs.length - 3).map(p => p.trim());

            return { story, choices: options };
        }

        const splitPoint = Math.floor(text.length * 0.75);
        const story = text.substring(0, splitPoint).trim();

        const contentWords = text.split(/\s+/);
        const keywords = contentWords
            .filter(word => word.length > 5)
            .filter((v, i, a) => a.indexOf(v) === i) 
            .slice(0, 10);

        return {
            story,
            choices: [
                `Approach cautiously, focusing on ${keywords[0] || 'stealth'}`,
                `Launch a direct assault targeting the ${keywords[2] || 'main objective'}`,
                `Gather more intelligence about ${keywords[4] || 'enemy positions'}`
            ]
        };
    } catch (error) {
        console.error("Error parsing AI response:", error);

        return {
            story: "TACTICAL ASSESSMENT: Mission parameters received. Proceed with caution, Commander. The situation is fluid and requires your immediate attention.",
            choices: [
                "Advance cautiously",
                "Request additional intelligence",
                "Analyze tactical options"
            ]
        };
    }
};

const ensureThreeOptions = (options: string[]): string[] => {
    const defaultOptions = [
        "Advance cautiously",
        "Request additional intelligence",
        "Analyze tactical options"
    ];


    if (options.length === 3) {
        return options;
    }

 
    if (options.length > 3) {
        return options.slice(0, 3);
    }


    const result = [...options];
    for (let i = options.length; i < 3; i++) {
        result.push(defaultOptions[i]);
    }

    return result;
};


const mockResponseGeneration = (prompt: string): { story: string, choices: string[] } => {
  
    const missionMatch = prompt.match(/Your mission is: (.*?)(?:\n|$)/);
    const locationMatch = prompt.match(/Location: (.*?)(?:\n|$)/);
    const enemyMatch = prompt.match(/Enemy Forces: (.*?)(?:\n|$)/);

    const missionName = missionMatch ? missionMatch[1].trim() : "Operation Fallback";
    const location = locationMatch ? locationMatch[1].trim() : "the contested region";
    const enemy = enemyMatch ? enemyMatch[1].trim() : "hostile forces";


    const story = `
TACTICAL ASSESSMENT: ${location}

Dawn breaks over the horizon as your convoy approaches the operational zone for ${missionName}. Satellite imagery shows ${enemy} have fortified key positions along the northern ridge. Your troops are in position and awaiting your command.

Intelligence reports indicate enemy patrols are concentrated near the central compound, with minimal presence in the surrounding areas. Our forward scouts have identified three potential approaches to the objective.

The weather conditions are favorable, with clear visibility and moderate winds. However, forecasts predict a storm front moving in within the next 12 hours, which could impact operations if we don't move quickly.

Your communications officer reports all systems are operational, and you have a direct line to headquarters if reinforcements become necessary.

The men are ready, Commander. How do you wish to proceed?
`.trim();

    
    const choices = [
        "Conduct a stealth approach under cover of darkness to minimize detection",
        "Launch a diversionary attack on the eastern flank while main force strikes from the west",
        "Deploy reconnaissance drones to gather additional intelligence before committing forces"
    ];

    return { story, choices };
};

export default generateAIResponse;