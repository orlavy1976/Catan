import { BaseComponent } from './baseComponent.js';

/**
 * Reusable panel component for organizing UI elements
 */
export class Panel extends BaseComponent {
    constructor(container, options = {}) {
        super(container);
        
        this.title = options.title || null;
        this.className = options.className || '';
        this.variant = options.variant || 'default'; // default, bordered, floating
        this.direction = options.direction || 'vertical'; // vertical, horizontal
        this.children = [];
        this.padding = options.padding || 'medium'; // none, small, medium, large
    }

    createElement() {
        const panel = document.createElement('div');
        panel.classList.add('catan-panel');
        panel.classList.add(`catan-panel--${this.variant}`);
        panel.classList.add(`catan-panel--${this.direction}`);
        panel.classList.add(`catan-panel--padding-${this.padding}`);
        
        if (this.className) {
            panel.classList.add(this.className);
        }

        // Add title if specified
        if (this.title) {
            const titleElement = document.createElement('h3');
            titleElement.classList.add('catan-panel__title');
            titleElement.textContent = this.title;
            panel.appendChild(titleElement);
        }

        // Create content container
        const content = document.createElement('div');
        content.classList.add('catan-panel__content');
        panel.appendChild(content);

        return panel;
    }

    /**
     * Get the content container where child elements should be added
     */
    getContentContainer() {
        return this.element?.querySelector('.catan-panel__content') || this.element;
    }

    /**
     * Add a child component to the panel
     */
    addChild(component) {
        this.children.push(component);
        const contentContainer = this.getContentContainer();
        
        if (contentContainer && component.render) {
            component.container = contentContainer;
            component.render();
        } else if (contentContainer && component instanceof HTMLElement) {
            contentContainer.appendChild(component);
        }
    }

    /**
     * Remove a child component from the panel
     */
    removeChild(component) {
        const index = this.children.indexOf(component);
        if (index > -1) {
            this.children.splice(index, 1);
            if (component.destroy) {
                component.destroy();
            } else if (component instanceof HTMLElement && component.parentNode) {
                component.parentNode.removeChild(component);
            }
        }
    }

    /**
     * Clear all children from the panel
     */
    clearChildren() {
        this.children.forEach(child => {
            if (child.destroy) {
                child.destroy();
            }
        });
        this.children = [];
        
        const contentContainer = this.getContentContainer();
        if (contentContainer) {
            contentContainer.innerHTML = '';
        }
    }

    /**
     * Update panel title
     */
    setTitle(title) {
        this.title = title;
        if (this.element) {
            let titleElement = this.element.querySelector('.catan-panel__title');
            if (title && !titleElement) {
                titleElement = document.createElement('h3');
                titleElement.classList.add('catan-panel__title');
                this.element.insertBefore(titleElement, this.element.firstChild);
            }
            
            if (titleElement) {
                if (title) {
                    titleElement.textContent = title;
                    titleElement.style.display = '';
                } else {
                    titleElement.style.display = 'none';
                }
            }
        }
    }

    /**
     * Destroy the panel and all its children
     */
    destroy() {
        this.clearChildren();
        super.destroy();
    }

    /**
     * Static factory methods for common panel types
     */
    static createVerticalPanel(container, title = null, className = '') {
        return new Panel(container, {
            title,
            className,
            direction: 'vertical',
            variant: 'default'
        });
    }

    static createHorizontalPanel(container, title = null, className = '') {
        return new Panel(container, {
            title,
            className,
            direction: 'horizontal',
            variant: 'default'
        });
    }

    static createFloatingPanel(container, title = null, className = '') {
        return new Panel(container, {
            title,
            className,
            direction: 'vertical',
            variant: 'floating'
        });
    }

    static createBorderedPanel(container, title = null, className = '') {
        return new Panel(container, {
            title,
            className,
            direction: 'vertical',
            variant: 'bordered'
        });
    }
}