import React, { useState } from 'react'
import { Box, Typography } from '@mui/material'
import Link from '@mui/material/Link'
import { convertMilli } from '../App'

const renderTitle = title => {
  const parts = title.split('-')
  const filtered = parts.filter((_, index) => index !== 1 && index !== 2)
  return filtered.map((chunk, index) => {
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
  })
}
const renderAssessment = value => {
  switch (value) {
    case 'POS':
      return <span style={{ color: '#3fc520', fontWeight: 'bold' }}>POS</span>
    case 'NEG':
      return <span style={{ color: 'red', fontWeight: 'bold' }}>NEG</span>
    default:
      return <span style={{ color: 'orange', fontWeight: 'bold' }}>POS/NEG</span>
  }
}
const renderDay = date => {
  const parts = date.split('/')
  return parts.pop()
}
const Hudl = ({ hudl, goTime, halfTimeEnd }) => {
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
              const time = convertMilli(startTimeMs, halfTimeEnd)
              const LineData = <Link
                onClick={
                  () => {
                    goTime(startTimeMs / 1000, true)
                    setLastClicked(index)
                  }
                }
                style={{
                  textDecoration: lastClicked === index ? 'underline' : 'none',
                  color: 'inherit',
                  cursor: 'pointer'
                }}
                variant="body2"
              >
                <Typography variant="body1">{renderTitle(getElement('HUDL_CODE'))}</Typography>
                <p align="justify" style={{ marginTop: 2 }}>
                  {renderAssessment(getElement('POS/NEG'))} ({time.short}{time.period} {time.long}):&nbsp;
                  {getElement('HUDL_FREETEXT')}
                </p>
              </Link>
              if (index === 0) {
                console.log('time:', time)
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
