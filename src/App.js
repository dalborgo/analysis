import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, createTheme, CssBaseline, Paper, Snackbar, ThemeProvider } from '@mui/material'
import MuiAlert from '@mui/material/Alert'
import { envConfig } from './init'

const PORT = envConfig['BACKEND_PORT']

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
})

const convertMilli = (millisecondi) => {
  let secondi = Math.floor(millisecondi / 1000)
  let minuti = Math.floor(secondi / 60)
  let ore = Math.floor(minuti / 60)
  
  secondi = secondi % 60
  minuti = minuti % 60
  
  // Aggiungi uno zero davanti ai minuti e ai secondi se sono meno di 10
  const minutiFormattati = minuti < 10 ? `0${minuti}` : minuti
  const secondiFormattati = secondi < 10 ? `0${secondi}` : secondi
  
  return `${ore}:${minutiFormattati}:${secondiFormattati}`
}

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
  const [command, ...rest] = text.split(' ')
  const result = rest.join(' ')
  return { command, result }
}

async function connect (setMessage) {
  try {
    const response = await fetch(`http://localhost:${PORT}/zoom/connect`)
    const data = await response.json()
    console.log('data:', data)
    setMessage(print(data))
  } catch (error) {
    const text = `Backend error: ${error}`
    setMessage({ open: true, text, severity: 'error' })
  }
}

export default function App () {
  const [message, setMessage] = useState({ open: false })
  const renderedRef = useRef(false)
  const handleClose = () => setMessage({ ...message, open: false })
  const play = useCallback(async () => {
    await tcpCommand('5100 fnPlay')
    const { result: status } = manageResponse(await tcpCommand('1000'))
    const button = document.getElementById('play')
    button.textContent = status === '3' ? '⏸' : '▶'
  }, [])
  const saveChapter = useCallback(async () => {
    const response = await tcpCommand('5100 fnAddChapter')
    await tcpCommand('5100 fnSaveChapter')
    const { result: file } = manageResponse(await tcpCommand('1800'))
    console.log('file:', file)
    //await fetch(`http://localhost:${PORT}/zoom/write-bookmark?file=${file}&text=prova`)
    setMessage(response)
  }, [])
  
  useEffect(() => {
    if (!renderedRef.current) {
      (async () => {await connect(setMessage)})()
      renderedRef.current = true
    }
    if (renderedRef.current) {
      const interval = setInterval(async () => {
        const { command, result: status } = manageResponse(await tcpCommand('1000'))
        if (['Not', 'Error'].includes(command)) {
          await connect(setMessage)
        } else {
          if (message.open && message.severity === 'error') {
            setMessage({ ...message, open: false })
          }
        }
        const button = document.getElementById('play')
        console.log('status:', status)
        if (status === '3') {
          button.textContent = '⏸'
          const { result, command } = manageResponse(await tcpCommand('1120'))
          if (command === '1120') {
            const elem = document.getElementById('time')
            elem.textContent = convertMilli(result)
          }
        } else {
          if (command === '1000') {button.textContent = '▶'}
        }
      }, 500)
      return () => clearInterval(interval)
    }
  }, [message])
  
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline/>
      <Box sx={{ height: '100%' }}>
        <Paper sx={{ height: '100vh' }}>
          <Box
            id="time"
            p={2}
            sx={{
              fontSize: '2rem', // Aumenta la dimensione del testo
              textAlign: 'center', // Allinea il testo al centro
              width: '100%', // Imposta la larghezza del Box al 100%
              margin: 'auto' // Centra il Box
            }}
          >
            0:00:00
          </Box>
          <Box p={2}>
            <Button variant="contained" color="primary" onClick={saveChapter}>
              OFSALE MEXAL
            </Button>
            <Button variant="contained" color="primary" onClick={play}>
              <span id="play" style={{ fontSize: '1.5rem' }}>⧗</span>
            </Button>
          </Box>
          <Snackbar
            open={message.open}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
