/**
 * Building placement validation utilities
 */

import { createLogger } from '../helpers/debugUtils.js';

const logger = createLogger('BuildingValidator');

/**
 * Validate settlement placement
 * @param {Object} gameState - Current game state
 * @param {string} playerId - Player attempting to build
 * @param {Object} vertex - Vertex coordinates {q, r, s}
 * @returns {Object} - Validation result with isValid and reason
 */
export function validateSettlementPlacement(gameState, playerId, vertex) {
    logger.debug('Validating settlement placement', { playerId, vertex });
    
    // Check if vertex exists in board
    if (!isValidVertex(gameState.board, vertex)) {
        return { isValid: false, reason: 'Invalid vertex coordinates' };
    }
    
    // Check if vertex is already occupied
    if (isVertexOccupied(gameState.board, vertex)) {
        return { isValid: false, reason: 'Vertex already occupied' };
    }
    
    // Check distance rule (no settlements on adjacent vertices)
    if (!checkDistanceRule(gameState.board, vertex)) {
        return { isValid: false, reason: 'Too close to existing settlement (distance rule)' };
    }
    
    // During initial placement, don't check road connectivity
    if (gameState.phase === 'initial_placement') {
        return { isValid: true, reason: 'Valid initial placement' };
    }
    
    // Check road connectivity for normal placement
    if (!hasRoadConnection(gameState.board, vertex, playerId)) {
        return { isValid: false, reason: 'No road connection to vertex' };
    }
    
    return { isValid: true, reason: 'Valid settlement placement' };
}

/**
 * Validate city upgrade
 * @param {Object} gameState - Current game state
 * @param {string} playerId - Player attempting to upgrade
 * @param {Object} vertex - Vertex coordinates {q, r, s}
 * @returns {Object} - Validation result with isValid and reason
 */
export function validateCityUpgrade(gameState, playerId, vertex) {
    logger.debug('Validating city upgrade', { playerId, vertex });
    
    // Check if vertex exists
    if (!isValidVertex(gameState.board, vertex)) {
        return { isValid: false, reason: 'Invalid vertex coordinates' };
    }
    
    // Check if there's a settlement at this vertex
    const building = getBuildingAtVertex(gameState.board, vertex);
    if (!building || building.type !== 'settlement') {
        return { isValid: false, reason: 'No settlement at this vertex' };
    }
    
    // Check if settlement belongs to player
    if (building.playerId !== playerId) {
        return { isValid: false, reason: 'Settlement belongs to another player' };
    }
    
    return { isValid: true, reason: 'Valid city upgrade' };
}

/**
 * Validate road placement
 * @param {Object} gameState - Current game state
 * @param {string} playerId - Player attempting to build
 * @param {Object} edge - Edge coordinates {vertex1, vertex2}
 * @returns {Object} - Validation result with isValid and reason
 */
export function validateRoadPlacement(gameState, playerId, edge) {
    logger.debug('Validating road placement', { playerId, edge });
    
    // Check if edge exists in board
    if (!isValidEdge(gameState.board, edge)) {
        return { isValid: false, reason: 'Invalid edge coordinates' };
    }
    
    // Check if edge is already occupied
    if (isEdgeOccupied(gameState.board, edge)) {
        return { isValid: false, reason: 'Edge already has a road' };
    }
    
    // During initial placement, allow free road placement adjacent to settlement
    if (gameState.phase === 'initial_placement') {
        if (hasAdjacentBuilding(gameState.board, edge, playerId)) {
            return { isValid: true, reason: 'Valid initial road placement' };
        }
        return { isValid: false, reason: 'Road must be adjacent to your settlement during initial placement' };
    }
    
    // Check for connectivity to existing roads or buildings
    if (!hasRoadConnectivity(gameState.board, edge, playerId)) {
        return { isValid: false, reason: 'Road must connect to existing road network' };
    }
    
    return { isValid: true, reason: 'Valid road placement' };
}

/**
 * Check if vertex coordinates are valid
 * @param {Object} board - Game board
 * @param {Object} vertex - Vertex coordinates
 * @returns {boolean} - Whether vertex is valid
 */
export function isValidVertex(board, vertex) {
    if (!vertex || typeof vertex.q !== 'number' || typeof vertex.r !== 'number') {
        return false;
    }
    
    // Check if vertex is within board boundaries
    // This would depend on your specific board layout
    const maxDistance = 2; // Assuming standard Catan board
    return Math.abs(vertex.q) <= maxDistance && 
           Math.abs(vertex.r) <= maxDistance && 
           Math.abs(vertex.q + vertex.r) <= maxDistance;
}

