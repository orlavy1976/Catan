/**
 * Hexagonal coordinate system utilities
 * Uses axial coordinates (q, r) with pointy-top orientation
 */

import { createLogger } from '../helpers/debugUtils.js';

const logger = createLogger('HexGeometry');

/**
 * Axial coordinate directions for pointy-top hexagons
 */
export const HEX_DIRECTIONS = [
    { q: 1, r: 0 },   // East
    { q: 1, r: -1 },  // Northeast  
    { q: 0, r: -1 },  // Northwest
    { q: -1, r: 0 },  // West
    { q: -1, r: 1 },  // Southwest
    { q: 0, r: 1 }    // Southeast
];

/**
 * Convert axial coordinates to cube coordinates
 * @param {Object} hex - Axial coordinates {q, r}
 * @returns {Object} - Cube coordinates {x, y, z}
 */
export function axialToCube(hex) {
    const x = hex.q;
    const z = hex.r;
    const y = -x - z;
    return { x, y, z };
}

/**
 * Convert cube coordinates to axial coordinates
 * @param {Object} cube - Cube coordinates {x, y, z}
 * @returns {Object} - Axial coordinates {q, r}
 */
export function cubeToAxial(cube) {
    return { q: cube.x, r: cube.z };
}

/**
 * Add two hex coordinates
 * @param {Object} a - First hex coordinate
 * @param {Object} b - Second hex coordinate
 * @returns {Object} - Sum of coordinates
 */
export function hexAdd(a, b) {
    return { q: a.q + b.q, r: a.r + b.r };
}

/**
 * Subtract two hex coordinates
 * @param {Object} a - First hex coordinate
 * @param {Object} b - Second hex coordinate
 * @returns {Object} - Difference of coordinates
 */
export function hexSubtract(a, b) {
    return { q: a.q - b.q, r: a.r - b.r };
}

/**
 * Multiply hex coordinate by scalar
 * @param {Object} hex - Hex coordinate
 * @param {number} k - Scalar multiplier
 * @returns {Object} - Scaled coordinate
 */
export function hexScale(hex, k) {
    return { q: hex.q * k, r: hex.r * k };
}

/**
 * Get hex coordinate in specific direction
 * @param {number} direction - Direction index (0-5)
 * @returns {Object} - Direction vector
 */
export function hexDirection(direction) {
    return HEX_DIRECTIONS[direction % 6];
}

/**
 * Get neighbor hex in specific direction
 * @param {Object} hex - Starting hex coordinate
 * @param {number} direction - Direction index (0-5)
 * @returns {Object} - Neighbor hex coordinate
 */
export function hexNeighbor(hex, direction) {
    return hexAdd(hex, hexDirection(direction));
}

/**
 * Get all neighbors of a hex
 * @param {Object} hex - Center hex coordinate
 * @returns {Array} - Array of neighbor coordinates
 */
export function hexNeighbors(hex) {
    return HEX_DIRECTIONS.map(dir => hexAdd(hex, dir));
}

/**
 * Calculate distance between two hexes
 * @param {Object} a - First hex coordinate
 * @param {Object} b - Second hex coordinate
 * @returns {number} - Distance between hexes
 */
export function hexDistance(a, b) {
    const cubeA = axialToCube(a);
    const cubeB = axialToCube(b);
    
    return Math.max(
        Math.abs(cubeA.x - cubeB.x),
        Math.abs(cubeA.y - cubeB.y),
        Math.abs(cubeA.z - cubeB.z)
    );
}

/**
 * Get line between two hexes
 * @param {Object} a - Start hex coordinate
 * @param {Object} b - End hex coordinate
 * @returns {Array} - Array of hex coordinates forming the line
 */
export function hexLine(a, b) {
    const distance = hexDistance(a, b);
    if (distance === 0) return [a];
    
    const results = [];
    for (let i = 0; i <= distance; i++) {
        const t = i / distance;
        const lerped = hexLerp(a, b, t);
        results.push(hexRound(lerped));
    }
    
    return results;
}

