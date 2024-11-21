import React, { useState } from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import Link from '@mui/material/Link'
import { convertMilli } from '../App'
import { CopyToClipboard } from 'react-copy-to-clipboard'

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
const predefinedStrings = ['Espulsione', 'DOGSO', 'RIGORE', 'Seconda Ammonizione', 'Grave Fallo di Gioco', 'Condotta Violenta', 'Reta Annullata', 'Fattuale']

function containsAny (targetString) {
  return predefinedStrings.some(str => targetString.includes(str) && !targetString.includes('OK'))
}

const Hudl = ({ hudl, goTime, halfTimeEnd, initTimeEnd }) => {
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
            (hudl || []).map(({ tags, startTimeMs }, index) => {
              function getElement (key) {
                const tag = tags.find(tag => tag.key === key)
                return tag ? tag.values[0] : '--'
              }
  
              const time = convertMilli(startTimeMs, halfTimeEnd, initTimeEnd)
              const [title, rawTitle] = renderTitle(getElement('HUDL_CODE'))
              const [assessments, rawAssessment_] = renderAssessment(getElement('POS/NEG'))
              const rawAssessment = `${rawAssessment_} (${initTimeEnd ? time.short : ''}${initTimeEnd ? `${time.period} ` : ''}${time.long})`
              const hasNegative = ['NEG', 'POS/NEG', 'NEG/POS'].includes(getElement('POS/NEG')) ? 1 : 0
              const highlightNeg = hasNegative === 1 && Boolean(containsAny(getElement('HUDL_CODE')))
              const text = highlightNeg ?
                getElement('POS/NEG') === 'NEG' ?
                  <span style={{ color: 'red' }}>{getElement('HUDL_FREETEXT')}</span>
                  :
                  <span style={{ color: 'orange' }}>{getElement('HUDL_FREETEXT')}</span>
                : getElement('HUDL_FREETEXT')
              const LineData = <Box>
                <CopyToClipboard
                  text={rawTitle.join(' ') + ' [OA ' + getElement('O.A.') + ']\n' + rawAssessment + ' ' + text}
                >
                  <IconButton
                    size="small"
                    style={{ cursor: 'hand', padding: 0, float: 'left', marginTop: 4, marginRight: 2 }}
                  >
                    <span style={{ fontSize: 'small', marginTop: -2 }}>📋</span>
                  </IconButton>
                </CopyToClipboard>
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
