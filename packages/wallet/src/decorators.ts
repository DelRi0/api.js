import {Newable} from 'cennznet-types';
import 'reflect-metadata';

/**
 *
 * @ignore
 */
export function isTypePromise(type: Newable<any>): boolean {
    try {
        const test = new type(() => ({}));
        return test.then && typeof test.then === 'function';
    } catch (e) {
        return false;
    }
}

/**
 *
 * @ignore
 */
export const requireUnlocked = (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<Function>
) => {
    const origin = descriptor.value;
    const retType = Reflect.getMetadata('design:returntype', target, propertyKey);
    const isReturnPromise = isTypePromise(retType);
    descriptor.value = <any>function(...args) {
        if (this.isLocked()) {
            if (isReturnPromise) {
                return Promise.reject(new Error('wallet is locked'));
            } else {
                throw new Error('wallet is locked');
            }
        }
        return origin.apply(this, args);
    };
};

/**
 *
 * @ignore
 */
export const persistBeforeReturn = (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<Function>
) => {
    const origin = descriptor.value;
    const retType = Reflect.getMetadata('design:returntype', target, propertyKey);
    if (!isTypePromise(retType)) {
        throw new Error('method decorated by @persistBeforeReturn must return Promise');
    }
    descriptor.value = <any>function(...args) {
        return origin.apply(this, args).then(res =>
            this.syncAccountKeyringMap()
                .then(() => this.persistAll())
                .then(() => res)
        );
    };
};

const mutexLocks = new Map<Object, Promise<any>>();
/**
 *
 * @ignore
 */
export const synchronized = (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<Function>
) => {
    const origin = descriptor.value;
    const retType = Reflect.getMetadata('design:returntype', target, propertyKey);
    if (!isTypePromise(retType)) {
        throw new Error('method decorated by @synchronized must return Promise');
    }
    descriptor.value = <any>function(...args) {
        let mutexLock = mutexLocks.get(this);
        if (!mutexLock) {
            mutexLock = origin.apply(this, args);
        } else {
            mutexLock = mutexLock.catch(() => {}).then(() => origin.apply(this, args));
        }
        mutexLocks.set(this, mutexLock);
        return mutexLock;
    };
};
