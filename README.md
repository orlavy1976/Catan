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
├─ board/
│ ├─ board.js # Board generation, randomization, validation
│ ├─ initBoard.js # Board rendering and setup
│ └─ coast.js # Coastline calculation and debugging
├─ ui/
│ ├─ index.js # HUD and layout
│ ├─ button.js # Reusable button component
│ ├─ diceView.js # Dice rendering and animation
├─ utils/
│ └─ geom.js # Hex geometry helpers (axial coords, pixel conversion)


---

## 🚀 How to Run

1. Clone the repository.
2. Serve the project via a local server:
   ```bash
   npx http-server