/**
 * Check if edge coordinates are valid
 * @param {Object} board - Game board
 * @param {Object} edge - Edge coordinates
 * @returns {boolean} - Whether edge is valid
 */
export function isValidEdge(board, edge) {
    if (!edge || !edge.vertex1 || !edge.vertex2) {
        return false;
    }
    
    // Check if both vertices are valid
    if (!isValidVertex(board, edge.vertex1) || !isValidVertex(board, edge.vertex2)) {
        return false;
    }
    
    // Check if vertices are adjacent (distance of 1)
    const distance = getVertexDistance(edge.vertex1, edge.vertex2);
    return distance === 1;
}

/**
 * Calculate distance between two vertices
 * @param {Object} vertex1 - First vertex
 * @param {Object} vertex2 - Second vertex
 * @returns {number} - Distance between vertices
 */
export function getVertexDistance(vertex1, vertex2) {
    return Math.max(
        Math.abs(vertex1.q - vertex2.q),
        Math.abs(vertex1.r - vertex2.r),
        Math.abs((vertex1.q + vertex1.r) - (vertex2.q + vertex2.r))
    );
}

/**
 * Check if vertex is occupied by any building
 * @param {Object} board - Game board
 * @param {Object} vertex - Vertex coordinates
 * @returns {boolean} - Whether vertex is occupied
 */
export function isVertexOccupied(board, vertex) {
    return getBuildingAtVertex(board, vertex) !== null;
}

/**
 * Get building at vertex
 * @param {Object} board - Game board
 * @param {Object} vertex - Vertex coordinates
 * @returns {Object|null} - Building object or null
 */
export function getBuildingAtVertex(board, vertex) {
    if (!board.buildings) return null;
    
    const vertexKey = getVertexKey(vertex);
    return board.buildings[vertexKey] || null;
}

/**
 * Check if edge is occupied by a road
 * @param {Object} board - Game board
 * @param {Object} edge - Edge coordinates
 * @returns {boolean} - Whether edge is occupied
 */
export function isEdgeOccupied(board, edge) {
    return getRoadAtEdge(board, edge) !== null;
}

/**
 * Get road at edge
 * @param {Object} board - Game board
 * @param {Object} edge - Edge coordinates
 * @returns {Object|null} - Road object or null
 */
export function getRoadAtEdge(board, edge) {
    if (!board.roads) return null;
    
    const edgeKey = getEdgeKey(edge);
    return board.roads[edgeKey] || null;
}

/**
 * Check distance rule for settlement placement
 * @param {Object} board - Game board
 * @param {Object} vertex - Vertex coordinates to check
 * @returns {boolean} - Whether distance rule is satisfied
 */
export function checkDistanceRule(board, vertex) {
    const adjacentVertices = getAdjacentVertices(vertex);
    
    for (const adjacentVertex of adjacentVertices) {
        if (isVertexOccupied(board, adjacentVertex)) {
            return false;
        }
    }
    
    return true;
}

/**
 * Get adjacent vertices for a given vertex
 * @param {Object} vertex - Vertex coordinates
 * @returns {Array} - Array of adjacent vertex coordinates
 */
export function getAdjacentVertices(vertex) {
    // In a hex grid, each vertex has 3 adjacent vertices
    // This would depend on your specific coordinate system
    const { q, r } = vertex;
    return [
        { q: q + 1, r: r },
        { q: q - 1, r: r },
        { q: q, r: r + 1 },
        { q: q, r: r - 1 },
        { q: q + 1, r: r - 1 },
        { q: q - 1, r: r + 1 }
    ].filter(v => isValidVertex({ /* mock board */ }, v));
}

/**
 * Check if vertex has road connection for the player
 * @param {Object} board - Game board
 * @param {Object} vertex - Vertex coordinates
 * @param {string} playerId - Player ID
 * @returns {boolean} - Whether vertex has road connection
 */
export function hasRoadConnection(board, vertex, playerId) {
    // Check if player has a building at this vertex
    const building = getBuildingAtVertex(board, vertex);
    if (building && building.playerId === playerId) {
        return true;
    }
    
    // Check adjacent edges for player's roads
    const adjacentEdges = getAdjacentEdges(vertex);
    
    for (const edge of adjacentEdges) {
        const road = getRoadAtEdge(board, edge);
        if (road && road.playerId === playerId) {
            return true;
        }
    }
    
    return false;
}

/**
 * Get adjacent edges for a vertex
 * @param {Object} vertex - Vertex coordinates
 * @returns {Array} - Array of adjacent edge objects
 */
export function getAdjacentEdges(vertex) {
    const adjacentVertices = getAdjacentVertices(vertex);
    return adjacentVertices.map(adjacentVertex => ({
        vertex1: vertex,
        vertex2: adjacentVertex
    }));
}

