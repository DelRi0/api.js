// Copyright 2019 Centrality Investments Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import testingPairs from '@plugnet/keyring/testingPairs';

import {Api} from '../../src/Api';
import {ICennznetExtrinsic} from '../../src/types';

import {getTypeRegistry} from '@cennznet/types/polkadot';
import BN from 'bn.js';

const typeRegistry = getTypeRegistry();

typeRegistry.register({
    AssetId: 'u32',
    AssetOptions: {total_supply: 'Balance'},
    Group: 'u256',
    Meta: 'u256',
    PKB: 'u256',
    Response: 'u256',
    Topic: 'u256',
    Value: 'u256',
    Amount: 'u256',
    AcceptPayload: 'u256',
    DeviceId: 'u256',
    ExchangeKey: 'u256',
    Invite: 'u256',
    PermissionOptions: 'u256',
    PreKeyBundle: 'u256',
    BalanceLock: 'u256',
    Exposure: 'u256',
    RewardDestination: 'u256',
    StakingLedger: 'u256',
});

describe.skip('sending test doughnut', () => {
    let api;
    let keyring;

    beforeEach(async () => {
        if (!api) {
            api = await Api.create();
            keyring = testingPairs({type: 'sr25519'});
        }
    });

    afterEach(() => {
        jest.setTimeout(5000);
    });

    it('makes a transfer (sign, then send)', async done => {
        const nonce = await api.query.system.accountNonce(keyring.dave.address());

        const tx = api.tx.genericAsset.transfer(16000, keyring.bob.address(), 10000) as ICennznetExtrinsic<
            Promise<BN>,
            {}
        >;
        tx.addFeeExchangeOpt({
            assetId: 16000,
            maxPayment: 50000,
        });
        tx.sign(keyring.dave, {nonce});
        return tx.send(({events, status}) => {
            console.log('Transaction status:', status.type);
            if (status.isFinalized) {
                console.log('Completed at block hash', status.value.toHex());
                console.log('Events:');

                events.forEach(({phase, event: {data, method, section}}) => {
                    console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
                });

                done();
            }
        });
        done();
    });
});
