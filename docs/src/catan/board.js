// Generates a fixed base-game layout for M0 (we'll add shuffling/validation later)
export function generateBoard() {
  // Resources count (base game): 4 sheep, 4 wood, 4 wheat, 3 brick, 3 ore, 1 desert
  const tiles = [
    "brick","wood","sheep","wheat","ore",
    "sheep","wood","wheat","brick","sheep",
    "ore","wheat","desert","wood","sheep",
    "wheat","wood","ore","brick"
  ];

  // Standard token sequence (no 7), clockwise from a known top position.
  // We'll just map in order to the 19 non-desert tiles.
  const tokens = [5,2,6,3,8,10,9,12,11,4,8,10,9,4,5,6,3,11];

  // Place tokens skipping desert
  const withTokens = [];
  let t = 0;
  for (let i = 0; i < tiles.length; i++) {
    const kind = tiles[i];
    const token = kind === "desert" ? 7 : tokens[t++];
    withTokens.push({ kind, token });
  }
  return withTokens;
}

export function colorFor(kind) {
  // Placeholder fills (we'll replace with textures in M1 for “realistic” look)
  return ({
    water: 0x5aa0c8,
    desert: 0xd8c38e,
    wood:   0x256d39,
    sheep:  0x7bbf6a,
    wheat:  0xd8b847,
    brick:  0xb04a3a,
    ore:    0x6a6f7b,
  })[kind];
}
