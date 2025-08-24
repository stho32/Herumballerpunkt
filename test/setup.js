/**
 * Test setup file for Vitest
 * Configures global test environment and mocks
 */

// Mock browser APIs that might not be available in test environment
global.performance = global.performance || {
    now: () => Date.now(),
    memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000
    }
};

// Mock Canvas API
global.HTMLCanvasElement = global.HTMLCanvasElement || class {
    constructor() {
        this.width = 800;
        this.height = 600;
    }
    
    getContext() {
        return {
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
            font: '12px Arial',
            textAlign: 'left',
            textBaseline: 'top',
            
            save: () => {},
            restore: () => {},
            translate: () => {},
            rotate: () => {},
            scale: () => {},
            
            fillRect: () => {},
            strokeRect: () => {},
            clearRect: () => {},
            
            beginPath: () => {},
            closePath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            arc: () => {},
            
            fill: () => {},
            stroke: () => {},
            
            fillText: () => {},
            strokeText: () => {},
            measureText: () => ({ width: 100 })
        };
    }
};

// Mock Audio API
global.AudioContext = global.AudioContext || class {
    constructor() {
        this.state = 'running';
        this.sampleRate = 44100;
        this.destination = {};
    }
    
    createGain() {
        return {
            gain: { value: 1 },
            connect: () => {}
        };
    }
    
    createBufferSource() {
        return {
            buffer: null,
            loop: false,
            playbackRate: { value: 1 },
            connect: () => {},
            start: () => {},
            stop: () => {},
            onended: null
        };
    }
    
    createBuffer(channels, length, sampleRate) {
        return {
            numberOfChannels: channels,
            length: length,
            sampleRate: sampleRate,
            getChannelData: () => new Float32Array(length)
        };
    }
    
    resume() {
        return Promise.resolve();
    }
    
    close() {
        return Promise.resolve();
    }
};

global.webkitAudioContext = global.AudioContext;

// Mock requestAnimationFrame
global.requestAnimationFrame = global.requestAnimationFrame || ((callback) => {
    return setTimeout(callback, 16);
});

global.cancelAnimationFrame = global.cancelAnimationFrame || ((id) => {
    clearTimeout(id);
});

// Mock localStorage
const localStorageMock = {
    getItem: (key) => localStorageMock[key] || null,
    setItem: (key, value) => { localStorageMock[key] = value; },
    removeItem: (key) => { delete localStorageMock[key]; },
    clear: () => {
        Object.keys(localStorageMock).forEach(key => {
            if (key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear') {
                delete localStorageMock[key];
            }
        });
    }
};

global.localStorage = localStorageMock;

// Mock document and window for DOM-related tests
global.document = global.document || {
    createElement: (tagName) => {
        const element = {
            tagName: tagName.toUpperCase(),
            id: '',
            className: '',
            style: {},
            addEventListener: () => {},
            removeEventListener: () => {},
            appendChild: () => {},
            removeChild: () => {},
            querySelector: () => null,
            querySelectorAll: () => [],
            getAttribute: () => null,
            setAttribute: () => {},
            removeAttribute: () => {}
        };
        
        if (tagName === 'canvas') {
            element.width = 800;
            element.height = 600;
            element.getContext = () => global.HTMLCanvasElement.prototype.getContext();
        }
        
        return element;
    },
    
    getElementById: () => null,
    addEventListener: () => {},
    removeEventListener: () => {},
    readyState: 'complete',
    hidden: false
};

global.window = global.window || {
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: global.requestAnimationFrame,
    cancelAnimationFrame: global.cancelAnimationFrame,
    performance: global.performance,
    AudioContext: global.AudioContext,
    webkitAudioContext: global.webkitAudioContext,
    localStorage: global.localStorage
};

// Mock navigator for gamepad API
global.navigator = global.navigator || {
    getGamepads: () => [],
    userAgent: 'test-environment'
};

// Console helpers for tests
global.console.group = global.console.group || (() => {});
global.console.groupEnd = global.console.groupEnd || (() => {});
global.console.time = global.console.time || (() => {});
global.console.timeEnd = global.console.timeEnd || (() => {});

// Test utilities
global.testUtils = {
    // Create a mock canvas element
    createMockCanvas: (width = 800, height = 600) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    },
    
    // Create a mock game config
    createMockGameConfig: () => ({
        get: (path, defaultValue) => defaultValue,
        set: () => {},
        onChange: () => () => {},
        getAll: () => ({}),
        reset: () => {}
    }),
    
    // Create a mock event bus
    createMockEventBus: () => ({
        subscribe: () => () => {},
        unsubscribe: () => {},
        emit: () => {},
        once: () => () => {},
        removeAllListeners: () => {},
        listenerCount: () => 0,
        eventNames: () => [],
        setDebug: () => {},
        setMaxListeners: () => {}
    }),
    
    // Wait for next tick
    nextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
    
    // Wait for animation frame
    nextFrame: () => new Promise(resolve => requestAnimationFrame(resolve)),
    
    // Create a spy function
    createSpy: (implementation) => {
        const spy = implementation || (() => {});
        spy.calls = [];
        spy.callCount = 0;
        
        const wrappedSpy = (...args) => {
            spy.calls.push(args);
            spy.callCount++;
            return spy(...args);
        };
        
        wrappedSpy.calls = spy.calls;
        Object.defineProperty(wrappedSpy, 'callCount', {
            get: () => spy.calls.length
        });
        
        wrappedSpy.reset = () => {
            spy.calls.length = 0;
        };
        
        return wrappedSpy;
    }
};

// Error handling for tests
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Cleanup after each test
afterEach(() => {
    // Clear any timers
    jest?.clearAllTimers?.();
    
    // Reset localStorage
    global.localStorage.clear();
    
    // Reset document state
    global.document.hidden = false;
});

console.log('Test environment setup complete');
