/**
 * Array manipulation utilities
 */

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - New shuffled array
 */
export function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Get random element from array
 * @param {Array} array - Array to pick from
 * @returns {*} - Random element
 */
export function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get multiple random elements from array without replacement
 * @param {Array} array - Array to pick from
 * @param {number} count - Number of elements to pick
 * @returns {Array} - Array of random elements
 */
export function randomElements(array, count) {
    const shuffled = shuffle(array);
    return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Group array elements by a key function
 * @param {Array} array - Array to group
 * @param {Function} keyFn - Function that returns grouping key
 * @returns {Object} - Object with grouped arrays
 */
export function groupBy(array, keyFn) {
    return array.reduce((groups, item) => {
        const key = keyFn(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

/**
 * Remove duplicates from array
 * @param {Array} array - Array to deduplicate
 * @param {Function} keyFn - Optional function to generate comparison key
 * @returns {Array} - Array without duplicates
 */
export function unique(array, keyFn = null) {
    if (!keyFn) {
        return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
        const key = keyFn(item);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

/**
 * Find the element with maximum value according to selector function
 * @param {Array} array - Array to search
 * @param {Function} selector - Function that returns value to compare
 * @returns {*} - Element with maximum value
 */
export function maxBy(array, selector) {
    if (array.length === 0) return undefined;
    
    let maxElement = array[0];
    let maxValue = selector(maxElement);
    
    for (let i = 1; i < array.length; i++) {
        const value = selector(array[i]);
        if (value > maxValue) {
            maxValue = value;
            maxElement = array[i];
        }
    }
    
    return maxElement;
}

/**
 * Find the element with minimum value according to selector function
 * @param {Array} array - Array to search
 * @param {Function} selector - Function that returns value to compare
 * @returns {*} - Element with minimum value
 */
export function minBy(array, selector) {
    if (array.length === 0) return undefined;
    
    let minElement = array[0];
    let minValue = selector(minElement);
    
    for (let i = 1; i < array.length; i++) {
        const value = selector(array[i]);
        if (value < minValue) {
            minValue = value;
            minElement = array[i];
        }
    }
    
    return minElement;
}

/**
 * Sum array elements according to selector function
 * @param {Array} array - Array to sum
 * @param {Function} selector - Function that returns value to sum
 * @returns {number} - Sum of values
 */
export function sumBy(array, selector) {
    return array.reduce((sum, item) => sum + selector(item), 0);
}

/**
 * Count elements that match predicate
 * @param {Array} array - Array to count
 * @param {Function} predicate - Function that returns boolean
 * @returns {number} - Count of matching elements
 */
export function countBy(array, predicate) {
    return array.filter(predicate).length;
}

/**
 * Partition array into two arrays based on predicate
 * @param {Array} array - Array to partition
 * @param {Function} predicate - Function that returns boolean
 * @returns {Array} - [truthy array, falsy array]
 */
export function partition(array, predicate) {
    const truthy = [];
    const falsy = [];
    
    array.forEach(item => {
        if (predicate(item)) {
            truthy.push(item);
        } else {
            falsy.push(item);
        }
    });
    
    return [truthy, falsy];
}

/**
 * Create array of specified length filled with value or result of function
 * @param {number} length - Length of array
 * @param {*|Function} fillValue - Value to fill with or function to generate values
 * @returns {Array} - Filled array
 */
export function fillArray(length, fillValue) {
    if (typeof fillValue === 'function') {
        return Array.from({ length }, (_, index) => fillValue(index));
    }
    return Array(length).fill(fillValue);
}

/**
 * Chunk array into smaller arrays of specified size
 * @param {Array} array - Array to chunk
 * @param {number} size - Size of each chunk
 * @returns {Array} - Array of chunks
 */
export function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * Flatten nested array by one level
 * @param {Array} array - Array to flatten
 * @returns {Array} - Flattened array
 */
export function flatten(array) {
    return array.reduce((flat, item) => flat.concat(item), []);
}

/**
 * Deep flatten nested array
 * @param {Array} array - Array to flatten
 * @returns {Array} - Deeply flattened array
 */
export function flattenDeep(array) {
    return array.reduce((flat, item) => 
        flat.concat(Array.isArray(item) ? flattenDeep(item) : item), []);
}