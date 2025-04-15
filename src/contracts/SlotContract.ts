import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    TupleReader,
    Dictionary,
    contractAddress,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
}

export function storeStateInit(src: StateInit) {
    return (builder: Builder) => {
        let b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}

export function loadStateInit(slice: Slice) {
    let sc_0 = slice;
    let _code = sc_0.loadRef();
    let _data = sc_0.loadRef();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}



export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
}

export function storeStdAddress(src: StdAddress) {
    return (builder: Builder) => {
        let b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}

export function loadStdAddress(slice: Slice) {
    let sc_0 = slice;
    let _workchain = sc_0.loadIntBig(8);
    let _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}


export type VarAddress = {
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
}

export function storeVarAddress(src: VarAddress) {
    return (builder: Builder) => {
        let b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}

export function loadVarAddress(slice: Slice) {
    let sc_0 = slice;
    let _workchain = sc_0.loadIntBig(32);
    let _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export type Context = {
    $$type: 'Context';
    bounced: boolean;
    sender: Address;
    value: bigint;
    raw: Slice;
}

export function storeContext(src: Context) {
    return (builder: Builder) => {
        let b_0 = builder;
        b_0.storeBit(src.bounced);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}

export function loadContext(slice: Slice) {
    let sc_0 = slice;
    let _bounced = sc_0.loadBit();
    let _sender = sc_0.loadAddress();
    let _value = sc_0.loadIntBig(257);
    let _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context' as const, bounced: _bounced, sender: _sender, value: _value, raw: _raw };
}


export type SendParameters = {
    $$type: 'SendParameters';
    bounce: boolean;
    to: Address;
    value: bigint;
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
}

export function storeSendParameters(src: SendParameters) {
    return (builder: Builder) => {
        let b_0 = builder;
        b_0.storeBit(src.bounce);
        b_0.storeAddress(src.to);
        b_0.storeInt(src.value, 257);
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        if (src.code !== null && src.code !== undefined) { b_0.storeBit(true).storeRef(src.code); } else { b_0.storeBit(false); }
        if (src.data !== null && src.data !== undefined) { b_0.storeBit(true).storeRef(src.data); } else { b_0.storeBit(false); }
    };
}

export function loadSendParameters(slice: Slice) {
    let sc_0 = slice;
    let _bounce = sc_0.loadBit();
    let _to = sc_0.loadAddress();
    let _value = sc_0.loadIntBig(257);
    let _mode = sc_0.loadIntBig(257);
    let _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    let _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    let _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'SendParameters' as const, bounce: _bounce, to: _to, value: _value, mode: _mode, body: _body, code: _code, data: _data };
}

export type Deploy = {
    $$type: 'Deploy';
    queryId: bigint;
}

export function storeDeploy(src: Deploy) {
    return (builder: Builder) => {
        let b_0 = builder;
        b_0.storeUint(2490013878, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeploy(slice: Slice) {
    let sc_0 = slice;
    if (sc_0.loadUint(32) !== 2490013878) { throw Error('Invalid prefix'); }
    let _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Deploy' as const, queryId: _queryId };
}


export type DeployOk = {
    $$type: 'DeployOk';
    queryId: bigint;
}

export function storeDeployOk(src: DeployOk) {
    return (builder: Builder) => {
        let b_0 = builder;
        b_0.storeUint(2952335191, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeployOk(slice: Slice) {
    let sc_0 = slice;
    if (sc_0.loadUint(32) !== 2952335191) { throw Error('Invalid prefix'); }
    let _queryId = sc_0.loadUintBig(64);
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export type FactoryDeploy = {
    $$type: 'FactoryDeploy';
    queryId: bigint;
    cashback: Address;
}

export function storeFactoryDeploy(src: FactoryDeploy) {
    return (builder: Builder) => {
        let b_0 = builder;
        b_0.storeUint(1829761339, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.cashback);
    };
}

export function loadFactoryDeploy(slice: Slice) {
    let sc_0 = slice;
    if (sc_0.loadUint(32) !== 1829761339) { throw Error('Invalid prefix'); }
    let _queryId = sc_0.loadUintBig(64);
    let _cashback = sc_0.loadAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}


export type Hierarchy = {
    $$type: 'Hierarchy';
    owner: Address;
    parent: Address | null;
    grandparent: Address | null;
    greatgrandparent: Address | null;
    availableSlots: bigint;
}

export function storeHierarchy(src: Hierarchy) {
    return (builder: Builder) => {
        let b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.parent);
        b_0.storeAddress(src.grandparent);
        let b_1 = new Builder();
        b_1.storeAddress(src.greatgrandparent);
        b_1.storeInt(src.availableSlots, 257);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadHierarchy(slice: Slice) {
    let sc_0 = slice;
    let _owner = sc_0.loadAddress();
    let _parent = sc_0.loadMaybeAddress();
    let _grandparent = sc_0.loadMaybeAddress();
    let sc_1 = sc_0.loadRef().beginParse();
    let _greatgrandparent = sc_1.loadMaybeAddress();
    let _availableSlots = sc_1.loadIntBig(257);
    return { $$type: 'Hierarchy' as const, owner: _owner, parent: _parent, grandparent: _grandparent, greatgrandparent: _greatgrandparent, availableSlots: _availableSlots };
}

function loadTupleHierarchy(source: TupleReader) {
    let _owner = source.readAddress();
    let _parent = source.readAddressOpt();
    let _grandparent = source.readAddressOpt();
    let _greatgrandparent = source.readAddressOpt();
    let _availableSlots = source.readBigNumber();
    return { $$type: 'Hierarchy' as const, owner: _owner, parent: _parent, grandparent: _grandparent, greatgrandparent: _greatgrandparent, availableSlots: _availableSlots };
}

function dictValueParserHierarchy(): DictionaryValue<Hierarchy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeHierarchy(src)).endCell());
        },
        parse: (src) => {
            return loadHierarchy(src.loadRef().beginParse());
        }
    }
}

export type Join = {
    $$type: 'Join';
    parentAddress: Address | null;
}

export function storeJoin(src: Join) {
    return (builder: Builder) => {
        let b_0 = builder;
        b_0.storeUint(2647416232, 32);
        b_0.storeAddress(src.parentAddress);
    };
}

export function loadJoin(slice: Slice) {
    let sc_0 = slice;
    if (sc_0.loadUint(32) !== 2647416232) { throw Error('Invalid prefix'); }
    let _parentAddress = sc_0.loadMaybeAddress();
    return { $$type: 'Join' as const, parentAddress: _parentAddress };
}

export type GetPlayerHierarchy = {
    $$type: 'GetPlayerHierarchy';
    playerAddress: Address;
}

export function storeGetPlayerHierarchy(src: GetPlayerHierarchy) {
    return (builder: Builder) => {
        let b_0 = builder;
        b_0.storeUint(1808865133, 32);
        b_0.storeAddress(src.playerAddress);
    };
}

export function loadGetPlayerHierarchy(slice: Slice) {
    let sc_0 = slice;
    if (sc_0.loadUint(32) !== 1808865133) { throw Error('Invalid prefix'); }
    let _playerAddress = sc_0.loadAddress();
    return { $$type: 'GetPlayerHierarchy' as const, playerAddress: _playerAddress };
}


export type ArmyContract$Data = {
    $$type: 'ArmyContract$Data';
    owner: Address | null;
    parent: Address | null;
    grandparent: Address | null;
    greatgrandparent: Address | null;
    availableSlots: bigint;
    systemWallet: Address;
    totalTopSlots: bigint;
    usedTopSlots: bigint;
    slotHierarchy: Dictionary<Address, Hierarchy>;
}

export function storeArmyContract$Data(src: ArmyContract$Data) {
    return (builder: Builder) => {
        let b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.parent);
        b_0.storeAddress(src.grandparent);
        let b_1 = new Builder();
        b_1.storeAddress(src.greatgrandparent);
        b_1.storeInt(src.availableSlots, 257);
        b_1.storeAddress(src.systemWallet);
        let b_2 = new Builder();
        b_2.storeInt(src.totalTopSlots, 257);
        b_2.storeInt(src.usedTopSlots, 257);
        b_2.storeDict(src.slotHierarchy, Dictionary.Keys.Address(), dictValueParserHierarchy());
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadArmyContract$Data(slice: Slice) {
    let sc_0 = slice;
    let _owner = sc_0.loadMaybeAddress();
    let _parent = sc_0.loadMaybeAddress();
    let _grandparent = sc_0.loadMaybeAddress();
    let sc_1 = sc_0.loadRef().beginParse();
    let _greatgrandparent = sc_1.loadMaybeAddress();
    let _availableSlots = sc_1.loadIntBig(257);
    let _systemWallet = sc_1.loadAddress();
    let sc_2 = sc_1.loadRef().beginParse();
    let _totalTopSlots = sc_2.loadIntBig(257);
    let _usedTopSlots = sc_2.loadIntBig(257);
    let _slotHierarchy = Dictionary.load(Dictionary.Keys.Address(), dictValueParserHierarchy(), sc_2);
    return { $$type: 'ArmyContract$Data' as const, owner: _owner, parent: _parent, grandparent: _grandparent, greatgrandparent: _greatgrandparent, availableSlots: _availableSlots, systemWallet: _systemWallet, totalTopSlots: _totalTopSlots, usedTopSlots: _usedTopSlots, slotHierarchy: _slotHierarchy };
}

type ArmyContract_init_args = {
    $$type: 'ArmyContract_init_args';
}
// For the first error (line 362)
// @ts-ignore
function initArmyContract_init_args(src: ArmyContract_init_args) {
    return (builder: Builder) => {
        // For the second error (line 364)
        // @ts-ignore
        let b_0 = builder;
    };
}

async function ArmyContract_init() {
    const __code = Cell.fromBase64('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');
    const __system = Cell.fromBase64('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');
    let builder = beginCell();
    builder.storeRef(__system);
    builder.storeUint(0, 1);
    initArmyContract_init_args({ $$type: 'ArmyContract_init_args' })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

const ArmyContract_errors: { [key: number]: { message: string } } = {
    2: { message: `Stack underflow` },
    3: { message: `Stack overflow` },
    4: { message: `Integer overflow` },
    5: { message: `Integer out of expected range` },
    6: { message: `Invalid opcode` },
    7: { message: `Type check error` },
    8: { message: `Cell overflow` },
    9: { message: `Cell underflow` },
    10: { message: `Dictionary error` },
    11: { message: `'Unknown' error` },
    12: { message: `Fatal error` },
    13: { message: `Out of gas error` },
    14: { message: `Virtualization error` },
    32: { message: `Action list is invalid` },
    33: { message: `Action list is too long` },
    34: { message: `Action is invalid or not supported` },
    35: { message: `Invalid source address in outbound message` },
    36: { message: `Invalid destination address in outbound message` },
    37: { message: `Not enough TON` },
    38: { message: `Not enough extra-currencies` },
    39: { message: `Outbound message does not fit into a cell after rewriting` },
    40: { message: `Cannot process a message` },
    41: { message: `Library reference is null` },
    42: { message: `Library change action error` },
    43: { message: `Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree` },
    50: { message: `Account state size exceeded limits` },
    128: { message: `Null reference exception` },
    129: { message: `Invalid serialization prefix` },
    130: { message: `Invalid incoming message` },
    131: { message: `Constraints error` },
    132: { message: `Access denied` },
    133: { message: `Contract stopped` },
    134: { message: `Invalid argument` },
    135: { message: `Code of a contract was not found` },
    136: { message: `Invalid address` },
    137: { message: `Masterchain support is not enabled for this contract` },
    7444: { message: `No available top slots, join under a parent.` },
    18566: { message: `Not enough funds for systemWallet!` },
    51754: { message: `Insufficient funds` },
    57868: { message: `No available slots` },
}

const ArmyContract_types: ABIType[] = [
    { "name": "StateInit", "header": null, "fields": [{ "name": "code", "type": { "kind": "simple", "type": "cell", "optional": false } }, { "name": "data", "type": { "kind": "simple", "type": "cell", "optional": false } }] },
    { "name": "StdAddress", "header": null, "fields": [{ "name": "workchain", "type": { "kind": "simple", "type": "int", "optional": false, "format": 8 } }, { "name": "address", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 256 } }] },
    { "name": "VarAddress", "header": null, "fields": [{ "name": "workchain", "type": { "kind": "simple", "type": "int", "optional": false, "format": 32 } }, { "name": "address", "type": { "kind": "simple", "type": "slice", "optional": false } }] },
    { "name": "Context", "header": null, "fields": [{ "name": "bounced", "type": { "kind": "simple", "type": "bool", "optional": false } }, { "name": "sender", "type": { "kind": "simple", "type": "address", "optional": false } }, { "name": "value", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }, { "name": "raw", "type": { "kind": "simple", "type": "slice", "optional": false } }] },
    { "name": "SendParameters", "header": null, "fields": [{ "name": "bounce", "type": { "kind": "simple", "type": "bool", "optional": false } }, { "name": "to", "type": { "kind": "simple", "type": "address", "optional": false } }, { "name": "value", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }, { "name": "mode", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }, { "name": "body", "type": { "kind": "simple", "type": "cell", "optional": true } }, { "name": "code", "type": { "kind": "simple", "type": "cell", "optional": true } }, { "name": "data", "type": { "kind": "simple", "type": "cell", "optional": true } }] },
    { "name": "Deploy", "header": 2490013878, "fields": [{ "name": "queryId", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 64 } }] },
    { "name": "DeployOk", "header": 2952335191, "fields": [{ "name": "queryId", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 64 } }] },
    { "name": "FactoryDeploy", "header": 1829761339, "fields": [{ "name": "queryId", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 64 } }, { "name": "cashback", "type": { "kind": "simple", "type": "address", "optional": false } }] },
    { "name": "Hierarchy", "header": null, "fields": [{ "name": "owner", "type": { "kind": "simple", "type": "address", "optional": false } }, { "name": "parent", "type": { "kind": "simple", "type": "address", "optional": true } }, { "name": "grandparent", "type": { "kind": "simple", "type": "address", "optional": true } }, { "name": "greatgrandparent", "type": { "kind": "simple", "type": "address", "optional": true } }, { "name": "availableSlots", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }] },
    { "name": "Join", "header": 2647416232, "fields": [{ "name": "parentAddress", "type": { "kind": "simple", "type": "address", "optional": true } }] },
    { "name": "GetPlayerHierarchy", "header": 1808865133, "fields": [{ "name": "playerAddress", "type": { "kind": "simple", "type": "address", "optional": false } }] },
    { "name": "ArmyContract$Data", "header": null, "fields": [{ "name": "owner", "type": { "kind": "simple", "type": "address", "optional": true } }, { "name": "parent", "type": { "kind": "simple", "type": "address", "optional": true } }, { "name": "grandparent", "type": { "kind": "simple", "type": "address", "optional": true } }, { "name": "greatgrandparent", "type": { "kind": "simple", "type": "address", "optional": true } }, { "name": "availableSlots", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }, { "name": "systemWallet", "type": { "kind": "simple", "type": "address", "optional": false } }, { "name": "totalTopSlots", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }, { "name": "usedTopSlots", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }, { "name": "slotHierarchy", "type": { "kind": "dict", "key": "address", "value": "Hierarchy", "valueFormat": "ref" } }] },
]

const ArmyContract_getters: ABIGetter[] = [
    { "name": "getHierarchy", "arguments": [{ "name": "playerAddress", "type": { "kind": "simple", "type": "address", "optional": false } }], "returnType": { "kind": "simple", "type": "Hierarchy", "optional": true } },
    { "name": "TotalTopSlots", "arguments": [], "returnType": { "kind": "simple", "type": "int", "optional": false, "format": 257 } },
]

export const ArmyContract_getterMapping: { [key: string]: string } = {
    'getHierarchy': 'getGetHierarchy',
    'TotalTopSlots': 'getTotalTopSlots',
}

const ArmyContract_receivers: ABIReceiver[] = [
    { "receiver": "internal", "message": { "kind": "typed", "type": "Join" } },
    { "receiver": "internal", "message": { "kind": "typed", "type": "GetPlayerHierarchy" } },
    { "receiver": "internal", "message": { "kind": "typed", "type": "Deploy" } },
]

export class ArmyContract implements Contract {

    static async init() {
        return await ArmyContract_init();
    }

    static async fromInit() {
        const init = await ArmyContract_init();
        const address = contractAddress(0, init);
        return new ArmyContract(address, init);
    }

    static fromAddress(address: Address) {
        return new ArmyContract(address);
    }

    readonly address: Address;
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types: ArmyContract_types,
        getters: ArmyContract_getters,
        receivers: ArmyContract_receivers,
        errors: ArmyContract_errors,
    };

    private constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }

    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean | null | undefined }, message: Join | GetPlayerHierarchy | Deploy) {

        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Join') {
            body = beginCell().store(storeJoin(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'GetPlayerHierarchy') {
            body = beginCell().store(storeGetPlayerHierarchy(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Deploy') {
            body = beginCell().store(storeDeploy(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }

        await provider.internal(via, { ...args, body: body });

    }

    async getGetHierarchy(provider: ContractProvider, playerAddress: Address) {
        let builder = new TupleBuilder();
        builder.writeAddress(playerAddress);
        let source = (await provider.get('getHierarchy', builder.build())).stack;
        const result_p = source.readTupleOpt();
        const result = result_p ? loadTupleHierarchy(result_p) : null;
        return result;
    }

    async getTotalTopSlots(provider: ContractProvider) {
        let builder = new TupleBuilder();
        let source = (await provider.get('TotalTopSlots', builder.build())).stack;
        let result = source.readBigNumber();
        return result;
    }

}
export default ArmyContract;