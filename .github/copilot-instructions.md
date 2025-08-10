# Copilot Instructions for Catan Board Game

## Project Overview
This is a browser-based **Catan board game** clone implemented in **vanilla JavaScript, HTML, and CSS**, using **PixiJS** for rendering and game UI. The code is modular, with separate files for board generation, UI, game state, and logic. The project has been refactored to use a **unified Material Design system** for consistent UI components and interactions.

## Current Features
- **Board Rendering**: Hex tile board with randomized resource placement and token distribution, validation prevents adjacent 6 and 8 tokens, ports (harbors) placed according to official map
- **Gameplay**: Turn-based flow, robber movement, building system (roads, settlements, cities), trading (bank and player-to-player)
- **Development Cards**: Knight, Road Building, Year of Plenty, Monopoly, Victory Point cards with Material Design dialogs
- **Scoring**: Automatic calculation including Largest Army and Longest Road, win condition at 10 points
- **Material Design UI**: Unified animation system, consistent button styling, modern dialog components
- **Trading System**: Both bank/port trading and player-to-player trading with full resource management

## Architecture & Code Organization

### Core Structure
```
docs/src/
├── main.js              # Entry point, orchestrates all modules
├── core/
│   ├── app.js          # PixiJS app initialization
│   ├── state.js        # Central game state object
│   └── assets.js       # Asset loading
├── catan/              # Board and UI rendering
│   ├── board.js        # Board generation logic
│   ├── tiles.js        # Tile rendering
│   ├── graph.js        # Vertex/edge graph for building
│   ├── ui.js           # Main UI components
│   └── build/          # Building placement system
│       └── ui/
│           └── materialButton.js  # Unified button system
├── game/               # Game logic and mechanics
│   ├── stateStore.js   # State management utilities
│   ├── resources.js    # Resource distribution
│   ├── turns.js        # Turn management
│   ├── trade.js        # Trading system (migrated to Material Design)
│   ├── devcards.js     # Development cards (migrated to Material Design)
│   ├── devcards/       # Development card system
│   └── dialogs/        # Modern Material Design dialogs
│       ├── materialTrade.js  # Trade dialogs
│       └── devcards.js       # Dev card dialogs
├── config/
│   ├── constants.js    # Game constants and configuration
│   └── materialDesign.js  # Material Design color palette and tokens
└── utils/
    ├── geom.js         # Geometric utilities for hex grid
    ├── materialUI.js   # Material Design animation and UI utilities
    └── materialDialog.js  # Material Design dialog system
```

### Material Design System
The project now uses a unified **Material Design system** for all UI components:

- **`utils/materialUI.js`**: Core animation library with easing functions, fade/scale/slide animations
- **`utils/materialDialog.js`**: Material Design dialog components (alert, confirm, choice, form)
- **`catan/ui/materialButton.js`**: Unified button factory with consistent styling and animations
- **`config/materialDesign.js`**: Material Design color palette, typography, spacing, and motion tokens

### State Management
- **Central state**: All game data stored in `state.js` object
- **State updates**: Use `patch()` function from `stateStore.js` for updates
- **Subscriptions**: Use `subscribe()` for reactive updates
- **State structure**: Players, board, current turn, phases, resources, etc.

```javascript
// Example state access and update
import { state } from "./core/state.js";
import { patch } from "./game/stateStore.js";

// Reading state
const currentPlayer = state.players[state.currentPlayer - 1];

// Updating state
patch({ currentPlayer: nextPlayerId });
```

## Coding Conventions

### General Style
- Use **ES6 modules** with explicit imports/exports
- **No external dependencies** except PixiJS for rendering
- **Descriptive function names** that clearly indicate purpose
- **Consistent file naming**: camelCase for files, kebab-case for directories when needed
- **Comments in Hebrew are acceptable** (existing codebase has mixed Hebrew/English)

### Material Design System Usage
- **Always use Material Design components** for new UI elements
- **Import from unified systems**: Use `materialButton.js`, `materialDialog.js`, `materialUI.js`
- **Follow Material Design principles**: Consistent elevation, color usage, animations
- **Use animation helpers**: `animateScale()`, `animateFade()`, `animateSlide()` from `materialUI.js`

