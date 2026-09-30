import { blue, grey } from '@mui/material/colors';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

const primaryWithAaContrastOnGrey = blue[800];
const AA_TEXT_CONTRAST_RATIO = 4.5;
const focusRing = {
  outline: `2px solid ${primaryWithAaContrastOnGrey}`,
  outlineOffset: 2,
};

export const theme = responsiveFontSizes(
  createTheme({
    palette: {
      primary: { main: primaryWithAaContrastOnGrey },
      background: { default: grey[100] },
      contrastThreshold: AA_TEXT_CONTRAST_RATIO,
    },
    shape: { borderRadius: 8 },
    components: {
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
