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
import CallMissedOutgoingIcon from '@mui/icons-material/CallMissedOutgoing'
import DataArrayIcon from '@mui/icons-material/DataArray'
import Hudl, { generateClip, parseAuthValue } from './comp/Hudl'
import Dialer from './comp/Dialer'

const queryParams = new URLSearchParams(window.location.search)
const hudlId = queryParams.get('hudl')
const player = queryParams.get('p') || 'zoom'
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

const convertToMilliseconds = (minuteSeconds, initTimeEnd, halfTimeEnd, fullMode = false, isSecondHalf = false) => {
  if (!/^\d+$/.test(minuteSeconds)) {return NaN}
  let gap = isSecondHalf && halfTimeEnd ? halfTimeEnd : initTimeEnd || 0
  if (minuteSeconds.startsWith('0')) {
    let seconds = parseInt(minuteSeconds, 10)
    return (seconds * 1000) + parseInt(gap, 10)
  }
  const num = parseInt(minuteSeconds, 10)
  const str = num.toString()
  let minutes, seconds
  
  if (str.length <= 2) {
    minutes = num
    seconds = 0
  } else {
    seconds = parseInt(str.slice(-2), 10)
    minutes = parseInt(str.slice(0, -2) || '0', 10)
  }
  if (fullMode && isSecondHalf && minutes < 45) {return 0}
  if (isSecondHalf && (minutes > 50 || fullMode)) {minutes = Math.max(0, minutes - 45)}
  if (!isSecondHalf && minutes > 50) {
    gap = halfTimeEnd
    minutes = Math.max(0, minutes - 45)
  }
  return (minutes * 60000) + (seconds * 1000) + parseInt(gap, 10)
}

