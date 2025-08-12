import { createResourceDialog } from "../../../utils/resourceDialog.js";
import { patch } from "../../stateStore.js";

export function playMonopoly({ app, hud, state, resPanel, refreshScores }) {
  const dialog = createResourceDialog(app, {
    title: "Monopoly",
    subtitle: "Choose a resource to monopolize. All other players will give you all their cards of this type:",
    resources: ["brick", "wood", "wheat", "sheep", "ore"],
    onResourceSelect: (chosenResource) => {
      executeMonopoly(chosenResource);
    }
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
      
      // Remove the Monopoly card from inventory
      me.dev.monopoly = Math.max(0, (me.dev.monopoly || 0) - 1);
    });

    // Update UI
    resPanel?.updateResources?.(state.players, state);
    refreshScores?.();
    
    // Show result
    const message = totalTaken > 0 
      ? `Monopoly: took ${totalTaken} ${chosenResource} from other players`
      : `Monopoly: no other players had ${chosenResource}`;
    hud.showResult(message);
  }

  dialog.show();
}
