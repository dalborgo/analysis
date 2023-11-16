import React, { useEffect, useState } from 'react'
import { Alert, Box, Button, createTheme, CssBaseline, Paper, ThemeProvider } from '@mui/material'
import { makeStyles } from '@mui/styles'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
})

const useStyles = makeStyles(theme => ({
  fullHeightPaper: {
    height: '100vh',
  },
  mainContainer: {
    height: '100%',
  },
}))

const handleZpFunc = async event => {
  try {
    await fetch(`http://localhost:3000/zoom/command?code=5100 ${event.target.id}`)
  } catch (error) {
    console.error('Errore nella funzione handleZpFunc:', error)
  }
}

const tcpCommand = async command => {
  try {
    const response = await fetch(`http://localhost:3000/zoom/command?code=${command}`)
    console.log('response:', response)
    const data = await response.json()
    console.log('data:', data)
  } catch (error) {
    console.error('Errore nel comando TCP:', error)
  }
}

export default function App () {
  const classes = useStyles()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const checkConnection = async () => {
    try {
      const response = await fetch('http://localhost:3000/zoom/connect')
      const { ok } = await response.json()
      setIsConnected(ok)
      return ok
    } catch (error) {
      console.error('Errore nella verifica della connessione:', error)
    }
  }
  
  useEffect(() => {
    const establishConnection = async () => {
      if (!isConnected) {
        setIsLoading(true)
        const result = await checkConnection()
        result && await tcpCommand('5100 fnChapter')
        setIsLoading(false)
      }
    }
    
    establishConnection().then()
  }, [isConnected])
  
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline/>
      <Box className={classes.mainContainer}>
        <Paper className={classes.fullHeightPaper}>
          {
            isConnected ?
              <Alert severity="success">Connesso!</Alert>
              :
              isLoading ?
                <Alert severity="info">Loading...</Alert>
                :
                <Alert severity="error">Connessione non riuscita!</Alert>
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