/**
 * Linear interpolation between two hexes
 * @param {Object} a - Start hex coordinate
 * @param {Object} b - End hex coordinate
 * @param {number} t - Interpolation factor (0-1)
 * @returns {Object} - Interpolated coordinate
 */
export function hexLerp(a, b, t) {
    return {
        q: a.q * (1 - t) + b.q * t,
        r: a.r * (1 - t) + b.r * t
    };
}

/**
 * Round fractional hex coordinates to nearest hex
 * @param {Object} hex - Fractional hex coordinate
 * @returns {Object} - Rounded hex coordinate
 */
export function hexRound(hex) {
    const cube = axialToCube(hex);
    let x = Math.round(cube.x);
    let y = Math.round(cube.y);
    let z = Math.round(cube.z);
    
    const xDiff = Math.abs(x - cube.x);
    const yDiff = Math.abs(y - cube.y);
    const zDiff = Math.abs(z - cube.z);
    
    if (xDiff > yDiff && xDiff > zDiff) {
        x = -y - z;
    } else if (yDiff > zDiff) {
        y = -x - z;
    } else {
        z = -x - y;
    }
    
    return cubeToAxial({ x, y, z });
}

/**
 * Get all hexes within range of center
 * @param {Object} center - Center hex coordinate
 * @param {number} range - Maximum distance from center
 * @returns {Array} - Array of hex coordinates within range
 */
export function hexRange(center, range) {
    const results = [];
    
    for (let q = -range; q <= range; q++) {
        const r1 = Math.max(-range, -q - range);
        const r2 = Math.min(range, -q + range);
        
        for (let r = r1; r <= r2; r++) {
            const hex = hexAdd(center, { q, r });
            results.push(hex);
        }
    }
    
    return results;
}

/**
 * Get hexes in a ring around center
 * @param {Object} center - Center hex coordinate
 * @param {number} radius - Ring radius
 * @returns {Array} - Array of hex coordinates in ring
 */
export function hexRing(center, radius) {
    if (radius === 0) return [center];
    
    const results = [];
    let hex = hexAdd(center, hexScale(hexDirection(4), radius)); // Start at southwest
    
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < radius; j++) {
            results.push({ ...hex });
            hex = hexNeighbor(hex, i);
        }
    }
    
    return results;
}

/**
 * Get hexes in spiral from center
 * @param {Object} center - Center hex coordinate
 * @param {number} radius - Maximum spiral radius
 * @returns {Array} - Array of hex coordinates in spiral order
 */
export function hexSpiral(center, radius) {
    const results = [center];
    
    for (let r = 1; r <= radius; r++) {
        const ring = hexRing(center, r);
        results.push(...ring);
    }
    
    return results;
}

/**
 * Check if two hex coordinates are equal
 * @param {Object} a - First hex coordinate
 * @param {Object} b - Second hex coordinate
 * @returns {boolean} - Whether coordinates are equal
 */
export function hexEqual(a, b) {
    return a.q === b.q && a.r === b.r;
}

/**
 * Create hex coordinate key for use in maps/sets
 * @param {Object} hex - Hex coordinate
 * @returns {string} - String key
 */
export function hexKey(hex) {
    return `${hex.q},${hex.r}`;
}

/**
 * Parse hex coordinate from key string
 * @param {string} key - Hex key string
 * @returns {Object} - Hex coordinate
 */
export function hexFromKey(key) {
    const [q, r] = key.split(',').map(Number);
    return { q, r };
}

/**
 * Rotate hex coordinate around origin
 * @param {Object} hex - Hex coordinate to rotate
 * @param {number} steps - Number of 60-degree steps (positive = clockwise)
 * @returns {Object} - Rotated hex coordinate
 */
export function hexRotate(hex, steps) {
    const cube = axialToCube(hex);
    const normalizedSteps = ((steps % 6) + 6) % 6; // Normalize to 0-5
    
    let { x, y, z } = cube;
    
    for (let i = 0; i < normalizedSteps; i++) {
        [x, y, z] = [-z, -x, -y]; // Rotate 60 degrees clockwise
    }
    
    return cubeToAxial({ x, y, z });
}

