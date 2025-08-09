import { BaseComponent } from './baseComponent.js';
import { Button } from './button.js';

/**
 * Reusable modal dialog component
 */
export class Modal extends BaseComponent {
    constructor(options = {}) {
        super(document.body);
        
        this.title = options.title || '';
        this.content = options.content || '';
        this.className = options.className || '';
        this.size = options.size || 'medium'; // small, medium, large, fullscreen
        this.closable = options.closable !== false; // default true
        this.closeOnOverlay = options.closeOnOverlay !== false; // default true
        this.closeOnEscape = options.closeOnEscape !== false; // default true
        this.buttons = options.buttons || [];
        this.onClose = options.onClose || (() => {});
        this.onOpen = options.onOpen || (() => {});
        
        this.contentElement = null;
        this.isOpen = false;
    }

    createElement() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.classList.add('catan-modal-overlay');
        
        // Create modal container
        const modal = document.createElement('div');
        modal.classList.add('catan-modal');
        modal.classList.add(`catan-modal--${this.size}`);
        
        if (this.className) {
            modal.classList.add(this.className);
        }

        // Create header
        const header = document.createElement('div');
        header.classList.add('catan-modal__header');
        
        if (this.title) {
            const titleElement = document.createElement('h2');
            titleElement.classList.add('catan-modal__title');
            titleElement.textContent = this.title;
            header.appendChild(titleElement);
        }

        if (this.closable) {
            const closeButton = new Button(header, {
                text: '×',
                onClick: () => this.close(),
                variant: 'secondary',
                size: 'small',
                className: 'catan-modal__close'
            });
            closeButton.render();
        }

        // Create content
        this.contentElement = document.createElement('div');
        this.contentElement.classList.add('catan-modal__content');
        this.setContent(this.content);

        // Create footer with buttons
        const footer = document.createElement('div');
        footer.classList.add('catan-modal__footer');
        
        this.buttons.forEach(buttonConfig => {
            const button = new Button(footer, {
                text: buttonConfig.text,
                onClick: () => {
                    if (buttonConfig.onClick) {
                        buttonConfig.onClick();
                    }
                    if (buttonConfig.closeModal !== false) {
                        this.close();
                    }
                },
                variant: buttonConfig.variant || 'secondary',
                size: buttonConfig.size || 'medium'
            });
            button.render();
        });

        // Assemble modal
        modal.appendChild(header);
        modal.appendChild(this.contentElement);
        if (this.buttons.length > 0) {
            modal.appendChild(footer);
        }
        overlay.appendChild(modal);

        // Add event listeners
        if (this.closeOnOverlay) {
            this.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            }, overlay);
        }

        if (this.closeOnEscape) {
            this.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            }, document);
        }

        // Prevent modal from closing when clicking inside
        this.addEventListener('click', (e) => {
            e.stopPropagation();
        }, modal);

        return overlay;
    }

    /**
     * Set modal content
     */
    setContent(content) {
        this.content = content;
        if (this.contentElement) {
            if (typeof content === 'string') {
                this.contentElement.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                this.contentElement.innerHTML = '';
                this.contentElement.appendChild(content);
            }
        }
    }

    /**
     * Open the modal
     */
    open() {
        if (this.isOpen) return;
        
        this.render();
        this.isOpen = true;
        document.body.classList.add('modal-open');
        
        // Focus management
        this.previouslyFocused = document.activeElement;
        const focusableElement = this.element.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElement) {
            focusableElement.focus();
        }

        this.onOpen();
    }

    /**
     * Close the modal
     */
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        document.body.classList.remove('modal-open');
        
        // Restore focus
        if (this.previouslyFocused) {
            this.previouslyFocused.focus();
        }

        this.onClose();
        this.destroy();
    }

    /**
     * Update modal title
     */
    setTitle(title) {
        this.title = title;
        if (this.element) {
            const titleElement = this.element.querySelector('.catan-modal__title');
            if (titleElement) {
                titleElement.textContent = title;
            }
        }
    }

    /**
     * Static factory methods for common modal types
     */
    static createConfirmDialog(title, message, onConfirm, onCancel = null) {
        return new Modal({
            title,
            content: message,
            size: 'small',
            buttons: [
                {
                    text: 'Cancel',
                    variant: 'secondary',
                    onClick: onCancel
                },
                {
                    text: 'Confirm',
                    variant: 'primary',
                    onClick: onConfirm
                }
            ]
        });
    }

    static createAlertDialog(title, message, onOk = null) {
        return new Modal({
            title,
            content: message,
            size: 'small',
            buttons: [
                {
                    text: 'OK',
                    variant: 'primary',
                    onClick: onOk
                }
            ]
        });
    }

    static createCustomDialog(title, content, buttons = []) {
        return new Modal({
            title,
            content,
            size: 'medium',
            buttons
        });
    }
}