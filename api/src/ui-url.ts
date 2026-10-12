/** Where Relay's screens are; links to a run point here. */
export const uiUrl = () =>
  (process.env.UI_URL ?? 'http://localhost:5400').replace(/\/$/, '');
