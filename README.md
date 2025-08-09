# Catan JS

A browser-based **Catan** game built in **pure JavaScript, HTML, and CSS**, using **PixiJS** for rendering.  
Supports **one human player vs bots** with full gameplay mechanics, trading, building, development cards, and win conditions.

---

## 🎯 Features

### **Board & Geometry**
- Hexagonal board rendering with **pointy-top axial coordinates**.
- Coastline detection and debug mode to visualize edge indices.
- Ports (harbors) drawn on correct coastal edges with proper trade ratios.
- Full **randomization** of terrain tiles and number tokens.
- **Validation** to prevent 6 and 8 tokens from being adjacent.
- Desert tile placement with automatic robber initialization.

### **Game Mechanics**
- Turn-based gameplay: roll dice, collect resources, build, trade, play development cards, end turn.
- Robber mechanics: move robber, block tile, steal resource from opponent.
- Dice roll animation.
- Victory points calculation in real-time:
  - Settlements & cities.
  - **Longest Road** (auto-calculated).
  - **Largest Army** (from Knight cards).
- Win condition check (first to 10 points ends the game).

### **Building & Actions**
- Build settlements, roads, and cities with resource cost validation.
- Resource production from dice rolls.
- Action buttons auto-enable/disable based on available resources and turn phase.

### **Trading**
- Bank trade at **4:1** ratio.
- Port trade at improved ratios (3:1 generic or 2:1 specific resource).
- Player-to-player trading interface.

### **Development Cards**
- Purchase development cards (Knight, Road Building, Year of Plenty, Monopoly, Victory Point).
- Play dev cards with actual effects:
  - **Knight** → move robber & steal.
  - **Road Building** → build 2 free roads.
  - **Year of Plenty** → gain 2 chosen resources.
  - *(Monopoly can be added as a future enhancement).*
- Reveal received dev card to player.

### **UI & UX**
- HUD with vertical buttons on the right side of the screen.
- Resource panel.
- Score panel (bottom-right corner).
- Dice positioned next to Roll button.
- Ports and board elements rendered with correct alignment and scaling.
- Debug tools for board layout and coastal edge indices.

---

## 📂 Project Structure

src/
├─ main.js # Main game loop and setup
├─ core/
│ ├─ app.js # Application initialization
│ ├─ state/ # State management
│ │ ├─ gameState.js # Game state management
│ │ └─ stateSubscriptions.js # State change subscriptions
│ └─ config/
│   ├─ constants.js # Game constants and configuration
│   └─ gameRules.js # Game rules and validation
├─ board/
│ ├─ generation/
│ │ ├─ boardGenerator.js # Board layout generation
│ │ ├─ tileRandomizer.js # Tile and token randomization
│ │ └─ validator.js # Board validation (no adjacent 6/8)
│ ├─ rendering/
│ │ ├─ boardRenderer.js # Board visual rendering
│ │ ├─ tileRenderer.js # Individual tile rendering
│ │ └─ portRenderer.js # Port/harbor rendering
│ └─ coast.js # Coastline calculation and debugging
├─ game/
│ ├─ mechanics/
│ │ ├─ diceRoll.js # Dice rolling and resource distribution
│ │ ├─ building.js # Building placement and validation
│ │ ├─ trading.js # Trading system (bank, port, player)
│ │ └─ robber.js # Robber movement and stealing
│ ├─ cards/
│ │ ├─ developmentCards.js # Dev card management
│ │ ├─ cardEffects.js # Individual card effect implementations
│ │ └─ cardRenderer.js # Card UI rendering
│ ├─ scoring/
│ │ ├─ scoreCalculator.js # Victory points calculation
│ │ ├─ longestRoad.js # Longest road algorithm
│ │ └─ largestArmy.js # Largest army tracking
│ └─ ai/
│   ├─ botPlayer.js # AI player logic
│   └─ botStrategies.js # AI decision making
├─ ui/
│ ├─ components/
│ │ ├─ button.js # Reusable button component
│ │ ├─ panel.js # Reusable panel component
│ │ ├─ modal.js # Modal dialog component
│ │ └─ resourceDisplay.js # Resource counter display
│ ├─ hud/
│ │ ├─ hudManager.js # HUD layout and management
│ │ ├─ actionPanel.js # Action buttons panel
│ │ ├─ resourcePanel.js # Resource display panel
│ │ └─ scorePanel.js # Score display panel
│ ├─ animations/
│ │ ├─ diceAnimation.js # Dice roll animation
│ │ ├─ buildAnimation.js # Building placement animations
│ │ └─ transitionEffects.js # General transition effects
│ └─ dialogs/
│   ├─ tradeDialog.js # Trading interface
│   ├─ devCardDialog.js # Development card interface
│   └─ gameOverDialog.js # Game end screen
├─ utils/
│ ├─ geometry/
│ │ ├─ hexGeometry.js # Hex coordinate system
│ │ ├─ pixelConversion.js # Coordinate to pixel conversion
│ │ └─ pathfinding.js # Path algorithms for roads
│ ├─ validation/
│ │ ├─ buildingValidator.js # Building placement validation
│ │ ├─ resourceValidator.js # Resource cost validation
│ │ └─ gameStateValidator.js # General game state validation
│ └─ helpers/
│   ├─ arrayUtils.js # Array manipulation utilities
│   ├─ randomUtils.js # Random number and selection utilities
│   └─ debugUtils.js # Debug and logging utilities


---

## 🚀 How to Run

1. Clone the repository.
2. Serve the project via a local server:
   ```bash
   npx http-server
