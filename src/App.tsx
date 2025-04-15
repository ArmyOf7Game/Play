import './App.css';
import { useTonConnect } from './hooks/useTonConnect';
import { useSlotContract} from './hooks/useSlotContract';
import { useState, useEffect, useCallback} from 'react';
import { Button, Card, Elevation } from '@blueprintjs/core';
import { TonConnectButton } from '@tonconnect/ui-react';
import { Address } from '@ton/core';
import { Routes, Route } from 'react-router-dom';
import { HierarchyCounts } from './types'; 
import { SlotCard } from './components/SlotCard';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useTelegramAuth } from './hooks/useTelegramAuth';
import WebApp from '@twa-dev/sdk';
import { normalizeAddress } from './utils/addressUtils';
import { HierarchicalSquadMember, SquadMember } from './types';
import ScaledUIContainer from './components/ScaledUIContainer';
import OrientationWarning from './components/OrientationWarning';
import BattleSystem from './components/BattleSystem';



interface CompleteHierarchyData {
  captains: HierarchicalSquadMember[];
  caporals: {
    [ownerAddress: string]: {
      [captainAddress: string]: HierarchicalSquadMember[]; 
    };
  };
  soldiers: {
    [ownerAddress: string]: {
      [caporalAddress: string]: HierarchicalSquadMember[]; 
    };
  };
  counts?: {
    captains: number;
    caporals: number;
    soldiers: number;
  };
  totalMembers: number;
}
type HierarchyType = {
  $$type: "Hierarchy";
  owner: Address;
  parent: Address | null;
  grandparent: Address | null;
  greatgrandparent: Address | null;
  availableSlots: bigint;
} | null;

