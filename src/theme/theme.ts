'use client';

import { createTheme, responsiveFontSizes } from '@mui/material/styles';

const baseTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#174ea6', // Google Blue 900
        },
        secondary: {
          main: '#1a73e8', // Google Blue 600
        },
        background: {
          default: '#f8f9fa', // Google Grey 50（Cloud Console 系の淡い背景）
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#ecf0f1', // Light text for dark mode
        },
        secondary: {
          main: '#8ab4f8', // Google Blue 300（暗背景でのアクセント）
        },
        background: {
          default: '#202124', // Google のダークグレー
          paper: '#2d2e30',
        },
      },
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '.markdown-body': {
          wordBreak: 'break-all',
          overflowWrap: 'break-word',
        },
        '& table': {
          display: 'block',
          width: '100% !important',
          maxWidth: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          borderCollapse: 'collapse',
          whiteSpace: 'nowrap',
        },
        '& th, & td': {
          padding: '8px 16px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Disable MUI v5 dark mode elevation overlay
        },
      },
    },
  },
});

const theme = responsiveFontSizes(baseTheme);

export default theme;
