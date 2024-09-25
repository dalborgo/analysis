import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  createTheme,
  CssBaseline,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  ThemeProvider,
} from '@mui/material'
import MuiAlert from '@mui/material/Alert'
import { envConfig } from './init'
import RefereeDisplay from './comp/RefereeDisplay'
import MatchInfo from './comp/MatchInfo'
import ChaptersList from './comp/ChaptersList'
import Grid from '@mui/material/Grid'
import SeekMinute from './comp/SeekMinute'
import ClearIcon from '@mui/icons-material/Clear'
import TagIcon from '@mui/icons-material/Tag'
import DataArrayIcon from '@mui/icons-material/DataArray'
import Hudl from './comp/Hudl'

const PORT = envConfig['BACKEND_PORT']

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
})

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function extractID (path) {
  const fileName = path.split('\\').pop()
  const pattern = /g(\d+)[^0-9]*/
  const match = fileName.match(pattern)
  return match ? match[1] : null
}

function isIntegerOrStringInteger (value) {
  if (Number.isInteger(value)) {
    return true
  } else if (typeof value === 'string' && value.trim() !== '') {
    const parsed = parseInt(value, 10)
    return parsed.toString() === value.trim()
  }
  return false
}

const tolerance = 1
export const convertMilli = (millisecondi, halfTimeEnd = 0, initTimeEnd = 0, fullMode) => {
  if (millisecondi < initTimeEnd) { return { long: '00:00', effectiveLong: '00:00', short: '0′' }}
  const minute45 = 2_700_000
  const secondi = Math.floor((halfTimeEnd && millisecondi > halfTimeEnd ? millisecondi - halfTimeEnd : millisecondi - initTimeEnd) / 1000)
  const minuti = Math.floor(secondi / 60)
  const short = fullMode ? millisecondi > halfTimeEnd ? (minuti % 60) + 45 : minuti % 60 : minuti % 60
  
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
  if (data.ok) {
    return { open: true, text: data.ok ? data.output : data.message, severity: data.ok ? 'success' : 'error' }
  } else {
    return { open: true, text: data.message, severity: 'error' }
  }
}

