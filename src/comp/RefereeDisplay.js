import React from 'react'
import { Box, Typography } from '@mui/material'

const RefereeDisplay = ({ match }) => {
  const renderReferee = ({ referee, role }) => {
    const fullName = `${referee['firstName']} ${referee['middleName']} ${referee['lastName']}`.trim()
    const iconUrl = ['referee', 'fourthOfficial'].includes(role)
      ? 'http://www.arbitri.com/forum/images/smilies/fischietto.png'
      : 'http://www.arbitri.com/forum/images/smilies/bandierina.png'
    return (
      <span key={referee.id}>
        <img src={iconUrl} alt={role} style={{ marginRight: '5px' }}/>
        {fullName}&nbsp;&nbsp;
        <img src={referee.thumb.url} alt={fullName} style={{ width: 15, height: 15 }} />
      </span>
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
        <Box style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }} mt={1}>
          {
            match.match['referees'].elements
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
