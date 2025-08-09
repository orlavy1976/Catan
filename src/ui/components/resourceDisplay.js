import { BaseComponent } from './baseComponent.js';

/**
 * Reusable resource display component for showing resource counts with icons
 */
export class ResourceDisplay extends BaseComponent {
    constructor(container, options = {}) {
        super(container);
        
        this.resources = options.resources || {};
        this.showZeros = options.showZeros !== false; // default true
        this.layout = options.layout || 'horizontal'; // horizontal, vertical, grid
        this.size = options.size || 'medium'; // small, medium, large
        this.interactive = options.interactive || false;
        this.onResourceClick = options.onResourceClick || (() => {});
        this.resourceOrder = options.resourceOrder || ['wood', 'brick', 'sheep', 'wheat', 'ore'];
        this.className = options.className || '';
        
        // Resource icons mapping
        this.resourceIcons = {
            wood: '🌲',
            brick: '🧱',
            sheep: '🐑',
            wheat: '🌾',
            ore: '⛰️'
        };
    }

    createElement() {
        const container = document.createElement('div');
        container.classList.add('catan-resource-display');
        container.classList.add(`catan-resource-display--${this.layout}`);
        container.classList.add(`catan-resource-display--${this.size}`);
        
        if (this.interactive) {
            container.classList.add('catan-resource-display--interactive');
        }
        
        if (this.className) {
            container.classList.add(this.className);
        }

        this.updateResourceElements(container);
        return container;
    }

    /**
     * Update resource display elements
     */
    updateResourceElements(container = this.element) {
        if (!container) return;
        
        container.innerHTML = '';
        
        this.resourceOrder.forEach(resourceType => {
            const count = this.resources[resourceType] || 0;
            
            if (!this.showZeros && count === 0) {
                return;
            }
            
            const resourceElement = this.createResourceElement(resourceType, count);
            container.appendChild(resourceElement);
        });
    }

    /**
     * Create individual resource element
     */
    createResourceElement(resourceType, count) {
        const element = document.createElement('div');
        element.classList.add('catan-resource-item');
        element.classList.add(`catan-resource-item--${resourceType}`);
        
        if (count === 0) {
            element.classList.add('catan-resource-item--empty');
        }

        // Icon
        const icon = document.createElement('span');
        icon.classList.add('catan-resource-item__icon');
        icon.textContent = this.resourceIcons[resourceType] || '?';
        element.appendChild(icon);

        // Count
        const countElement = document.createElement('span');
        countElement.classList.add('catan-resource-item__count');
        countElement.textContent = count.toString();
        element.appendChild(countElement);

        // Label (optional)
        if (this.size === 'large') {
            const label = document.createElement('span');
            label.classList.add('catan-resource-item__label');
            label.textContent = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
            element.appendChild(label);
        }

        // Interactive behavior
        if (this.interactive) {
            element.classList.add('clickable');
            this.addEventListener('click', () => {
                this.onResourceClick(resourceType, count);
            }, element);
        }

        return element;
    }

    /**
     * Update resources data
     */
    update(resources) {
        this.resources = { ...resources };
        this.updateResourceElements();
    }

    /**
     * Set count for a specific resource
     */
    setResourceCount(resourceType, count) {
        this.resources[resourceType] = count;
        this.updateResourceElements();
    }

    /**
     * Get count for a specific resource
     */
    getResourceCount(resourceType) {
        return this.resources[resourceType] || 0;
    }

    /**
     * Get total resource count
     */
    getTotalCount() {
        return Object.values(this.resources).reduce((sum, count) => sum + count, 0);
    }

    /**
     * Check if has enough of a specific resource
     */
    hasEnough(resourceType, requiredCount) {
        return this.getResourceCount(resourceType) >= requiredCount;
    }

    /**
     * Check if has enough resources from a requirements object
     */
    hasEnoughResources(requirements) {
        return Object.entries(requirements).every(([resourceType, requiredCount]) => 
            this.hasEnough(resourceType, requiredCount)
        );
    }

    /**
     * Static factory methods for common configurations
     */
    static createCompactDisplay(container, resources) {
        return new ResourceDisplay(container, {
            resources,
            layout: 'horizontal',
            size: 'small',
            showZeros: false
        });
    }

    static createFullDisplay(container, resources) {
        return new ResourceDisplay(container, {
            resources,
            layout: 'grid',
            size: 'large',
            showZeros: true
        });
    }

    static createInteractiveDisplay(container, resources, onResourceClick) {
        return new ResourceDisplay(container, {
            resources,
            layout: 'grid',
            size: 'medium',
            interactive: true,
            onResourceClick
        });
    }

    static createVerticalDisplay(container, resources) {
        return new ResourceDisplay(container, {
            resources,
            layout: 'vertical',
            size: 'medium',
            showZeros: true
        });
    }
}