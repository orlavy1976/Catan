/**
 * Random number and selection utilities
 */

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random integer
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random float between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random float
 */
export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Get random boolean with optional probability
 * @param {number} probability - Probability of true (0-1), default 0.5
 * @returns {boolean} - Random boolean
 */
export function randomBool(probability = 0.5) {
    return Math.random() < probability;
}

/**
 * Pick random element from array
 * @param {Array} array - Array to pick from
 * @returns {*} - Random element
 */
export function randomChoice(array) {
    return array[randomInt(0, array.length - 1)];
}

/**
 * Pick multiple random elements from array without replacement
 * @param {Array} array - Array to pick from
 * @param {number} count - Number of elements to pick
 * @returns {Array} - Array of random elements
 */
export function randomChoices(array, count) {
    if (count >= array.length) {
        return [...array];
    }
    
    const result = [];
    const available = [...array];
    
    for (let i = 0; i < count; i++) {
        const index = randomInt(0, available.length - 1);
        result.push(available.splice(index, 1)[0]);
    }
    
    return result;
}

/**
 * Weighted random selection
 * @param {Array} choices - Array of [item, weight] pairs
 * @returns {*} - Randomly selected item based on weights
 */
export function weightedChoice(choices) {
    const totalWeight = choices.reduce((sum, [, weight]) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const [item, weight] of choices) {
        if (random < weight) {
            return item;
        }
        random -= weight;
    }
    
    // Fallback to last item
    return choices[choices.length - 1][0];
}

/**
 * Generate random string of specified length
 * @param {number} length - Length of string
 * @param {string} charset - Character set to use
 * @returns {string} - Random string
 */
export function randomString(length, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset.charAt(randomInt(0, charset.length - 1));
    }
    return result;
}

/**
 * Generate random ID string
 * @param {number} length - Length of ID (default 8)
 * @returns {string} - Random ID
 */
export function randomId(length = 8) {
    return randomString(length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
}

/**
 * Generate UUID v4
 * @returns {string} - UUID string
 */
export function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Shuffle array in place using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - The same array, shuffled
 */
export function shuffleInPlace(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = randomInt(0, i);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Create new shuffled array without modifying original
 * @param {Array} array - Array to shuffle
 * @returns {Array} - New shuffled array
 */
export function shuffle(array) {
    return shuffleInPlace([...array]);
}

/**
 * Random number generator with seed (simple LCG)
 */
export class SeededRandom {
    constructor(seed = Date.now()) {
        this.seed = seed;
    }
    
    /**
     * Get next random number between 0 and 1
     * @returns {number} - Random number
     */
    next() {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }
    
    /**
     * Get random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} - Random integer
     */
    int(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    
    /**
     * Get random float between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} - Random float
     */
    float(min, max) {
        return this.next() * (max - min) + min;
    }
    
    /**
     * Pick random element from array
     * @param {Array} array - Array to pick from
     * @returns {*} - Random element
     */
    choice(array) {
        return array[this.int(0, array.length - 1)];
    }
    
    /**
     * Shuffle array using this seeded generator
     * @param {Array} array - Array to shuffle
     * @returns {Array} - New shuffled array
     */
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.int(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}

/**
 * Dice rolling utilities
 */
export class Dice {
    /**
     * Roll a single die
     * @param {number} sides - Number of sides (default 6)
     * @returns {number} - Die result
     */
    static roll(sides = 6) {
        return randomInt(1, sides);
    }
    
    /**
     * Roll multiple dice
     * @param {number} count - Number of dice
     * @param {number} sides - Number of sides per die (default 6)
     * @returns {Array} - Array of die results
     */
    static rollMultiple(count, sides = 6) {
        return Array.from({ length: count }, () => this.roll(sides));
    }
    
    /**
     * Roll two six-sided dice and return sum (Catan standard)
     * @returns {number} - Sum of two dice (2-12)
     */
    static rollCatan() {
        return this.roll(6) + this.roll(6);
    }
    
    /**
     * Get all possible outcomes for rolling multiple dice
     * @param {number} count - Number of dice
     * @param {number} sides - Number of sides per die
     * @returns {Array} - Array of all possible sums
     */
    static getAllOutcomes(count, sides = 6) {
        const outcomes = [];
        const min = count;
        const max = count * sides;
        
        for (let sum = min; sum <= max; sum++) {
            outcomes.push(sum);
        }
        
        return outcomes;
    }
    
    /**
     * Calculate probability of getting specific sum with multiple dice
     * @param {number} targetSum - Target sum
     * @param {number} diceCount - Number of dice
     * @param {number} sides - Number of sides per die
     * @returns {number} - Probability (0-1)
     */
    static getProbability(targetSum, diceCount, sides = 6) {
        if (targetSum < diceCount || targetSum > diceCount * sides) {
            return 0;
        }
        
        // For Catan (2 dice, 6 sides), we can use hardcoded probabilities
        if (diceCount === 2 && sides === 6) {
            const probabilities = {
                2: 1/36, 3: 2/36, 4: 3/36, 5: 4/36, 6: 5/36, 7: 6/36,
                8: 5/36, 9: 4/36, 10: 3/36, 11: 2/36, 12: 1/36
            };
            return probabilities[targetSum] || 0;
        }
        
        // General calculation would be more complex
        // For now, return simplified estimate
        const totalOutcomes = Math.pow(sides, diceCount);
        const middle = (diceCount + diceCount * sides) / 2;
        const distance = Math.abs(targetSum - middle);
        const maxDistance = Math.max(middle - diceCount, diceCount * sides - middle);
        
        // Simple approximation - real calculation requires recursive counting
        return Math.max(0.01, (maxDistance - distance) / maxDistance / totalOutcomes * sides);
    }
}