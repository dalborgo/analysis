import React from 'react'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'
import { Box, createTheme, ThemeProvider, useTheme } from '@mui/material'

function SeekMinute ({ goTime, period = 1 }) {
  const theme = useTheme()
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
        <Box display="flex" m={1} border={'1px solid #2A2929'} p={1} pt={0.5} pb={0.5}>
          <List dense
                sx={{ bgcolor: 'background.paper', padding: 0 }}
          >
            {
              Array.from({ length: 51 }).map((item, index) => {
                return (<ListItem
                  key={index}
                  disablePadding
                  onClick={() => goTime({ minute: index + 1, period })}
                >
                  <ListItemButton style={{ textAlign: 'center', padding: 0, marginRight: -8 }} sx={{color: theme.palette.primary.main}}>
                    <ListItemText primary={index + 1} sx={{margin: 0, fontSize: 12}} disableTypography/>
                  </ListItemButton>
                </ListItem>)
              })}
          </List>&nbsp;&nbsp;
        </Box>
      </ThemeProvider>
    </Box>
  )
}

export default SeekMinute
