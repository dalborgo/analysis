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
  //console.log('data:', data)
  if (data.ok) {
    return { open: true, text: data.ok ? data.output : data.message, severity: data.ok ? 'success' : 'error' }
  } else {
    return { open: true, text: data.message, severity: 'error' }
  }
}

const tcpCommand = async command => {
  try {
    //console.log(command)
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

function manageResponse ({ text }) {
  const [command, result] = text.split(' ')
  return { command, result }
}

async function connect (setMessage) {
  try {
    const response = await fetch(`http://localhost:${PORT}/zoom/connect`)
    const data = await response.json()
    console.log('data:', data)
    setMessage(print(data))
  } catch (error) {
    setMessage({ open: true, text: `Backend error: ${error}`, severity: 'error' })
  }
}

export default function App () {
  const [message, setMessage] = useState({ open: false })
  const renderedRef = useRef(false)
  const handleClose = () => setMessage({ ...message, open: false })
  const play = useCallback(async () => {
    const { result } = manageResponse(await tcpCommand('1000'))
    console.log('result:', result)
    await tcpCommand(`5100 ${result === '3' ? 'fnPause' : 'fnPlay'}`)
  }, [])
  const saveChapter = useCallback(async () => {
    const response = await tcpCommand('5100 fnAddChapter')
    await tcpCommand('5100 fnSaveChapter')
    setMessage(response)
  }, [])
  
  useEffect(() => {
    if (!renderedRef.current) {
      (async () => {await connect(setMessage)})()
      renderedRef.current = true
    }
    if (renderedRef.current) {
      const interval = setInterval(async () => {
        const { command, result } = manageResponse(await tcpCommand('1100'))
        console.log('command:', command)
        if (['Not', 'Error'].includes(command)) {await connect(setMessage)}
        if (command === '1100') {
          const [time] = result.split('/')
          if (time) {
            const elem = document.getElementById('time')
            elem.textContent = time
          }
        }
        if (command === '1200') {
          console.log('state:', result)
        }
      }, 1000)
      return () => clearInterval(interval)
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
          <div id="time">0:00:00</div>
          <Snackbar
            open={message.open}
            autoHideDuration={message.severity === 'error' ? 0 : 3000}
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
