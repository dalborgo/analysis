import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, createTheme, CssBaseline, Snackbar, TextField, ThemeProvider, } from '@mui/material'
import MuiAlert from '@mui/material/Alert'
import { envConfig } from './init'
import RefereeDisplay from './comp/RefereeDisplay'
import MatchInfo from './comp/MatchInfo'
import ChaptersList from './comp/ChaptersList'
import Grid from '@mui/material/Grid'
import SeekMinute from './comp/SeekMinute'

const PORT = envConfig['BACKEND_PORT']

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
})

function extractID (path) {
  const fileName = path.split('\\').pop()
  const pattern = /g(\d+)[^0-9]*/
  const match = fileName.match(pattern)
  return match ? match[1] : null
}

export const convertMilli = (millisecondi, halfTimeEnd = 0, initTimeEnd = 0) => {
  if (millisecondi < initTimeEnd) { return { long: '00:00:00', effectiveLong: '00:00:00', short: '0′' }}
  const minute45 = 2_700_000
  const secondi = Math.floor((halfTimeEnd && millisecondi > halfTimeEnd ? millisecondi - halfTimeEnd : millisecondi - initTimeEnd) / 1000)
  const minuti = Math.floor(secondi / 60)
  const short = minuti % 60
  
  function getTimeLong (secondi) {
    const minuti = Math.floor(secondi / 60)
    const ore = Math.floor(minuti / 60)
    const secondi_ = secondi % 60
    const minuti_ = minuti % 60
    const minutiFormattati = minuti_ < 10 ? `0${minuti_}` : minuti_
    const secondiFormattati = secondi_ < 10 ? `0${secondi_}` : secondi_
    return `${ore}:${minutiFormattati}:${secondiFormattati}`
  }
  
  function getTime (secondi) {
    const minuti = Math.floor(secondi / 60)
    const secondi_ = secondi % 60
    const minutiFormattati = minuti < 10 ? `0${minuti}` : minuti
    const secondiFormattati = secondi_ < 10 ? `0${secondi_}` : secondi_
    return `${minutiFormattati}:${secondiFormattati}`
  }
  
  const effectiveLong = getTime(Math.floor((halfTimeEnd && millisecondi > halfTimeEnd ? minute45 + (millisecondi - halfTimeEnd) : millisecondi - initTimeEnd) / 1000))
  const long = getTimeLong(Math.floor(millisecondi / 1000))
  return { long, effectiveLong, short: `${short + 1}′`, period: millisecondi > halfTimeEnd ? 'st' : 'pt' }
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
    setMessage(print(data))
  } catch (error) {
    const text = `Backend error: ${error}`
    setMessage({ open: true, text, severity: 'error' })
  }
}

async function getMatch (id, setMatch) {
  try {
    const response = await fetch(`http://localhost:${PORT}/wyscout/match/${id}`)
    const data = await response.json()
    setMatch(data?.results)
  } catch (error) {
    console.error(error)
  }
}

async function getChapters (file, setChapters) {
  try {
    const response = await fetch(`http://localhost:${PORT}/zoom/chapters?file=${file}`)
    const data = await response.json()
    console.log('data:', data)
    setChapters(data?.results)
  } catch (error) {
    console.error(error)
  }
}