/**
 * Reflect hex coordinate across Q axis
 * @param {Object} hex - Hex coordinate to reflect
 * @returns {Object} - Reflected hex coordinate
 */
export function hexReflectQ(hex) {
    return { q: hex.q, r: -hex.q - hex.r };
}

/**
 * Reflect hex coordinate across R axis
 * @param {Object} hex - Hex coordinate to reflect
 * @returns {Object} - Reflected hex coordinate
 */
export function hexReflectR(hex) {
    return { q: -hex.q - hex.r, r: hex.r };
}

/**
 * Reflect hex coordinate across S axis
 * @param {Object} hex - Hex coordinate to reflect
 * @returns {Object} - Reflected hex coordinate
 */
export function hexReflectS(hex) {
    return { q: -hex.r, r: -hex.q };
}

/**
 * Get vertices of a hex in screen coordinates
 * @param {Object} hex - Hex coordinate
 * @param {number} size - Hex size (radius)
 * @param {Object} origin - Screen origin {x, y}
 * @returns {Array} - Array of vertex points {x, y}
 */
export function hexVertices(hex, size, origin = { x: 0, y: 0 }) {
    const center = hexToPixel(hex, size, origin);
    const vertices = [];
    
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i; // 60 degrees each
        const x = center.x + size * Math.cos(angle);
        const y = center.y + size * Math.sin(angle);
        vertices.push({ x, y });
    }
    
    return vertices;
}

/**
 * Convert hex coordinate to pixel coordinate (pointy-top)
 * @param {Object} hex - Hex coordinate
 * @param {number} size - Hex size (radius)
 * @param {Object} origin - Screen origin {x, y}
 * @returns {Object} - Pixel coordinate {x, y}
 */
export function hexToPixel(hex, size, origin = { x: 0, y: 0 }) {
    const x = size * (3/2 * hex.q) + origin.x;
    const y = size * (Math.sqrt(3)/2 * hex.q + Math.sqrt(3) * hex.r) + origin.y;
    return { x, y };
}

/**
 * Convert pixel coordinate to hex coordinate (pointy-top)
 * @param {Object} pixel - Pixel coordinate {x, y}
 * @param {number} size - Hex size (radius)
 * @param {Object} origin - Screen origin {x, y}
 * @returns {Object} - Hex coordinate
 */
export function pixelToHex(pixel, size, origin = { x: 0, y: 0 }) {
    const x = pixel.x - origin.x;
    const y = pixel.y - origin.y;
    
    const q = (2/3 * x) / size;
    const r = (-1/3 * x + Math.sqrt(3)/3 * y) / size;
    
    return hexRound({ q, r });
}

/**
 * Get hex bounds in pixel coordinates
 * @param {Object} hex - Hex coordinate
 * @param {number} size - Hex size (radius)
 * @param {Object} origin - Screen origin {x, y}
 * @returns {Object} - Bounds {minX, minY, maxX, maxY}
 */
export function hexBounds(hex, size, origin = { x: 0, y: 0 }) {
    const center = hexToPixel(hex, size, origin);
    const halfWidth = size * 3/2;
    const halfHeight = size * Math.sqrt(3)/2;
    
    return {
        minX: center.x - halfWidth,
        minY: center.y - halfHeight,
        maxX: center.x + halfWidth,
        maxY: center.y + halfHeight
    };
}

/**
 * Check if point is inside hex
 * @param {Object} pixel - Pixel coordinate {x, y}
 * @param {Object} hex - Hex coordinate
 * @param {number} size - Hex size (radius)
 * @param {Object} origin - Screen origin {x, y}
 * @returns {boolean} - Whether point is inside hex
 */
export function pointInHex(pixel, hex, size, origin = { x: 0, y: 0 }) {
    const hexAtPixel = pixelToHex(pixel, size, origin);
    return hexEqual(hexAtPixel, hex);
}