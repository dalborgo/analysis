import React, { useState } from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import Link from '@mui/material/Link'
import { convertMilli } from '../App'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { envConfig } from '../init'

const PORT = envConfig['BACKEND_PORT']

const renderTitle = title => {
  const parts = title.split('-')
  const filtered = parts.filter((_, index) => index !== 1 && index !== 2)
  return [
    filtered.map((chunk, index) => {
      switch (index) {
        case 0:
          return <span>[{chunk}]</span>
        case 1:
          return <span style={{ marginLeft: chunk ? 8 : 0, color: '#90CAF9' }}>{chunk}</span>
        case 2:
          return <span style={{ marginLeft: chunk ? 10 : 0, color: '#a2f890' }}>{chunk}</span>
        case 3:
          return <span style={{ marginLeft: chunk ? 10 : 0, color: '#f5afef' }}>{chunk}</span>
        case 4:
          return <span style={{ marginLeft: chunk ? 10 : 0, color: '#f9fd9c' }}>{chunk}</span>
        case 5:
          return <span style={{ marginLeft: chunk ? 10 : 0, color: '#E1BA75' }}>{chunk}</span>
        default:
          return chunk
      }
    }),
    filtered.map((chunk, index) => {
      switch (index) {
        case 0:
          return `[${chunk}]`
        default:
          return chunk
      }
    })
  ]
}
const renderAssessment = value => {
  switch (value) {
    case 'POS':
      return [<span style={{ color: '#3fc520', fontWeight: 'bold' }}>POS</span>, 'POS']
    case 'NEG':
      return [<span style={{ color: 'red', fontWeight: 'bold' }}>NEG</span>, 'NEG']
    case 'POS/NEG':
      return [<span style={{ color: 'orange', fontWeight: 'bold' }}>POS/NEG</span>, 'POS/NEG']
    default:
      return [<span style={{ color: 'orange', fontWeight: 'bold' }}>NEG/POS</span>, 'NEG/POS']
  }
}
const renderDay = date => {
  const parts = date.split('/')
  return parts.pop()
}
const predefinedStrings = ['Espulsione', 'DOGSO', 'RIGORE', 'Rigore', 'Seconda Ammonizione', 'Grave Fallo di Gioco', 'Condotta Violenta', 'Rete', 'Fattuale', 'Scambio Persona']

function containsAnyNeg (targetString) {
  return predefinedStrings.some(str => targetString.includes(str) && !targetString.includes('Non Concesso OK'))
}

function containsAnyPos (targetString) {
  return predefinedStrings.some(str => targetString.includes(str))
}

export const parseAuthValue = value => {
  const regex = /^g(\d{7})-(\w{40})$/
  const match = value.match(regex)
  if (match) {
    return {
      matchId: match[1],
      dtk: match[2]
    }
  }
  return {
    matchId: '',
    dtk: value
  }
}

export async function generateClip (matchId, { end, start }, forceDownload = false) {
  try {
    const elem = document.getElementById('episodeDescription')
    const value = elem?.value
    if (!value) {return elem.focus()}
    const obj = parseAuthValue(value)
    const response = await fetch(`http://localhost:${PORT}/wyscout/generate-clip/${obj['matchId'] || matchId}?end=${end}&start=${start}&dtk=${obj['dtk']}&asBlob=${forceDownload ? 'true' : ''}`)
    if (forceDownload) {
      const blob = await response.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${start}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } else {
      const data = await response.json()
      if (data.ok) {
        const link = data.results
        window.open(link, '_blank')
      }
    }
    
  } catch (error) {
    console.error(error)
  }
}

const getClipInSeconds = (startTimeMs, endTimeMs) => {
  const isValid = Number.isFinite(startTimeMs) && Number.isFinite(endTimeMs) && endTimeMs >= startTimeMs
  
  if (!isValid) {
    return { start: 0, duration: 0, end: 0 }
  }
  
  const start = Math.round(startTimeMs / 1000)
  const end = Math.round(endTimeMs / 1000)
  const duration = end - start
  
  return {
    start,
    duration,
    end
  }
}

