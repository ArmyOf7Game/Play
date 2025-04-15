import axios from 'axios';

export interface MissionTheme {
    operationName: string;
    location: string;
    enemyForce: string;
    objective: string;
    complication: string;
    reward: string;
}


const generateMissionTheme = async (): Promise<MissionTheme> => {
    try {

        const API_URL = "https://api.groq.com/openai/v1/chat/completions";
        const API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

        const randomSeed = Math.floor(Math.random() * 10000);
        // Prompt for the AI to generate mission content
        const themePrompt = `
Generate a unique military operation theme. Use seed ${randomSeed} for randomness.
Format the response as JSON with these fields:
{
  "operationName": "A creative military operation name",
  "location": "A specific tactical location",
  "enemyForce": "Description of enemy forces",
  "objective": "Primary mission objective",
  "complication": "A tactical complication",
  "reward": "Strategic benefit of success"
}
Make it varied and interesting.
`;

        // Make the API request
        const response = await axios.post(
            API_URL,
            {
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: "You are a military strategy game AI that creates mission themes."
                    },
                    {
                        role: "user",
                        content: themePrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );




        const generatedText = response.data.choices[0]?.message?.content || '';


        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);


        if (jsonMatch) {
            try {

                const missionData = JSON.parse(jsonMatch[0]);


                const result = {
                    operationName: missionData.operationName || "Operation Fallback",
                    location: missionData.location || "Contested Territory",
                    enemyForce: missionData.enemyForce || "Hostile Forces",
                    objective: missionData.objective || "Complete the mission",
                    complication: missionData.complication || "Unexpected resistance",
                    reward: missionData.reward || "Tactical advantage"
                };


                return result;
            } catch (parseError) {
                console.error("Failed to parse AI response:", parseError);
                throw new Error("Invalid response format");
            }
        } else {


            return extractMissionDataFromText(generatedText);
        }
    } catch (error) {
        console.error("Error generating mission:", error);


        return {
            operationName: "Operation Iron Shield",
            location: "Urban Warzone",
            enemyForce: "Rogue Military Unit",
            objective: "Secure the command center",
            complication: "Communications blackout",
            reward: "Advanced weapons cache"
        };
    }
};

const extractMissionDataFromText = (text: string): MissionTheme => {

    const extract = (keywords: string[], defaultValue: string): string => {
        for (const keyword of keywords) {
            const regex = new RegExp(`${keyword}[:\\s]+(.*?)(?:\\.|\\n|$)`, 'i');
            const match = text.match(regex);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return defaultValue;
    };

    return {
        operationName: extract(['operation name', 'operation', 'mission name'], "Operation Fallback"),
        location: extract(['location', 'strategic location', 'area'], "Contested Territory"),
        enemyForce: extract(['enemy force', 'enemy', 'hostile'], "Hostile Forces"),
        objective: extract(['objective', 'mission objective', 'primary objective'], "Complete the mission"),
        complication: extract(['complication', 'challenge', 'unexpected'], "Unexpected resistance"),
        reward: extract(['reward', 'strategic reward', 'success reward'], "Tactical advantage")
    };
};

export default generateMissionTheme;
