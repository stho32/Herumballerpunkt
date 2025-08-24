# Herumballerpunkt - Modular Architecture

This document describes the new modular architecture implementation for the 2D combat game, following the requirements from `Anforderungen/002-Code-Architektur-Modulsystem.md`.

## 🏗️ Architecture Overview

The game has been completely restructured using modern ES6 modules with a clean separation of concerns, dependency injection, and event-driven communication.

### Core Principles

- **Modularity**: Each system is a self-contained module with clear responsibilities
- **Loose Coupling**: Systems communicate through events and dependency injection
- **Testability**: All modules can be tested in isolation
- **Maintainability**: Clear structure and comprehensive documentation
- **Performance**: Optimized for 60 FPS with performance monitoring

## 📁 Project Structure

```
src/
├── core/                   # Core architecture components
│   ├── ServiceContainer.js # Dependency injection container
│   ├── EventBus.js        # Event system for decoupled communication
│   └── GameEngine.js      # Main game loop and system coordination
├── systems/               # Game systems
│   ├── RenderSystem.js    # Rendering and graphics
│   ├── InputManager.js    # Input handling (keyboard, mouse, gamepad)
│   ├── AudioManager.js    # Audio management with Web Audio API
│   └── EntityManager.js   # Entity lifecycle and management
├── entities/              # Game entities (to be migrated)
│   ├── Player.js
│   ├── Enemy.js
│   └── Projectile.js
├── components/            # Entity components (to be implemented)
│   ├── Transform.js
│   ├── Health.js
│   └── Weapon.js
├── utils/                 # Utility modules
│   ├── MathUtils.js       # Mathematical functions
│   ├── CollisionUtils.js  # Collision detection and resolution
│   └── PerformanceUtils.js # Performance monitoring
├── config/                # Configuration management
│   ├── GameConfig.js      # Game settings and configuration
│   └── SystemConfig.js    # System dependencies and initialization
├── main.js               # Application bootstrap
└── index.html           # New modular HTML entry point
```

## 🔧 Core Systems

### Service Container
- **Purpose**: Manages dependency injection and service lifecycle
- **Features**: Singleton management, dependency resolution, circular dependency detection
- **Usage**: `serviceContainer.register('serviceName', ServiceClass, singleton, dependencies)`

### Event Bus
- **Purpose**: Enables decoupled communication between systems
- **Features**: Subscribe/unsubscribe, once listeners, event history, debugging
- **Usage**: `eventBus.emit('event:name', data)` and `eventBus.subscribe('event:name', handler)`

### Game Engine
- **Purpose**: Coordinates all systems and manages the main game loop
- **Features**: 60 FPS target, performance monitoring, pause/resume, error handling
- **Lifecycle**: Initialize → Start → Update/Render Loop → Stop → Destroy

## 🎮 Game Systems

### Render System
- **Responsibilities**: Canvas management, rendering pipeline, camera system
- **Features**: Layer-based rendering, camera shake, performance tracking
- **Interface**: `render(deltaTime)`, `addToLayer(layer, renderable)`

### Input Manager
- **Responsibilities**: Input processing, key mapping, gamepad support
- **Features**: Configurable key bindings, input history, action states
- **Interface**: `isActionPressed(action)`, `getMousePosition()`

### Audio Manager
- **Responsibilities**: Sound effects, music, audio context management
- **Features**: Sound pooling, volume categories, Web Audio API integration
- **Interface**: `playSound(name, volume)`, `setCategoryVolume(category, volume)`

### Entity Manager
- **Responsibilities**: Entity lifecycle, collision detection, spatial partitioning
- **Features**: Object pooling, update groups, performance optimization
- **Interface**: `createEntity(type, data)`, `getEntitiesInArea(x, y, radius)`

## ⚙️ Configuration System

### Game Configuration
- **Environment-specific settings**: Development, production, testing
- **Runtime configuration changes**: Volume, graphics settings, difficulty
- **Validation**: Type checking and value validation
- **Persistence**: Save/load configuration to localStorage

### System Configuration
- **Dependency management**: System initialization order
- **Service registration**: Automatic system registration
- **Validation**: Circular dependency detection

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ (for development tools)
- Modern browser with ES6 module support

### Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Run tests**:
   ```bash
   npm test
   ```

5. **Lint code**:
   ```bash
   npm run lint
   ```

### Quick Start (No Build Tools)

1. **Serve the src directory**:
   ```bash
   npm run serve
   ```