const Hudl = ({ hudl, goTime, halfTimeEnd, initTimeEnd, matchId }) => {
  const [lastClicked, setLastClicked] = useState(-1)
  return (
    <>
      <Box
        id="titleHudl"
        p={0}
        sx={{
          fontSize: '1rem',
          textAlign: 'center',
          width: '100%',
          margin: 'auto',
        }}
      >
        {hudl ? <span>&nbsp;</span> : 'Caricamento...'}
      </Box>
      {
        hudl &&
        <Box mt={1} ml={2} mr={2}>
          {
            (hudl || []).map(({ tags, startTimeMs, endTimeMs }, index) => {
              function getElement (key) {
                const tag = tags.find(tag => tag.key === key)
                return tag ? tag.values[0] : '--'
              }
              
              const clipInSeconds = getClipInSeconds(startTimeMs, endTimeMs)
              const time = convertMilli(startTimeMs, halfTimeEnd, initTimeEnd)
              const [title, rawTitle] = renderTitle(getElement('HUDL_CODE'))
              const [assessments, rawAssessment_] = renderAssessment(getElement('POS/NEG'))
              const rawAssessment = `${rawAssessment_} (${initTimeEnd ? time.short : ''}${initTimeEnd ? `${time.period} ` : ''}${time.long})`
              const hasNegative = ['NEG', 'POS/NEG', 'NEG/POS'].includes(getElement('POS/NEG')) ? 1 : 0
              const hasPositive = ['POS'].includes(getElement('POS/NEG')) || (getElement('HUDL_CODE').includes('Non Concesso OK') && ['POS/NEG', 'NEG/POS'].includes(getElement('POS/NEG'))) ? 1 : 0
              const highlightNeg = hasNegative === 1 && Boolean(containsAnyNeg(getElement('HUDL_CODE')))
              const highlightPos = hasPositive === 1 && Boolean(containsAnyPos(getElement('HUDL_CODE')))
              const toCopyText = getElement('HUDL_FREETEXT')
              const text = highlightNeg ?
                getElement('POS/NEG') === 'NEG' ?
                  <span style={{ color: 'red' }}>{toCopyText}</span>
                  :
                  <span style={{ color: 'orange' }}>{toCopyText}</span>
                : highlightPos ? <span style={{ color: '#3FC520' }}>{toCopyText}</span> : toCopyText
              const LineData = <Box>
                <CopyToClipboard
                  text={rawTitle.join(' ') + ' [OA ' + getElement('O.A.') + ']\n' + rawAssessment + ' ' + toCopyText}
                >
                  <IconButton
                    size="small"
                    style={{ cursor: 'hand', padding: 0, float: 'left', marginTop: 4, marginRight: 2 }}
                  >
                    <span style={{ fontSize: 'small', marginTop: -2 }}>📋</span>
                  </IconButton>
                </CopyToClipboard>
                {
                  Boolean(clipInSeconds['duration']) &&
                  <IconButton
                    size="small"
                    style={{ cursor: 'hand', padding: 0, float: 'left', marginTop: 4, marginRight: 4 }}
                    onClick={async () => {
                      await generateClip(matchId, clipInSeconds)
                    }}
                  >
                    <span style={{ fontSize: 'small', marginTop: -2 }}>📩</span>
                  </IconButton>
                }
                <Link
                  onClick={
                    () => {
                      goTime(startTimeMs / 1000, true)
                      setLastClicked(index)
                    }
                  }
                  style={{
                    textDecoration: lastClicked === index ? 'underline' : 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                  variant="body2"
                >
                  <Typography variant="body1">{title}</Typography>
                  <p align="justify" style={{ marginTop: 2 }}>
                    {assessments} ({initTimeEnd ? time.short : ''}{initTimeEnd ? `${time.period} ` : ''}{time.long}):&nbsp;
                    {text}
                  </p>
                </Link>
              </Box>
              if (index === 0) {
                return (
                  <Box>
                    <Typography variant="body2" display="inline">
                      {getElement('Tournament').toUpperCase()}
                    </Typography>&nbsp;&nbsp;
                    <Typography variant="body2" display="inline">
                      GIOR: {getElement('Giornata di Campionato')} ({renderDay(getElement('DATA'))})
                    </Typography>&nbsp;&nbsp;
                    <Typography variant="body2" display="inline">OA: {getElement('O.A.')}</Typography>&nbsp;&nbsp;
                    <Typography variant="body2" display="inline">OT: {getElement('O.T.')}</Typography>&nbsp;&nbsp;
                    <Typography variant="body2" display="inline">AE: {getElement('ARBITRO')}</Typography>&nbsp;&nbsp;
                    <Typography variant="body2" display="inline">AA1: {getElement('A.A. 1')}</Typography>&nbsp;&nbsp;
                    <Typography variant="body2" display="inline">AA2: {getElement('A.A. 2')}</Typography>&nbsp;&nbsp;
                    <Typography variant="body2" display="inline">IV: {getElement('IV UDG')}</Typography>&nbsp;&nbsp;
                    <Typography variant="body2" display="inline">VAR: {getElement('VAR')}</Typography>&nbsp;&nbsp;
                    <Typography variant="body2" display="inline">AVAR: {getElement('AVAR')}</Typography>
                    {LineData}
                  </Box>
                )
              } else {
                return LineData
              }
            })
          }
        </Box>
      }
    </>
  )
}

export default Hudl
