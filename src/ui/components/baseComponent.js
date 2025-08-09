/**
 * Base component class that provides common functionality for all UI components
 */
export class BaseComponent {
    constructor(container = null) {
        this.container = container;
        this.element = null;
        this.isVisible = true;
        this.isEnabled = true;
        this.eventListeners = new Map();
    }

    /**
     * Create the DOM element for this component
     * @returns {HTMLElement}
     */
    createElement() {
        throw new Error('createElement must be implemented by subclasses');
    }

    /**
     * Render the component to its container
     */
    render() {
        if (!this.element) {
            this.element = this.createElement();
        }
        
        if (this.container && !this.container.contains(this.element)) {
            this.container.appendChild(this.element);
        }
        
        this.updateVisibility();
        this.updateEnabled();
        
        return this.element;
    }

    /**
     * Update component data and re-render if necessary
     * @param {Object} data - New data for the component
     */
    update(data) {
        // Override in subclasses
    }

    /**
     * Show the component
     */
    show() {
        this.isVisible = true;
        this.updateVisibility();
    }

    /**
     * Hide the component
     */
    hide() {
        this.isVisible = false;
        this.updateVisibility();
    }

    /**
     * Enable the component
     */
    enable() {
        this.isEnabled = true;
        this.updateEnabled();
    }

    /**
     * Disable the component
     */
    disable() {
        this.isEnabled = false;
        this.updateEnabled();
    }

    /**
     * Add event listener with automatic cleanup tracking
     */
    addEventListener(event, handler, element = null) {
        const target = element || this.element;
        if (!target) return;

        const key = `${event}-${target.id || 'element'}`;
        
        // Remove existing listener if it exists
        this.removeEventListener(event, element);
        
        target.addEventListener(event, handler);
        this.eventListeners.set(key, { target, event, handler });
    }

    /**
     * Remove event listener
     */
    removeEventListener(event, element = null) {
        const target = element || this.element;
        const key = `${event}-${target?.id || 'element'}`;
        
        const listener = this.eventListeners.get(key);
        if (listener) {
            listener.target.removeEventListener(listener.event, listener.handler);
            this.eventListeners.delete(key);
        }
    }

    /**
     * Clean up the component
     */
    destroy() {
        // Remove all event listeners
        for (const [key, listener] of this.eventListeners) {
            listener.target.removeEventListener(listener.event, listener.handler);
        }
        this.eventListeners.clear();

        // Remove from DOM
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
    }

    /**
     * Update visibility based on isVisible flag
     */
    updateVisibility() {
        if (this.element) {
            this.element.style.display = this.isVisible ? '' : 'none';
        }
    }

    /**
     * Update enabled state
     */
    updateEnabled() {
        if (this.element) {
            if (this.element.disabled !== undefined) {
                this.element.disabled = !this.isEnabled;
            }
            this.element.classList.toggle('disabled', !this.isEnabled);
        }
    }

    /**
     * Add CSS class
     */
    addClass(className) {
        if (this.element) {
            this.element.classList.add(className);
        }
    }

    /**
     * Remove CSS class
     */
    removeClass(className) {
        if (this.element) {
            this.element.classList.remove(className);
        }
    }

    /**
     * Toggle CSS class
     */
    toggleClass(className, force = undefined) {
        if (this.element) {
            this.element.classList.toggle(className, force);
        }
    }
}