/**
 * Input Manager - Handles all input processing
 * Manages keyboard, mouse, and gamepad input with configurable key mappings
 */
export class InputManager {
    constructor(gameConfig, eventBus) {
        this.gameConfig = gameConfig;
        this.eventBus = eventBus;
        
        this.isInitialized = false;
        
        // Input state
        this.keys = new Map();
        this.mouse = {
            x: 0,
            y: 0,
            buttons: new Map(),
            wheel: { deltaX: 0, deltaY: 0 }
        };
        
        // Key mappings from config
        this.keyMappings = new Map();
        this.actionStates = new Map();
        
        // Input history for debugging
        this.inputHistory = [];
        this.maxHistorySize = 100;
        
        // Event listeners storage for cleanup
        this.eventListeners = [];
        
        // Gamepad support
        this.gamepads = new Map();
        this.gamepadDeadZone = 0.1;
        
        this.setupEventListeners();
    }

    /**
     * Initialize the input manager
     */
    async initialize() {
        try {
            // Load key mappings from config
            this.loadKeyMappings();
            
            // Setup mouse settings
            this.mouse.sensitivity = this.gameConfig.get('input.mouseSensitivity', 1.0);
            this.gamepadDeadZone = this.gameConfig.get('input.deadZone', 0.1);
            
            this.isInitialized = true;
            this.eventBus.emit('inputManager:initialized');
            
            console.log('InputManager initialized');
            
        } catch (error) {
            console.error('Failed to initialize InputManager:', error);
            throw error;
        }
    }

    /**
     * Update input state
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        if (!this.isInitialized) return;

        // Update gamepad state
        this.updateGamepads();
        
        // Process input actions
        this.processActions();
        
        // Clean up old input history
        if (this.inputHistory.length > this.maxHistorySize) {
            this.inputHistory = this.inputHistory.slice(-this.maxHistorySize);
        }
    }

    /**
     * Load key mappings from configuration
     */
    loadKeyMappings() {
        const mappings = this.gameConfig.get('input.keyMappings', {});
        
        this.keyMappings.clear();
        this.actionStates.clear();
        
        for (const [action, keys] of Object.entries(mappings)) {
            this.keyMappings.set(action, Array.isArray(keys) ? keys : [keys]);
            this.actionStates.set(action, {
                isPressed: false,
                wasPressed: false,
                justPressed: false,
                justReleased: false
            });
        }
    }

    /**
     * Setup event listeners for input
     */
    setupEventListeners() {
        // Keyboard events
        const keyDownHandler = (event) => this.handleKeyDown(event);
        const keyUpHandler = (event) => this.handleKeyUp(event);
        
        document.addEventListener('keydown', keyDownHandler);
        document.addEventListener('keyup', keyUpHandler);
        
        this.eventListeners.push(
            () => document.removeEventListener('keydown', keyDownHandler),
            () => document.removeEventListener('keyup', keyUpHandler)
        );

        // Mouse events
        const mouseDownHandler = (event) => this.handleMouseDown(event);
        const mouseUpHandler = (event) => this.handleMouseUp(event);
        const mouseMoveHandler = (event) => this.handleMouseMove(event);
        const mouseWheelHandler = (event) => this.handleMouseWheel(event);
        
        document.addEventListener('mousedown', mouseDownHandler);
        document.addEventListener('mouseup', mouseUpHandler);
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('wheel', mouseWheelHandler);
        
        this.eventListeners.push(
            () => document.removeEventListener('mousedown', mouseDownHandler),
            () => document.removeEventListener('mouseup', mouseUpHandler),
            () => document.removeEventListener('mousemove', mouseMoveHandler),
            () => document.removeEventListener('wheel', mouseWheelHandler)
        );

        // Gamepad events
        const gamepadConnectedHandler = (event) => this.handleGamepadConnected(event);
        const gamepadDisconnectedHandler = (event) => this.handleGamepadDisconnected(event);
        
        window.addEventListener('gamepadconnected', gamepadConnectedHandler);
        window.addEventListener('gamepaddisconnected', gamepadDisconnectedHandler);
        
        this.eventListeners.push(
            () => window.removeEventListener('gamepadconnected', gamepadConnectedHandler),
            () => window.removeEventListener('gamepaddisconnected', gamepadDisconnectedHandler)
        );

        // Prevent context menu on right click
        const contextMenuHandler = (event) => event.preventDefault();
        document.addEventListener('contextmenu', contextMenuHandler);
        this.eventListeners.push(
            () => document.removeEventListener('contextmenu', contextMenuHandler)
        );
    }

    /**
     * Handle keyboard key down
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        const keyCode = event.code;
        
        if (!this.keys.get(keyCode)) {
            this.keys.set(keyCode, {
                isPressed: true,
                justPressed: true,
                timestamp: Date.now()
            });
            
            this.addToHistory('keydown', keyCode);
            this.eventBus.emit('input:keyDown', { key: keyCode, event });
        }
        
        // Prevent default for game keys
        if (this.isGameKey(keyCode)) {
            event.preventDefault();
        }
    }

    /**
     * Handle keyboard key up
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyUp(event) {
        const keyCode = event.code;
        
        this.keys.set(keyCode, {
            isPressed: false,
            justReleased: true,
            timestamp: Date.now()
        });
        
        this.addToHistory('keyup', keyCode);
        this.eventBus.emit('input:keyUp', { key: keyCode, event });
    }

    /**
     * Handle mouse button down
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseDown(event) {
        const button = `Mouse${event.button}`;
        
        this.mouse.buttons.set(button, {
            isPressed: true,
            justPressed: true,
            timestamp: Date.now()
        });
        
        this.addToHistory('mousedown', button);
        this.eventBus.emit('input:mouseDown', { button, x: event.clientX, y: event.clientY, event });
    }

    /**
     * Handle mouse button up
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseUp(event) {
        const button = `Mouse${event.button}`;
        
        this.mouse.buttons.set(button, {
            isPressed: false,
            justReleased: true,
            timestamp: Date.now()
        });
        
        this.addToHistory('mouseup', button);
        this.eventBus.emit('input:mouseUp', { button, x: event.clientX, y: event.clientY, event });
    }

    /**
     * Handle mouse movement
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseMove(event) {
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
        
        this.eventBus.emit('input:mouseMove', { x: event.clientX, y: event.clientY, event });
    }

    /**
     * Handle mouse wheel
     * @param {WheelEvent} event - Wheel event
     */
    handleMouseWheel(event) {
        this.mouse.wheel.deltaX = event.deltaX;
        this.mouse.wheel.deltaY = event.deltaY;
        
        this.eventBus.emit('input:mouseWheel', { 
            deltaX: event.deltaX, 
            deltaY: event.deltaY, 
            event 
        });
        
        event.preventDefault();
    }

