import React from 'react'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { Avatar, Tooltip } from '@mui/material'

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
const shouldDisplayAvatar = (thumbId) => {
  return thumbId !== 'ndplayer'
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
  console.log('MERDA')
  const text = event.target.id
  const elem = document.getElementById('episodeDescription')
  elem.value = `${elem.value.trim() ? `${elem.value.trim()} ${text}` : text}`
}

const MatchInfo = ({ match, goTime }) => {
  const { teamsData } = match['match']
  const players = match['players']
  const events = match['events']
  console.log('matchXXX:', match)
  const sortedTeams = Object.values(teamsData).sort((a, b) => {
    if (a.side === 'home') return -1
    if (b.side === 'home') return 1
    return 0
  })
  const getTeamPlayers = (teamId) => {
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
          <Box display={'flex'}>
            <Typography variant="body1">Allenatore:&nbsp;</Typography>
            {shouldDisplayAvatar(team.coach?.thumbId) &&
             <>
               <Tooltip
                 title={<img src={getCoachUrl(team)} alt={'img'} style={{
                   width: 'auto',
                   height: 'auto',
                   maxWidth: '200px',
                   maxHeight: '200px'
                 }}/>}
                 placement="top"
               >
                 <Avatar src={getCoachUrl(team)} style={{ width: 18, height: 18, cursor: 'help' }}/>
               </Tooltip>&nbsp;
             </>
            }
            <Tooltip
              title={getCoachInfo(team)}
              placement="top"
            >
              <Typography variant="body1" style={{ cursor: 'help' }}>{getCoachName(team)}</Typography>
            </Tooltip>
            &nbsp;({match['metadata']['scheme' + (index ? 'Away' : 'Home')]})
          </Box>
          <Box>
            {getTeamPlayers(team.teamId).map((player, index) => (
              <Box key={index}>
                {player.isSubstituteFirst && <Box mt={2}/>}
                <Grid container mt={1}>
                  <Grid item style={{ textAlign: 'right' }}>
                    {
                      shouldDisplayAvatar(player.player.thumbId) ?
                        <Tooltip
                          title={<img src={player.player.thumb.url} alt={player.player.shortName} style={{
                            width: 'auto',
                            height: 'auto',
                            maxWidth: '200px',
                            maxHeight: '200px'
                          }}/>}
                          placement="top"
                        >
                          <Avatar src={player.player.thumb.url} style={{ width: 18, height: 18, cursor: 'help' }}/>
                        </Tooltip>
                        :
                        <Avatar src={player.player.thumb.url}
                                style={{ width: 18, height: 18, visibility: 'hidden' }}/>
                    }
                  </Grid>
                  <Grid item style={{ textAlign: 'right', width: 25 }}>
                    <Typography
                      variant="body2"
                      style={{ cursor: 'pointer', fontWeight: 'bold' }}
                      onClick={writeBox}
                      id={player.player.teamId === match['metadata'].home ?
                        `#${player.shirtNumber} ${match['metadata'].nameHome}`
                        :
                        `#${player.shirtNumber} ${match['metadata'].nameAway}`}>
                      {player.shirtNumber}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Tooltip
                      title={player.player.birthDate}
                      placement="top"
                    >
                      <Typography
                        variant="body2" ml={1}
                        style={{ cursor: 'help' }}
                      >
                        {player.player?.role?.code2}
                      </Typography>
                    </Tooltip>
                  </Grid>
                  <Grid item>
                    <Typography variant="body2" ml={1}>{player.player.shortName}</Typography>
                  </Grid>
                  {player.eventImages && player.eventImages.length > 0 && (
                    <>
                      {player.eventImages.map((imageUrl, index) => (
                        <React.Fragment key={index}>
                          <Grid item>
                            &nbsp;<Link
                            onClick={() => goTime(player.eventTimes[index])}
                            style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                            variant="body2"
                          >
                            <img src={imageUrl} alt="Event" style={{ width: 18, height: 18 }}/>
                          </Link>
                          </Grid>
                          <Grid item>
                            <Link
                              onClick={() => goTime(player.eventTimes[index])}
                              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                              variant="body2"
                            >
                              <Typography variant="body2"
                                          ml={0.5}>{`${player.eventTimes[index].minute}′${player.eventTimes[index].period === 2 ? 'st' : 'pt'}`}</Typography>
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
