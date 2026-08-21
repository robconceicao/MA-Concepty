/** Serifada da marca, usada nos titulos. O corpo do texto segue a fonte do sistema. */
export const fonts = {
  display: 'PlayfairDisplay',
  displayMedium: 'PlayfairDisplay-Medium',
} as const;

export const fontAssets = {
  [fonts.display]: require('../../assets/fonts/PlayfairDisplay-Regular.ttf'),
  [fonts.displayMedium]: require('../../assets/fonts/PlayfairDisplay-Medium.ttf'),
};
