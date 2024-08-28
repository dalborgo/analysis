import React from 'react'
import { Avatar, Box, Tooltip, Typography } from '@mui/material'

const RefereeDisplay = ({ match }) => {
  const renderReferee = ({ referee, role }) => {
    const fullName = `${referee['firstName']} ${referee['middleName']} ${referee['lastName']}`.trim()
    const iconUrl = ['referee', 'fourthOfficial'].includes(role)
      ? '/static/fischietto.png'
      : '/static/bandierina.png'
    return (
      <Box key={referee.id} display="flex" alignItems="center">
        <img src={iconUrl} alt={role} style={{ marginRight: 7, height: 15 }}/>
        {fullName}&nbsp;&nbsp;
        <Tooltip
          title={
            <img src={referee.thumb.url} alt={fullName} style={{
              width: 'auto',
              height: 'auto',
              maxWidth: '200px',
              maxHeight: '200px'
            }}/>
          }
          placement="right"
        >
          <Avatar src={referee.thumb.url} alt={fullName}
                  style={{
                    cursor: 'help',
                    width: 15,
                    height: 15,
                    filter: referee.thumb.url.includes('ndplayer') ? 'brightness(50%)' : undefined,
                  }}
          />
        </Tooltip>
      </Box>
    )
  }
  
  return (
    <>
      {
        match &&
        <Box style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }} mb={1}>
          <Typography variant="h5">{match.match['label']}</Typography>
        </Box>
      }
      <Box
        id="title"
        p={0}
        sx={{
          fontSize: '1rem',
          textAlign: 'center',
          width: '100%',
          margin: 'auto',
        }}
      >
        {match ? <span>&nbsp;</span> : 'Caricamento...'}
      </Box>
      {
        match &&
        <Box style={{ display: 'flex', justifyContent: 'center' }} mt={1} gap={5}>
          {
            match.match['referees']?.elements
              .sort((a, b) => {
                const roles = ['referee', 'firstAssistant', 'secondAssistant', 'fourthOfficial']
                return roles.indexOf(a.role) - roles.indexOf(b.role)
              })
              .map(renderReferee)
          }
        </Box>
      }
    </>
  )
}

export default RefereeDisplay
