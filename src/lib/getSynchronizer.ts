import EventEmitter from 'promise-events'
import { identity } from 'lodash'
import debugFactory from 'debug'

const debug = debugFactory('msr:synchronizer')

// ! DO NOT TYPE THIS FILE AS IT WILL BE REMOVED

/**
 * Cross-packages synchronization context.
 * @typedef Synchronizer
 * @param {EventEmitter} ee Shared event emitter class.
 * @param {Function} todo Gets the list of packages which are still todo
 * @param {Function} once Memoized event subscriber.
 * @param {Function} emit Memoized event emitter.
 * @params {Function} waitFor Function returns a promise that waits until the package has target probe value.
 * @params {Function} waitForAll Function returns a promise that waits until all the packages have the same target probe value.
 */

/**
 * Creates shared signal bus and its assets.
 * @param {Package[]} packages The multi-semantic-release context.
 * @returns {Synchronizer} Shared sync assets.
 */
const getSynchronizer = (packages: Array<Record<string, any>>) => {
  const ee = new EventEmitter()
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  const getEventName = (probe: any, pkg: any) =>
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands,@typescript-eslint/restrict-template-expressions
    `${probe}${pkg ? ':' + pkg.name : ''}`

  // List of packages which are still todo (don't yet have a result).
  const todo = () => packages.filter(p => p.result === undefined)

  // Emitter with memo: next subscribers will receive promises from the past if exists.
  const store = {
    evt: {},
    subscr: {},
  }

  const emit = (probe: any, pkg?: any) => {
    const name = getEventName(probe, pkg)
    debug('ready: %s', name)

    return (
      (store.evt as any)[name as any] ||
      ((store.evt as any)[name as any] = ee.emit(name))
    )
  }

  const once = (probe: any, pkg?: any) => {
    const name = getEventName(probe, pkg)
    return (
      (store.evt as any)[name] ||
      (store.subscr as any)[name] ||
      ((store.subscr as any)[name] = ee.once(name))
    )
  }

  const waitFor = (probe: any, pkg: any) => {
    const name = getEventName(probe, pkg)
    // eslint-disable-next-line no-param-reassign
    return pkg[name] || (pkg[name] = once(probe, pkg))
  }

  // Status sync point.
  const waitForAll = (probe: any, filter = identity) => {
    const promise = once(probe)

    if (
      todo()
        .filter(filter)
        .every(p => probe in p)
    ) {
      debug('ready: %s', probe)
      emit(probe)
    }

    return promise
  }

  // Only the first lucky package passes the probe.
  const getLucky = (probe: any, pkg?: any) => {
    if ((getLucky as any)[probe]) {
      return
    }
    const name = getEventName(probe, pkg)
    debug('lucky: %s', name)
    ;(getLucky as any)[probe] = emit(probe, pkg)
  }

  return {
    ee,
    emit,
    once,
    todo,
    waitFor,
    waitForAll,
    getLucky,
  }
}

export default getSynchronizer
