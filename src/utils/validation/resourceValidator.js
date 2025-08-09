/**
 * Resource cost validation utilities
 */

import { createLogger } from '../helpers/debugUtils.js';

const logger = createLogger('ResourceValidator');

/**
 * Check if player has enough resources for a cost
 * @param {Object} playerResources - Player's current resources
 * @param {Object} cost - Required resource cost
 * @returns {boolean} - Whether player can afford the cost
 */
export function canAfford(playerResources, cost) {
    if (!playerResources || !cost) {
        logger.warn('canAfford called with null parameters', { playerResources, cost });
        return false;
    }

    for (const [resource, amount] of Object.entries(cost)) {
        const available = playerResources[resource] || 0;
        if (available < amount) {
            logger.debug(`Insufficient ${resource}: has ${available}, needs ${amount}`);
            return false;
        }
    }
    
    logger.debug('Resource check passed', { playerResources, cost });
    return true;
}

/**
 * Calculate missing resources for a cost
 * @param {Object} playerResources - Player's current resources
 * @param {Object} cost - Required resource cost
 * @returns {Object} - Missing resources (only includes resources that are short)
 */
export function getMissingResources(playerResources, cost) {
    const missing = {};
    
    for (const [resource, amount] of Object.entries(cost)) {
        const available = playerResources[resource] || 0;
        const shortage = amount - available;
        if (shortage > 0) {
            missing[resource] = shortage;
        }
    }
    
    return missing;
}

/**
 * Check if resources object is valid
 * @param {Object} resources - Resources to validate
 * @returns {boolean} - Whether resources are valid
 */
export function isValidResourceObject(resources) {
    if (!resources || typeof resources !== 'object') {
        return false;
    }

    const validResources = ['wood', 'brick', 'sheep', 'wheat', 'ore'];
    
    for (const [resource, amount] of Object.entries(resources)) {
        if (!validResources.includes(resource)) {
            logger.warn(`Invalid resource type: ${resource}`);
            return false;
        }
        
        if (typeof amount !== 'number' || amount < 0 || !Number.isInteger(amount)) {
            logger.warn(`Invalid resource amount for ${resource}: ${amount}`);
            return false;
        }
    }
    
    return true;
}

/**
 * Normalize resources object (ensure all resource types are present)
 * @param {Object} resources - Resources to normalize
 * @returns {Object} - Normalized resources with all types
 */
export function normalizeResources(resources = {}) {
    const normalized = {
        wood: 0,
        brick: 0,
        sheep: 0,
        wheat: 0,
        ore: 0
    };
    
    for (const [resource, amount] of Object.entries(resources)) {
        if (normalized.hasOwnProperty(resource)) {
            normalized[resource] = Math.max(0, Math.floor(amount || 0));
        }
    }
    
    return normalized;
}

/**
 * Add resources to a resource object
 * @param {Object} resources - Current resources
 * @param {Object} toAdd - Resources to add
 * @returns {Object} - New resource object with added resources
 */
export function addResources(resources, toAdd) {
    const result = normalizeResources(resources);
    const normalizedToAdd = normalizeResources(toAdd);
    
    for (const [resource, amount] of Object.entries(normalizedToAdd)) {
        result[resource] += amount;
    }
    
    return result;
}

/**
 * Subtract resources from a resource object
 * @param {Object} resources - Current resources
 * @param {Object} toSubtract - Resources to subtract
 * @returns {Object} - New resource object with subtracted resources
 */
export function subtractResources(resources, toSubtract) {
    const result = normalizeResources(resources);
    const normalizedToSubtract = normalizeResources(toSubtract);
    
    for (const [resource, amount] of Object.entries(normalizedToSubtract)) {
        result[resource] = Math.max(0, result[resource] - amount);
    }
    
    return result;
}

/**
 * Get total resource count
 * @param {Object} resources - Resources to count
 * @returns {number} - Total resource count
 */
export function getTotalResourceCount(resources) {
    return Object.values(normalizeResources(resources)).reduce((sum, amount) => sum + amount, 0);
}

/**
 * Check if resources are empty (all zeros)
 * @param {Object} resources - Resources to check
 * @returns {boolean} - Whether resources are empty
 */
export function isEmpty(resources) {
    return getTotalResourceCount(resources) === 0;
}

/**
 * Compare two resource objects
 * @param {Object} resources1 - First resource object
 * @param {Object} resources2 - Second resource object
 * @returns {boolean} - Whether they are equal
 */
export function areEqual(resources1, resources2) {
    const norm1 = normalizeResources(resources1);
    const norm2 = normalizeResources(resources2);
    
    for (const resource of ['wood', 'brick', 'sheep', 'wheat', 'ore']) {
        if (norm1[resource] !== norm2[resource]) {
            return false;
        }
    }
    
    return true;
}

