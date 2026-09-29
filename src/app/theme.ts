import { blue, grey } from '@mui/material/colors';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

const focusRing = { outline: `2px solid ${blue[800]}`, outlineOffset: 2 };

// Stock MUI with a few deliberate overrides. blue[800] instead of the default
// blue[700] keeps primary text at AA contrast on the gray page background too.
// contrastThreshold 4.5 picks AA-contrast text on filled colors (e.g. warning).
// responsiveFontSizes steps headings down on small screens.
export const theme = responsiveFontSizes(
  createTheme({
    palette: {
      primary: { main: blue[800] },
      background: { default: grey[100] },
      contrastThreshold: 4.5,
    },
    shape: { borderRadius: 8 },
    components: {
      // A visible keyboard focus ring for every button-like control and link.
      MuiButtonBase: {
        styleOverrides: { root: { '&.Mui-focusVisible': focusRing } },
      },
      MuiLink: {
        styleOverrides: { root: { '&:focus-visible': focusRing } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { textTransform: 'none' } },
      },
    },
  }),
);
