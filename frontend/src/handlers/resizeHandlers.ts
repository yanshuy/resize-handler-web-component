import { throttle } from "../utils/throttle";

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
 * @attr {string} collapsable - ('true' or 'false')
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

    // Configuration all applies to the sibling element
    private MIN_WIDTH: number = 150; // px
    private MAX_WIDTH_PERCENT: number = 30; // % of window width
    private DEFAULT_WIDTH: number = this.MIN_WIDTH;

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

    // when element is added to DOM
    connectedCallback(): void {
        this.render();
        this.setupEventListeners();
        this.adjustPanelWidth();

        const resize = this.getAttribute("resize");

        if (resize === "left" && this.previousElementSibling) {
            (
                this.previousElementSibling as HTMLElement
            ).style.flexBasis = `${this.DEFAULT_WIDTH}px`;
            console.log(
                (this.previousElementSibling as HTMLElement).style.flexBasis
            );
        } else if (resize === "right" && this.nextElementSibling) {
            (
                this.nextElementSibling as HTMLElement
            ).style.flexBasis = `${this.DEFAULT_WIDTH}px`;
        }

        // Add resize listener
        window.addEventListener("resize", throttle(this.adjustPanelWidth, 100));
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

        this.shadowRoot.innerHTML = `
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
        const resize = this.getAttribute("resize");

        this.setBgColor(this, this.COLOR_HOVER_BG);
        document.body.style.cursor = "col-resize";

        this.isDragging = true;
        this.initialX = e.clientX;

        if (resize === "left" && this.previousElementSibling) {
            this.currentSiblingWidth = (
                this.previousElementSibling as HTMLElement
            ).getBoundingClientRect().width;
        } else if (resize === "right" && this.nextElementSibling) {
            this.currentSiblingWidth = (
                this.nextElementSibling as HTMLElement
            ).getBoundingClientRect().width;
        }

        document.addEventListener("mousemove", this.handleMouseMove);
        document.addEventListener("mouseup", this.handleMouseUp);
    }

    handleMouseMove(e: MouseEvent): void {
        if (!this.isDragging) return;

        const resize = this.getAttribute("resize");
        let newWidth: number;
        let targetElement: HTMLElement | null = null;

        if (resize === "left" && this.previousElementSibling) {
            targetElement = this.previousElementSibling as HTMLElement;
            newWidth = this.currentSiblingWidth + (e.clientX - this.initialX);
        } else if (resize === "right" && this.nextElementSibling) {
            targetElement = this.nextElementSibling as HTMLElement;
            newWidth = this.currentSiblingWidth - (e.clientX - this.initialX);
        } else {
            console.error(
                "invalid attribute value \n valid attribute value for resize: left | right"
            );
            return;
        }

        if (this.isCollapsable) {
            if (newWidth <= this.MIN_WIDTH) {
                targetElement.style.display = "none";
                this.isPanelCollapsed = true;
            }
            if (this.isPanelCollapsed && newWidth > 50) {
                targetElement.style.display = "block";
                this.isPanelCollapsed = false;
            }
        }

        if (!targetElement) return;

        const maxWidth = window.innerWidth * (this.MAX_WIDTH_PERCENT / 100);
        const clampedWidth = Math.max(
            this.MIN_WIDTH,
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
        const maxWidth = window.innerWidth * (this.MAX_WIDTH_PERCENT / 100);
        const resize = this.getAttribute("resize");
        let targetElement: HTMLElement | null = null;

        if (resize === "left" && this.previousElementSibling) {
            targetElement = this.previousElementSibling as HTMLElement;
        } else if (resize === "right" && this.nextElementSibling) {
            targetElement = this.nextElementSibling as HTMLElement;
        }

        if (targetElement) {
            const currentWidth = targetElement.getBoundingClientRect().width;
            if (currentWidth > maxWidth && maxWidth > this.MIN_WIDTH) {
                targetElement.style.setProperty("flex-basis", `${maxWidth}px`);
            }
        }
    }

    // Observe attribute changes
    static get observedAttributes(): string[] {
        return [
            "min-width",
            "max-width-percent",
            "default-width",
            "resize",
            "collapsable",
        ];
    }

    // React to attribute changes
    attributeChangedCallback(
        name: string,
        oldValue: string,
        newValue: string
    ): void {
        if (name === "min-width") {
            this.MIN_WIDTH = parseInt(newValue) || 150;
        } else if (name === "max-width-percent") {
            this.MAX_WIDTH_PERCENT = parseInt(newValue) || 30;
        } else if (name === "default-width") {
            this.DEFAULT_WIDTH = parseInt(newValue) || this.MIN_WIDTH;
        } else if (name === "collapsable") {
            this.isCollapsable =
                newValue.toLowerCase() == "false" ? false : true;
        }
    }
}

// Register the web component
customElements.define("panel-resize-handler", PanelResizeHandler);
