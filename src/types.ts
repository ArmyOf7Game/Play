


export interface HierarchicalSquadMember {
    address: string;
    role: 'captain' | 'caporal' | 'soldier';
    members: string[]; 
}

export interface CompleteHierarchyData {
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

export interface HierarchyCounts {
    soldiers: number;
    caporals: number;
    captains: number;
}
export interface SquadMember {
    address: string;
    role: 'captain' | 'caporal' | 'soldier';
    members: string[]; 
}


export interface HierarchicalCache {
    [ownerAddress: string]: {
        captains: SquadMember[];
        caporals: {
            [captainAddress: string]: SquadMember[];
        };
        soldiers: {
            [caporalAddress: string]: SquadMember[];
        };
        lastUpdated: number;
    }
}