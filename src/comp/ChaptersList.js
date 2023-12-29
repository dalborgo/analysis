import React from 'react'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'
import { convertMilli } from '../App'
import { createTheme, ThemeProvider } from '@mui/material'
import Grid from '@mui/material/Grid'

function ChaptersList ({ chapters = [], goTime, halfTimeEnd }) {
  return (
    <Grid item style={{marginRight: '5%'}}>
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
              sx={{ bgcolor: 'background.paper', border: '1px solid #2A2929', marginTop: 4 }}
              component="nav"
        >
          {
            chapters.map((item, index) => {
              const time = convertMilli(item.time * 1000, halfTimeEnd)
              return (<ListItem
                key={index}
                disablePadding
                onClick={() => goTime(item.time, true)}
              >
                <ListItemButton>
                  <ListItemText primary={`${time.short}${time.period}: ${item.text}`} style={{margin: 0}}/>
                </ListItemButton>
              </ListItem>)
            })}
        </List>
      </ThemeProvider>
    </Grid>
  )
}

export default ChaptersList
