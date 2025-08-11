// Game reset dialog with Material Design
import { createMaterialConfirm } from "../../utils/materialDialog.js";

/**
 * Show confirmation dialog for game reset
 * @param {PIXI.Application} app - PIXI application
 * @param {Function} onConfirm - Callback when reset is confirmed
 * @param {Function} onCancel - Callback when reset is cancelled
 */
export function showResetGameDialog(app, onConfirm, onCancel) {
  console.log("🔄 showResetGameDialog called");
  
  const dialog = createMaterialConfirm(app, {
    title: "Reset Game",
    message: "Are you sure you want to reset the game? All progress will be lost and cannot be recovered.",
    confirmText: "Reset Game",
    cancelText: "Cancel",
    onConfirm: () => {
      console.log("Game reset confirmed");
      onConfirm?.();
    },
    onCancel: () => {
      console.log("Game reset cancelled");
      onCancel?.();
    }
  });
  console.log("🔄 showResetGameDialog dialog created successfully");
  dialog.show();
}

/**
 * Show dialog when loading saved game state
 * @param {PIXI.Application} app - PIXI application
 * @param {object} savedInfo - Information about saved game
 * @param {Function} onLoadSaved - Callback to load saved game
 * @param {Function} onStartNew - Callback to start new game
 */
export function showLoadGameDialog(app, savedInfo, onLoadSaved, onStartNew) {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const phaseText = savedInfo.phase === 'setup' ? 'Setup Phase' : 
                   savedInfo.phase === 'play' ? 'Playing' : 
                   savedInfo.phase === 'move-robber' ? 'Moving Robber' : 
                   savedInfo.phase;

  const message = `Found a saved game:
• Turn ${savedInfo.turn}, Player ${savedInfo.currentPlayer}
• Phase: ${phaseText}
• Saved: ${formatDate(savedInfo.timestamp)}

Would you like to continue the saved game or start a new one?`;

  const dialog = createMaterialConfirm(app, {
    title: "Load Saved Game",
    message: message,
    confirmText: "Load",
    cancelText: "Start New",
    variant: 'info',
    onConfirm: () => {
      console.log("Loading saved game");
      onLoadSaved?.();
    },
    onCancel: () => {
      console.log("Starting new game");
      onStartNew?.();
    }
  });
  dialog.show();
}