export default function App ({ halfTime, initTime = 0 }) {
  const [message, setMessage] = useState({ open: false })
  const [match, setMatch] = useState()
  const [chapters, setChapters] = useState([])
  const [halfTimeEnd, setHalfTimeEnd] = useState(halfTime)
  const [initTimeEnd, setInitTimeEnd] = useState(initTime)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [longPressTriggered, setLongPressTriggered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const handleLongPressStart = () => {
    setLongPressTriggered(false)
    const timer = setTimeout(() => {
      setHalfTimeEnd(0)
      setInitTimeEnd(0)
      localStorage.setItem('halfTimeEnd', 0)
      localStorage.setItem('initTimeEnd', 0)
      setLongPressTriggered(true)
    }, 1000)
    
    setLongPressTimer(timer)
  }
  const handleLongPressEnd = () => {
    clearTimeout(longPressTimer)
  }
  const renderedRef = useRef(false)
  const handleClose = () => setMessage({ ...message, open: false })
  const play = useCallback(async () => {
    await tcpCommand('5100 fnPlay')
    const { result: status } = manageResponse(await tcpCommand('1000'))
    const button = document.getElementById('play')
    button.textContent = status === '3' ? '⏸' : '▶'
  }, [])
  const saveChapter = useCallback(async () => {
    const episodeDescription = document.getElementById('episodeDescription')
    const episode = episodeDescription.value
    if (!episode) {return}
    const elem = document.getElementById('milliBox')
    const newChapters = [...chapters, {
      time: parseFloat(elem.value / 1000),
      text: episode.trim()
    }].sort((a, b) => a.time - b.time)
    setChapters(newChapters)
    const response = await tcpCommand('5100 fnAddChapter')
    await tcpCommand('5100 fnSaveChapter')
    const { result: file } = manageResponse(await tcpCommand('1800'))
    await fetch(`http://localhost:${PORT}/zoom/write-bookmark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: file,
        chapters: newChapters
      })
    })
    episodeDescription.value = ''
    setMessage(response)
  }, [chapters])
  const skipForward = useCallback(async () => {
    await tcpCommand('5100 fnSkipForward')
  }, [])
  const skipBackward = useCallback(async () => {
    await tcpCommand('5100 fnSkipBackward')
  }, [])
  const goTime = useCallback(async (eventTime, direct = false) => {
    if (direct) {return tcpCommand(`5000 ${eventTime}`)}
    const { minute, period } = eventTime || {}
    const to = period === 2 && halfTimeEnd ? minute * 60000 + parseInt(halfTimeEnd) : (minute * 60000) + parseInt(initTimeEnd)
    await tcpCommand(`5000 ${(to - 59000) / 1000}`) // 59 per arrotondamento
  }, [halfTimeEnd, initTimeEnd])
  const seekMinute = useCallback(async dir => {
    const elem = document.getElementById('time_min')
    const fraction = document.getElementById('fraction')
    const minute = parseInt(elem.textContent.replace('′', ''))
    await goTime({ minute: dir === '+' ? minute + 1 : minute - 1, period: fraction.textContent === 'st' ? 2 : 1 })
  }, [goTime])
  const setHalfTime = useCallback(async () => {
    if (!longPressTriggered) {
      const { result } = manageResponse(await tcpCommand('1120'))
      localStorage.setItem('halfTimeEnd', result.toString())
      setHalfTimeEnd(result)
    }
  }, [longPressTriggered])
  const setInitTime = useCallback(async () => {
    if (!longPressTriggered) {
      const { result } = manageResponse(await tcpCommand('1120'))
      localStorage.setItem('initTimeEnd', result.toString())
      setInitTimeEnd(result)
    }
  }, [longPressTriggered])
  const handleKeyPress = useCallback(event => {
    if (!isFocused) {
      switch (event.key) {
        case 'ArrowRight':
          skipForward()
          break
        case 'ArrowLeft':
          skipBackward()
          break
        case ' ':
          play()
          break
        default:
          break
      }
    }
    const elem = document.getElementById('episodeDescription')
    const getValue = () => elem.value.trim().replace(/\[.*?]\s*/, '')
    switch (event.key) {
      case 'F1':
        elem.value = `[SOGL] ${getValue()} `
        break
      case 'F2':
        elem.value = `[TEC] ${getValue()} `
        break
      case 'F4':
        elem.value = `[DIS] ${getValue()} `
        break
      case 'F7':
        elem.value = `[ATL] ${getValue()} `
        break
      case 'F8':
        elem.value = `[TATT] ${getValue()} `
        break
      case 'F9':
        elem.value = `[PERS] ${getValue()} `
        break
      default:
        break
    }
  }, [isFocused, skipForward, skipBackward, play])
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])
  
  useEffect(() => {
    if (!renderedRef.current) {
      (async () => {
        await connect(setMessage)
      })()
      renderedRef.current = true
    }
    if (renderedRef.current) {
      const interval = setInterval(async () => {
        const { result: file } = manageResponse(await tcpCommand('1800'))
        const title = document.getElementById('title')
        const filePattern = /^[a-zA-Z]:\\(?:[^\\:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]+\.[a-zA-Z0-9]+$/
        if (filePattern.test(file)) {
          if (title.textContent !== file) {
            const id = extractID(file)
            if (id) {
              await getMatch(id, setMatch)
            }
            await getChapters(file, setChapters)
            title.textContent = file
          }
        }
        const { command, result: status } = manageResponse(await tcpCommand('1000'))
        if (['Not', 'Error'].includes(command)) {
          await connect(setMessage)
        } else {
          if (message.open && message.severity === 'error') {
            setMessage({ ...message, open: false })
          }
        }
        {
          const { result, command } = manageResponse(await tcpCommand('1120'))
          if (command === '1120') {
            const milliBox = document.getElementById('milliBox')
            const elemEff = document.getElementById('time')
            const elemLong = document.getElementById('time_long')
            const elemShort = document.getElementById('time_min')
            const fractionElem = document.getElementById('fraction')
            const time = convertMilli(parseInt(result), halfTimeEnd, initTimeEnd)
            elemEff.textContent = time.effectiveLong
            elemLong.textContent = time.long
            elemShort.textContent = time.short
            milliBox.value = result
            if (fractionElem && !time.short.startsWith('0')) {
              fractionElem.textContent = result > halfTimeEnd ? 'st' : 'pt'
            }
          }
        }
        const button = document.getElementById('play')
        if (status === '3') {
          button.textContent = '⏸'
          
        } else {
          if (command === '1000') {button.textContent = '▶'}
        }
      }, 500)
      return () => clearInterval(interval)
    }
  }, [halfTimeEnd, initTimeEnd, message])
  console.log('match:', match)
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline/>
      <Box display={'flex'}>
        <SeekMinute goTime={goTime}/>
        <Box mb={1} flexGrow={1}>
          <RefereeDisplay match={match}/>
          <input id="milliBox" style={{ display: 'none' }}/>
          <Box
            id="time"
            p={0}
            sx={{
              fontSize: '2rem',
              textAlign: 'center',
              width: '100%',
              margin: 'auto',
            }}
          >
            -:--:--
          </Box>
          <Box
            display={'none'}
            id="time_long"
            p={0}
            sx={{
              fontSize: '0.8rem',
              textAlign: 'center',
              width: '100%',
              margin: 'auto',
            }}
          >
            -:--:--
          </Box>
          <Box display="flex"
               sx={{
                 fontSize: '2rem',
                 textAlign: 'center',
                 justifyContent: 'center',
               }}
          >
            <Box>
              <Button onClick={() => seekMinute('-')} variant="outlined"
                      style={{ marginRight: 15, padding: 0, minWidth: 30 }}>
                -
              </Button>
            </Box>
            <Box display="flex" p={0}>
              <Box id="time_min">--</Box>{Boolean(halfTimeEnd) && <Box id="fraction">&nbsp;</Box>}
            </Box>
            <Box>
              <Button onClick={() => seekMinute('+')} variant="outlined"
                      style={{ marginLeft: 15, padding: 0, minWidth: 30 }}>
                +
              </Button>
            </Box>
          </Box>
          <Box p={1} justifyContent={'center'} display={'flex'}>
            <Button
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              variant="outlined"
              color="primary"
              onClick={setInitTime}>
              I: {initTimeEnd}
            </Button>&nbsp;
            <Button
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              variant="outlined"
              color="primary"
              onClick={setHalfTime}>
              H: {halfTimeEnd}
            </Button>&nbsp;
            <Button variant="outlined" color="primary" onClick={skipBackward}>
              <span style={{ fontSize: '1rem' }}>{'<-'}</span>
            </Button>&nbsp;
            <Box width={400}>
              <TextField
                id="episodeDescription"
                fullWidth
                label="Episodi"
                variant="outlined"
                size="small"
                focused
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyPress={(event) => {
                  if (event.key === 'Enter') {
                    saveChapter()
                    event.preventDefault()
                  }
                }}
              />
            </Box>&nbsp;
            <Button variant="outlined" color="primary" onClick={skipForward}>
              <span style={{ fontSize: '1rem' }}>{'->'}</span>
            </Button>&nbsp;
            <Button variant="outlined" color="primary" onClick={saveChapter}>
              SALVA
            </Button>&nbsp;
            <Button variant="outlined" color="primary" onClick={play}>
              <span id="play" style={{ fontSize: '1rem' }}>⧗</span>
            </Button>
          </Box>
          <Grid container spacing={8} justifyContent="center">
            {Boolean(chapters?.length) && <ChaptersList chapters={chapters} halfTimeEnd={halfTimeEnd} goTime={goTime}/>}
            {match && <MatchInfo match={match} goTime={goTime} chapters={chapters} halfTimeEnd={halfTimeEnd}/>}
          </Grid>
        </Box>
        <SeekMinute goTime={goTime} period={2}/>
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
    </ThemeProvider>
  )
}
