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

import getPlugins from '@cennznet/api/plugins';
import {mergeDeriveOptions} from '@cennznet/api/util/derives';
import {injectOption, injectPlugins, mergePlugins} from '@cennznet/api/util/injectPlugin';
import {CennzxSpotRx} from '@cennznet/crml-cennzx-spot';
import {GenericAssetRx} from '@cennznet/crml-generic-asset';
import {ApiRx as ApiRxBase} from '@plugnet/api';
import {ApiOptions as ApiOptionsBase} from '@plugnet/api/types';
import {ProviderInterface} from '@plugnet/rpc-provider/types';
import WsProvider from '@plugnet/rpc-provider/ws';
import {isFunction, isObject} from '@plugnet/util';
import {Observable} from 'rxjs';
import * as derives from './derives';
import {ApiOptions, IPlugin} from './types';
import logger from './util/logging';

const Types = require('@cennznet/types');

export class ApiRx extends ApiRxBase {
    static create(options: ApiOptions | ProviderInterface = {}): Observable<ApiRx> {
        return new ApiRx(options).isReady;
    }

    // TODO: add other crml namespaces
    /**
     * Generic Asset CRML extention
     */
    genericAsset?: GenericAssetRx;
    /**
     * Cennzx Spot CRML extention
     */
    cennzxSpot?: CennzxSpotRx;

    constructor(provider: ApiOptions | ProviderInterface = {}) {
        const options =
            isObject(provider) && isFunction((provider as ProviderInterface).send)
                ? ({provider} as ApiOptions)
                : ({...provider} as ApiOptions);
        if (typeof options.provider === 'string') {
            options.provider = new WsProvider(options.provider);
        }
        let plugins: IPlugin[] = options.plugins || [];
        try {
            plugins = mergePlugins(plugins, getPlugins());
            injectOption(options, plugins);
        } catch (e) {
            logger.error('plugin loading failed');
        }

        options.types = {...Types, ...options.types};
        options.derives = mergeDeriveOptions(derives, options.derives);

        super(options as ApiOptionsBase);

        if (plugins) {
            injectPlugins(this, plugins);
        }
    }
}
