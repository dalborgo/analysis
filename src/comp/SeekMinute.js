import React from 'react'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'
import { Box, createTheme, ThemeProvider } from '@mui/material'

function SeekMinute ({ goTime, period = 1 }) {
  return (
    <Box>
      <ThemeProvider
        theme={createTheme({
          components: {
            MuiListItemButton: {
              defaultProps: {
                disableTouchRipple: true,
              },
            },
          },
          palette: {
            mode: 'dark',
            background: { paper: 'rgb(28,27,27)' },
          },
        })}
      >
        <Box display={'flex'} m={1}>
          <List dense
                sx={{ bgcolor: 'background.paper' }}
                component="nav"
          >
            {
              Array.from({ length: 25 }).map((item, index) => {
                return (<ListItem
                  key={index}
                  disablePadding
                  style={{ padding: 0 }}
                  onClick={() => goTime({ minute: index + 1, period })}
                >
                  <ListItemButton style={{ textAlign: 'center', padding: 1 }}>
                    <ListItemText primary={index + 1}/>
                  </ListItemButton>
                </ListItem>)
              })}
          </List>&nbsp;&nbsp;
          <List dense
                sx={{ bgcolor: 'background.paper' }}
                component="nav"
          >
            {
              Array.from({ length: 25 }).map((item, index) => {
                return (<ListItem
                  key={index}
                  disablePadding
                  style={{ padding: 0 }}
                  onClick={() => goTime({ minute: index + 30 + 1, period })}
                >
                  <ListItemButton style={{ textAlign: 'center', padding: 1 }}>
                    <ListItemText primary={index + 30 + 1}/>
                  </ListItemButton>
                </ListItem>)
              })}
          </List>
        </Box>
      
      </ThemeProvider>
    </Box>
  
  )
}

export default SeekMinute
