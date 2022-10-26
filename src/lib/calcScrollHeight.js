import collectionsData from "../data/collections.json";

export function calcScrollHeight(slug, dimensions) {
  let scrollHeight = 0;
  if (slug) {
    let gap = (6 / 100) * dimensions.width;
    let padding = dimensions.width <= 376 ? 16 : 20;
    let width = dimensions.width - 2 * padding;
    let collectionHeight = 0;
    collectionsData
      .find((c) => c.slug === slug)
      .isLandscape.forEach((isLandscape) => {
        collectionHeight += isLandscape ? width / 1.5 : width / (2 / 3);
        collectionHeight += gap;
      });
    scrollHeight = collectionHeight - gap + (1 / 2) * dimensions.height;
  }

  return scrollHeight;
}
