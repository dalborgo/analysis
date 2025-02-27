import React, { useCallback } from 'react'
import { Box, Button, Grid } from '@mui/material'

function Dialer ({ saveChapter }) {
  
  const handleButtonClick = useCallback(async event => {
    const value = event.currentTarget.id.replace('dialer-', '')
    if (value === 'invio') {
      return saveChapter()
    }
    if (value === 'C') {
      document.getElementById('episodeDescription').value = ''
      return
    }
    const elem = document.getElementById('episodeDescription')
    elem.value = `${elem.value.trim() || ''}${value}`
  }, [saveChapter])
  
  return (
    <Box pl={3} pr={3}>
      <Grid container spacing={1} maxWidth={300}>
        <Grid item xs={9}>
          <Grid container spacing={1}>
            {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(key => (
              <Grid item xs={4} key={key}>
                <Button
                  id={`dialer-${key}`}
                  variant="outlined"
                  fullWidth
                  sx={{ fontSize: '1.5rem', height: '40px' }}
                  color="primary"
                  onClick={handleButtonClick}
                >
                  {key}
                </Button>
              </Grid>
            ))}
            <Grid item xs={8}>
              <Button
                id="dialer-0"
                variant="outlined"
                fullWidth
                sx={{ fontSize: '1.5rem', height: '40px' }}
                color="primary"
                onClick={handleButtonClick}
              >
                0
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                id="dialer-C"
                variant="contained"
                fullWidth
                sx={{ fontSize: '1.5rem', height: '40px' }}
                color="inherit"
                onClick={handleButtonClick}
              >
                C
              </Button>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={2}>
          <Button
            id="dialer-invio"
            variant="contained"
            fullWidth
            sx={{ fontSize: '3.5rem', height: '100%', minHeight: '180px' }}
            color="secondary"
            onClick={handleButtonClick}
          >
            ↵
          </Button>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dialer