const formatTime = (timeStr, fullMode = false, isSecondHalf = false) => {
  if (!/^\d+$/.test(timeStr)) {return '00:00'}
  if (timeStr.startsWith('0')) {
    let seconds = parseInt(timeStr, 10)
    return `00:${String(seconds).padStart(2, '0')}`
  }
  const num = parseInt(timeStr, 10)
  const str = num.toString()
  let minutes, seconds
  
  if (str.length <= 2) {
    minutes = num
    seconds = 0
  } else {
    seconds = parseInt(str.slice(-2), 10)
    minutes = parseInt(str.slice(0, -2) || '0', 10)
  }
  const origMinutes = minutes
  if (fullMode && isSecondHalf && minutes < 45) {return}
  if (isSecondHalf && (minutes > 50 || fullMode)) {minutes = Math.max(0, minutes - 45)}
  if (!isSecondHalf && minutes > 50) {minutes = Math.max(0, minutes - 45)}
  const output = []
  output.push(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
  if (isSecondHalf || (!isSecondHalf && origMinutes > 50)) {
    output.push(`${String(minutes + 45).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
  }
  return output.length > 1 ? output.join(' / ') : output[0]
}

const tolerance = 2
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
  const effectiveLongSimple = getTime(secondi)
  const long = getTimeLong(Math.floor(millisecondi / 1000))
  return {
    long,
    effectiveLong,
    effectiveLongSimple,
    short: `${short + 1}′`,
    period: millisecondi > halfTimeEnd ? 'st' : 'pt'
  }
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
    const response = await fetch(`http://localhost:${PORT}/${player}/command?code=${command}`)
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
    const response = await fetch(`http://localhost:${PORT}/${player}/connect`)
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

const findObjIdByFilename = (matches, file) => {
  let matchData = file.match(/(\d{4}-\d{2}-\d{2}) (.+?) - (.+?) \d - \d/)
  
  if (!matchData) {
    matchData = file.match(/(\d{4})(\d{2})(\d{2})_(.+?)vs(.+?)_/)
    if (!matchData) {return null}
    const [, year, month, day, teamA, teamB] = matchData
    matchData = ['', `${year}-${month}-${day}`, teamA, teamB]
  }
  
  const [, dateStr, teamA, teamB] = matchData
  const inputDate = new Date(dateStr)
  
  const normalized = str => str.toLowerCase().replace(/[^a-z]/g, '')
  const matched = matches.find(m => {
    const matchDateParts = m.data.split(' ')[0].split('/')
    const matchDate = new Date(`${matchDateParts[2]}-${matchDateParts[1]}-${matchDateParts[0]}`)
    return (
      Math.abs(matchDate - inputDate) <= 24 * 3600 * 1000 &&
      (
        normalized(m.teamAName).includes(normalized(teamA)) ||
        normalized(m.teamBName).includes(normalized(teamA)) ||
        normalized(m.teamAName).includes(normalized(teamB)) ||
        normalized(m.teamBName).includes(normalized(teamB))
      )
    )
  })
  return matched ? matched.objId : null
}

async function getIdByDay (file) {
  if (!file) {return}
  try {
    const response = await fetch(`http://localhost:${PORT}/wyscout/calendar-ids/0`)
    const data = await response.json()
    return findObjIdByFilename(data['results'], file)
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

const switchPlayer = () => {
  const newPlayer = player === 'zoom' ? 'vlc' : 'zoom'
  const url = new URL(window.location.href)
  
  url.searchParams.set('p', newPlayer)
  
  if (hudlId) {
    url.searchParams.set('hudl', hudlId)
  }
  
  window.location.href = url.toString()
}

function vBlank (chapters) {
  for (const chapter of chapters) {
    const current = document.getElementById('' + (chapter.time * 1000))
    if (current) {current.style.color = 'white'}
  }
}

const parseTimeToSeconds = timeStr => {
  if (!timeStr) return null
  const parts = timeStr.split(':').map(Number)
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    return hours * 3600 + minutes * 60 + seconds
  }
  return null
}

function RecButton ({ matchId }) {
  const [isRecording, setIsRecording] = useState(false)
  const [startData, setStartData] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const toggleRecording = async () => {
    const currentTime = document.getElementById('time_long')?.textContent || null
    const elem = document.getElementById('episodeDescription')
    const value = elem?.value
    if (!value) {
      return elem.focus()
    }
    const obj = parseAuthValue(value)
    if (!isRecording) {
      setStartData(currentTime)
    } else {
      const toRecordClip = {
        start: parseTimeToSeconds(startData),
        end: parseTimeToSeconds(currentTime),
      }
      setIsGenerating(true)
      if (toRecordClip.end - toRecordClip.start > 5) {
        await generateClip(obj['matchId'] || matchId, toRecordClip, true)
      }
      setIsGenerating(false)
    }
    
    setIsRecording(!isRecording)
  }
  return (
    <Button
      onClick={toggleRecording}
      color={isRecording ? 'secondary' : 'primary'}
      tabIndex={-1}
      disabled={isGenerating}
      variant="outlined"
    >
      <span style={{ whiteSpace: 'nowrap' }}>⏺ REC</span>
    </Button>
  )
}

export default function App ({ halfTime, initTime = 0, homeDir = false }) {
  const [showLong, setShowLong] = useState(false)
  const [showSTDetail, setShowSTDetail] = useState(false)
  const [message, setMessage] = useState({ open: false })
  const [match, setMatch] = useState()
  const [hudl, setHudl] = useState()
  const [wyView, setWyView] = useState(!hudlId)
  const [chapters, setChapters] = useState([])
  const [lastTime, setLastTime] = useState(0)
  const [halfTimeEnd, setHalfTimeEnd] = useState(halfTime)
  const [initTimeEnd, setInitTimeEnd] = useState(initTime)
  const [fullMode, setFullMode] = useState(false)
  const [homeDirEnd, setHomeDirEnd] = useState(homeDir)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [longPressTriggered, setLongPressTriggered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [hasDialer] = useState(false)
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
  const handleLongPressGo = event => {
    const time = event.target.id === 'skipBackward' ? initTimeEnd : halfTimeEnd
    setLongPressTriggered(false)
    const timer = setTimeout(async () => {
      await goTime(time / 1000, true)
      setLongPressTriggered(true)
    }, 1000)
    
    setLongPressTimer(timer)
  }
  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setTimeout(() => setLongPressTriggered(false), 0)
  }
  const renderedRef = useRef(false)
  const handleClose = useCallback(() => {
    setMessage({ ...message, open: false })
  }, [message])
  const play = useCallback(async () => {
    await tcpCommand('5100 fnPlay')
    const { result: status } = manageResponse(await tcpCommand('1000'))
    const button = document.getElementById('play')
    if (status === '3') {
      button.textContent = '⏸'
      vBlank(chapters)
    } else {
      button.textContent = '▶'
    }
  }, [chapters])
  const showBar = useCallback(async () => {
    await tcpCommand('5100 fnBar')
  }, [])
  const minimize = useCallback(async () => {
    await tcpCommand('5100 fnMinimize')
  }, [])
  const seekLongAhead = useCallback(async () => {
    await tcpCommand('5100 fnSeekForward')
  }, [])
  const seekLongBack = useCallback(async () => {
    await tcpCommand('5100 fnSeekBackward')
  }, [])
  const goTime = useCallback(async (eventTime, direct = false) => {
    if (direct) {return tcpCommand(`5000 ${eventTime}`)}
    const { minute, period } = eventTime || {}
    const to = period === 2 && halfTimeEnd ? minute * 60000 + parseInt(halfTimeEnd, 10) : minute * 60000 + parseInt(initTimeEnd, 10)
    await tcpCommand(`5000 ${(to - 59000) / 1000}`) // 59 per arrotondamento
  }, [halfTimeEnd, initTimeEnd])
  const saveChapter = useCallback(async event => {
    if (player === 'vlc') {return}
    const episodeDescription = document.getElementById('episodeDescription')
    const elem = document.getElementById('milliBox')
    const isGoButton = event?.currentTarget?.id === 'goTagButton'
    const isSaveButton = event?.currentTarget?.id === 'directSave' || event?.currentTarget?.id === 'dialer-invio'
    let episodeRaw = episodeDescription.value?.trim()
    const isSecondHalf = parseInt(elem.value, 10) > parseInt(halfTimeEnd, 10)
    const getFastMode = (val) => /^\d+$/.test(val)
    const calculateTimeValue = (val) =>
      getFastMode(val)
        ? convertToMilliseconds(val, initTimeEnd, halfTimeEnd, fullMode, isSecondHalf) / 1000
        : parseFloat(elem.value) / 1000
    let fastMode = getFastMode(episodeRaw)
    let timeValue = calculateTimeValue(episodeRaw)
    const existingChapter = chapters.find(
      chapter => Math.abs(chapter.time - timeValue) <= tolerance
    )
    if (!episodeRaw && isSaveButton && !existingChapter) {
      const elemEff = document.getElementById('time')
      episodeRaw = elemEff.textContent.replace(':', '').replace(/^0(?!0)/, '')
      fastMode = getFastMode(episodeRaw)
      timeValue = calculateTimeValue(episodeRaw)
    }
    const episode = fastMode
      ? formatTime(episodeRaw, fullMode, isSecondHalf)
      : episodeRaw
    if (fastMode && isGoButton) {
      await goTime(timeValue, true)
      episodeDescription.value = ''
      return
    }
    if (timeValue === 0) {return episodeDescription.value = ''}
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
        setLastTime(timeValue)
        vBlank(chapters)
        newChapters = [...chapters, { time: timeValue, text: episode.trim() }]
      }
    } else {
      if (existingChapter && !isGoButton) {
        vBlank(chapters)
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
    await fetch(`http://localhost:${PORT}/${player}/write-bookmark`, {
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
  }, [chapters, fullMode, goTime, halfTimeEnd, initTimeEnd])
  const skipForward = useCallback(async () => {
    if (!longPressTriggered) {
      await tcpCommand('5100 fnSkipForward')
    }
  }, [longPressTriggered])
  const skipBackward = useCallback(async () => {
    if (!longPressTriggered) {
      await tcpCommand('5100 fnSkipBackward')
    }
  }, [longPressTriggered])
  const prevFrame = useCallback(async () => {
    if (player === 'vlc') {
      const button = document.getElementById('play')
      if (button.textContent === '⏸') {
        button.click()
      }
    }
    await tcpCommand('5100 fnPrevFrame')
  }, [])
  const nextFrame = useCallback(async () => {
    if (player === 'vlc') {
      const button = document.getElementById('play')
      if (button.textContent === '⏸') {
        button.click()
      }
    }
    await tcpCommand('5100 fnNextFrame')
  }, [])
  const goToEndTime = useCallback(async () => {
    await tcpCommand('5100 fnReloadCurrent')
    const text = 'Perfect!'
    if (player === 'vlc') {
      setMessage({ open: true, text, severity: 'success' })
    } else {
      /*await sleep(500)
      const { result } = manageResponse(await tcpCommand('1110'))
      const endTime = Number(result)
      if (Number.isInteger(endTime) && endTime > 100) {
        setMessage({ open: true, text, severity: 'success' })
        await goTime(endTime / 1000 - 8, true)
      } else {
        setMessage({ open: true, text: `endTime: ${endTime}`, severity: 'error' })
      }*/
      await sleep(500)
      let attempts = 0
      do {
        const { result } = manageResponse(await tcpCommand('1110'))
        const endTime = Number(result)
        if (Number.isInteger(endTime) && endTime > 100) {
          setMessage({ open: true, text: `endTime: ${endTime}`, severity: 'success' })
          await goTime(endTime / 1000 - 8, true)
          break
        }
        setMessage({ open: true, text: `attempt: ${attempts} - endTime: ${endTime}`, severity: 'error' })
        await sleep(300)
        attempts++
      } while (attempts < 20)
    }
  }, [goTime])
  const seekMinute = useCallback(async dir => {
    const elem = document.getElementById('time_min')
    const fraction = document.getElementById('fraction')
    const minute = fullMode ? parseInt(elem.textContent.replace('′', ''), 10) - 45 : parseInt(elem.textContent.replace('′', ''), 10)
    await goTime({ minute: dir === '+' ? minute + 1 : minute - 1, period: fraction.textContent === 'st' ? 2 : 1 })
  }, [fullMode, goTime])
  const setHalfTime = useCallback(async () => {
    if (!longPressTriggered) {
      if (halfTimeEnd === 6000000) {
        await goTime(match?.['metadata'].halfTime, true)
      }
      const { result } = manageResponse(await tcpCommand('1120'))
      if (isIntegerOrStringInteger(result)) {
        localStorage.setItem('halfTimeEnd', result.toString())
        setHalfTimeEnd(result)
      } else {
        setHalfTimeEnd('Error')
      }
    }
  }, [goTime, halfTimeEnd, longPressTriggered, match])
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
        case 'Backspace':
          event.preventDefault()
          showBar()
          return
        case 'End':
          event.preventDefault()
          minimize()
          return
        case 'Home':
          event.preventDefault()
          seekLongAhead()
          return
        case 'Insert':
          event.preventDefault()
          seekLongBack()
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
        elem.value = `[SOGL] ${getValue() ? `${getValue()} ` : ''}`
        break
      case 'F3':
        event.preventDefault()
        elem.value = `[PREV] ${getValue() ? `${getValue()} ` : ''}`
        break
      case 'F4':
        elem.value = `[DIS] ${getValue() ? `${getValue()} ` : ''}`
        break
      case 'F6':
        event.preventDefault()
        elem.value = `${elem.value}#`
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
      case 'F10':
        event.preventDefault()
        elem.value = `[AA1] ${getValue() ? `${getValue()} ` : ''}`
        break
      case 'F11':
        event.preventDefault()
        elem.value = `[AA2] ${getValue() ? `${getValue()} ` : ''}`
        break
      default:
        break
    }
    elem.focus()
  }, [isFocused, seekLongAhead, seekLongBack, skipForward, skipBackward, nextFrame, prevFrame, showBar, minimize, play])
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])
  useEffect(() => {
    if (message.open && message.severity === 'success') {
      const timer = setTimeout(() => {
        handleClose()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [message, handleClose])
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
        if (filePattern.test(file) || (player === 'vlc' && file !== 'from VLC Player')) {
          if (title.textContent !== file) {
            const id = extractID(file)
            if (id) {
              await getMatch(id, setMatch)
            } else {
              if (file?.split(/[/\\]/).pop().length > 20) {
                const id = await getIdByDay(file)
                if (id) {
                  await getMatch(id, setMatch)
                }
              }
            }
            await getChapters(file, setChapters)
            title.innerHTML = `<span title="${file}" style="cursor: help">${file.split('\\').pop()}</span>`
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
          const { command, result } = manageResponse(await tcpCommand('1120'))
          if (command === '1120') {
            const milliBox = document.getElementById('milliBox')
            const elemEff = document.getElementById('time')
            const elemLong = document.getElementById('time_long')
            const elemShort = document.getElementById('time_min')
            const elemDetail = document.getElementById('time_min_detail')
            const fractionElem = document.getElementById('fraction')
            const direction = document.getElementById('direction')
            const time = convertMilli(parseInt(result, 10), halfTimeEnd, initTimeEnd, fullMode)
            if (elemEff) {elemEff.textContent = time.effectiveLong === 'NaN:NaN' ? '--:--' : time.effectiveLong}
            if (elemLong) {elemLong.textContent = time.long === 'NaN:NaN:NaN' ? '--:--' : time.long}
            if (elemShort) {elemShort.textContent = time.short === 'NaN′' ? '--' : time.short}
            if (elemDetail) {elemDetail.textContent = time.short === 'NaN′' ? '--' : time.effectiveLongSimple}
            milliBox.value = result
            if (fractionElem && !time.short.startsWith('0')) {
              const nextPeriod = parseInt(result, 10) > parseInt(halfTimeEnd, 10) ? 'st' : 'pt'
              if (fractionElem.textContent !== nextPeriod) {
                const savedHomeDir = localStorage.getItem('homeDirEnd')
                const homeDir = savedHomeDir ? Boolean(parseInt(savedHomeDir, 10)) : false
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
            vBlank(chapters)
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
  }, [chapters, fullMode, halfTimeEnd, homeDirEnd, initTimeEnd, lastTime, message])
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline/>
      <Box display="flex">
        <SeekMinute
          goTime={goTime}
        />
        <Box mb={1} flexGrow={1}>
          <Box width={70} display="flex" flexDirection="column" position="absolute" pt={1}>
            <Box display="flex">
              <Button
                id="direction"
                onClick={setHomeDir}
                onMouseDown={handleLongPressStart}
                onMouseLeave={handleLongPressEnd}
                onMouseUp={handleLongPressEnd}
                variant="outlined"
              >
                --
              </Button>&nbsp;
              <Button
                variant="outlined"
                color={player === 'zoom' ? 'primary' : 'secondary'}
                onClick={switchPlayer}
              >
              <span style={{ fontSize: 'small' }}>
                {player === 'zoom' ? 'Z' : 'V'}
              </span>
              </Button>
            </Box>
            <Box display="flex" style={{ marginTop: 4 }}>
              <Button
                onClick={setInitTime}
                onMouseDown={handleLongPressStart}
                onMouseLeave={handleLongPressEnd}
                onMouseUp={handleLongPressEnd}
                variant="outlined"
              >
                {initTimeEnd || 0}
              </Button>&nbsp;
              <Button
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
            <Box display="flex" p={0} onClick={() => setShowSTDetail(!showSTDetail)} sx={{ cursor: 'pointer' }}>
              <Box id="time_min" style={{ display: showSTDetail ? 'none' : 'block' }}>--</Box>
              <Box id="time_min_detail" style={{ display: !showSTDetail ? 'none' : 'block' }}>--</Box>
              {Boolean(halfTimeEnd) && <Box id="fraction" sx={{ marginLeft: showSTDetail ? 1 : 0 }}>&nbsp;</Box>}
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
              <span style={{ fontSize: '1rem' }}>LIVE</span>
            </Button>&nbsp;
            <Button
              id="skipBackward"
              variant="outlined"
              color="primary"
              onClick={skipBackward}
              onMouseDown={handleLongPressGo}
              onMouseLeave={handleLongPressEnd}
              onMouseUp={handleLongPressEnd}
              style={{ fontSize: '1rem' }}
              tabIndex={-1}
            >
              {'<-'}
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
                onKeyPress={event => {
                  if (event.key === 'Enter') {
                    player === 'zoom' && saveChapter()
                    event.preventDefault()
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="tag text"
                        onClick={saveChapter}
                        edge="end"
                        id="goTagButton"
                        size="small"
                        color="primary"
                        style={{ padding: 2, marginRight: 5 }}
                        tabIndex={-1}
                      >
                        <CallMissedOutgoingIcon fontSize="small"/>
                      </IconButton>
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
            <Button
              id="skipForward"
              variant="outlined"
              color="primary"
              onClick={skipForward}
              onMouseDown={handleLongPressGo}
              onMouseLeave={handleLongPressEnd}
              onMouseUp={handleLongPressEnd}
              style={{ fontSize: '1rem' }}
              tabIndex={-1}
            >
              {'->'}
            </Button>&nbsp;
            {
              player === 'zoom' &&
              <>
                <Button id="directSave" variant="outlined" color="primary" onClick={saveChapter} tabIndex={-1}>
                  SALVA
                </Button>&nbsp;
              </>
            }
            <Button variant="outlined" color="primary" onClick={play} tabIndex={-1}>
              <span id="play" style={{ fontSize: '1rem' }}>⧗</span>
            </Button>&nbsp;
            <RecButton matchId={match?.['matchId']}/>
          </Box>
          <Grid container justifyContent="center">
            {
              (Boolean(chapters?.length) && wyView) &&
              <ChaptersList
                chapters={chapters}
                fullMode={fullMode}
                goTime={goTime}
                halfTimeEnd={halfTimeEnd}
                hasDialer={hasDialer}
                initTimeEnd={initTimeEnd}
                lastTime={lastTime}
                match={match}
              />
            }
            {
              (hasDialer && !match) &&
              <Dialer fullMode={fullMode} saveChapter={saveChapter}/>
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
                goTime={goTime}
                halfTimeEnd={halfTimeEnd}
                hudl={hudl}
                initTimeEnd={initTimeEnd}
                matchId={match?.['matchId']}
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
        anchorOrigin={{ vertical: wyView ? 'bottom' : 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={message.severity}>
          {message.text}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  )
}
