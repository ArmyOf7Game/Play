import React, { useState, useEffect, useRef } from 'react';
import { HierarchyCounts } from '../types';
import './BattleSystem.css';
import generateMissionTheme from './missionGenerator';
import generateAIResponse from './aiService';

interface BattleSystemProps {
    hierarchyCount: HierarchyCounts;
    resources: number;
    setResources: React.Dispatch<React.SetStateAction<number>>;

    updateHierarchyCounts: (newCounts: Partial<HierarchyCounts>) => void;
}

const BattleSystem: React.FC<BattleSystemProps> = ({
    hierarchyCount,
    resources,
    setResources,
    updateHierarchyCounts
}) => {
  
    const [currentStory, setCurrentStory] = useState<string>('');
    const [choices, setChoices] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [battleMode, setBattleMode] = useState<boolean>(false);
    const [gameLog, setGameLog] = useState<string[]>([]);
    const [campaignProgress, setCampaignProgress] = useState(0);
    const [campaignLevel, setCampaignLevel] = useState(1);
    const [campaignName, setCampaignName] = useState<string>("New Operation");
    const [animateSlide, setAnimateSlide] = useState<boolean>(false);
    const [slideDirection, setSlideDirection] = useState<'out' | 'in'>('in');
    const [gameOver, setGameOver] = useState<boolean>(false);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [previousStoryLength, setPreviousStoryLength] = useState(0);



    const [armyStats, setArmyStats] = useState({
        morale: 100,
        supplies: 100,
        intel: 50,
        casualties: 0
    });

    const [enemyStats, setEnemyStats] = useState({
        name: '',
        strength: 0,
        maxStrength: 0,
        attackPower: 0,
        defense: 0,
        type: ''
    });

    

 
    const [missionTheme, setMissionTheme] = useState<MissionTheme | null>(null);

    const storyRef = useRef<HTMLDivElement>(null);

    
 
    const calculateArmyStrength = () => {
        return {
            totalForce: hierarchyCount.soldiers + hierarchyCount.caporals + hierarchyCount.captains,
            combatPower: hierarchyCount.soldiers * 1 + hierarchyCount.caporals * 3 + hierarchyCount.captains * 7,
            defensePower: hierarchyCount.soldiers * 0.5 + hierarchyCount.caporals * 2 + hierarchyCount.captains * 5,
            specialOperations: Math.floor(hierarchyCount.captains / 2) + Math.floor(hierarchyCount.caporals / 3),
            commandEfficiency: Math.min(100, hierarchyCount.captains * 10 + hierarchyCount.caporals * 5)
        };
    };

  
    useEffect(() => {
        if (getTotalArmySize() > 0) {
            startNewMission();
        } else {
            setCurrentStory("You need to recruit soldiers before starting a mission.");
            setChoices(["Recruit soldiers first"]);
        }
    }, []);

  
    useEffect(() => {
        // Reset scroll position to top whenever the story changes
        if (storyRef.current) {
            storyRef.current.scrollTop = 0;
        }
    }, [currentStory]); // Only depend on currentStory

    useEffect(() => {
      
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [gameLog]);

    useEffect(() => {
        if (getTotalArmySize() === 0 && !gameOver) {
            endGame();
        }
    }, [hierarchyCount]);

   
    const getTotalArmySize = (): number => {
        return hierarchyCount.soldiers + hierarchyCount.caporals + hierarchyCount.captains;
    };


    const endGame = async () => {
        setSlideDirection('out');
        setAnimateSlide(true);
        setGameOver(true);
        setCurrentStory(`\n\nYour forces have been completely depleted. The mission is a failure, and you must retreat to rebuild your army.`);
        if (storyRef.current) {
            storyRef.current.scrollTop = 0;
        }
        setChoices(["Return to base"]);
        addToGameLog("MISSION FAILED: All forces lost");
        setSlideDirection('in');
        setAnimateSlide(true);

        setTimeout(() => {
            setAnimateSlide(false);
        }, 500);
    };


    interface MissionTheme {
        operationName: string;
        location: string;
        enemyForce: string;
        objective: string;
        complication: string;
        reward: string;
    }


  
    

  
    const startNewMission = async () => {
       
        const totalTroops = hierarchyCount.soldiers + hierarchyCount.caporals + hierarchyCount.captains;

        if (totalTroops <= 0) {
            setCurrentStory("MISSION ABORTED: You have no troops available for deployment. Recruit soldiers to your army before attempting a mission.");
            if (storyRef.current) {
                storyRef.current.scrollTop = 0;
            }
            setChoices(["Return to base"]);
            setGameOver(true);
            return;
        }

      
        setIsLoading(true);
        setGameLog([]);
        setBattleMode(false);
        setGameOver(false);

        try {
     
            const theme = await generateMissionTheme();
            setMissionTheme(theme);
            setCampaignName(theme.operationName);

         
            setArmyStats({
                morale: 100,
                supplies: 100,
                intel: 50,
                casualties: 0
            });

  
            const armyStrength = calculateArmyStrength();

       
            const initialPrompt = `
You are commanding a military force consisting of ${hierarchyCount.captains} officers,
${hierarchyCount.caporals} sergeants, and ${hierarchyCount.soldiers} soldiers.

Your mission is: ${theme.operationName}

Location: ${theme.location}

Enemy Forces: ${theme.enemyForce}

Primary Objective: ${theme.objective}

Intel has identified a complication: ${theme.complication}

Success will yield: ${theme.reward}

Your total force strength is ${armyStrength.totalForce} troops with combat effectiveness rating of ${armyStrength.combatPower}.`;

            const response = await generateAIResponse(initialPrompt);

         
            setCurrentStory(response.story);
            setChoices(response.choices);

      
            addToGameLog(`Mission ${theme.operationName} initiated. Deployment to ${theme.location} underway.`);

        } catch (error) {
            console.error("Error starting mission:", error);

   
            setCurrentStory("COMMUNICATION ERROR: Unable to establish connection with command. Falling back to emergency protocols. Proceed with caution, Commander.");
            setChoices([
                "Advance cautiously",
                "Request reinforcements",
                "Assess the situation"
            ]);

            addToGameLog("WARNING: Command link unstable. Operating on emergency protocols.");

        } finally {
            setIsLoading(false);
        }
    };


    const makeChoice = async (choiceIndex: number) => {
        const selectedChoice = choices[choiceIndex];

        setSlideDirection('out');
        setAnimateSlide(true);

        setTimeout(async () => {
            setIsLoading(true);
            addToGameLog(`Command: ${selectedChoice}`);

            try {
               
                const battleChance = 0.3 + (campaignProgress / 200); // 
                const encounterBattle = Math.random() < battleChance;

                if (encounterBattle) {
               
                    startBattle();
                } else {
            
                    const armyStrength = calculateArmyStrength();
                    const prompt = `
            Continue the military operation where the commander chose: "${selectedChoice}".
            
            Remember this is taking place in ${missionTheme?.location}.
            The enemy forces are ${missionTheme?.enemyForce}.
            The objective is to ${missionTheme?.objective}.
            The complication is ${missionTheme?.complication}.
            
            The commander leads a force of ${hierarchyCount.captains} officers, 
            ${hierarchyCount.caporals} sergeants, and ${hierarchyCount.soldiers} soldiers.
            Current force strength: ${armyStrength.totalForce} troops.
            Current morale: ${armyStats.morale}%.
            Current supplies: ${armyStats.supplies}%.
            
            Describe what happens next and present 3 new tactical options.
            Make the story progress toward the objective, and incorporate elements of the setting and enemy forces.
            Include some tension and military jargon. Keep it under 300 words.
            
            The choices should be clear tactical decisions, not just narrative options.
          `;

                    const storyResponse = await generateAIResponse(prompt);

                    setCurrentStory(storyResponse.story);
                    setChoices(storyResponse.choices);

               
                    setCampaignProgress(prev => {
                        const newProgress = prev + 10;
                 
                        if (newProgress >= 100) {
                            setTimeout(() => completeMission(), 1000);
                            return 100;
                        }
                        return newProgress;
                    });

             
                    const resourceChange = Math.floor(Math.random() * 20) - 5;
                    if (resourceChange > 0) {
                        setResources(prev => prev + resourceChange);
                        addToGameLog(`Acquired ${resourceChange} resources`);
                    }

                 
                    setArmyStats(prev => ({
                        ...prev,
                        morale: Math.max(30, Math.min(100, prev.morale + Math.floor(Math.random() * 10) - 3)),
                        supplies: Math.max(20, Math.min(100, prev.supplies - Math.floor(Math.random() * 5)))
                    }));

                    
                    if (Math.random() < 0.15 && getTotalArmySize() > 3) {
                        const casualtyCount = Math.max(1, Math.floor(getTotalArmySize() * 0.05));
                        handleCasualties(casualtyCount, "operational hazards");
                    }
                }
            } catch (error) {
                console.error("Error processing choice:", error);
                addToGameLog("Error processing your tactical decision. Please try again.");
            } finally {
                setIsLoading(false);

              
                setSlideDirection('in');
                setAnimateSlide(true);

                setTimeout(() => {
                    setAnimateSlide(false);
                }, 500); 
            }
        }, 500); 
    };

 
    const startBattle = () => {
        setBattleMode(true);

    
        const armyStrength = calculateArmyStrength();
        const totalForce = getTotalArmySize();

     
        let enemyTypes: Array<{ name: string, type: string }> = [];

        if (missionTheme?.enemyForce.includes("Mercenary") || missionTheme?.enemyForce.includes("Rogue")) {
            enemyTypes = [
                { name: "Mercenary Squad", type: "infantry" },
                { name: "Elite Commandos", type: "special" },
                { name: "Armored Vehicle Patrol", type: "vehicle" },
                { name: "Sniper Team", type: "special" }
            ];
        } else if (missionTheme?.enemyForce.includes("Drone") || missionTheme?.enemyForce.includes("AI")) {
            enemyTypes = [
                { name: "Drone Swarm", type: "air" },
                { name: "Combat Robots", type: "infantry" },
                { name: "Automated Turrets", type: "fixed" },
                { name: "AI Command Unit", type: "special" }
            ];
        } else if (missionTheme?.enemyForce.includes("Biological") || missionTheme?.enemyForce.includes("Zombie")) {
            enemyTypes = [
                { name: "Infected Horde", type: "infantry" },
                { name: "Mutant Brute", type: "special" },
                { name: "Contamination Team", type: "special" },
                { name: "Carrier Unit", type: "infantry" }
            ];
        } else if (missionTheme?.enemyForce.includes("Tank") || missionTheme?.enemyForce.includes("Armored")) {
            enemyTypes = [
                { name: "Tank Platoon", type: "vehicle" },
                { name: "Mechanized Infantry", type: "infantry" },
                { name: "Artillery Battery", type: "fixed" },
                { name: "Armored Scout", type: "vehicle" }
            ];
        } else {
           
            enemyTypes = [
                { name: "Enemy Patrol", type: "infantry" },
                { name: "Hostile Squad", type: "infantry" },
                { name: "Defensive Position", type: "fixed" },
                { name: "Enemy Specialists", type: "special" }
            ];
        }

        const enemySelection = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const enemyName = enemySelection.name;
        const enemyType = enemySelection.type;

  
        const difficultyFactor = Math.max(0.8, 1.5 - (totalForce / 30));
        const progressFactor = 1 + (campaignProgress / 100);

        const enemyStrength = Math.floor((armyStrength.combatPower * 0.7 * difficultyFactor * progressFactor) + (campaignLevel * 10));

        setEnemyStats({
            name: enemyName,
            strength: enemyStrength,
            maxStrength: enemyStrength,
            attackPower: Math.floor(5 + (campaignLevel * 2) + (campaignProgress / 10)),
            defense: Math.floor(3 + campaignLevel + (campaignProgress / 20)),
            type: enemyType
        });

        addToGameLog(`Engagement: ${enemyName} encountered!`);
    };

 
    const attackEnemy = () => {
        if (battleMode && !isLoading) {
            setIsLoading(true);

            const armyStrength = calculateArmyStrength();

       
            const baseDamage = armyStrength.combatPower * (0.8 + Math.random() * 0.4);
            const effectiveDamage = Math.max(1, Math.floor(baseDamage - enemyStats.defense));

        
            const newEnemyStrength = Math.max(0, enemyStats.strength - effectiveDamage);
            setEnemyStats(prev => ({
                ...prev,
                strength: newEnemyStrength
            }));

            addToGameLog(`Your forces deal ${effectiveDamage} damage to ${enemyStats.name}`);

        
            setTimeout(() => {
                if (newEnemyStrength > 0) {
                    enemyAttack();
                } else {
                    endBattle(true);
                }
                setIsLoading(false);
            }, 1000);
        }
    };


    const useSpecialTactics = () => {
        if (battleMode && !isLoading && armyStats.supplies >= 20) {
            setIsLoading(true);

            const armyStrength = calculateArmyStrength();

           
            setArmyStats(prev => ({
                ...prev,
                supplies: prev.supplies - 20
            }));

        
            const specialMultiplier = 1.5 + (armyStrength.specialOperations * 0.1);
            const baseDamage = armyStrength.combatPower * specialMultiplier;
            const effectiveDamage = Math.max(1, Math.floor(baseDamage - (enemyStats.defense * 0.5)));

        
            const newEnemyStrength = Math.max(0, enemyStats.strength - effectiveDamage);
            setEnemyStats(prev => ({
                ...prev,
                strength: newEnemyStrength
            }));

            addToGameLog(`Special tactics deployed! ${effectiveDamage} critical damage to ${enemyStats.name}`);

           
            setTimeout(() => {
                if (newEnemyStrength > 0) {
                    if (Math.random() > 0.3) {
                        enemyAttack();
                    } else {
                        addToGameLog(`${enemyStats.name} is disoriented and unable to counterattack!`);
                    }
                } else {
                    endBattle(true);
                }
                setIsLoading(false);
            }, 1000);
        }
    };

    
    const enemyAttack = () => {
        const armyStrength = calculateArmyStrength();

       
        const rawDamage = enemyStats.attackPower * (0.8 + Math.random() * 0.4);
        const mitigatedDamage = Math.max(1, Math.floor(rawDamage - (armyStrength.defensePower * 0.2)));

     
        const casualtyPercentage = mitigatedDamage / armyStrength.combatPower;
        const casualtyCount = Math.max(1, Math.floor(getTotalArmySize() * casualtyPercentage * 0.2));

    
        handleCasualties(casualtyCount, enemyStats.name);

        addToGameLog(`${enemyStats.name} counterattacks for ${mitigatedDamage} damage`);

      
        if (getTotalArmySize() === 0) {
            endBattle(false);
        }
    };

   
    const handleCasualties = (count: number, cause: string) => {
        let remainingCasualties = count;
        const newCounts = { ...hierarchyCount };

    
        if (remainingCasualties > 0 && newCounts.soldiers > 0) {
            const soldierLosses = Math.min(remainingCasualties, newCounts.soldiers);
            newCounts.soldiers -= soldierLosses;
            remainingCasualties -= soldierLosses;
        }

  
        if (remainingCasualties > 0 && newCounts.caporals > 0) {
            const caporalLosses = Math.min(remainingCasualties, newCounts.caporals);
            newCounts.caporals -= caporalLosses;
            remainingCasualties -= caporalLosses;
        }

        
        if (remainingCasualties > 0 && newCounts.captains > 0) {
            const captainLosses = Math.min(remainingCasualties, newCounts.captains);
            newCounts.captains -= captainLosses;
        }

      
        setArmyStats(prev => ({
            ...prev,
            casualties: prev.casualties + count,
            morale: Math.max(30, prev.morale - (count * 2))
        }));

      
        updateHierarchyCounts(newCounts);

        addToGameLog(`Casualties: ${count} troops lost to ${cause}`);
    };

   
    const endBattle = async (victory: boolean) => {
        setSlideDirection('out');
        setAnimateSlide(true);
        await new Promise(resolve => setTimeout(resolve, 500));

        setBattleMode(false);

        if (victory) {
          
            const resourceReward = Math.floor(20 + (campaignLevel * 5) + (enemyStats.maxStrength * 0.1));
            setResources(prev => prev + resourceReward);

          
            setArmyStats(prev => ({
                ...prev,
                morale: Math.min(100, prev.morale + 10)
            }));

            addToGameLog(`Victory! Enemy ${enemyStats.name} defeated`);
            addToGameLog(`Acquired ${resourceReward} resources`);

         
            setCampaignProgress(prev => {
                const newProgress = prev + 15;
                if (newProgress >= 100) {
                    setTimeout(() => completeMission(), 1000);
                    return 100;
                }
                return newProgress;
            });

       
            try {
                setIsLoading(true);

                const armyStrength = calculateArmyStrength();
                const prompt = `
          The commander and their forces of ${hierarchyCount.captains} officers, 
          ${hierarchyCount.caporals} sergeants, and ${hierarchyCount.soldiers} soldiers
          have just defeated ${enemyStats.name} in battle.
          
          Remember this is taking place in ${missionTheme?.location}.
          The objective is to ${missionTheme?.objective}.
          
          Current force strength: ${armyStrength.totalForce} troops.
          Current morale: ${armyStats.morale}%.
          Current supplies: ${armyStats.supplies}%.
          
          Describe the aftermath of the battle and present 3 new tactical options for how to proceed.
          Keep the narrative tense and military-focused. Keep it under 250 words.
        `;

                const storyResponse = await generateAIResponse(prompt);

                setCurrentStory(storyResponse.story);
                setChoices(storyResponse.choices);
                
                if (storyRef.current) {
                    storyRef.current.scrollTop = 0;
                }
                setSlideDirection('in');
                setAnimateSlide(true);
                setTimeout(() => {
                    setAnimateSlide(false);
                }, 500);

            } catch (error) {
                console.error("Error continuing story after victory:", error);
                setChoices(["Continue advance", "Secure the area", "Call for reinforcements"]);
            } finally {
                setIsLoading(false);
            }
        } else {
         
            setArmyStats(prev => ({
                ...prev,
                morale: Math.max(20, prev.morale - 20),
                supplies: Math.max(20, prev.supplies - 10)
            }));

            addToGameLog(`Defeat! Forces pushed back by ${enemyStats.name}`);

            if (getTotalArmySize() === 0) {
                endGame();
                return;
            }

            try {

                setIsLoading(true);
                const armyStrength = calculateArmyStrength();
                const prompt = `
          The commander and their remaining forces of ${hierarchyCount.captains} officers, 
          ${hierarchyCount.caporals} sergeants, and ${hierarchyCount.soldiers} soldiers
          were just defeated by ${enemyStats.name} in battle.
          
          They've suffered casualties and been pushed back, but must regroup to continue the mission.
          
                    Remember this is taking place in ${missionTheme?.location}.
          The objective is still to ${missionTheme?.objective}.
          
          Current force strength: ${armyStrength.totalForce} troops.
          Current morale: ${armyStats.morale}%.
          Current supplies: ${armyStats.supplies}%.
          
          Describe the aftermath of the defeat and present 3 new tactical options for how to regroup and continue the mission.
          Focus on the difficult situation but provide hope for recovery. Keep it under 250 words.
        `;

                const storyResponse = await generateAIResponse(prompt);

                setCurrentStory(storyResponse.story);
                setChoices(storyResponse.choices);

                if (storyRef.current) {
                    storyRef.current.scrollTop = 0;
                }

                setSlideDirection('in');
                setAnimateSlide(true);
                setTimeout(() => {
                    setAnimateSlide(false);
                }, 500);


            } catch (error) {
                console.error("Error continuing story after defeat:", error);
                setChoices(["Retreat and regroup", "Call for reinforcements", "Change tactics"]);
            } finally {
                setIsLoading(false);
            }
        }
    };

  
    const completeMission = async () => {
        try {
            setIsLoading(true);

        
            const baseReward = 100 * campaignLevel;
            const casualtyPenalty = armyStats.casualties * 5;
            const moraleBonus = Math.floor(armyStats.morale * 0.5);
            const finalReward = Math.max(50, baseReward - casualtyPenalty + moraleBonus);

         
            setResources(prev => prev + finalReward);

            const prompt = `
        The commander and their forces have successfully completed ${missionTheme?.operationName}.
        
        They have achieved the objective to ${missionTheme?.objective} in ${missionTheme?.location}.
        
        The enemy forces (${missionTheme?.enemyForce}) have been overcome.
        
        The reward was ${missionTheme?.reward}.
        
        Write a brief mission success report in military style, mentioning the casualties suffered (${armyStats.casualties}) 
        and the strategic value of the mission. Keep it under 200 words.
      `;

            const storyResponse = await generateAIResponse(prompt);

            setCurrentStory(storyResponse.story);
            setChoices(["Return to base", "Start new mission"]);

            addToGameLog(`Mission complete! Awarded ${finalReward} resources`);

            
            setCampaignLevel(prev => prev + 1);
            setCampaignProgress(0);

        } catch (error) {
            console.error("Error completing mission:", error);
            
            setChoices(["Return to base", "Start new mission"]);
        } finally {
            setIsLoading(false);
        }
    };

    const addToGameLog = (message: string) => {
        setGameLog(prev => [...prev, message].slice(-10));
    };

  


   
    const mockResponseGeneration = (prompt: string): { story: string, choices: string[] } => {
        // Extract key elements from the prompt to customize the response
        const isBattleAftermath = prompt.includes("aftermath of the battle");
        const isDefeatAftermath = prompt.includes("aftermath of the defeat");
        const isMissionComplete = prompt.includes("successfully completed");
        const isMissionStart = prompt.includes("beginning of this military operation");

        let story = "";
        let choices: string[] = [];

        if (isMissionStart) {
         
            const missionStartTemplates = [
                `MISSION BRIEFING: ${missionTheme?.operationName}\n\nThe command tent is silent as you review the tactical display. Intelligence reports confirm ${missionTheme?.enemyForce} have established a stronghold in ${missionTheme?.location}. Your objective is clear: ${missionTheme?.objective}.\n\nHowever, be advised that ${missionTheme?.complication}. Success will secure ${missionTheme?.reward}, critical to our ongoing operations.\n\nYour force of ${hierarchyCount.captains} officers, ${hierarchyCount.caporals} sergeants, and ${hierarchyCount.soldiers} soldiers awaits your command. The clock is ticking, Commander.`,

                `TACTICAL ASSESSMENT: ${missionTheme?.location}\n\nDawn breaks over the horizon as your convoy approaches the operational zone. Satellite imagery shows ${missionTheme?.enemyForce} have fortified key positions. Your mission parameters are non-negotiable: ${missionTheme?.objective}.\n\nField reports warn that ${missionTheme?.complication}, which will complicate our approach. High Command emphasizes the strategic importance of ${missionTheme?.reward}.\n\nYour battle-ready force stands prepared for deployment. The next move is yours, Commander.`,

                `OPERATION ORDER: ${campaignLevel}00 HOURS\n\nThe tactical operations center buzzes with activity as final preparations are made. Intelligence has confirmed ${missionTheme?.enemyForce} presence in ${missionTheme?.location}. Mission objective: ${missionTheme?.objective}.\n\nBe advised, ${missionTheme?.complication}. Mission success will yield ${missionTheme?.reward}, essential for future operations.\n\nYour combat-ready force awaits your strategic direction. Time is of the essence.`
            ];

            story = missionStartTemplates[Math.floor(Math.random() * missionStartTemplates.length)];

            choices = [
                "Execute frontal assault on main objective",
                "Deploy reconnaissance teams to gather intelligence",
                "Establish forward operating base before advancing",
                "Attempt covert infiltration to avoid detection"
            ].sort(() => Math.random() - 0.5).slice(0, 3);

        } else if (isBattleAftermath) {
          
            const victoryTemplates = [
                `The dust settles as your forces secure the area. The defeated ${enemyStats.name} have retreated, leaving behind valuable equipment and intelligence. Your troops move efficiently, treating wounded and establishing a defensive perimeter. The victory has boosted morale, but you know the enemy will regroup. Time is critical to maintain momentum.`,

                `Smoke rises from the battlefield as your soldiers confirm the area is clear. The ${enemyStats.name} have been routed, their defensive positions now under your control. Communications intercepts suggest enemy reinforcements may be en route. Your officers await your next command while the tactical advantage is yours.`,

                `The engagement is over. Your tactical superiority proved decisive against the ${enemyStats.name}. Forward scouts report the enemy is in disarray, but they won't remain disorganized for long. Your NCOs have already begun consolidating your position, but the mission clock continues to tick. The next phase is crucial.`
            ];

            story = victoryTemplates[Math.floor(Math.random() * victoryTemplates.length)];

            choices = [
                "Press the advantage and advance rapidly",
                "Fortify position and prepare for counterattack",
                "Split forces to secure multiple objectives",
                "Extract valuable intelligence before proceeding",
                "Call in air support to target enemy reinforcements",
                "Establish supply lines to maintain operational capacity"
            ].sort(() => Math.random() - 0.5).slice(0, 3);

        } else if (isDefeatAftermath) {
           
            const defeatTemplates = [
                `The retreat is chaotic but disciplined. Your remaining forces regroup at the fallback position, tending to the wounded and accounting for losses. The ${enemyStats.name} have gained ground, but their advance has slowed. Your officers report that morale is shaken but not broken. This setback is significant, but the mission can still succeed with adjusted tactics.`,

                `Communications crackle with urgent reports as your forces withdraw under heavy pressure. The engagement with ${enemyStats.name} has cost you dearly in personnel and equipment. Your command staff has established a secure position 3 clicks east of the combat zone. Despite the defeat, valuable intelligence was gathered about enemy capabilities and dispositions.`,

                `The withdrawal is complete. Your forces have suffered casualties, but core combat effectiveness remains. The ${enemyStats.name} now control the contested area, but they've expended significant resources in the process. Your remaining officers have already begun formulating alternative approaches. This is a setback, not a mission failure.`
            ];

            story = defeatTemplates[Math.floor(Math.random() * defeatTemplates.length)];

            choices = [
                "Request immediate reinforcements",
                "Regroup and attempt flanking maneuver",
                "Change approach to stealth tactics",
                "Utilize terrain for guerrilla warfare",
                "Focus on sabotage to weaken enemy position",
                "Establish new forward base in safer territory"
            ].sort(() => Math.random() - 0.5).slice(0, 3);

        } else if (isMissionComplete) {
           
            const completionTemplates = [
                `MISSION REPORT: ${missionTheme?.operationName} - SUCCESSFUL\n\nObjective secured. Your forces have successfully completed the mission to ${missionTheme?.objective} despite encountering ${missionTheme?.complication}. The ${missionTheme?.enemyForce} have been neutralized or forced to retreat from ${missionTheme?.location}.\n\nCasualties: ${armyStats.casualties} personnel\nStrategic Value: Acquisition of ${missionTheme?.reward}\n\nHigh Command sends commendations for your tactical acumen. Your success here will significantly impact ongoing operations in the region.`,

                `OPERATION COMPLETE: ${missionTheme?.operationName}\n\nMission parameters fulfilled. Your tactical leadership has resulted in the successful completion of all primary objectives in ${missionTheme?.location}. The threat posed by ${missionTheme?.enemyForce} has been eliminated.\n\nPersonnel lost: ${armyStats.casualties}\nStrategic gains: ${missionTheme?.reward}\n\nThis victory represents a significant advancement in our strategic position. Your battle group is ordered to return to base for debriefing and reassignment.`,

                `AFTER ACTION REPORT: ${missionTheme?.operationName}\n\nMission status: Complete\nObjective: ${missionTheme?.objective} - Achieved\nEnemy forces: ${missionTheme?.enemyForce} - Neutralized\n\nDespite complications from ${missionTheme?.complication}, your forces successfully secured ${missionTheme?.reward}. The cost was ${armyStats.casualties} brave personnel, whose sacrifice ensured mission success.\n\nThis operation has significantly improved our strategic position in the region. Your command decisions were instrumental to this outcome.`
            ];

            story = completionTemplates[Math.floor(Math.random() * completionTemplates.length)];

            choices = ["Return to base for debriefing", "Prepare for next mission"];

        } else {
          
            const progressionTemplates = [
                `Your forces advance through ${missionTheme?.location}, maintaining tactical awareness. Scout reports indicate ${missionTheme?.enemyForce} activity ahead, but your approach remains undetected. The objective to ${missionTheme?.objective} is now within operational range. Your officers report that morale is steady, though supplies are being consumed at expected rates.`,

                `The operation continues as planned. Your units have established effective control of the approach vectors to the primary objective. Intelligence suggests the ${missionTheme?.enemyForce} remain unaware of your full tactical disposition. The complication of ${missionTheme?.complication} requires ongoing adaptation, but your NCOs are implementing contingencies effectively.`,

                `Progress toward the objective is steady. Your forces have navigated the challenges of ${missionTheme?.location} while maintaining operational security. Forward elements report increased ${missionTheme?.enemyForce} activity, suggesting they may be reinforcing key positions. The mission to ${missionTheme?.objective} remains viable, though tactical flexibility will be essential.`
            ];

            story = progressionTemplates[Math.floor(Math.random() * progressionTemplates.length)];

            choices = [
                "Advance main force toward primary objective",
                "Send reconnaissance team to scout enemy positions",
                "Establish defensive perimeter and observe enemy patterns",
                "Execute diversionary tactics to draw enemy attention",
                "Deploy special forces for targeted operation",
                "Secure supply route before advancing further",
                "Attempt diplomatic contact with local forces",
                "Call for air reconnaissance of the target area"
            ].sort(() => Math.random() - 0.5).slice(0, 3);
        }

        return { story, choices };
    };

    
    const handleButtonClick = (index: number) => {
        if (gameOver && choices[index] === "Return to base") {
          
            startNewMission();
        } else if (choices[index] === "Start new mission" || choices[index] === "Prepare for next mission") {
            startNewMission();
        } else {
            makeChoice(index);
        }
    };

   
    const calculateBattleProgress = (): number => {
        if (!battleMode || enemyStats.maxStrength === 0) return 0;
        return Math.min(100, Math.max(0, 100 - ((enemyStats.strength / enemyStats.maxStrength) * 100)));
    };

    return (
        <div className={`adventure-system ${animateSlide ? `slide-${slideDirection}` : ''}`}>
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">Transmitting orders...</div>
                </div>
            )}

            <div className="adventure-header">
                <h2>{campaignName} - Level {campaignLevel}</h2>

                <div className="player-stats">
                    <div className="stat">
                        <strong>Forces:</strong> {getTotalArmySize()} troops
                    </div>
                    <div className="stat">
                        <strong>Morale:</strong> {armyStats.morale}%
                    </div>
                    <div className="stat">
                        <strong>Supplies:</strong> {armyStats.supplies}%
                    </div>
                    <div className="stat">
                        <strong>Resources:</strong> {resources}
                    </div>
                </div>

                <div className="campaign-progress">
                    <div className="progress-label">Mission Progress: {campaignProgress}%</div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${campaignProgress}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="story-container" ref={storyRef}>
                <div className="story-text">
                    {currentStory.split('\n').map((paragraph, index) => (
                        paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
                    ))}
                </div>
            </div>

            {battleMode ? (
                <div className="battle-interface">
                    <h3>Combat Engagement</h3>

                    <div className="battle-opponents">
                        <div className="friendly-forces">
                            <h4>Your Forces</h4>
                            <div className="force-composition">
                                <div>Officers: {hierarchyCount.captains}</div>
                                <div>Sergeants: {hierarchyCount.caporals}</div>
                                <div>Soldiers: {hierarchyCount.soldiers}</div>
                            </div>
                        </div>

                        <div className="vs-indicator">VS</div>

                        <div className="enemy-forces">
                            <h4>{enemyStats.name}</h4>
                            <div className="enemy-strength">
                                <div className="strength-bar">
                                    <div
                                        className="strength-fill"
                                        style={{ width: `${(enemyStats.strength / enemyStats.maxStrength) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="strength-text">
                                    Combat Strength: {enemyStats.strength}/{enemyStats.maxStrength}
                                </div>
                            </div>
                            <div className="enemy-type">Type: {enemyStats.type}</div>
                        </div>
                    </div>

                    <div className="battle-progress">
                        <div className="progress-label">Battle Progress: {calculateBattleProgress().toFixed(0)}%</div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill battle-fill"
                                style={{ width: `${calculateBattleProgress()}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="battle-actions">
                        <button
                            className="action-button attack-button"
                            onClick={attackEnemy}
                            disabled={isLoading}
                        >
                            Standard Attack
                        </button>

                        <button
                            className="action-button special-button"
                            onClick={useSpecialTactics}
                            disabled={isLoading || armyStats.supplies < 20}
                        >
                            Special Tactics (20 Supplies)
                        </button>
                    </div>
                </div>
            ) : (
                <div className="choices-container">
                    {choices.map((choice, index) => (
                        <button
                            key={index}
                            className="choice-button"
                            onClick={() => handleButtonClick(index)}
                            disabled={isLoading}
                        >
                            {choice}
                        </button>
                    ))}
                </div>
            )}

            <div className="game-log" ref={logContainerRef}>
                <h3>Mission Log</h3>
                <div className="log-entries">
                    {gameLog.map((entry, index) => (
                        <div key={index} className="log-entry">
                            {entry}
                        </div>
                    ))}
                </div>
            </div>

            {!battleMode && (
                <div className="mission-actions">
                    <button
                        className="action-button"
                        onClick={startNewMission}
                        disabled={isLoading || (gameOver && getTotalArmySize() <= 0)}
                        title={gameOver && getTotalArmySize() <= 0 ? "No troops available for deployment" : ""}
                    >
                        {gameOver ? "Start New Mission" : "Abort Mission"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default BattleSystem;