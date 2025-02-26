import React, { useCallback } from 'react'
import { Box, Button, Grid } from '@mui/material'

function Dialer ({ saveChapter }) {
  
  const handleButtonClick = useCallback(async event => {
    const value = event.target.id.replace('dialer-', '')
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
    <Box p={6}>
      <Grid container spacing={2} maxWidth={400}>
        
        {/* Tastiera numerica */}
        <Grid item xs={9}>
          <Grid container spacing={2}>
            {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((key) => (
              <Grid item xs={4} key={key}>
                <Button
                  id={`dialer-${key}`}
                  variant="contained"
                  fullWidth
                  sx={{ fontSize: '2rem', height: '80px' }}
                  color="primary"
                  onClick={handleButtonClick}
                >
                  {key}
                </Button>
              </Grid>
            ))}
            
            {/* Zero su due colonne */}
            <Grid item xs={8}>
              <Button
                id="dialer-0"
                variant="contained"
                fullWidth
                sx={{ fontSize: '2rem', height: '80px' }}
                color="primary"
                onClick={handleButtonClick}
              >
                0
              </Button>
            </Grid>
            
            {/* C sotto il 3 */}
            <Grid item xs={4}>
              <Button
                id="dialer-C"
                variant="contained"
                fullWidth
                sx={{ fontSize: '2rem', height: '80px' }}
                color="inherit"
                onClick={handleButtonClick}
              >
                C
              </Button>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Invio sulla destra, alto 4 righe */}
        <Grid item xs={3}>
          <Button
            id="dialer-invio"
            variant="contained"
            fullWidth
            sx={{ fontSize: '5rem', height: '100%', minHeight: '340px' }}
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
