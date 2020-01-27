/**
 * @typedef {() => Promise<any>} AsyncFunction
 * 
 * @param {AsyncFunction[]} fns
 */
export function promiseSeq(fns) {
    return fns.reduce((ps, p) => ps.then(p), Promise.resolve())
}