```javascript
// Example Material Design usage
import { createMaterialButton } from "../catan/ui/materialButton.js";
import { createMaterialConfirm } from "../utils/materialDialog.js";
import { animateScale } from "../utils/materialUI.js";

// Create consistent buttons
const button = createMaterialButton("Click Me", {
  variant: 'filled',
  size: 'large',
  onClick: () => console.log('clicked')
});

// Use unified dialogs
createMaterialConfirm(app, {
  title: "Confirm Action",
  message: "Are you sure?",
  onConfirm: () => performAction()
});
```

### PixiJS Rendering
- All rendering done via **PixiJS containers and graphics**
- **Separate rendering from game logic** where possible
- Use **container hierarchies** for organized scene graph
- **Store sprite references** for updates (e.g., `robberSpriteRef`, `tileSprites`)
- **Use Material Design animations** for smooth transitions

```javascript
// Example PixiJS pattern with Material Design
const container = new PIXI.Container();
const graphics = new PIXI.Graphics();
graphics.beginFill(MATERIAL_COLORS.primary[500]);
graphics.drawCircle(0, 0, radius);
container.addChild(graphics);

// Animate with Material Design timing
animateScale(container, 1.2, MATERIAL_MOTION.duration.normal);
```

### Module Organization
- **Create new modules** rather than bloating existing ones
- **Export clear public APIs** from each module
- **Keep related functionality together** (e.g., all dev card logic in `devcards/`)
- **Use index.js files** for clean imports from directories
- **Prefer Material Design dialogs** over inline dialog code

### Dialog System Guidelines
- **Always use Material Design dialogs** for new features
- **Migrate inline dialogs** to Material Design system when modifying existing code
- **Use appropriate dialog types**: Alert, Confirm, Choice, Form, or custom dialogs
- **Handle HUD state properly** with disable/enable functions

```javascript
// Preferred dialog pattern
import { createMaterialChoice } from "../utils/materialDialog.js";

function showOptionsMenu(app, options) {
  createMaterialChoice(app, {
    title: "Choose Option",
    choices: options.map(opt => ({
      label: opt.name,
      action: opt.callback
    }))
  });
}
```

### State and Data Flow
- **Immutable-style updates** where possible
- **Validate inputs** before state changes
- **Emit events** for UI updates after state changes
- **Keep UI reactive** to state changes via subscriptions
- **Use Material Design feedback** for user actions

### Game Logic Patterns
- **Separate phases** for different game modes (`setup`, `play`, `move-robber`, etc.)
- **Validation functions** before allowing actions
- **Cost checking** before resource expenditure
- **Rule enforcement** follows official Catan rules

```javascript
// Example validation pattern
function canBuildRoad(player, edge) {
  if (!hasResources(player, BUILD_COSTS.road)) return false;
  if (!isValidRoadPlacement(player, edge)) return false;
  return true;
}
```

## Key Files and Their Responsibilities

### Core Files
- **`main.js`**: Entry point, initializes all systems, handles main game loop
- **`core/state.js`**: Central game state, player data, board state
- **`core/app.js`**: PixiJS application setup and root container
- **`game/stateStore.js`**: State management utilities (patch, subscribe)

### Board and Rendering
- **`catan/board.js`**: Board generation with randomization and validation
- **`catan/tiles.js`**: Individual tile rendering and token placement
- **`catan/graph.js`**: Vertex and edge graph for building placement
- **`catan/coast.js`**: Harbor/port placement and rendering

### Game Mechanics
- **`game/resources.js`**: Resource distribution on dice rolls
- **`game/turns.js`**: Turn management and phase transitions
- **`game/robber.js`**: Robber movement and resource stealing
- **`game/build*.js`**: Building placement (roads, settlements, cities)
- **`game/trade.js`**: Trading system (migrated to Material Design dialogs)

### Development Cards
- **`game/devcards.js`**: Dev card main functions (migrated to Material Design)
- **`game/devcards/index.js`**: Dev card deck management and purchase
- **`game/devcards/effects/`**: Individual card implementations
- **`game/dialogs/devcards.js`**: Material Design dev card dialogs

### Material Design System
- **`utils/materialUI.js`**: Core animation system and UI utilities
- **`utils/materialDialog.js`**: Dialog system (alert, confirm, choice, form)
- **`catan/ui/materialButton.js`**: Unified button factory with all variants
- **`game/dialogs/materialTrade.js`**: Modern trade dialog system
- **`config/materialDesign.js`**: Design tokens, colors, typography, spacing