    /**
     * Handle gamepad connected
     * @param {GamepadEvent} event - Gamepad event
     */
    handleGamepadConnected(event) {
        this.gamepads.set(event.gamepad.index, event.gamepad);
        this.eventBus.emit('input:gamepadConnected', { gamepad: event.gamepad });
        console.log(`Gamepad connected: ${event.gamepad.id}`);
    }

    /**
     * Handle gamepad disconnected
     * @param {GamepadEvent} event - Gamepad event
     */
    handleGamepadDisconnected(event) {
        this.gamepads.delete(event.gamepad.index);
        this.eventBus.emit('input:gamepadDisconnected', { gamepad: event.gamepad });
        console.log(`Gamepad disconnected: ${event.gamepad.id}`);
    }

    /**
     * Update gamepad state
     */
    updateGamepads() {
        const gamepads = navigator.getGamepads();
        
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (gamepad) {
                this.gamepads.set(i, gamepad);
            }
        }
    }

    /**
     * Process action states based on key mappings
     */
    processActions() {
        for (const [action, state] of this.actionStates) {
            const keys = this.keyMappings.get(action) || [];
            
            // Reset frame-specific states
            state.justPressed = false;
            state.justReleased = false;
            state.wasPressed = state.isPressed;
            
            // Check if any mapped key/button is pressed
            let isCurrentlyPressed = false;
            
            for (const key of keys) {
                if (this.isKeyPressed(key) || this.isMouseButtonPressed(key)) {
                    isCurrentlyPressed = true;
                    break;
                }
            }
            
            // Update action state
            if (isCurrentlyPressed && !state.wasPressed) {
                state.justPressed = true;
            } else if (!isCurrentlyPressed && state.wasPressed) {
                state.justReleased = true;
            }
            
            state.isPressed = isCurrentlyPressed;
        }
        
        // Clear just pressed/released states for keys and mouse buttons
        this.clearFrameStates();
    }

    /**
     * Clear frame-specific input states
     */
    clearFrameStates() {
        for (const [key, state] of this.keys) {
            state.justPressed = false;
            state.justReleased = false;
        }
        
        for (const [button, state] of this.mouse.buttons) {
            state.justPressed = false;
            state.justReleased = false;
        }
    }

    /**
     * Check if a key is currently pressed
     * @param {string} key - Key code
     * @returns {boolean} Whether key is pressed
     */
    isKeyPressed(key) {
        const state = this.keys.get(key);
        return state ? state.isPressed : false;
    }

    /**
     * Check if a mouse button is currently pressed
     * @param {string} button - Button name (e.g., 'Mouse0')
     * @returns {boolean} Whether button is pressed
     */
    isMouseButtonPressed(button) {
        const state = this.mouse.buttons.get(button);
        return state ? state.isPressed : false;
    }

    /**
     * Check if an action is currently active
     * @param {string} action - Action name
     * @returns {boolean} Whether action is active
     */
    isActionPressed(action) {
        const state = this.actionStates.get(action);
        return state ? state.isPressed : false;
    }

    /**
     * Check if an action was just pressed this frame
     * @param {string} action - Action name
     * @returns {boolean} Whether action was just pressed
     */
    isActionJustPressed(action) {
        const state = this.actionStates.get(action);
        return state ? state.justPressed : false;
    }

    /**
     * Check if an action was just released this frame
     * @param {string} action - Action name
     * @returns {boolean} Whether action was just released
     */
    isActionJustReleased(action) {
        const state = this.actionStates.get(action);
        return state ? state.justReleased : false;
    }

    /**
     * Get mouse position
     * @returns {Object} Mouse position {x, y}
     */
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    /**
     * Check if a key is used by the game
     * @param {string} key - Key code
     * @returns {boolean} Whether key is used by game
     */
    isGameKey(key) {
        for (const keys of this.keyMappings.values()) {
            if (keys.includes(key)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Add input event to history
     * @param {string} type - Event type
     * @param {string} key - Key or button
     */
    addToHistory(type, key) {
        this.inputHistory.push({
            type,
            key,
            timestamp: Date.now()
        });
    }

    /**
     * Get input history
     * @returns {Array} Input history
     */
    getInputHistory() {
        return [...this.inputHistory];
    }

    /**
     * Cleanup resources
     */
    destroy() {
        // Remove all event listeners
        this.eventListeners.forEach(removeListener => removeListener());
        this.eventListeners.length = 0;
        
        // Clear state
        this.keys.clear();
        this.mouse.buttons.clear();
        this.gamepads.clear();
        this.actionStates.clear();
        this.inputHistory.length = 0;
        
        this.isInitialized = false;
        this.eventBus.emit('inputManager:destroyed');
        console.log('InputManager destroyed');
    }
}