function App() {
  useEffect(() => {

    const isTelegram = WebApp.initDataUnsafe.query_id !== undefined;
   


    if (isTelegram && WebApp.initDataUnsafe.user) {
    }
  }, []);



  const { address } = useTonConnect();
  const {
    joinSlot,
    getHierarchy,
    getSquadMembers,
    getTotalTopSlots,
    buildCompleteHierarchy,
    fetchPayoutsAndUpdateHierarchy,
  } = useSlotContract();
  const [parentAddress, setParentAddress] = useState('');
  const [playerHierarchy, setPlayerHierarchy] = useState<HierarchyType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [squadMembers, setSquadMembers] = useState<HierarchicalSquadMember[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [nestedSquadMembers, setNestedSquadMembers] = useState<HierarchicalSquadMember[]>([]);
  const [grandchildSquadMembers, setGrandchildSquadMembers] = useState<HierarchicalSquadMember[]>([]);
  const [selectedSlotIndex] = useState<number>(0);

  
  const [hierarchyCount, setHierarchyCount] = useState<HierarchyCounts>({
    soldiers: 0,
    caporals: 0,
    captains: 0
  });
  const [viewState, setViewState] = useState('main');
  const click1 = new Audio(`${import.meta.env.BASE_URL}click1.mp3`);
  const click2 = new Audio(`${import.meta.env.BASE_URL}click2.wav`);
  const click3 = new Audio(`${import.meta.env.BASE_URL}switch.wav`);
  const click4 = new Audio(`${import.meta.env.BASE_URL}click4.wav`);
  const click5 = new Audio(`${import.meta.env.BASE_URL}click5.wav`);
  const [showJoinOptions, setShowJoinOptions] = useState(false);
  const [showParentInput, setShowParentInput] = useState(false);
  const [topSlotsAvailable, setTopSlotsAvailable] = useState(false);
  const [topSlotsCount, setTopSlotsCount] = useState(0);
  const [showConnectWarning, setShowConnectWarning] = useState(false);
  const [tonConnectUI] = useTonConnectUI();  
  const [showInfo, setShowInfo] = useState(false);
  const [hudView, setHudView] = useState('stats1');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { telegramUser, isTelegram } = useTelegramAuth();
  const [completeHierarchyData, setCompleteHierarchyData] = useState<CompleteHierarchyData | null>(null);
  const [showSquadManagement, setShowSquadManagement] = useState(false);
  const [resources, setResources] = useState(0);
  const [showBattleSystem, setShowBattleSystem] = useState(false);


  
 

  const handleLoading = () => {
    const animationDuration = 2000; 

    setTimeout(() => {
      setIsInitialLoading(false);
    }, animationDuration);
  };



  const handleJoin = async (parentAddress?: string) => {
    try {
      await joinSlot(parentAddress);
      const hierarchyData = await fetchHierarchyWithRetry();
      if (hierarchyData) {
        setHasJoined(true);
        setShowJoinOptions(false);
        setShowParentInput(false);
        setPlayerHierarchy(hierarchyData);
      }
    } catch (error: any) {
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      setIsInitialLoading(true);
      setIsLoading(true);

      if (!address) {
        setPlayerHierarchy(null);
        setSquadMembers([]);
        setHasJoined(false);
        handleLoading();
        setIsLoading(false);
        return;
      }

      try {

        const hierarchyData = await getHierarchy(address);

        if (!mounted) return;

        if (hierarchyData) {

          const completeHierarchy = await buildCompleteHierarchy(address);


          if (!mounted) return;

          setPlayerHierarchy(hierarchyData);
          setHasJoined(true);
          const ownerAddress = address || '';
        
          setSquadMembers(completeHierarchy.captains || []);

         
          setCompleteHierarchyData({
            
            captains: completeHierarchy.captains || [],
            caporals: {
              [ownerAddress]: Object.entries(completeHierarchy.caporals || {}).reduce((acc, [captainAddr, members]) => {
                acc[captainAddr] = Array.isArray(members)
                  ? convertAddressesToSquadMembers(

                    members.map(addrStr => {
                      try {
                        return Address.parse(addrStr);
                      } catch (e) {
                        console.error(`Failed to parse address: ${addrStr}`, e);
                        return null;
                      }
                    }).filter(Boolean) as Address[],
                    'caporal'
                  )
                  : [];
                return acc;
              }, {} as { [captainAddress: string]: HierarchicalSquadMember[] })
            },

            soldiers: {
              [ownerAddress]: Object.entries(completeHierarchy.soldiers || {}).reduce((acc, [caporalAddr, members]) => {
                acc[caporalAddr] = Array.isArray(members)
                  ? convertAddressesToSquadMembers(

                    members.map(addrStr => {
                      try {
                        return Address.parse(addrStr);
                      } catch (e) {
                        console.error(`Failed to parse address: ${addrStr}`, e);
                        return null;
                      }
                    }).filter(Boolean) as Address[],
                    'soldier'
                  )
                  : [];
                return acc;
              }, {} as { [caporalAddress: string]: HierarchicalSquadMember[] })
            },
            totalMembers: completeHierarchy.totalMembers || 0,   
            counts: completeHierarchy.counts || { captains: 0, caporals: 0, soldiers: 0 }
          });


          setHierarchyCount(completeHierarchy.counts || { captains: 0, caporals: 0, soldiers: 0 });
        } else {
          setHasJoined(false);
          setPlayerHierarchy(null);
          setSquadMembers([]);
          setCompleteHierarchyData(null);
        }
      } catch (error) {
        console.log("Initialization error:", error);
      } finally {
        setIsLoading(false);
        if (mounted) handleLoading();
      }
    };

    initializeData();

    return () => {
      mounted = false;
    };
  }, [address, getHierarchy, buildCompleteHierarchy]);


  useEffect(() => {
    const checkTopSlots = async () => {
      try {
        const available = await getTotalTopSlots();

        setTopSlotsAvailable(available > 0);
        setTopSlotsCount(available);

      } catch (error) {

      }
    };
    checkTopSlots();
  }, [getTotalTopSlots]);

  useEffect(() => {
    if (!address || !hasJoined) return;

    
    const initialFetch = async () => {
      setIsLoading(true);
      try {

        await fetchPayoutsAndUpdateHierarchy(address);


        if (completeHierarchyData) {
          setHierarchyCount(completeHierarchyData.counts || { captains: 0, caporals: 0, soldiers: 0 });
          setSquadMembers(completeHierarchyData.captains || []);
        }
      } catch (error) {
        console.error("Error in initial data fetch:", error);
      } finally {
       setIsLoading(false);
      }
    };

    initialFetch();


    const intervalId = setInterval(() => {

      fetchPayoutsAndUpdateHierarchy(address)
        .catch(err => console.error("Error in periodic update:", err));
    }, 5 * 60 * 1000); 

    return () => clearInterval(intervalId);
  }, [address, hasJoined, fetchPayoutsAndUpdateHierarchy]);

  useEffect(() => {

    const params = new URLSearchParams(window.location.search);
    const parentFromUrl = params.get('parent');

    if (parentFromUrl) {
      setParentAddress(parentFromUrl);
      setShowParentInput(true);
    }
  }, []);
 

  const toggleSquadManagement = () => {
    click4.play();
    setShowSquadManagement(!showSquadManagement);


    if (!showSquadManagement) {
      document.body.classList.add('overlay-open');
    } else {

      setTimeout(() => {
        document.body.classList.remove('overlay-open');
      }, 300); 
    }
  };

  const toHexFormat = (address: string | Address): string => {
    try {

      if (typeof address === 'string' && address.startsWith('0:')) {
        return address;
      }

  
      const addr = typeof address === 'string' ? Address.parse(address) : address;
      return `0:${addr.hash.toString('hex')}`;
    } catch (e) {
      console.error('Error converting to hex format:', e);
      return typeof address === 'string' ? address : address.toString();
    }
  };

  const handleSquadMemberClick = useCallback(async (memberAddress: string) => {

    click1.play();
    setViewState('nested');
    await new Promise(resolve => setTimeout(resolve, 300));

    setSelectedAddress(memberAddress);

    try {

      const hexOwnerAddress = address ? toHexFormat(address) : '';
      const hexCaptainAddress = toHexFormat(memberAddress);



     
      if (completeHierarchyData?.caporals) {

      }

      let actualOwnerKey = '';
      let actualCaptainKey = '';
      let caporalMembers: SquadMember[] = [];

      if (completeHierarchyData?.caporals) {

        if (completeHierarchyData.caporals[hexOwnerAddress]) {
          actualOwnerKey = hexOwnerAddress;
        } else {

          for (const key of Object.keys(completeHierarchyData.caporals)) {
            try {
              const keyHex = toHexFormat(key);
              if (keyHex === hexOwnerAddress) {
                actualOwnerKey = key;

                break;
              }
            } catch (e) {

            }
          }
        }

        if (actualOwnerKey && completeHierarchyData.caporals[actualOwnerKey]) {
          if (completeHierarchyData.caporals[actualOwnerKey][hexCaptainAddress]) {
            actualCaptainKey = hexCaptainAddress;
          } else {

            for (const key of Object.keys(completeHierarchyData.caporals[actualOwnerKey])) {
              try {
                const keyHex = toHexFormat(key);
                if (keyHex === hexCaptainAddress) {
                  actualCaptainKey = key;

                  break;
                }
              } catch (e) {

              }
            }
          }
        }

  
        if (actualOwnerKey && actualCaptainKey) {
          caporalMembers = completeHierarchyData.caporals[actualOwnerKey][actualCaptainKey];

        }
      }

      if (caporalMembers && caporalMembers.length > 0) {


        setNestedSquadMembers(caporalMembers);
      } else {



   
        setNestedSquadMembers([]);



      }
    } catch (error) {
      console.error("Error handling squad member click:", error);
      setNestedSquadMembers([]);
    }
  }, [click1, address]);


  const handleNestedSquadMemberClick = useCallback(async (memberAddress: string) => {

    click1.play();
    setViewState('grandchild');
    await new Promise(resolve => setTimeout(resolve, 300));

    setSelectedAddress(memberAddress);

    try {
  
      const hexOwnerAddress = address ? toHexFormat(address) : '';
      const hexCaporalAddress = toHexFormat(memberAddress);



 
      let actualOwnerKey = '';
      let actualCaporalKey = '';
      let soldierMembers: HierarchicalSquadMember[] = [];

      if (completeHierarchyData?.soldiers) {

        const soldiersData = completeHierarchyData.soldiers as unknown as Record<string, Record<string, HierarchicalSquadMember[]>>;

    
        if (soldiersData[hexOwnerAddress]) {
          actualOwnerKey = hexOwnerAddress;
        } else {
  
          for (const key of Object.keys(soldiersData)) {
            try {
              const keyHex = toHexFormat(key);
              if (keyHex === hexOwnerAddress) {
                actualOwnerKey = key;

                break;
              }
            } catch (e) {

            }
          }
        }


        if (actualOwnerKey && soldiersData[actualOwnerKey]) {
          const ownerData = soldiersData[actualOwnerKey];

          if (ownerData[hexCaporalAddress]) {
            actualCaporalKey = hexCaporalAddress;
          } else {

            for (const key of Object.keys(ownerData)) {
              try {
                const keyHex = toHexFormat(key);
                if (keyHex === hexCaporalAddress) {
                  actualCaporalKey = key;

                  break;
                }
              } catch (e) {

              }
            }
          }
        }


        if (actualOwnerKey && actualCaporalKey) {
          soldierMembers = soldiersData[actualOwnerKey][actualCaporalKey];

        }
      }

      if (soldierMembers && soldierMembers.length > 0) {


        setGrandchildSquadMembers(soldierMembers);
      } else {

       
        setGrandchildSquadMembers([]);
       
      }
    } catch (error) {

      setGrandchildSquadMembers([]);
    }
  }, [click1, address, selectedAddress, completeHierarchyData]);


  const handleBackToMain = () => {
    click2.play();
    setViewState('main');
    setTimeout(() => {
      setSelectedAddress(null);
      setNestedSquadMembers([]);
    }, 300);
  };

  const handleBackToNested = () => {
    click2.play();
    setViewState('nested');
    setTimeout(() => {
      setGrandchildSquadMembers([]);
    }, 300);
  };

  const updateHierarchyCounts = (newCounts: Partial<HierarchyCounts>) => {
    setHierarchyCount(prev => ({
      ...prev,
      ...newCounts
    }));
  };


  const formatAddress = (address: string | HierarchicalSquadMember | Address) => {
    if (!address) return 'None';

    try {

      if (address instanceof Address) {
        const fullAddress = address.toString({ urlSafe: true, bounceable: false });
        return `${fullAddress.slice(0, 4)}...${fullAddress.slice(-4)}`;
      }

 
      if (typeof address === 'object' && 'address' in address) {
  
        const addressStr = address.address;
        const addr = Address.parse(addressStr);
        const fullAddress = addr.toString({ urlSafe: true, bounceable: false });
        return `${fullAddress.slice(0, 4)}...${fullAddress.slice(-4)}`;
      }

  
      if (typeof address === 'string') {
        const addr = Address.parse(address);
        const fullAddress = addr.toString({ urlSafe: true, bounceable: false });
        return `${fullAddress.slice(0, 4)}...${fullAddress.slice(-4)}`;
      }


      const addressStr = String(address);
      return addressStr.slice(0, 4) + '...' + addressStr.slice(-4);
    } catch (e) {
      console.warn(`Failed to parse address: ${address}`, e);
      // Safely convert to string in case of failure
      const addressStr = typeof address === 'string'
        ? address
        : (typeof address === 'object' && address && 'toString' in address)
          ? address.toString()
          : String(address);

      return addressStr.slice(0, 4) + '...' + addressStr.slice(-4);
    }
  };

  const convertAddressesToSquadMembers = (
    addresses: Address[],
    role: 'captain' | 'caporal' | 'soldier'
  ): SquadMember[] => {
    return addresses.map(addr => ({
      address: addr.toString(),
      role,
      members: []
    }));
  };

  const handleInviteFriends = () => {
    click4.play();


    const inviteLink = generateInviteLink();



    const messageText = `Join me in Army of 7, a strategic blockchain game on TON!\n\nEarn insane amounts of TON directly and instantly into your wallet, no withdrawals needed!\n\nUse my invite link to join under my command: ${inviteLink}\n\n`;


    navigator.clipboard.writeText(messageText);

   
    WebApp.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(messageText)}`
    );
  };


  const handlePaste = async () => {
    try {

      if (isTelegram && window.Telegram?.WebApp?.utils?.readTextFromClipboard) {

        const clipboardText = await window.Telegram.WebApp.utils.readTextFromClipboard();

        if (clipboardText) {

          setParentAddress(clipboardText);
 
          if (click4) click4.play();
        } else {
          
        }
      } else {

        const text = await navigator.clipboard.readText();
        setParentAddress(text);
      }
    } catch (error) {
      console.error("Error accessing clipboard:", error);
    }
  };

  const generateInviteLink = () => {
    if (!address) return '';

    try {
     
      const userFriendlyAddress = address.toString();
      



      const telegramBotLink = `https://t.me/army_of_7_bot?start=${userFriendlyAddress}`;


      navigator.clipboard.writeText(telegramBotLink);


      return telegramBotLink;
    } catch (e) {
      console.error("Error generating invite link:", e);
      return '';
    }
  };


  const fetchHierarchyWithRetry = async (retries = 3, delay = 2000) => {
    
    for (let i = 0; i < retries; i++) {
      const hierarchyData = await getHierarchy(address!);
      if (hierarchyData) {
        setPlayerHierarchy(hierarchyData);
        const members = await getSquadMembers(address!);
        const hierarchicalMembers = members.map(member => ({
          address: member.toString(),  
          role: 'captain' as const, 
          members: []                
        }));
        setSquadMembers(hierarchicalMembers);
        setIsLoading(false);
        setIsInitialLoading(false);
        return hierarchyData;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    setIsInitialLoading(false);
    return null;
  };

  const refreshHierarchyOnClose = async () => {
    console.log("Starting hierarchy refresh...");
    if (address) {
      try {
        setIsLoading(true);
        console.log("Fetching hierarchy data...");

        // First get basic hierarchy data
        const hierarchyData = await getHierarchy(address);
        console.log("Basic hierarchy data:", hierarchyData);

        if (hierarchyData) {
          // Get the complete hierarchy
          const completeHierarchy = await buildCompleteHierarchy(address);
          console.log("Complete hierarchy data:", completeHierarchy);

          // Explicitly update all state variables
          setPlayerHierarchy(hierarchyData);
          setHasJoined(true);
          setSquadMembers(completeHierarchy.captains || []);
          setHierarchyCount(completeHierarchy.counts || { captains: 0, caporals: 0, soldiers: 0 });

          console.log("State variables updated successfully");
        }
      } catch (error) {
        console.error("Error in refreshHierarchyOnClose:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

 

  const handleConsoleClick = () => {

    tonConnectUI.openModal();
  };


  if (isInitialLoading) {
    return (
      <div className="App2">
        <img src={`${import.meta.env.BASE_URL}loadinglogo.png`} alt="Logo" className="loading-logo" />
        <img
          src={`${import.meta.env.BASE_URL}loadingimage.png`}
          alt="Loading"
          className="loading-bar"
          onAnimationEnd={handleLoading}
        />
      </div>
    );
  }

  return (
    <>
    <OrientationWarning />
    <Routes>
      <Route path="/" element={
        
    <div className="App">
         
       
          <div className={`loading-overlay ${isLoading ? '' : 'hidden'}`}>
              <div className="loading-spinner-container">
                <img src={`${import.meta.env.BASE_URL}loading.gif`} alt="Loading..." className="loading-spinner" />
                <div className="loading-text">Processing blockchain data...</div>
              </div>
            </div>
          

      <div className="Container">
        <TonConnectButton className='ton-button' />

            {errorMessage && (
              <div className="error-message">
                {errorMessage}
              </div>
            )}

              

        <div className="logo">      
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" />
            </div>
            
              

            {showInfo && (
              <div className="info-window">
                <div className="info-content">
                  <button className="close-button" onClick={() => {
                    click5.play();
                    setShowInfo(false);
                  }}>×</button>
                  <h2>Army of 7</h2>
                  <div className="info-section">
                    <p>Army of 7 is a transparent, blockchain-based strategy game where players build and command hierarchical military structures. Built on TON blockchain with fully open-source code available on GitHub, the game leverages smart contracts to ensure fair play and verifiable outcomes.</p>
                    <img src={`${import.meta.env.BASE_URL}hierarchy-diagram.png`} alt="Hierarchy" className="info-image" />
                  
                  <p>Players earn rewards in TON coins instantly to their wallet, for every recruits under their three-tier hierarchy: Soldiers, Caporals, and Captains. Payouts are processed by a smart contract on the TON blockchain, creating an engaging <b>play-to-earn ecosystem.</b></p>

                      <img src={`${import.meta.env.BASE_URL}game-modes.png`} alt="Game Modes" className="info-image" />
                  <p>The game's initial phase focuses on building complete army structures across all hierarchical levels, with each player potentially commanding up to 7 direct recruits. Future phases will introduce new strategic elements and gameplay mechanics, making Army of 7 an <b>evolving gaming experience.</b></p>
                  <p>Join now and start building your military empire on the blockchain!</p>
                    </div>
                </div>
              </div>
            )}
            <div className="hud-container">
              
              
              <img src={`${import.meta.env.BASE_URL}hud-background.png`} alt="HUD" className="hud-background" />
              <ScaledUIContainer designWidth={1080} designHeight={1080}>
              <img
                className="info-button"
                src={`${import.meta.env.BASE_URL}info.svg`}
                onClick={() => {
                  click4.play();
                  setShowInfo(true);
                }}
                alt="About the Game"
              />
              
              {!hasJoined && (
                <div className="hud-buttons">
                  {!showJoinOptions ? (
                    <>
                      {showConnectWarning && (
                        <div className={`warning-message ${showConnectWarning ? 'visible' : 'hidden'}`}
                          onClick={() => {
                            if (!address) {
                              setShowConnectWarning(true);
                              setTimeout(() => {
                                const warning = document.querySelector('.warning-message');
                                if (warning) {
                                  (warning as HTMLElement).style.animation = 'warningFade 1s ease-in-out reverse';
                                
                                  setTimeout(() => setShowConnectWarning(false), 3000);
                                }
                              }, 2700);
                            } else {
                              setShowJoinOptions(true);
                            }
                          }}>
                          Connect your wallet to join
                          
                        </div>
                      )}
                      <div className="join-cost">
                        <h3>Joining the army costs: 2.1 TON</h3>
                        <p>Press the info button to learn about rewards and game mechanics.</p>
                      </div>  
                      <img
                        className={`hud-button join-army ${!address ? 'disabled' : ''} mount`}
                        src={`${import.meta.env.BASE_URL}join-army.svg`}
                        alt="Join Army"
                        onClick={() => {
                          click4.play();
                          if (!address) {
                            setShowConnectWarning(true);
                            setTimeout(() => setShowConnectWarning(false), 3000);
                          } else if (!parentAddress) {
                            setShowJoinOptions(true);
                          } else {
                            handleJoin(parentAddress);
                          }
                        }}
                      />
                    </>
                  ) : topSlotsAvailable && !showParentInput ? (
                    <>
                        <div className="join-cost">
                          <h3>Joining the army costs: 2.1 TON</h3>
                          <p>Press the info button to learn about rewards and game mechanics.</p>
                        </div> 
                        <div className='top-slots'><h3>{topSlotsCount} Supreme Commander Slots are still available!</h3></div>
                        <img className={`hud-button0 top-slot ${!address ? 'disabled' : ''} mount`} 
                        onClick={() => {
                        click4.play(); 
                        handleJoin();
                        }}
                         src={`${import.meta.env.BASE_URL}supreme.svg`} alt="Top Slot" />
                        <img
                          key={showJoinOptions ? 'visible' : 'hidden'}
                          className={`hud-button1 under-superior ${!address ? 'disabled' : ''} mount`}
                          onClick={() => {
                            click4.play();
                            setShowParentInput(true);
                          }}
                          src={`${import.meta.env.BASE_URL}superior.svg`}
                          alt="Under Superior"
                        />
                    </>
                  ) : (
                    <>
                          <div className="join-cost">
                            <h3>Joining the army costs: 2.1 TON</h3>
                            <p>Press the info button to learn about rewards and game mechanics.</p>
                          </div> 
                      <input
                        type="text"
                        value={parentAddress}
                        onChange={(e) => setParentAddress(e.target.value)}
                                onPaste={() => {
                                  if (isTelegram) {
                                  
                                    handlePaste();
                                  }
                                }}
                        placeholder="Enter superior address"
                        className={`transparent-input ${!address ? 'disabled' : ''} mount`} 
                      />
                        <div className="join-under">
                          <h3>Enter the TON address of your superior</h3></div>
                          <img className={`hud-button2 ${!address ? 'disabled' : ''} mount`} 
                           src={`${import.meta.env.BASE_URL}join-under.svg`} alt="Join Under" />
                          <img className={`hud-button3 join ${!address ? 'disabled' : ''} mount`} 
                          onClick={() => {
                            click4.play();
                            handleJoin(parentAddress);
                            }} src={`${import.meta.env.BASE_URL}joinb.svg`} alt="Join Under" />
                          <img className={`hud-button-back mount`} 
                          onClick={() => {
                            click4.play();
                            setShowParentInput(false);
                          }} src={`${import.meta.env.BASE_URL}back.svg`} alt="Back" />
                    </>
                  )}
                </div>
              )}
             
                {address ? (
                  <img className="console-svg connected" src={`${import.meta.env.BASE_URL}connected.svg`} alt="Console Connected" />
                ) : (
                  <img
                    className="console-svg disconnected"
                    src={`${import.meta.env.BASE_URL}disconnected.svg`}
                    alt="Console Disconnected"
                    onClick={() => {
                      click4.play();
                      handleConsoleClick();
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                )}

                 

              {hasJoined && (
              
                
                <div className="hud-stats">
                  <img
                    src={`${import.meta.env.BASE_URL}self-hud.svg`}
                    alt="My Stats"
                    className='self-hud'
                  />
                  {isTelegram && telegramUser && (
                    <div className="telegram-info">
                      <img className='telegram-photo' src={telegramUser.photoUrl} alt="Profile" />
                          <div className='telegram-name'><p>Commander {telegramUser.lastName}</p></div>
                    </div>
                  )}
                  <img
                    src={`${import.meta.env.BASE_URL}hud-toggle.svg`}
                    className='hud-toggle'
                    onClick={() => {
                      click3.play();
                      setHudView(hudView === 'stats1' ? 'stats2' : 'stats1');}}
                  />
                  <img
                    src={hudView === 'stats1' ? `${import.meta.env.BASE_URL}squad.svg` : `${import.meta.env.BASE_URL}squad2.svg`}
                    alt="Squad Status"
                    className="squad-status"
                  />
                  {hudView === 'stats1' ? (
                    <div className="army-counts">
                      <div className="count-item">
                        <span>{hierarchyCount.soldiers}/343</span>
                      </div>
                      <div className="count-item">
                        <span>{hierarchyCount.caporals}/49</span>
                      </div>
                      <div className="count-item">
                        <span>{hierarchyCount.captains}/7</span>
                      </div>
                    </div>
                  ) : (
                    <div className="reward-counts">
                      <div className="count-item2">
                        <span>{(hierarchyCount.soldiers * 0.9).toFixed(1

                        )}</span>
                      </div>
                      <div className="count-item2">
                        <span>{(hierarchyCount.caporals * 0.6).toFixed(1)}</span>
                      </div>
                      <div className="count-item2">
                        <span>{(hierarchyCount.captains * 0.3).toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </ScaledUIContainer>
            </div>
            
       
             
      </div>
            {hasJoined && showBattleSystem && (
              <>
                <div className="battle-backdrop" onClick={() => {
                  setShowBattleSystem(false);
                  refreshHierarchyOnClose();
                }}></div>
                <div className="battle-tab">
                  <div className="battle-tab-header">
                    <h2>Army Commander</h2>
                    <button
                      className="close-battle-button"
                      onClick={() => {
                        setShowBattleSystem(false);
                        refreshHierarchyOnClose();
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <BattleSystem
                    hierarchyCount={hierarchyCount}
                    resources={resources}
                    setResources={setResources}
                    updateHierarchyCounts={updateHierarchyCounts} // Add this line
                  />
                </div>
              </>
            )}
           
          {hasJoined && (
            <div className="bottom-nav">
              <button
                className="squad-button"
                onClick={toggleSquadManagement}
              >
                Squad Management
              </button>

                <button
                  className={`conquer-button ${squadMembers.length === 0 ? 'disabled' : ''}`}
                  onClick={() => {
                    if (squadMembers.length === 0) {
                     
                      setErrorMessage("Recruit at least one member to enter game mode!");

                
                      setTimeout(() => setErrorMessage(null), 3000);
                    } else {

                      click1.play();
                      setShowBattleSystem(!showBattleSystem);
                    }
                  }}
                >
                  Game
                </button>

              <button
                className="invite-button"
                onClick={handleInviteFriends}
                >
                Invite Friends
              </button>
            </div>
          )} 

          <div className={`squad-management-overlay ${showSquadManagement ? 'visible' : ''}`}>
            
            <div className="overlay-header">
              <h2>Squad Management</h2>
              <button
                onClick={toggleSquadManagement}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div> 
            <div className="overlay-content">
            {hasJoined && playerHierarchy && (


              <Card elevation={Elevation.ONE}>
                <div className="views-container">

                  <div className={`squad-view ${viewState !== 'none' ? 'hidden' : ''}`}>
                    <Button icon="arrow-down" minimal={true} onClick={handleBackToMain} />
                  </div>

                      <div className={`squad-view ${viewState !== 'main' ? 'hidden' : ''}`}>
                        <div className="card-header">
                          {isTelegram && telegramUser ? (
                            
                              <h3>Squad of {telegramUser.firstName}  {telegramUser.lastName}</h3>
                            ) : (
                              <h3>Squad of {formatAddress(address)}</h3>
                                )}
                          <Button icon="cross" minimal={true} onClick={toggleSquadManagement} />
   
                           
                          
                        
                        </div>
                    <div className="squad-grid">
                      {[...Array(8)].map((_, index) => (
                        index === 0 ? (
                          <SlotCard
                            key={index}
                            filled={false}
                            className="slot-card"
                            customImage={`${import.meta.env.BASE_URL}captain.png`}
                            rank='captain'
                          />
                        ) : (
                          <SlotCard
                            key={index}
                            filled={squadMembers[index - 1] !== undefined}
                            className="slot-card"
                            address={squadMembers[index - 1] ? squadMembers[index - 1].address.toString() : ''}
                            onClick={() => {
                              if (squadMembers[index - 1]) {
                            
                                const normalizedAddress = normalizeAddress(squadMembers[index - 1].address);
                                handleSquadMemberClick(normalizedAddress);
                              }
                            }}
                            rank='captain'
                          >
                            <h4>Captain {index}</h4>
                            {squadMembers[index - 1] ? (
                              <div className="filled-slot">
                                <p>Member Address:</p>
                                <p>{formatAddress(
                        
                                  squadMembers[index - 1] instanceof Address ?
                                    squadMembers[index - 1] :
          
                                    typeof squadMembers[index - 1] === 'object' &&
                                      squadMembers[index - 1] !== null &&
                                      'address' in squadMembers[index - 1] ?
                                      squadMembers[index - 1].address :
           
                                      String(squadMembers[index - 1])
                                )}</p>

                              </div>
                            ) : (
                              <div className="empty-slot">
                                <p>Empty Slot</p>
                                <Button
                                  intent="success"
                                  text="Generate Invite Link"
                                  onClick={generateInviteLink}
                                />
                              </div>
                            )}
                          </SlotCard>
                        )
                      ))}
                    </div>
                  </div>

                  <div className={`nested-view ${viewState !== 'nested' ? 'hidden' : ''}`}>
                    <div className="card-header">
                      <h3>Squad of {selectedAddress ? formatAddress(selectedAddress) : ''}</h3>
                      <Button
                        icon="arrow-left"
                        minimal={true}
                        onClick={handleBackToMain}
                      />
                    </div>
                    <div className="squad-grid">
                      {/* Caporal header slot */}
                      <SlotCard
                        key="caporal"
                        className="slot-card"
                        filled={false}
                        customImage={`${import.meta.env.BASE_URL}caporal.png`}
                        rank='caporal'
                      />

                      {/* Caporal member slots */}
                      {[1, 2, 3, 4, 5, 6, 7].map(index => {
                        const member = nestedSquadMembers[index - 1];
                        const filled = Boolean(member);

                        return (
                          <SlotCard
                            key={index}
                            filled={filled}
                            className="slot-card"
                            address={nestedSquadMembers[index - 1] ? nestedSquadMembers[index - 1].address.toString() : ''}
                            onClick={() => {
                              if (filled && member) {
                               
                                handleNestedSquadMemberClick(member.address);
                              }
                            }}
                            rank='caporal'
                          >
                            <h4>Caporal {index}</h4>
                            {filled ? (
                              <div className="filled-slot">
                                <p>Member Address:</p>
                                <p>{formatAddress(member.address)}</p>
                              </div>
                            ) : (
                              <div className="empty-slot">
                                <p>Empty Slot</p>
                              </div>
                            )}
                          </SlotCard>
                        );
                      })}
                    </div>
                  </div>


                  <div className={`grandchild-view ${viewState !== 'grandchild' ? 'hidden' : ''}`}>
                    <div className="card-header">
                      <h3>Squad of {
                        nestedSquadMembers[selectedSlotIndex]
                          ? formatAddress(nestedSquadMembers[selectedSlotIndex].address)
                          : ''
                      }</h3>
                      <Button
                        icon="arrow-left"
                        minimal={true}
                        onClick={handleBackToNested}
                      />
                    </div>
                    <div className="squad-grid">
                      {[...Array(8)].map((_, index) => (
                        index === 0 ? (
                          <SlotCard
                            key="soldier"
                            className="slot-card"
                            filled={false}
                            customImage={`${import.meta.env.BASE_URL}soldier.png`}
                            rank='soldier'
                          >
                          </SlotCard>
                        ) : (
                          <SlotCard
                            key={index}
                            filled={grandchildSquadMembers[index - 1] !== undefined}
                            className="slot-card"
                            rank='soldier'
                            address={grandchildSquadMembers[index - 1] ? grandchildSquadMembers[index - 1].address.toString() : ''}
                          >
                            <h4>Soldier {index}</h4>
                            {grandchildSquadMembers[index - 1] ? (
                              <div className="filled-slot">
                                <p>Member Address:</p>
                                <p>{formatAddress(grandchildSquadMembers[index - 1].address)}</p>
                              </div>
                            ) : (
                              <div className="empty-slot">
                                <p>Empty Slot</p>
                              </div>
                            )}
                          </SlotCard>
                        )
                      ))}
                    </div>
                  </div>
                </div>

              </Card>

            )} 
          </div> 
         </div>      
    </div>
    
     } />
  
    </Routes > 
    </>
    );
 
}

export default App;