## How to Assist with This Codebase

### When Adding New Features
1. **Follow modular organization** - create new files for significant features
2. **Update related modules** and UI components accordingly
3. **Maintain compatibility** with current state management patterns
4. **Add to main.js** initialization if needed
5. **Follow game phase patterns** for complex features

### When Modifying Existing Features
1. **Preserve backward compatibility** unless refactoring is explicitly requested
2. **Maintain existing function signatures** when possible
3. **Update related UI elements** when logic changes
4. **Test integration** with other systems

### UI Development
1. **Use Material Design components** for all new UI elements
2. **Import from unified systems**: `materialButton.js`, `materialDialog.js`, `materialUI.js`
3. **Follow existing patterns** from migrated components
4. **Make UI responsive** to state changes
5. **Use consistent animations** from the Material Design system

### Dialog Development
1. **Always use Material Design dialogs** for new features
2. **Use appropriate dialog types**: `createMaterialAlert`, `createMaterialConfirm`, `createMaterialChoice`, `createMaterialForm`
3. **Handle HUD state properly** with disable/enable functions
4. **Migrate inline dialogs** when modifying existing code
5. **Follow Material Design principles** for spacing and layout

### Game Rule Implementation
1. **Follow official Settlers of Catan rules** unless instructed otherwise
2. **Validate all player actions** before allowing them
3. **Handle edge cases** gracefully with appropriate user feedback
4. **Maintain game balance** and fairness

## Constants and Configuration

### Build Costs
```javascript
export const BUILD_COSTS = {
  road: { brick: 1, wood: 1 },
  settlement: { brick: 1, wood: 1, wheat: 1, sheep: 1 },
  city: { wheat: 2, ore: 3 },
};
```

### Resources
```javascript
export const RES_KEYS = ["brick", "wood", "wheat", "sheep", "ore"];
```

### Player Colors
```javascript
export const PLAYER_COLORS = [
  0xd32f2f, // Red
  0x1976d2, // Blue  
  0xffa000, // Orange
  0x388e3c, // Green
];
```

## Common Patterns

### Resource Management
```javascript
// Check if player can afford something
function canAfford(player, cost) {
  return Object.keys(cost).every(res => player.resources[res] >= cost[res]);
}

// Spend resources
function spendResources(player, cost) {
  Object.keys(cost).forEach(res => {
    player.resources[res] -= cost[res];
  });
}
```

### UI Updates
```javascript
// Subscribe to state changes for UI updates
subscribe((newState, oldState) => {
  if (newState.currentPlayer !== oldState.currentPlayer) {
    updatePlayerIndicator(newState.currentPlayer);
  }
});
```

### Building Placement
```javascript
// Typical building flow
function startBuildingPlacement(buildingType) {
  if (!canAffordBuilding(currentPlayer, buildingType)) {
    showError("Not enough resources");
    return;
  }
  enterBuildMode(buildingType);
  highlightValidPlacements();
}
```

## Upcoming Features / Areas for Development

### High Priority
- **Enhanced player trade system**: Add trade offer negotiation and approval flow
- **Improved AI for bot players**
- **Building and robber movement animations using Material Design motion**

### Medium Priority  
- **Mobile responsiveness** with Material Design touch targets
- **Game save/load functionality**
- **Sound effects and music**
- **Enhanced Material Design theming**

### Low Priority
- **Multiplayer networking**
- **Custom rule variants**
- **Statistics tracking**
- **Advanced Material Design components**

## Testing and Debugging

### Debug Features
- **Debug overlays** for development (already implemented)
- **Console logging** for state changes during development
- **Visual debugging** for graph structures and placement validation

### Code Quality
- **Validate inputs** at module boundaries
- **Handle errors gracefully** with user-friendly messages
- **Use consistent error patterns** throughout the codebase
- **Document complex algorithms** (especially geometric calculations)

## Performance Considerations

- **Minimize PixiJS object creation** during gameplay
- **Reuse containers and graphics** when possible
- **Batch state updates** to avoid excessive re-renders
- **Optimize pathfinding algorithms** for longest road calculation
- **Use object pooling** for frequently created/destroyed objects

Remember: This codebase values **clarity and maintainability** over premature optimization. Write code that's easy to understand and modify first, then optimize specific bottlenecks if needed.