2. **Open browser**: Navigate to `http://localhost:8080`

## 🔄 Migration Status

### ✅ Completed
- [x] Core architecture (ServiceContainer, EventBus, GameEngine)
- [x] Configuration system (GameConfig, SystemConfig)
- [x] System interfaces (RenderSystem, InputManager, AudioManager, EntityManager)
- [x] Utility modules (MathUtils, CollisionUtils, PerformanceUtils)
- [x] Build system and development tools
- [x] Documentation and project structure

### 🚧 In Progress
- [ ] Entity system migration from old codebase
- [ ] Component system implementation
- [ ] Game logic integration
- [ ] Asset loading system
- [ ] Save/load system integration

### 📋 TODO
- [ ] Unit tests for all modules
- [ ] Integration tests
- [ ] Performance benchmarks
- [ ] Complete game feature migration
- [ ] Mobile input support
- [ ] WebGL renderer option

## 🧪 Testing

### Unit Tests
```bash
npm test                    # Run all tests
npm run test:ui            # Run tests with UI
```

### Performance Testing
- Built-in performance monitor
- FPS tracking and optimization recommendations
- Memory usage monitoring
- Frame time analysis

### Manual Testing
- F1: Toggle performance info
- F2: Toggle debug info
- ESC: Pause/resume game

## 📊 Performance Monitoring

The new architecture includes comprehensive performance monitoring:

- **FPS Tracking**: Real-time frame rate monitoring
- **Memory Usage**: Heap size tracking (where supported)
- **System Metrics**: Update/render time tracking
- **Recommendations**: Automatic performance suggestions
- **Profiling**: Built-in function profiling tools

## 🔧 Development Tools

### Code Quality
- **ESLint**: Code linting with game-specific rules
- **Prettier**: Code formatting
- **JSDoc**: Documentation generation

### Build System
- **Vite**: Fast development server and build tool
- **Tree Shaking**: Automatic dead code elimination
- **Code Splitting**: Optimized bundle chunks
- **Source Maps**: Debugging support

### Debugging
- **Debug Mode**: Enhanced logging and error reporting
- **Performance Overlay**: Real-time metrics display
- **Event Logging**: Event bus activity monitoring
- **System Status**: Service container inspection

## 📚 API Documentation

### Service Container
```javascript
// Register a service
serviceContainer.register('myService', MyServiceClass, true, ['dependency1']);

// Resolve a service
const service = serviceContainer.resolve('myService');

// Inject dependencies
serviceContainer.inject(target, { prop: 'serviceName' });
```

### Event Bus
```javascript
// Subscribe to events
const unsubscribe = eventBus.subscribe('game:start', (data) => {
    console.log('Game started:', data);
});

// Emit events
eventBus.emit('game:start', { difficulty: 'normal' });

// One-time subscription
eventBus.once('game:end', handleGameEnd);
```

### Configuration
```javascript
// Get configuration value
const volume = gameConfig.get('audio.masterVolume', 1.0);

// Set configuration value
gameConfig.set('graphics.quality', 'high');

// Listen for changes
gameConfig.onChange('audio.masterVolume', (newValue) => {
    audioManager.setMasterVolume(newValue);
});
```

## 🤝 Contributing

1. Follow the established architecture patterns
2. Write comprehensive JSDoc documentation
3. Add unit tests for new functionality
4. Use the event bus for system communication
5. Register new services with the service container
6. Follow the coding standards (ESLint + Prettier)

## 📈 Performance Guidelines

1. **Use object pooling** for frequently created/destroyed entities
2. **Batch operations** where possible (rendering, audio)
3. **Leverage spatial partitioning** for collision detection
4. **Monitor performance metrics** regularly
5. **Profile expensive operations** using the built-in tools

## 🐛 Troubleshooting

### Common Issues

1. **Module not found**: Check import paths and file extensions
2. **Circular dependencies**: Use the system config validation
3. **Performance issues**: Enable performance monitoring
4. **Audio not working**: Check browser autoplay policies
5. **Canvas not rendering**: Verify canvas element exists

### Debug Tools

- Browser DevTools: Network, Performance, Memory tabs
- Built-in performance monitor: F1 key
- Debug overlay: F2 key
- Console logging: Enabled in debug mode

## 📄 License

MIT License - See LICENSE file for details.

---

This modular architecture provides a solid foundation for the game's continued development while addressing all the requirements from the original specification. The system is designed to be maintainable, testable, and performant.
