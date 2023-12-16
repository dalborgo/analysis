import React from 'react'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { Avatar, Tooltip } from '@mui/material'

const getEventImageUrl = eventType => {
  switch (eventType) {
    case 'YELLOW_CARD':
      return 'http://www.arbitri.com/forum/images/smilies/giallo.gif'
    case 'RED_CARD':
      return 'http://www.arbitri.com/forum/images/smilies/rosso.gif'
    case 'GOAL_PENALTY':
      return 'http://www.arbitri.com/forum/images/smilies/fischietto.png'
    default:
      return null
  }
}
const shouldDisplayAvatar = (url) => {
  return !url.includes('ndplayer')
}
const getCoachName = (team) => {
  return team.coach && team.coach.shortName ? team.coach.shortName : '--'
}
const getCoachUrl = (team) => {
  return team.coach && team.coach.thumb.url ? team.coach.thumb.url : 'ndplayer'
}
const MatchInfo = ({ match, goTime }) => {
  const { teamsData } = match['match']
  const players = match['players']
  const events = match['events']
  
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
        const roleIndexA = roleOrder.indexOf(a.player.role.code2)
        const roleIndexB = roleOrder.indexOf(b.player.role.code2)
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
          .filter(event => ['YELLOW_CARD', 'RED_CARD', 'GOAL_PENALTY'].includes(event.eventType))
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
    <Box pl={2}>
      <Grid container spacing={0}>
        {sortedTeams.map((team, index) => (
          <Grid item xs={6} key={index}>
            <Box display={'flex'}>
              <Typography variant="body1">Allenatore:&nbsp;</Typography>
              {shouldDisplayAvatar(getCoachUrl(team)) &&
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
                   <Avatar src={getCoachUrl(team)} style={{ width: 18, height: 18, cursor: 'pointer' }}/>
                 </Tooltip>&nbsp;
               </>
              }
              <Typography variant="body1">{getCoachName(team)}</Typography>
            </Box>
            <Box>
              {getTeamPlayers(team.teamId).map((player, index) => (
                <Box key={index}>
                  {player.isSubstituteFirst && <Box mt={2}/>}
                  <Grid container mt={1}>
                    <Grid item style={{ textAlign: 'right' }}>
                      {
                        shouldDisplayAvatar(player.player.thumb.url) ?
                          <Tooltip
                            title={<img src={player.player.thumb.url} alt={player.player.shortName} style={{
                              width: 'auto',
                              height: 'auto',
                              maxWidth: '200px',
                              maxHeight: '200px'
                            }}/>}
                            placement="top"
                          >
                            <Avatar src={player.player.thumb.url} style={{ width: 18, height: 18, cursor: 'pointer' }}/>
                          </Tooltip>
                          :
                          <Avatar src={player.player.thumb.url}
                                  style={{ width: 18, height: 18, visibility: 'hidden' }}/>
                      }
                    </Grid>
                    <Grid item style={{ textAlign: 'right', width: 25 }}>
                      <Typography variant="body2"><strong>{player.shirtNumber}</strong></Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="body2" ml={1}>{player.player.role.code2}</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="body2" ml={1}>{player.player.shortName}</Typography>
                    </Grid>
                    {player.eventImages && player.eventImages.length > 0 && (
                      <Grid item>
                        {player.eventImages.map((imageUrl, index) => (
                          <React.Fragment key={index}>
                            &nbsp;&nbsp;<Link
                            onClick={() => goTime(player.eventTimes[index])}
                            style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                            variant="body2"
                          >
                            <img src={imageUrl} alt="Event" style={{ width: 18, height: 18 }}/>
                          </Link>
                          </React.Fragment>
                        ))}
                      </Grid>
                    )}
                    
                    {player.eventTimes && player.eventTimes.length > 0 && (
                      <Grid item>
                        {player.eventTimes.map((time, index) => (
                          <Link
                            key={index}
                            onClick={() => goTime(time)}
                            style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                            variant="body2"
                          >
                            <Typography variant="body2"
                                        ml={0.5}>{`${time.minute}′${time.period === 2 ? 'st' : 'pt'}`}</Typography>
                          </Link>
                        ))}
                      </Grid>
                    )}
                  </Grid>
                
                </Box>
              ))}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default MatchInfo