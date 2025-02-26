import React, { useCallback } from 'react'
import { Box, Button, createTheme, Grid, ThemeProvider } from '@mui/material'

function Dialer ({ saveChapter }) {
  const theme = createTheme({
    components: {
      MuiListItemButton: {
        defaultProps: {
          disableTouchRipple: true,
        },
      },
    },
    palette: {
      mode: 'dark',
      background: { paper: 'rgb(28,27,27)' },
    },
  })
  
  const handleButtonClick = useCallback(async event => {
    const value = event.target.id.replace('button-', '')
    if (value === 'Invio') {
      return saveChapter()
    }
    const elem = document.getElementById('episodeDescription')
    elem.value = `${elem.value.trim() || ''}${value}`
    console.log(value)
  }, [saveChapter])
  
  const keys = [
    [7, 8, 9],
    [4, 5, 6],
    [1, 2, 3],
    [0, 'Invio']
  ]
  
  return (
    <Box>
      <ThemeProvider theme={theme}>
        <Box p={2}>
          <Grid container spacing={1} maxWidth={200}>
            {keys.map((row, rowIndex) => (
              <Grid container item spacing={1} key={rowIndex} justifyContent="center">
                {row.map((key) => (
                  <Grid item xs={key === 'Invio' ? 8 : 4} key={key}>
                    <Button
                      id={`button-${key}`}
                      variant="contained"
                      fullWidth
                      color={key === 'Invio' ? 'secondary' : 'primary'}
                      onClick={handleButtonClick}
                    >
                      {key}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            ))}
          </Grid>
        </Box>
      </ThemeProvider>
    </Box>
  )
}

export default Dialer
