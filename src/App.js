import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, createTheme, CssBaseline, Paper, Slide, Snackbar, ThemeProvider } from '@mui/material'
import MuiAlert from '@mui/material/Alert'
import { envConfig } from './init'

const PORT = envConfig['BACKEND_PORT']

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
})

function print (data) {
  console.log('data:', data)
  if (data.ok) {
    return { open: true, text: data.ok ? data.output : data.message, severity: data.ok ? 'success' : 'error' }
  } else {
    return { open: true, text: data.message, severity: 'error' }
  }
}

const tcpCommand = async command => {
  try {
    console.log(command)
    const response = await fetch(`http://localhost:${PORT}/zoom/command?code=${command}`)
    const data = await response.json()
    return print(data)
  } catch (error) {
    return { open: true, text: `Error command TCP: ${error}`, severity: 'error' }
  }
}

const Alert = React.forwardRef(function Alert (props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

export default function App () {
  const [message, setMessage] = useState({ open: false })
  const renderedRef = useRef(false)
  
  const handleClose = () => setMessage({ ...message, open: false })
  
  const play = useCallback(async () => {
    const response = await tcpCommand('5100 fnPlay')
    setMessage(response)
  }, [])
  const saveChapter = useCallback(async () => {
    const response = await tcpCommand('5100 fnAddChapter')
    await tcpCommand('5100 fnSaveChapter')
    setMessage(response)
  }, [])
  
  useEffect(() => {
    if (!renderedRef.current) {
      (async () => {
        try {
          const response = await fetch(`http://localhost:${PORT}/zoom/connect`)
          const data = await response.json()
          setMessage(print(data))
        } catch (error) {
          setMessage({ open: true, text: `Backend error: ${error}`, severity: 'error' })
        }
      })()
      renderedRef.current = true
    }
  }, [])
  
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline/>
      <Box sx={{ height: '100%' }}>
        <Paper sx={{ height: '100vh' }}>
          <Box p={2}>
            <Button variant="contained" color="primary" onClick={saveChapter} size="small">
              OFSALE MEXAL
            </Button>
            <Button variant="contained" color="primary" onClick={play} size="small">
              PLAY
            </Button>
          </Box>
          <Snackbar
            open={message.open}
            autoHideDuration={2000}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            TransitionComponent={props => <Slide {...props} direction="up" children={props.children}/>}
          >
            <Alert onClose={handleClose} severity={message.severity}>
              {message.text}
            </Alert>
          </Snackbar>
        </Paper>
      </Box>
    </ThemeProvider>
  )
}
