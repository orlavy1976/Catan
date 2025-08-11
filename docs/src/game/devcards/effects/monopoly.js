import { createMaterialChoice } from "../../../utils/materialDialog.js";
import { patch } from "../../stateStore.js";

export function playMonopoly({ app, hud, state, resPanel, refreshScores }) {
  const resources = ["brick", "wood", "wheat", "sheep", "ore"];

  const dialog = createMaterialChoice(app, {
    title: "Monopoly",
    message: "Choose a resource to monopolize. All other players will give you all their cards of this type:",
    choices: resources.map(resource => ({
      label: resource.charAt(0).toUpperCase() + resource.slice(1),
      action: () => executeMonopoly(resource)
    }))
  });

  function executeMonopoly(chosenResource) {
    const meIdx = state.currentPlayer - 1;
    let totalTaken = 0;

    // Take all cards of chosen type from other players using patch
    patch(s => {
      const me = s.players[meIdx];
      
      s.players.forEach((player, index) => {
        if (index === meIdx) return; // Skip current player
        
        const amount = player.resources[chosenResource] || 0;
        if (amount > 0) {
          player.resources[chosenResource] = 0;
          me.resources[chosenResource] = (me.resources[chosenResource] || 0) + amount;
          totalTaken += amount;
        }
      });
    });

    // Update UI
    resPanel?.updateResources?.(state.players);
    refreshScores?.();
    
    // Show result
    const message = totalTaken > 0 
      ? `Monopoly: took ${totalTaken} ${chosenResource} from other players`
      : `Monopoly: no other players had ${chosenResource}`;
    hud.showResult(message);
  }

  dialog.show();
}
