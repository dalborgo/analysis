import React, { useState } from 'react'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'
import { convertMilli } from '../App'
import { createTheme, IconButton, ThemeProvider, Tooltip } from '@mui/material'
import Grid from '@mui/material/Grid'
import { CopyToClipboard } from 'react-copy-to-clipboard'

const getTextText = (chapters, halfTimeEnd, fullMode) => {
  const output = []
  for (const item of chapters) {
    const time = convertMilli(item.time * 1000, halfTimeEnd)
    output.push(`${fullMode ? parseInt(time.short) + 45 + '′' : time.short}${time.period}: ${item.text}`)
  }
  return output.join('\n')
}

function ChaptersList ({ chapters = [], goTime, halfTimeEnd, fullMode }) {
  const [copied, setCopied] = useState('')
  return (
    <Grid item style={{ marginRight: '5%' }}>
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
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid #2A2929',
                marginTop: 4,
                position: 'relative',
                paddingRight: 1,
                paddingLeft: 1,
              }}
              component="nav"
        >
          {
            chapters.map((item, index) => {
              const time = convertMilli(item.time * 1000, halfTimeEnd)
              return (
                <ListItem
                  key={index}
                  disablePadding
                  onClick={() => goTime(item.time, true)}
                >
                  <ListItemButton>
                    <ListItemText
                      id={'' + (item.time * 1000)}
                      primary={`${fullMode ? parseInt(time.short) + 45 + '′' : time.short}${time.period}: ${item.text}`}
                      style={{ margin: 0 }}
                    />
                  </ListItemButton>
                </ListItem>
              )
            })}
          <CopyToClipboard
            onCopy={() => setCopied('Copiato!')}
            text={getTextText(chapters, halfTimeEnd, fullMode)}
          >
            {
              copied ?
                <Tooltip
                  onClose={() => setCopied('')}
                  title={copied}
                  placement="top"
                >
                  <IconButton
                    size="small"
                    style={{ cursor: 'hand', position: 'absolute', right: 4, top: 4, padding: 0 }}
                  >
                    <span style={{ fontSize: 'small' }}>📋</span>
                  </IconButton>
                </Tooltip>
                :
                <IconButton
                  size="small"
                  style={{ cursor: 'hand', position: 'absolute', right: 4, top: 4, padding: 0 }}
                >
                  <span style={{ fontSize: 'small' }}>📋</span>
                </IconButton>
            }
          </CopyToClipboard>
        </List>
      </ThemeProvider>
    </Grid>
  )
}

export default ChaptersList
