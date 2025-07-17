/**
 * Creates a partial object from a given object by picking a set of properties.
 * This is similar to lodash's `pick` function.
 *
 * @template T The type of the source object.
 * @template K The keys to pick from the source object.
 * @param {T} obj The source object.
 * @param {ReadonlyArray<K>} keys An array of keys to pick from the object.
 * @returns {Pick<T, K>} A new object with the picked properties.
 */
export function take<T extends any, K extends keyof T>(obj: T, keys: ReadonlyArray<K>): Pick<T, K> {
    if (!obj || typeof obj !== 'object' || obj === null) {
        return {} as Pick<T, K>;
    }

    if (!Array.isArray(keys)) {
        return obj as Pick<T, K>;
    }

    return keys.reduce((acc, key) => {
        if (key in obj) {
            acc[key] = (obj as any)[key];
        }
        return acc;
    }, {} as Pick<T, K>);
}
