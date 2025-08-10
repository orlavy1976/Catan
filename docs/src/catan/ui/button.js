// Legacy button system - now wraps Material Design buttons
import { makeButton as legacyMakeButton } from "../ui/materialButton.js";

/**
 * Legacy makeButton function - now uses Material Design system
 * @param {string} label - Button text
 * @param {number} width - Button width (default: 120)
 * @param {string} variant - Button variant ('primary' or 'secondary')
 * @returns {object} Button API with legacy compatibility
 */
export function makeButton(label, width = 120, variant = 'primary') {
  return legacyMakeButton(label, width, variant);
}
