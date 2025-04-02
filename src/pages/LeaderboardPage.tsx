import { useEffect, useState } from 'react';
import { Card, Elevation } from '@blueprintjs/core';
import { useSlotContract } from '../hooks/useSlotContract';
import { Address } from '@ton/core';
import './LeaderboardPage.css';

type LeaderboardPlayer = {
    address: Address;
    totalSlots: number;
    hierarchySize: number;
    rewards: bigint;
};

export function LeaderboardPage() {
    


   

    return (
        <div className="leaderboard-container">
            {/* Podium Section */}
            <div className="podium-container">
              <p>leaderboard</p>
            </div>
        </div>
    );
}