/**
 * Get the most abundant resource
 * @param {Object} resources - Resources to check
 * @returns {string|null} - Resource type with highest count, or null if empty
 */
export function getMostAbundantResource(resources) {
    const normalized = normalizeResources(resources);
    let maxResource = null;
    let maxAmount = 0;
    
    for (const [resource, amount] of Object.entries(normalized)) {
        if (amount > maxAmount) {
            maxAmount = amount;
            maxResource = resource;
        }
    }
    
    return maxResource;
}

/**
 * Get the least abundant resource (excluding zeros)
 * @param {Object} resources - Resources to check
 * @returns {string|null} - Resource type with lowest non-zero count, or null if all zero
 */
export function getLeastAbundantResource(resources) {
    const normalized = normalizeResources(resources);
    let minResource = null;
    let minAmount = Infinity;
    
    for (const [resource, amount] of Object.entries(normalized)) {
        if (amount > 0 && amount < minAmount) {
            minAmount = amount;
            minResource = resource;
        }
    }
    
    return minResource;
}

/**
 * Calculate trade ratios for different port types
 * @param {Object} playerPorts - Ports accessible to player
 * @param {string} resourceType - Resource type to trade away
 * @returns {number} - Best trade ratio for this resource
 */
export function getBestTradeRatio(playerPorts = {}, resourceType) {
    // Default bank ratio
    let bestRatio = 4;
    
    // Check for generic 3:1 port
    if (playerPorts.generic) {
        bestRatio = Math.min(bestRatio, 3);
    }
    
    // Check for specific 2:1 port for this resource
    if (playerPorts[resourceType]) {
        bestRatio = Math.min(bestRatio, 2);
    }
    
    return bestRatio;
}

/**
 * Calculate how many trades are needed to get target resources
 * @param {Object} currentResources - Current player resources
 * @param {Object} targetResources - Desired resources
 * @param {Object} playerPorts - Available ports
 * @returns {Object|null} - Trade plan or null if impossible
 */
export function calculateTradeNeeds(currentResources, targetResources, playerPorts = {}) {
    const current = normalizeResources(currentResources);
    const target = normalizeResources(targetResources);
    const missing = getMissingResources(current, target);
    
    if (isEmpty(missing)) {
        return { trades: [], possible: true };
    }
    
    const trades = [];
    const workingResources = { ...current };
    
    for (const [neededResource, neededAmount] of Object.entries(missing)) {
        let stillNeed = neededAmount;
        
        while (stillNeed > 0) {
            // Find best resource to trade away
            let bestTrade = null;
            let bestEfficiency = 0;
            
            for (const [ownedResource, ownedAmount] of Object.entries(workingResources)) {
                if (ownedResource === neededResource || ownedAmount === 0) continue;
                
                const ratio = getBestTradeRatio(playerPorts, ownedResource);
                if (ownedAmount >= ratio) {
                    const efficiency = 1 / ratio; // Higher is better
                    if (efficiency > bestEfficiency) {
                        bestEfficiency = efficiency;
                        bestTrade = {
                            give: ownedResource,
                            giveAmount: ratio,
                            get: neededResource,
                            getAmount: 1
                        };
                    }
                }
            }
            
            if (!bestTrade) {
                // Cannot complete trades
                return { trades, possible: false };
            }
            
            trades.push(bestTrade);
            workingResources[bestTrade.give] -= bestTrade.giveAmount;
            workingResources[bestTrade.get] += bestTrade.getAmount;
            stillNeed -= bestTrade.getAmount;
        }
    }
    
    return { trades, possible: true };
}

/**
 * Validate a trade offer
 * @param {Object} playerResources - Player's current resources
 * @param {Object} offer - Trade offer { give: {}, get: {} }
 * @returns {Object} - Validation result with isValid and errors
 */
export function validateTradeOffer(playerResources, offer) {
    const errors = [];
    
    if (!offer || !offer.give || !offer.get) {
        errors.push('Invalid trade offer structure');
        return { isValid: false, errors };
    }
    
    // Check if player has resources to give
    if (!canAfford(playerResources, offer.give)) {
        const missing = getMissingResources(playerResources, offer.give);
        errors.push(`Insufficient resources to give: ${JSON.stringify(missing)}`);
    }
    
    // Validate resource objects
    if (!isValidResourceObject(offer.give)) {
        errors.push('Invalid give resources');
    }
    
    if (!isValidResourceObject(offer.get)) {
        errors.push('Invalid get resources');
    }
    
    // Check for non-empty trade
    if (isEmpty(offer.give) && isEmpty(offer.get)) {
        errors.push('Empty trade offer');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}