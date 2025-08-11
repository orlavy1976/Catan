import { createMaterialChoice } from "../../../utils/materialDialog.js";
import { patch } from "../../stateStore.js";

export function playYearOfPlenty({ app, hud, state, resPanel, refreshScores }) {
  const resources = ["brick", "wood", "wheat", "sheep", "ore"];
  let selectedResources = [];

  function selectResource() {
    if (selectedResources.length >= 2) {
      completeYearOfPlenty();
      return;
    }

    const dialog = createMaterialChoice(app, {
      title: `Year of Plenty (${selectedResources.length + 1}/2)`,
      message: selectedResources.length === 0 
        ? "Choose your first resource from the bank:"
        : `Selected: ${selectedResources[0]}. Choose your second resource:`,
      choices: resources.map(resource => ({
        label: resource.charAt(0).toUpperCase() + resource.slice(1),
        action: () => {
          selectedResources.push(resource);
          selectResource(); // Recursively select next resource
        }
      }))
    });

    dialog.show();
  }

  function completeYearOfPlenty() {
    // Give resources to player using patch for proper state management
    patch(s => {
      const player = s.players[s.currentPlayer - 1];
      selectedResources.forEach(resource => {
        player.resources[resource] = (player.resources[resource] || 0) + 1;
      });
    });

    // Update UI
    resPanel?.updateResources?.(state.players);
    refreshScores?.();
    hud.showResult(`Year of Plenty: received ${selectedResources.join(' and ')}`);
  }

  // Start the selection process
  selectResource();
}