const tcpCommand = async command => {
  try {
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

async function getHudl (id, setHudl) {
  try {
    const response = await fetch(`http://localhost:${PORT}/hudl/match/${id}`)
    const data = await response.json()
    setHudl(data?.results)
  } catch (error) {
    console.error(error)
  }
}

async function getChapters (file, setChapters) {
  try {
    const response = await fetch(`http://localhost:${PORT}/zoom/chapters?file=${file}`)
    const data = await response.json()
    setChapters(data?.results ?? [])
  } catch (error) {
    setChapters([])
  }
}

export default function App ({ halfTime, initTime = 0, homeDir = false }) {
  const queryParams = new URLSearchParams(window.location.search)
  const hudlId = queryParams.get('hudl')
  const [showLong, setShowLong] = useState(false)
  const [message, setMessage] = useState({ open: false })
  const [match, setMatch] = useState()
  const [hudl, setHudl] = useState()
  const [wyView, setWyView] = useState(!hudlId)
  const [chapters, setChapters] = useState([])
  const [halfTimeEnd, setHalfTimeEnd] = useState(halfTime)
  const [initTimeEnd, setInitTimeEnd] = useState(initTime)
  const [fullMode, setFullMode] = useState(false)
  const [homeDirEnd, setHomeDirEnd] = useState(homeDir)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [longPressTriggered, setLongPressTriggered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const handleLongPressStart = () => {
    setLongPressTriggered(false)
    const timer = setTimeout(() => {
      setHalfTimeEnd(6000000)
      setInitTimeEnd(0)
      localStorage.setItem('halfTimeEnd', '6000000')
      localStorage.setItem('initTimeEnd', '0')
      localStorage.setItem('homeDirEnd', '0')
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
    if (status === '3') {
      button.textContent = '⏸'
      for (const chapter of chapters) {
        const current = document.getElementById('' + (chapter.time * 1000))
        if (current) {current.style.color = 'white'}
      }
    } else {
      button.textContent = '▶'
    }
  }, [chapters])
  const saveChapter = useCallback(async () => {
    const episodeDescription = document.getElementById('episodeDescription')
    const episode = episodeDescription.value
    const elem = document.getElementById('milliBox')
    const timeValue = parseFloat(elem.value) / 1000
    const existingChapter = chapters.find(chapter => Math.abs(chapter.time - timeValue) <= tolerance)
    let newChapters
    if (episode) {
      if (existingChapter) {
        newChapters = chapters.map(chapter => Math.abs(chapter.time - timeValue) <= tolerance
          ?
          {
            time: timeValue,
            text: episode.trim()
          }
          :
          chapter
        )
      } else {
        newChapters = [...chapters, { time: timeValue, text: episode.trim() }]
      }
    } else {
      if (existingChapter) {
        for (const chapter of chapters) {
          const current = document.getElementById('' + (chapter.time * 1000))
          if (current) {current.style.color = 'white'}
        }
        newChapters = chapters.filter(chapter => Math.abs(chapter.time - timeValue) > tolerance)
      } else {
        return
      }
    }
    newChapters.sort((a, b) => a.time - b.time)
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
  const prevFrame = useCallback(async () => {
    await tcpCommand('5100 fnPrevFrame')
  }, [])
  const nextFrame = useCallback(async () => {
    await tcpCommand('5100 fnNextFrame')
  }, [])
  const goTime = useCallback(async (eventTime, direct = false) => {
    if (direct) {return tcpCommand(`5000 ${eventTime}`)}
    const { minute, period } = eventTime || {}
    const to = period === 2 && halfTimeEnd ? minute * 60000 + parseInt(halfTimeEnd) : (minute * 60000) + parseInt(initTimeEnd)
    await tcpCommand(`5000 ${(to - 59000) / 1000}`) // 59 per arrotondamento
  }, [halfTimeEnd, initTimeEnd])
  const goToEndTime = useCallback(async () => {
    await tcpCommand('5100 fnReloadCurrent')
    let endTime
    await sleep(1000)
    do {
      const { result } = manageResponse(await tcpCommand('1110'))
      endTime = Number(result)
      if (Number.isInteger(endTime) && endTime > 100) {break}
      await sleep(300)
    } while (true)
    await goTime(endTime / 1000 - 8, true)
  }, [goTime])
  const seekMinute = useCallback(async dir => {
    const elem = document.getElementById('time_min')
    const fraction = document.getElementById('fraction')
    const minute = fullMode ? parseInt(elem.textContent.replace('′', '')) - 45 : parseInt(elem.textContent.replace('′', ''))
    await goTime({ minute: dir === '+' ? minute + 1 : minute - 1, period: fraction.textContent === 'st' ? 2 : 1 })
  }, [fullMode, goTime])
  const setHalfTime = useCallback(async () => {
    if (!longPressTriggered) {
      const { result } = manageResponse(await tcpCommand('1120'))
      if (isIntegerOrStringInteger(result)) {
        localStorage.setItem('halfTimeEnd', result.toString())
        setHalfTimeEnd(result)
      } else {
        setHalfTimeEnd('Error')
      }
    }
  }, [longPressTriggered])
  const setInitTime = useCallback(async () => {
    if (!longPressTriggered) {
      const { result } = manageResponse(await tcpCommand('1120'))
      if (isIntegerOrStringInteger(result)) {
        localStorage.setItem('initTimeEnd', result.toString())
        setInitTimeEnd(result)
      } else {
        setInitTimeEnd('Error')
      }
    }
  }, [longPressTriggered])
  const setHomeDir = useCallback(async () => {
    if (!longPressTriggered) {
      const direction = document.getElementById('direction')
      direction.textContent = direction.textContent.includes('◀') ?
        direction.textContent.replace('◀', '▶')
        :
        direction.textContent.replace('▶', '◀')
      if (direction.textContent.startsWith('2')) {
        localStorage.setItem('homeDirEnd', homeDirEnd ? '1' : '0')
        setHomeDirEnd(!homeDirEnd)
      } else {
        localStorage.setItem('homeDirEnd', homeDirEnd ? '0' : '1')
        setHomeDirEnd(!homeDirEnd)
      }
    }
  }, [homeDirEnd, longPressTriggered])
  const handleKeyPress = useCallback(event => {
    if (!isFocused) {
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault()
          skipForward()
          return
        case 'ArrowLeft':
          event.preventDefault()
          skipBackward()
          return
        case 'ArrowUp':
          event.preventDefault()
          nextFrame()
          return
        case 'ArrowDown':
          event.preventDefault()
          prevFrame()
          return
        case ' ':
          event.preventDefault()
          play()
          return
        default:
          break
      }
    }
    const elem = document.getElementById('episodeDescription')
    const getValue = () => elem.value.trim().replace(/\[.*?]\s*/, '')
    switch (event.code) {
      case 'F1':
        elem.value = `[TEC] ${getValue() ? `${getValue()} ` : ''}`
        break
      case 'F2':
        elem.value = `[PREV] ${getValue() ? `${getValue()} ` : ''}`
        break
      case 'F4':
        elem.value = `[DIS] ${getValue() ? `${getValue()} ` : ''}`
        break
      case 'F7':
        elem.value = `[COLL] ${getValue() ? `${getValue()} ` : ''}`
        break
      case 'F8':
        elem.value = `[TATT] ${getValue() ? `${getValue()} ` : ''}`
        break
      case 'F9':
        elem.value = `[PERS] ${getValue() ? `${getValue()} ` : ''}`
        break
      case 'F6':
      case 'Pause':
        elem.value = `[SOGL] ${getValue() ? `${getValue()} ` : ''}`
        break
      case 'ControlLeft':
        elem.value = `[AA1] ${getValue() ? `${getValue()} ` : ''}`
        break
      case 'ControlRight':
        elem.value = `[AA2] ${getValue() ? `${getValue()} ` : ''}`
        break
      default:
        break
    }
    elem.focus()
  }, [isFocused, skipForward, skipBackward, prevFrame, nextFrame, play])
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
        if (hudlId) {
          await getHudl(hudlId, setHudl)
        }
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
            const direction = document.getElementById('direction')
            const time = convertMilli(parseInt(result), halfTimeEnd, initTimeEnd, fullMode)
            if (elemEff) {elemEff.textContent = time.effectiveLong}
            elemLong.textContent = time.long
            elemShort.textContent = time.short
            milliBox.value = result
            if (fractionElem && !time.short.startsWith('0')) {
              const nextPeriod = parseInt(result) > parseInt(halfTimeEnd) ? 'st' : 'pt'
              if (fractionElem.textContent !== nextPeriod) {
                const savedHomeDir = localStorage.getItem('homeDirEnd')
                const homeDir = savedHomeDir ? Boolean(parseInt(savedHomeDir, 0)) : false
                if (nextPeriod === 'pt') {
                  setHomeDirEnd(homeDir)
                  direction.textContent = homeDir ? '1°◀' : '1°▶'
                } else {
                  setHomeDirEnd(!homeDir)
                  direction.textContent = homeDir ? '2°▶' : '2°◀'
                }
                fractionElem.textContent = nextPeriod
              }
            }
          }
        }
        const button = document.getElementById('play')
        if (status === '3') {
          if (button.textContent !== '⏸') {
            button.textContent = '⏸'
          }
        } else {
          if (command === '1000') {
            if (button.textContent !== '▶') {
              button.textContent = '▶'
            } else {
              const milliBox = document.getElementById('milliBox')
              const matchTime = parseFloat(milliBox.value)
              for (const chapter of chapters) {
                const current = document.getElementById('' + (chapter.time * 1000))
                if (!current) {continue}
                const chapterTime = chapter.time * 1000
                if (Math.abs(chapterTime - matchTime) <= tolerance) {
                  if (current) {current.style.color = 'yellow'}
                } else {
                  if (current) {current.style.color = 'white'}
                }
              }
            }
          }
        }
      }, 500)
      return () => clearInterval(interval)
    }
  }, [chapters, fullMode, halfTimeEnd, homeDirEnd, hudlId, initTimeEnd, message])
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline/>
      <Box display="flex">
        <SeekMinute
          goTime={goTime}
        />
        <Box mb={1} flexGrow={1}>
          <Box width={70} display="flex" flexDirection="column" position="absolute" pt={1}>
            <Button
              color="primary"
              id="direction"
              onClick={setHomeDir}
              onMouseDown={handleLongPressStart}
              onMouseLeave={handleLongPressEnd}
              onMouseUp={handleLongPressEnd}
              style={{ marginBottom: 4 }}
              variant="outlined"
            >
              --
            </Button>
            <Button
              color="primary"
              onClick={setInitTime}
              onMouseDown={handleLongPressStart}
              onMouseLeave={handleLongPressEnd}
              onMouseUp={handleLongPressEnd}
              style={{ marginBottom: 4 }}
              variant="outlined"
            >
              {initTimeEnd || 0}
            </Button>
            <Button
              color="primary"
              onClick={setHalfTime}
              onMouseDown={handleLongPressStart}
              onMouseLeave={handleLongPressEnd}
              onMouseUp={handleLongPressEnd}
              variant="outlined"
            >
              <span style={{ fontSize: 'small' }}>
                {halfTimeEnd || 0}
              </span>
            </Button>
          </Box>
          <RefereeDisplay match={match}/>
          <input id="milliBox" style={{ display: 'none' }}/>
          <Box
            id="time"
            onClick={() => setShowLong(!showLong)}
            p={0}
            sx={{
              cursor: 'pointer',
              fontSize: '2rem',
              textAlign: 'center',
              width: '100%',
              margin: 'auto',
            }}
          >
            --:--
          </Box>
          <Box
            display={showLong ? undefined : 'none'}
            id="time_long"
            p={0}
            sx={{
              fontSize: '1rem',
              textAlign: 'center',
              width: '100%',
              margin: 'auto',
            }}
          >
            --:--
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
          <Box p={1} justifyContent="center" display="flex" mb={2}>
            <Button variant="outlined" color="secondary" onClick={goToEndTime} tabIndex={-1} size="small">
              <span style={{ fontSize: '1rem' }}>{'LIVE'}</span>
            </Button>&nbsp;
            <Button variant="outlined" color="primary" onClick={skipBackward}>
              <span style={{ fontSize: '1rem' }}>{'<-'}</span>
            </Button>&nbsp;
            <Box width="60%">
              <TextField
                id="episodeDescription"
                fullWidth
                label="Episodi"
                variant="outlined"
                size="small"
                focused
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onWheel={event => {
                  if (event.deltaY < 0) {
                    const elem = document.getElementById('addTagButton')
                    elem.click()
                  }
                }}
                onKeyPress={(event) => {
                  if (event.key === 'Enter') {
                    saveChapter()
                    event.preventDefault()
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="tag text"
                        onClick={() => {
                          const elem = document.getElementById('episodeDescription')
                          elem.value = `${elem.value}#`
                          elem.focus()
                        }}
                        edge="end"
                        id="addTagButton"
                        size="small"
                        color="primary"
                        style={{ padding: 2 }}
                        tabIndex={-1}
                      >
                        <TagIcon fontSize="small"/>
                      </IconButton>
                      <IconButton
                        aria-label="brackets text"
                        onClick={() => {
                          const elem = document.getElementById('episodeDescription')
                          const getValue = () => elem.value.trim().replace(/\[.*?]\s*/, '')
                          elem.value = `[] ${getValue() ? `${getValue()} ` : ''}`
                          elem.focus()
                          const cursorPosition = 1
                          elem.setSelectionRange(cursorPosition, cursorPosition)
                        }}
                        edge="end"
                        id="addBracketsButton"
                        size="small"
                        color="primary"
                        style={{ padding: 2 }}
                        tabIndex={-1}
                      >
                        <DataArrayIcon fontSize="small"/>
                      </IconButton>
                      <IconButton
                        aria-label="clear text"
                        onClick={() => {
                          const elem = document.getElementById('episodeDescription')
                          elem.value = ''
                        }}
                        edge="end"
                        size="small"
                        color="primary"
                        style={{ padding: 2 }}
                        tabIndex={-1}
                      >
                        <ClearIcon fontSize="small"/>
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>&nbsp;
            <Button variant="outlined" color="primary" onClick={skipForward} tabIndex={-1}>
              <span style={{ fontSize: '1rem' }}>{'->'}</span>
            </Button>&nbsp;
            <Button variant="outlined" color="primary" onClick={saveChapter} tabIndex={-1}>
              SALVA
            </Button>&nbsp;
            <Button variant="outlined" color="primary" onClick={play} tabIndex={-1}>
              <span id="play" style={{ fontSize: '1rem' }}>⧗</span>
            </Button>
          </Box>
          <Grid container justifyContent="center">
            {
              Boolean(chapters?.length) &&
              <ChaptersList
                chapters={chapters}
                fullMode={fullMode}
                goTime={goTime}
                halfTimeEnd={halfTimeEnd}
                initTimeEnd={initTimeEnd}
              />
            }
            {
              (match && wyView) &&
              <MatchInfo
                match={match}
                goTime={goTime}
                chapters={chapters}
                halfTimeEnd={halfTimeEnd}
                fullMode={fullMode}
                mirrorMode={homeDirEnd}
              />
            }
            {
              (hudl && !wyView) &&
              <Hudl
                halfTimeEnd={halfTimeEnd}
                hudl={hudl}
                initTimeEnd={initTimeEnd}
                goTime={goTime}
              />
            }
          </Grid>
        </Box>
        <SeekMinute
          fullMode={fullMode}
          goTime={goTime}
          halfTimeEnd={halfTimeEnd}
          period={2}
          setFullMode={setFullMode}
          setWyView={setWyView}
          wyView={wyView}
        />
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
