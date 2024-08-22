import React from 'react'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { Avatar, Tooltip } from '@mui/material'
import parse from 'html-react-parser'
import { getAree } from './helpers'

function createSVGWithHighlightedNumber (players, highlightedNumber, isMirrored = false) {
  const svgWidth = 220
  const svgHeight = 180
  const svgHeader = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`
  let svgContent = ''
  players.forEach(player => {
    let { x, y } = player.coordinates
    if (isMirrored) {
      x = svgWidth - (x * 2) - 15
      y = y * 2 + (player.isDuplicated ? 30 : 0)
    } else {
      x = x * 2
      y = svgHeight - (y * 2) + 20 + (player.isDuplicated ? -30 : 0)
    }
    const fontSize = 20
    const fontWeight = player.shirtNumber === highlightedNumber ? 'bold' : 'normal'
    const fillColor = player.shirtNumber === highlightedNumber ? 'red' : 'black'
    svgContent += `<text x="${x}" y="${y}" font-family="Verdana" font-size="${fontSize}" fill="${fillColor}" font-weight="${fontWeight}">${player.shirtNumber}</text>\n`
  })
  const svgFooter = `</svg>`
  return svgHeader + svgContent + svgFooter
}

const getEventImageUrl = eventType => {
  switch (eventType) {
    case 'SUB_OUT':
      return '/static/out.svg'
    case 'SUB_IN':
      return '/static/in.svg'
    case 'YELLOW_CARD':
      return '/static/giallo.svg'
    case 'DOUBLE_YELLOW_CARD':
      return '/static/gr.svg'
    case 'RED_CARD':
      return '/static/rosso.svg'
    case 'GOAL':
      return '/static/goal.svg'
    case 'GOAL_PENALTY':
      return '/static/penalty.svg'
    default:
      return null
  }
}
const shouldDisplayAvatar = thumbId => {
  return thumbId && thumbId !== 'ndplayer'
}
const getCoachName = (team) => {
  return team.coach && team.coach?.shortName ? team.coach.shortName : '--'
}
const getCoachInfo = (team) => {
  return team.coach && team.coach?.birthDate ? team.coach.birthDate : '--'
}
const getCoachUrl = (team) => {
  return team.coach && team.coach?.thumb.url ? team.coach.thumb.url : 'ndplayer'
}

const writeBox = event => {
  const text = event.target.id
  const elem = document.getElementById('episodeDescription')
  elem.value = `${elem.value.trim() ? `${elem.value.trim()} ${text}` : text}`
  elem.focus()
}

const MatchInfo = ({ match, goTime, fullMode, mirrorMode }) => {
  const { teamsData } = match['match']
  const players = match['players']
  const events = match['events']
  const direction = document.getElementById('direction')
  const homeDir = direction ? direction.textContent[direction.textContent.length - 1] : ''
  const sortedTeams = Object.values(teamsData).sort((a, b) => {
    if (a.side === 'home') return -1
    if (b.side === 'home') return 1
    return 0
  })
  const getTeamPlayers = teamId => {
    let lastCode = null
    const roleOrder = ['GK', 'DF', 'MD', 'AT']
    return players
      .filter(player => player.teamId === teamId)
      .sort((a, b) => {
        if (a.code === 'L' && b.code !== 'L') return -1
        if (b.code === 'L' && a.code !== 'L') return 1
        if (a.code === 'SUB' && b.code !== 'SUB') return -1
        if (b.code === 'SUB' && a.code !== 'SUB') return 1
        const roleIndexA = roleOrder.indexOf(a.player?.role?.code2)
        const roleIndexB = roleOrder.indexOf(b.player?.role?.code2)
        if (roleIndexA !== roleIndexB) {return roleIndexA - roleIndexB}
        return a.shirtNumber - b.shirtNumber
      })
      .map(player => {
        const isSubstitute = player.code === 'SUB'
        if (isSubstitute && lastCode !== 'SUB') {
          lastCode = 'SUB'
          return { ...player, isSubstituteFirst: true }
        } else {
          lastCode = player.code
          return player
        }
      }).map(player => {
        const playerEvents = events.filter(event => event.playerId === player.player.id)
        const eventDetails = playerEvents
          .map(event => {
            return {
              imageUrl: getEventImageUrl(event.eventType),
              time: event.time
            }
          })
        
        return {
          ...player,
          eventImages: eventDetails.map(detail => detail.imageUrl),
          eventTimes: eventDetails.map(detail => detail.time)
        }
      })
  }
  return (
    <>
      {sortedTeams.map((team, index) => (
        <Grid item xs={4} key={index}>
          <Box display="flex">
            {
              shouldDisplayAvatar(team.coach?.thumbId) &&
              <>
                <Tooltip
                  title={<img src={getCoachUrl(team)} alt={'img'} style={{
                    width: 'auto',
                    height: 'auto',
                    maxWidth: '200px',
                    maxHeight: '200px'
                  }}/>}
                  placement="left"
                >
                  <Avatar src={getCoachUrl(team)} style={{ width: 18, height: 18, cursor: 'help' }}/>
                </Tooltip>&nbsp;
              </>
            }&nbsp;
            <Typography variant="body1">All:&nbsp;</Typography>
            <Tooltip
              title={getCoachInfo(team)}
              placement="left"
            >
              <Typography variant="body1" style={{ cursor: 'help' }}>{getCoachName(team)}</Typography>
            </Tooltip>
            &nbsp;
            <Tooltip
              enterDelay={500}
              enterNextDelay={500}
              style={{ cursor: 'help' }}
              title={
                index ?
                  parse(createSVGWithHighlightedNumber(match['metadata'].coordinatesAway, '', !mirrorMode))
                  :
                  parse(createSVGWithHighlightedNumber(match['metadata'].coordinatesHome, '', mirrorMode))
              }
              placement="top"
            >
              <span>
                ({match['metadata']['scheme' + (index ? 'Away' : 'Home')]})
              </span>
            </Tooltip>
            &nbsp;
            <Tooltip
              title={<img src={match['metadata']['img' + (index ? 'Away' : 'Home')]} alt="img" style={{
                width: 'auto',
                height: 'auto',
                maxWidth: '200px',
                maxHeight: '200px'
              }}/>}
              placement="right"
            >
              <Avatar
                onClick={() => window.open(match['metadata']['img' + (index ? 'Away' : 'Home')], '_blank')}
                src={match['metadata']['img' + (index ? 'Away' : 'Home')]}
                onMouseUp={event => {
                  if (event.button === 1) {
                    window.open(match['metadata']['img' + (index ? 'Away' : 'Home')], '_blank')
                  }
                }}
                style={{ width: 18, height: 18, cursor: 'pointer', marginTop: 3 }}
              />
            </Tooltip>
            {homeDir ? <span style={{ marginLeft: 5 }}>{index ? homeDir === '▶' ? '◀' : '▶' : homeDir}</span> : ''}
          </Box>
          <Box>
            {getTeamPlayers(team.teamId).map((player, index) => (
              <Box key={index}>
                {player.isSubstituteFirst && <Box mt={2}/>}
                <Grid container mt={0.6}>
                  <Grid item style={{ textAlign: 'right' }}>
                    <Tooltip
                      title={
                        <>
                          <img src={player.player.thumb.url} alt={player.player.shortName} style={{
                            width: 'auto',
                            height: 'auto',
                            maxWidth: '200px',
                            maxHeight: '200px'
                          }}/>
                          <div style={{ textAlign: 'center', marginBottom: 5 }}>{player.player.birthDate}</div>
                          <div style={{ textAlign: 'center' }}>
                            <img alt={player.player.birthAreaId} style={{ width: 30 }}
                                 src={getAree(player.player.birthAreaId).flag_url}/>
                          </div>
                          <div style={{ textAlign: 'center' }}>{getAree(player.player.birthAreaId).title}</div>
                        </>
                      }
                      placement="left"
                    >
                      <Avatar
                        src={player.player.thumb.url}
                        style={{
                          width: 18,
                          height: 18,
                          cursor: 'help',
                          filter: shouldDisplayAvatar(player.player.thumbId) ? undefined : 'brightness(40%)'
                        }}/>
                    </Tooltip>
                  </Grid>
                  <Grid item style={{ textAlign: 'right', width: 25 }}>
                    <Tooltip
                      enterDelay={500}
                      enterNextDelay={500}
                      title={player.teamId === match['metadata'].home ?
                        parse(createSVGWithHighlightedNumber(match['metadata'].coordinatesHome, parseInt(player.shirtNumber), mirrorMode))
                        :
                        parse(createSVGWithHighlightedNumber(match['metadata'].coordinatesAway, parseInt(player.shirtNumber), !mirrorMode))
                      }
                      placement="right"
                    >
                      <Typography
                        variant="body2"
                        style={{ cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={writeBox}
                        id={player.teamId === match['metadata'].home ?
                          `#${player.shirtNumber} ${match['metadata'].nameHome} `
                          :
                          `#${player.shirtNumber} ${match['metadata'].nameAway} `}>
                        {player.shirtNumber}
                      </Typography>
                    </Tooltip>
                  </Grid>
                  <Grid item>
                    <Typography
                      variant="body2" ml={1}
                    >
                      {player.player?.role?.code2}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body2" ml={1}>{player.player.shortName}</Typography>
                  </Grid>
                  {player.eventImages && player.eventImages.length > 0 && (
                    <>
                      {player.eventImages.map((imageUrl, index) => (
                        <React.Fragment key={index}>
                          <Grid item height={0}>
                            &nbsp;<Link
                            onClick={() => goTime(player.eventTimes[index])}
                            style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                            variant="body2"
                          >
                            <img src={imageUrl} alt="Event" style={{ width: 18, height: 18 }}/>
                          </Link>
                          </Grid>
                          <Grid item height={0}>
                            <Link
                              onClick={() => goTime(player.eventTimes[index])}
                              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                              variant="body2"
                            >
                              <Typography variant="body2"
                                          ml={0.5}>{`${
                                player.eventTimes[index].period === 2 ?
                                  fullMode ? player.eventTimes[index].minute + 45 : player.eventTimes[index].minute
                                  :
                                  player.eventTimes[index].minute
                              }′${player.eventTimes[index].period === 2 ? 'st' : 'pt'}`}</Typography>
                            </Link>
                          </Grid>
                        </React.Fragment>
                      ))}
                    </>
                  )}
                </Grid>
              </Box>
            ))}
          </Box>
        </Grid>
      ))}
    </>
  )
}

export default MatchInfo
