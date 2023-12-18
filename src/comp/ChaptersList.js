import React from 'react'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'
import { convertMilli } from '../App'
import { Box, ThemeProvider, createTheme  } from '@mui/material'

function ChaptersList ({ chapters = [], goTime, halfTimeEnd }) {
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
      <List dense
            sx={{ bgcolor: 'background.paper' }}
            component="nav"
            >
        {
          chapters.map((item, index) => {
            const time = convertMilli(item.time * 1000, halfTimeEnd)
            console.log('time:', time)
            return (<ListItem
              key={index}
              disablePadding
              onClick={() => goTime(item.time, true)}
            >
              <ListItemButton>
                <ListItemText primary={`${time.short}${time.period}: ${item.text}`}/>
              </ListItemButton>
            </ListItem>)
          })}
      </List>
      </ThemeProvider>
    </Box>
  
  )
}

export default ChaptersList
