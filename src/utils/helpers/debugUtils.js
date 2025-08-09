/**
 * Debug and logging utilities
 */

// Log levels
export const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
};

// Global debug configuration
let DEBUG_CONFIG = {
    level: LOG_LEVELS.INFO,
    enabled: true,
    showTimestamp: true,
    showLevel: true,
    modules: new Set(), // If empty, all modules are enabled
    colors: {
        ERROR: '#ff4444',
        WARN: '#ffaa00',
        INFO: '#4488ff',
        DEBUG: '#888888',
        TRACE: '#cccccc'
    }
};

/**
 * Configure debug settings
 * @param {Object} config - Debug configuration
 */
export function configureDebug(config) {
    DEBUG_CONFIG = { ...DEBUG_CONFIG, ...config };
}

/**
 * Enable/disable debug logging
 * @param {boolean} enabled - Whether to enable debug logging
 */
export function setDebugEnabled(enabled) {
    DEBUG_CONFIG.enabled = enabled;
}

/**
 * Set debug level
 * @param {number} level - Log level
 */
export function setDebugLevel(level) {
    DEBUG_CONFIG.level = level;
}

/**
 * Enable debug for specific modules
 * @param {Array<string>} modules - Module names to enable
 */
export function enableModules(modules) {
    DEBUG_CONFIG.modules = new Set(modules);
}

/**
 * Logger class for creating module-specific loggers
 */
export class Logger {
    constructor(module) {
        this.module = module;
    }

    /**
     * Check if logging is enabled for this level and module
     */
    _shouldLog(level) {
        if (!DEBUG_CONFIG.enabled) return false;
        if (level > DEBUG_CONFIG.level) return false;
        if (DEBUG_CONFIG.modules.size > 0 && !DEBUG_CONFIG.modules.has(this.module)) {
            return false;
        }
        return true;
    }

    /**
     * Format log message
     */
    _formatMessage(level, message, data) {
        const parts = [];
        
        if (DEBUG_CONFIG.showTimestamp) {
            const timestamp = new Date().toISOString().substr(11, 12);
            parts.push(`[${timestamp}]`);
        }
        
        if (DEBUG_CONFIG.showLevel) {
            const levelName = Object.keys(LOG_LEVELS)[level];
            parts.push(`[${levelName}]`);
        }
        
        parts.push(`[${this.module}]`);
        parts.push(message);
        
        return parts.join(' ');
    }

    /**
     * Log message at specified level
     */
    _log(level, message, data = null, color = null) {
        if (!this._shouldLog(level)) return;
        
        const formattedMessage = this._formatMessage(level, message, data);
        const levelName = Object.keys(LOG_LEVELS)[level];
        const logColor = color || DEBUG_CONFIG.colors[levelName];
        
        const consoleMethod = level <= LOG_LEVELS.WARN ? 'error' : 
                             level === LOG_LEVELS.WARN ? 'warn' : 'log';
        
        if (logColor && typeof window !== 'undefined') {
            console[consoleMethod](`%c${formattedMessage}`, `color: ${logColor}`, data || '');
        } else {
            if (data) {
                console[consoleMethod](formattedMessage, data);
            } else {
                console[consoleMethod](formattedMessage);
            }
        }
    }

    /**
     * Log error message
     */
    error(message, data = null) {
        this._log(LOG_LEVELS.ERROR, message, data);
    }

    /**
     * Log warning message
     */
    warn(message, data = null) {
        this._log(LOG_LEVELS.WARN, message, data);
    }

    /**
     * Log info message
     */
    info(message, data = null) {
        this._log(LOG_LEVELS.INFO, message, data);
    }

    /**
     * Log debug message
     */
    debug(message, data = null) {
        this._log(LOG_LEVELS.DEBUG, message, data);
    }

    /**
     * Log trace message
     */
    trace(message, data = null) {
        this._log(LOG_LEVELS.TRACE, message, data);
    }

    /**
     * Log function entry
     */
    enter(functionName, args = null) {
        this.trace(`→ ${functionName}()`, args);
    }

    /**
     * Log function exit
     */
    exit(functionName, result = null) {
        this.trace(`← ${functionName}()`, result);
    }

