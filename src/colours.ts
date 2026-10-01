// Sampled from the flat swatches in the supplied full-resolution reference.
const levels = ["50", "75", "100", "200", "300", "400", "500", "600"];
export const secondaryStories = [
  {
    name: "Brand",
    shades: ["#150229", "#D4A0FF", "#A538FF", "#4566E8"],
    labels: ["Midnight", "Lilac", "Violet", "Periwinkle"],
  },
  {
    name: "Blue",
    shades: [
      "#E6EBFB",
      "#97ADED",
      "#6C8BE6",
      "#2D59DB",
      "#0237D4",
      "#012794",
      "#012281",
      "#08194B",
      "#150229",
    ],
    labels: [...levels.map((v) => `B${v}`), "Midnight"],
  },
  {
    name: "Purple",
    shades: [
      "#F2E7FC",
      "#CB9BF2",
      "#B572ED",
      "#9635E5",
      "#800CE0",
      "#5A089D",
      "#4E0789",
      "#31005B",
      "#150229",
    ],
    labels: [...levels.map((v) => `P${v}`), "Midnight"],
  },
  {
    name: "Green",
    shades: [
      "#F4FCE7",
      "#D3F19C",
      "#C1EC73",
      "#A6E436",
      "#94DE0D",
      "#689B09",
      "#5A8708",
      "#294000",
      "#150229",
    ],
    labels: [...levels.map((v) => `G${v}`), "Midnight"],
  },
  {
    name: "Orange",
    shades: [
      "#FEEFE8",
      "#FBBEA2",
      "#FAA37C",
      "#F87C43",
      "#F6611D",
      "#AC4414",
      "#963B12",
      "#521A00",
      "#150229",
    ],
    labels: [...levels.map((v) => `O${v}`), "Midnight"],
  },
  {
    name: "Red",
    shades: [
      "#FCE9EA",
      "#F2A3AA",
      "#ED7D86",
      "#E54552",
      "#E01F2F",
      "#9D1621",
      "#89131D",
      "#4B040A",
      "#150229",
    ],
    labels: [...levels.map((v) => `R${v}`), "Midnight"],
  },
  {
    name: "Ink",
    shades: ["#FFFFFF", "#000000"],
    labels: ["White", "Black"],
  },
];
export const primaryStories = [
  secondaryStories[0],
  {
    name: "Blue",
    shades: [
      "#EDF1FD",
      "#B4C5F8",
      "#94ADF6",
      "#6689F2",
      "#4771EF",
      "#2E51B6",
      "#012281",
      "#061647",
      "#150229",
    ],
    labels: [...levels.map((v) => `B${v}`), "Midnight"],
  },
  {
    name: "Purple",
    shades: [
      "#F6EEFD",
      "#DBB8F8",
      "#CD9BF5",
      "#B770F0",
      "#A853ED",
      "#763AA6",
      "#663391",
      "#31005B",
      "#150229",
    ],
    labels: [...levels.map((v) => `P${v}`), "Midnight"],
  },
  {
    name: "Periwinkle",
    shades: [
      "#F3F3FF",
      "#CCCFFF",
      "#B7BBFF",
      "#989DFF",
      "#8389FF",
      "#5C60B3",
      "#4C51AC",
      "#232661",
      "#150229",
    ],
    labels: [...levels.map((v) => `V${v}`), "Midnight"],
  },
  {
    name: "Sky",
    shades: [
      "#F3FBFF",
      "#CDEEFD",
      "#B8E7FC",
      "#99DCFB",
      "#84D5FA",
      "#62AACB",
      "#3884A8",
      "#0C4965",
      "#150229",
    ],
    labels: [...levels.map((v) => `S${v}`), "Midnight"],
  },
  {
    name: "Green",
    shades: [
      "#F5FCF5",
      "#D5F1D6",
      "#C3EBC5",
      "#AAE3AC",
      "#98DD9B",
      "#66A66A",
      "#4B894E",
      "#0B480E",
      "#150229",
    ],
    labels: [...levels.map((v) => `G${v}`), "Midnight"],
  },
  secondaryStories[6],
];
export const colourStories = [...primaryStories, ...secondaryStories];
export type ColourPair = { highlight: string; background: string };
export const defaultPairs: ColourPair[] = colourStories.map((story) => ({
  highlight: story.shades[story.name === "Brand" ? 1 : 0],
  background:
    story.shades[story.name === "Brand" ? 0 : story.name === "Ink" ? 1 : 6],
}));
export function selectShade(
  pair: ColourPair,
  role: keyof ColourPair,
  colour: string,
): ColourPair {
  const other = role === "highlight" ? "background" : "highlight";
  return {
    ...pair,
    [role]: colour,
    [other]:
      pair[other].toUpperCase() === colour.toUpperCase()
        ? pair[role]
        : pair[other],
  };
}
