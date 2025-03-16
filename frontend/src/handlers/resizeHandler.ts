import { html, throttle } from "../utils";

/**
 * Panel resize handler component.
 * Allows resizing panels with drag interactions.
 *
 * @element panel-resize-handler
 *
 * @attr {string} resize - Direction to resize ('left' or 'right')
 * @attr {number} min-width - Minimum width of sibling in pixels
 * @attr {number} initial-width - Starting width of sibling in pixels
 * @attr {number} max-width-percent - Maximum width of sibling as percentage of window
 * @attr collapsable - Whether the panel can be collapsed
 *
 * @cssprop --resize-handler-hover-color - Color when hovering over handler
 *
 */
class PanelResizeHandler extends HTMLElement {
    private readonly COLOR_HOVER_BG: string =
        "var(--resize-handler-hover-color , #baba69)";
    private readonly COLOR_TRANSPARENT: string = "transparent";

    private isDragging: boolean = false;
    private initialX: number = 0;
    private currentSiblingWidth: number = 0;

    // Configuration properties with defaults
    private minWidth: number = 150; // px
    private maxWidthPercent: number = 30; // % of window width
    private defaultWidth: number = 150; // px - initialized to match minWidth
    private resize: "left" | "right" | null = null;
    private isCollapsable: boolean = false;

    private isPanelCollapsed: boolean = false;

    constructor() {
        super();

        this.attachShadow({ mode: "open" });

        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.adjustPanelWidth = this.adjustPanelWidth.bind(this);
    }

    connectedCallback(): void {
        this.initializeFromAttributes();

        this.render();
        this.setupEventListeners();
        this.applyDefaultWidth();
        this.adjustPanelWidth();

        window.addEventListener("resize", throttle(this.adjustPanelWidth, 100));
    }

    private initializeFromAttributes(): void {
        if (this.hasAttribute("min-width")) {
            this.minWidth =
                parseInt(this.getAttribute("min-width") || "") || 150;
        }

        if (this.hasAttribute("max-width-percent")) {
            this.maxWidthPercent =
                parseInt(this.getAttribute("max-width-percent") || "") || 30;
        }

        if (this.hasAttribute("initial-width")) {
            this.defaultWidth =
                parseInt(this.getAttribute("initial-width") || "") ||
                this.minWidth;
        }

        const resizeAttr = this.getAttribute("resize");
        if (resizeAttr === "left" || resizeAttr === "right") {
            this.resize = resizeAttr;
        } else if (resizeAttr !== null) {
            console.error(
                "Invalid value for resize attribute. Valid values are 'left' or 'right'."
            );
        }

        this.isCollapsable = this.hasAttribute("collapsable");
    }

    private applyDefaultWidth(): void {
        const targetElement = this.getTargetElement();
        if (targetElement) {
            targetElement.style.flexBasis = `${this.defaultWidth}px`;
        }
    }

    // Get the target element based on resize direction
    private getTargetElement(): HTMLElement | null {
        if (this.resize === "left" && this.previousElementSibling) {
            return this.previousElementSibling as HTMLElement;
        } else if (this.resize === "right" && this.nextElementSibling) {
            return this.nextElementSibling as HTMLElement;
        }
        return null;
    }

    // when element is removed from DOM
    disconnectedCallback(): void {
        this.removeEventListeners();
        window.removeEventListener(
            "resize",
            throttle(this.adjustPanelWidth, 100)
        );
    }

    render(): void {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = html`
            <style>
                :host {
                    display: block;
                    width: 4px;
                    cursor: col-resize;
                    background-color: transparent;
                    transition: background-color 0.2s ease;
                    z-index: 10;
                }
            </style>
        `;
    }

    setupEventListeners(): void {
        this.addEventListener("mouseenter", this.handleMouseEnter);
        this.addEventListener("mouseleave", this.handleMouseLeave);
        this.addEventListener("mousedown", this.handleMouseDown);
    }

    removeEventListeners(): void {
        this.removeEventListener("mouseenter", this.handleMouseEnter);
        this.removeEventListener("mouseleave", this.handleMouseLeave);
        this.removeEventListener("mousedown", this.handleMouseDown);
        document.removeEventListener("mousemove", this.handleMouseMove);
        document.removeEventListener("mouseup", this.handleMouseUp);
    }

    setBgColor(element: HTMLElement, color: string): void {
        element.style.backgroundColor = color;
    }

    handleMouseEnter(): void {
        this.setBgColor(this, this.COLOR_HOVER_BG);
        document.body.style.cursor = "col-resize";
    }

    handleMouseLeave(): void {
        if (!this.isDragging) {
            this.setBgColor(this, this.COLOR_TRANSPARENT);
            document.body.style.cursor = "default";
        }
    }

    handleMouseDown(e: MouseEvent): void {
        e.preventDefault();
        const targetElement = this.getTargetElement();
        if (!targetElement) return;

        this.setBgColor(this, this.COLOR_HOVER_BG);
        document.body.style.cursor = "col-resize";

        this.isDragging = true;
        this.initialX = e.clientX;
        this.currentSiblingWidth = targetElement.getBoundingClientRect().width;

        document.addEventListener("mousemove", this.handleMouseMove);
        document.addEventListener("mouseup", this.handleMouseUp);
    }

    handleMouseMove(e: MouseEvent): void {
        if (!this.isDragging) return;

        const targetElement = this.getTargetElement();
        if (!targetElement) return;

        let newWidth: number;

        if (this.resize === "left") {
            newWidth = this.currentSiblingWidth + (e.clientX - this.initialX);
        } else {
            newWidth = this.currentSiblingWidth - (e.clientX - this.initialX);
        }

        if (this.isCollapsable) {
            if (newWidth <= this.minWidth) {
                targetElement.style.display = "none";
                this.isPanelCollapsed = true;
            }
            if (this.isPanelCollapsed && newWidth > 50) {
                targetElement.style.display = "block";
                this.isPanelCollapsed = false;
            }
        }

        const maxWidth = window.innerWidth * (this.maxWidthPercent / 100);
        const clampedWidth = Math.max(
            this.minWidth,
            Math.min(newWidth, maxWidth)
        );

        targetElement.style.setProperty("flex-basis", `${clampedWidth}px`);
    }

    handleMouseUp(): void {
        this.setBgColor(this, this.COLOR_TRANSPARENT);

        this.isDragging = false;
        document.body.style.cursor = "default";
        document.removeEventListener("mousemove", this.handleMouseMove);
        document.removeEventListener("mouseup", this.handleMouseUp);
    }

    // Adjust panel widths on window resize
    adjustPanelWidth(): void {
        const maxWidth = window.innerWidth * (this.maxWidthPercent / 100);
        const targetElement = this.getTargetElement();

        if (targetElement) {
            const currentWidth = targetElement.getBoundingClientRect().width;
            if (currentWidth > maxWidth && maxWidth > this.minWidth) {
                targetElement.style.setProperty("flex-basis", `${maxWidth}px`);
            }
        }
    }

    static get observedAttributes(): string[] {
        return [];
    }

    attributeChangedCallback(
        name: string,
        oldValue: string,
        newValue: string
    ): void {}
}

customElements.define("panel-resize-handler", PanelResizeHandler);