    /**
     * Time a function execution
     */
    time(label) {
        const startTime = performance.now();
        return {
            end: () => {
                const duration = performance.now() - startTime;
                this.debug(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
                return duration;
            }
        };
    }

    /**
     * Log object state
     */
    state(label, object) {
        this.debug(`📊 ${label}:`, object);
    }

    /**
     * Log assertion
     */
    assert(condition, message) {
        if (!condition) {
            this.error(`❌ Assertion failed: ${message}`);
            if (DEBUG_CONFIG.level >= LOG_LEVELS.DEBUG) {
                console.trace();
            }
        }
    }

    /**
     * Create a group for related log messages
     */
    group(label) {
        if (this._shouldLog(LOG_LEVELS.DEBUG)) {
            console.group(this._formatMessage(LOG_LEVELS.DEBUG, label));
        }
        return {
            end: () => {
                if (this._shouldLog(LOG_LEVELS.DEBUG)) {
                    console.groupEnd();
                }
            }
        };
    }
}

/**
 * Create logger for a module
 * @param {string} module - Module name
 * @returns {Logger} - Logger instance
 */
export function createLogger(module) {
    return new Logger(module);
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
    constructor() {
        this.marks = new Map();
        this.measures = new Map();
    }

    /**
     * Start timing an operation
     */
    mark(name) {
        this.marks.set(name, performance.now());
    }

    /**
     * End timing and get duration
     */
    measure(name, startMark = null) {
        const endTime = performance.now();
        const startTime = startMark ? this.marks.get(startMark) : this.marks.get(name);
        
        if (startTime === undefined) {
            console.warn(`Performance mark "${startMark || name}" not found`);
            return 0;
        }

        const duration = endTime - startTime;
        this.measures.set(name, duration);
        
        return duration;
    }

    /**
     * Get all measurements
     */
    getReport() {
        const report = {};
        for (const [name, duration] of this.measures) {
            report[name] = `${duration.toFixed(2)}ms`;
        }
        return report;
    }

    /**
     * Clear all marks and measures
     */
    clear() {
        this.marks.clear();
        this.measures.clear();
    }
}

/**
 * Global performance monitor instance
 */
export const perf = new PerformanceMonitor();

/**
 * Function decorator for automatic timing
 */
export function timed(logger, label = null) {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const timerLabel = label || `${target.constructor.name}.${propertyKey}`;
        
        descriptor.value = function(...args) {
            const timer = logger.time(timerLabel);
            try {
                const result = originalMethod.apply(this, args);
                if (result instanceof Promise) {
                    return result.finally(() => timer.end());
                } else {
                    timer.end();
                    return result;
                }
            } catch (error) {
                timer.end();
                throw error;
            }
        };
        
        return descriptor;
    };
}

/**
 * Debug overlay for visualizing game state
 */
export class DebugOverlay {
    constructor(container) {
        this.container = container;
        this.element = null;
        this.isVisible = false;
        this.sections = new Map();
    }

    /**
     * Create debug overlay element
     */
    create() {
        if (this.element) return;

        this.element = document.createElement('div');
        this.element.className = 'debug-overlay';
        this.element.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
            min-width: 200px;
            max-height: 80vh;
            overflow-y: auto;
            display: none;
        `;

        this.container.appendChild(this.element);
    }

    /**
     * Show debug overlay
     */
    show() {
        this.create();
        this.isVisible = true;
        this.element.style.display = 'block';
    }

    /**
     * Hide debug overlay
     */
    hide() {
        this.isVisible = false;
        if (this.element) {
            this.element.style.display = 'none';
        }
    }

    /**
     * Toggle debug overlay visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Update a section of the debug overlay
     */
    updateSection(name, content) {
        this.create();
        
        let section = this.sections.get(name);
        if (!section) {
            section = document.createElement('div');
            section.className = 'debug-section';
            section.style.marginBottom = '10px';
            
            const header = document.createElement('div');
            header.style.cssText = 'font-weight: bold; color: #ffff00; margin-bottom: 5px;';
            header.textContent = name;
            section.appendChild(header);
            
            const body = document.createElement('div');
            body.className = 'debug-section-body';
            section.appendChild(body);
            
            this.element.appendChild(section);
            this.sections.set(name, section);
        }

        const body = section.querySelector('.debug-section-body');
        if (typeof content === 'object') {
            body.innerHTML = Object.entries(content)
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                .join('<br>');
        } else {
            body.innerHTML = content;
        }
    }

    /**
     * Remove a section
     */
    removeSection(name) {
        const section = this.sections.get(name);
        if (section) {
            section.remove();
            this.sections.delete(name);
        }
    }

    /**
     * Clear all sections
     */
    clear() {
        if (this.element) {
            this.element.innerHTML = '';
        }
        this.sections.clear();
    }

    /**
     * Destroy debug overlay
     */
    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
        this.sections.clear();
        this.isVisible = false;
    }
}

/**
 * Global debug overlay instance
 */
export let debugOverlay = null;

/**
 * Initialize debug overlay
 */
export function initDebugOverlay(container = document.body) {
    debugOverlay = new DebugOverlay(container);
    
    // Add keyboard shortcut to toggle overlay
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || (e.ctrlKey && e.key === '`')) {
            e.preventDefault();
            debugOverlay.toggle();
        }
    });
    
    return debugOverlay;
}