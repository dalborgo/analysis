import React, { useEffect, useState } from 'react'
import { Alert, Box, Button, createTheme, CssBaseline, Paper, ThemeProvider, Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
})

const useStyles = makeStyles(theme => ({
  fullHeightPaper: {
    height: '100vh', // Imposta l'altezza al 100% dell'area visibile
  },
  mainContainer: {
    height: '100%', // Assicurati che il contenitore principale abbia un'altezza del 100%
  },
}))

export default function App () {
  const classes = useStyles()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    setIsLoading(true)
    checkConnection()
  }, [])
  
  const checkConnection = () => {
    fetch('http://localhost:3000/zoom/connect')
      .then(response => response.json())
      .then(data => {
        setIsConnected(data.ok)
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Errore nella verifica della connessione:', error)
        setIsLoading(false)
      })
  }
  
  const handleZpFunc = event => {
    fetch(`http://localhost:5003/&zpfunc=${event.target.id}`, { mode: 'no-cors' }).then()
  }
  
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline/>
      <Box className={classes.mainContainer}>
        <Paper className={classes.fullHeightPaper}>
          {
            isConnected ? (
              <Typography><Alert severity="success">Connesso!</Alert></Typography>
            ) : (
              <Typography>{
                isLoading ?
                  <Alert severity="info">Loading!</Alert>
                  :
                  <Alert severity="error">Connessione non riuscita!</Alert>
              }
              </Typography>
            )
          }
          <Box p={2}>
            <Button id="fnPlay" variant="contained" color="primary" onClick={handleZpFunc} size="small">
              PLAY
            </Button>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  )
}
