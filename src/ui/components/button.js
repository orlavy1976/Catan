import { BaseComponent } from './baseComponent.js';

/**
 * Reusable button component with consistent styling and behavior
 */
export class Button extends BaseComponent {
    constructor(container, options = {}) {
        super(container);
        
        this.text = options.text || '';
        this.onClick = options.onClick || (() => {});
        this.className = options.className || '';
        this.variant = options.variant || 'primary'; // primary, secondary, danger, success
        this.size = options.size || 'medium'; // small, medium, large
        this.disabled = options.disabled || false;
        this.icon = options.icon || null;
        this.tooltip = options.tooltip || null;
    }

    createElement() {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = this.text;
        
        // Add base classes
        button.classList.add('catan-button');
        button.classList.add(`catan-button--${this.variant}`);
        button.classList.add(`catan-button--${this.size}`);
        
        if (this.className) {
            button.classList.add(this.className);
        }

        // Add icon if specified
        if (this.icon) {
            const iconElement = document.createElement('span');
            iconElement.classList.add('catan-button__icon');
            iconElement.textContent = this.icon;
            button.insertBefore(iconElement, button.firstChild);
        }

        // Add tooltip if specified
        if (this.tooltip) {
            button.title = this.tooltip;
        }

        // Set initial disabled state
        button.disabled = this.disabled;

        // Add click handler
        this.addEventListener('click', (e) => {
            if (!this.isEnabled) return;
            this.onClick(e);
        }, button);

        return button;
    }

    /**
     * Update button text
     */
    setText(text) {
        this.text = text;
        if (this.element) {
            // Preserve icon if it exists
            const icon = this.element.querySelector('.catan-button__icon');
            this.element.textContent = text;
            if (icon) {
                this.element.insertBefore(icon, this.element.firstChild);
            }
        }
    }

    /**
     * Update button variant
     */
    setVariant(variant) {
        if (this.element) {
            this.element.classList.remove(`catan-button--${this.variant}`);
            this.variant = variant;
            this.element.classList.add(`catan-button--${this.variant}`);
        }
    }

    /**
     * Update disabled state
     */
    updateEnabled() {
        super.updateEnabled();
        if (this.element) {
            this.element.disabled = !this.isEnabled;
        }
    }

    /**
     * Static factory methods for common button types
     */
    static createActionButton(container, text, onClick) {
        return new Button(container, {
            text,
            onClick,
            variant: 'primary',
            size: 'medium'
        });
    }

    static createSecondaryButton(container, text, onClick) {
        return new Button(container, {
            text,
            onClick,
            variant: 'secondary',
            size: 'medium'
        });
    }

    static createDangerButton(container, text, onClick) {
        return new Button(container, {
            text,
            onClick,
            variant: 'danger',
            size: 'medium'
        });
    }

    static createIconButton(container, icon, onClick, tooltip = null) {
        return new Button(container, {
            text: '',
            onClick,
            icon,
            tooltip,
            variant: 'secondary',
            size: 'small',
            className: 'icon-only'
        });
    }
}