/**
 * Check if edge has adjacent building for player
 * @param {Object} board - Game board
 * @param {Object} edge - Edge coordinates
 * @param {string} playerId - Player ID
 * @returns {boolean} - Whether edge has adjacent building
 */
export function hasAdjacentBuilding(board, edge, playerId) {
    const building1 = getBuildingAtVertex(board, edge.vertex1);
    const building2 = getBuildingAtVertex(board, edge.vertex2);
    
    return (building1 && building1.playerId === playerId) || 
           (building2 && building2.playerId === playerId);
}

/**
 * Check road connectivity for placement
 * @param {Object} board - Game board
 * @param {Object} edge - Edge coordinates
 * @param {string} playerId - Player ID
 * @returns {boolean} - Whether road can connect to existing network
 */
export function hasRoadConnectivity(board, edge, playerId) {
    // Check if either endpoint has player's building
    if (hasAdjacentBuilding(board, edge, playerId)) {
        return true;
    }
    
    // Check if either endpoint connects to player's roads
    return hasRoadConnection(board, edge.vertex1, playerId) || 
           hasRoadConnection(board, edge.vertex2, playerId);
}

/**
 * Generate unique key for vertex
 * @param {Object} vertex - Vertex coordinates
 * @returns {string} - Unique vertex key
 */
export function getVertexKey(vertex) {
    return `${vertex.q},${vertex.r}`;
}

/**
 * Generate unique key for edge
 * @param {Object} edge - Edge coordinates
 * @returns {string} - Unique edge key
 */
export function getEdgeKey(edge) {
    // Normalize edge to ensure consistent key regardless of vertex order
    const v1 = edge.vertex1;
    const v2 = edge.vertex2;
    
    if (v1.q < v2.q || (v1.q === v2.q && v1.r < v2.r)) {
        return `${getVertexKey(v1)}-${getVertexKey(v2)}`;
    } else {
        return `${getVertexKey(v2)}-${getVertexKey(v1)}`;
    }
}

/**
 * Get all possible building locations for a player
 * @param {Object} gameState - Current game state
 * @param {string} playerId - Player ID
 * @returns {Array} - Array of valid vertex coordinates for settlement placement
 */
export function getValidSettlementLocations(gameState, playerId) {
    const validLocations = [];
    
    // Get all vertices on the board (this would depend on your board structure)
    const allVertices = getAllBoardVertices(gameState.board);
    
    for (const vertex of allVertices) {
        const validation = validateSettlementPlacement(gameState, playerId, vertex);
        if (validation.isValid) {
            validLocations.push(vertex);
        }
    }
    
    return validLocations;
}

/**
 * Get all possible road locations for a player
 * @param {Object} gameState - Current game state
 * @param {string} playerId - Player ID
 * @returns {Array} - Array of valid edge coordinates for road placement
 */
export function getValidRoadLocations(gameState, playerId) {
    const validLocations = [];
    
    // Get all edges on the board (this would depend on your board structure)
    const allEdges = getAllBoardEdges(gameState.board);
    
    for (const edge of allEdges) {
        const validation = validateRoadPlacement(gameState, playerId, edge);
        if (validation.isValid) {
            validLocations.push(edge);
        }
    }
    
    return validLocations;
}

/**
 * Get all vertices on the board (placeholder implementation)
 * @param {Object} board - Game board
 * @returns {Array} - Array of all vertex coordinates
 */
function getAllBoardVertices(board) {
    // This would be implemented based on your actual board structure
    const vertices = [];
    for (let q = -2; q <= 2; q++) {
        for (let r = -2; r <= 2; r++) {
            if (Math.abs(q + r) <= 2) {
                vertices.push({ q, r });
            }
        }
    }
    return vertices;
}

/**
 * Get all edges on the board (placeholder implementation)
 * @param {Object} board - Game board
 * @returns {Array} - Array of all edge coordinates
 */
function getAllBoardEdges(board) {
    // This would be implemented based on your actual board structure
    const edges = [];
    const vertices = getAllBoardVertices(board);
    
    for (const vertex of vertices) {
        const adjacent = getAdjacentVertices(vertex);
        for (const adjacentVertex of adjacent) {
            if (isValidVertex(board, adjacentVertex)) {
                edges.push({ vertex1: vertex, vertex2: adjacentVertex });
            }
        }
    }
    
    // Remove duplicates
    const uniqueEdges = [];
    const seenKeys = new Set();
    
    for (const edge of edges) {
        const key = getEdgeKey(edge);
        if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueEdges.push(edge);
        }
    }
    
    return uniqueEdges;
}