import { createResourceDialog } from "../../../utils/resourceDialog.js";
import { patch } from "../../stateStore.js";

export function playYearOfPlenty({ app, hud, state, resPanel, refreshScores }) {
  console.log("🎴 Year of Plenty: playYearOfPlenty called");
  
  let selectedResources = [];
  
  function selectFirstResource() {
    const dialog = createResourceDialog(app, {
      title: "Year of Plenty (1/2)",
      subtitle: "Choose your first resource from the bank:",
      resources: ["brick", "wood", "wheat", "sheep", "ore"],
      onResourceSelect: (resource) => {
        selectedResources = [resource];
        selectSecondResource();
      }
    });
    
    dialog.show();
  }
  
  function selectSecondResource() {
    const dialog = createResourceDialog(app, {
      title: "Year of Plenty (2/2)",
      subtitle: `First: ${selectedResources[0]}. Choose your second resource:`,
      resources: ["brick", "wood", "wheat", "sheep", "ore"],
      onResourceSelect: (resource) => {
        selectedResources.push(resource);
        executeYearOfPlenty();
      }
    });
    
    dialog.show();
  }
  
  function executeYearOfPlenty() {
    // Use patch to ensure reactive updates
    patch(s => {
      const me = s.players[s.currentPlayer - 1];
      
      selectedResources.forEach(resource => {
        me.resources[resource] = (me.resources[resource] || 0) + 1;
      });
      
      // Remove the Year of Plenty card from inventory
      me.dev.year_of_plenty = Math.max(0, (me.dev.year_of_plenty || 0) - 1);
    });

    // Update UI
    resPanel?.updateResources?.(state.players, state);
    refreshScores?.();
    
    // Show result
    hud.showResult(`Year of Plenty: received ${selectedResources.join(' and ')}`);
  }
  
  selectFirstResource();
}
