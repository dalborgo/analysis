import React, { useState } from 'react'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'
import { convertMilli } from '../App'
import { Box, createTheme, IconButton, ListItemIcon, ThemeProvider, Tooltip, useMediaQuery } from '@mui/material'
import Grid from '@mui/material/Grid'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { useTheme } from '@mui/styles'

const getListText = (chapters, halfTimeEnd, fullMode) => {
  const output = []
  for (const item of chapters) {
    const time = convertMilli(item.time * 1000, halfTimeEnd)
    output.push(`${fullMode ? parseInt(time.short) + 45 + '′' : time.short}${time.period}: ${item.text}`)
  }
  return output.join('\n')
}

function ChaptersList ({ chapters = [], goTime, halfTimeEnd, fullMode }) {
  const [copied, setCopied] = useState('')
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('xl'))
  return (
    <>
      <Grid item style={{ marginRight: isSmall ? '0%' : '5%' }}>
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
          <Box display="flex">
            <List dense
                  sx={{
                    bgcolor: 'background.paper',
                    border: '1px solid #2A2929',
                    position: 'relative',
                    paddingRight: 1,
                    paddingLeft: 1,
                    minWidth: isSmall ? 250 : 150
                  }}
                  component="nav"
            >
              {
                chapters.map((item, index) => {
                  const time = convertMilli(item.time * 1000, halfTimeEnd)
                  if (isSmall && time.period === 'st') {return null}
                  return (
                    <ListItem
                      key={index}
                      disablePadding
                      onClick={() => goTime(item.time, true)}
                    >
                      <ListItemButton style={{ paddingLeft: 0, paddingRight: 0 }}>
                        <ListItemIcon style={{ marginRight: 5, padding: 0, minWidth: 0 }} onClick={() => {
                          const elem = document.getElementById('episodeDescription')
                          elem.value = item.text
                        }}>
                          <span style={{ fontSize: 'small' }}>📋</span>
                        </ListItemIcon>
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
                text={getListText(chapters, halfTimeEnd, fullMode)}
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
            {
              (isSmall && chapters.find(item => convertMilli(item.time * 1000, halfTimeEnd).period === 'st')) &&
              <List dense
                    sx={{
                      bgcolor: 'background.paper',
                      border: '1px solid #2A2929',
                      position: 'relative',
                      paddingRight: 1,
                      paddingLeft: 1,
                      minWidth: isSmall ? 250 : 150
                    }}
                    component="nav"
              >
                {
                  chapters.map((item, index) => {
                    const time = convertMilli(item.time * 1000, halfTimeEnd)
                    if (isSmall && time.period === 'pt') {return null}
                    return (
                      <ListItem
                        key={index}
                        disablePadding
                        onClick={() => goTime(item.time, true)}
                      >
                        <ListItemButton style={{ paddingLeft: 0, paddingRight: 0 }}>
                          <ListItemIcon style={{ marginRight: 5, padding: 0, minWidth: 0 }} onClick={() => {
                            const elem = document.getElementById('episodeDescription')
                            elem.value = item.text
                          }}>
                            <span style={{ fontSize: 'small' }}>📋</span>
                          </ListItemIcon>
                          <ListItemText
                            id={'' + (item.time * 1000)}
                            primary={`${fullMode ? parseInt(time.short) + 45 + '′' : time.short}${time.period}: ${item.text}`}
                            style={{ margin: 0 }}
                          />
                        </ListItemButton>
                      </ListItem>
                    )
                  })}
              </List>
            }
          </Box>
        </ThemeProvider>
      </Grid>
      {
        isSmall &&
        <Box width="100%" mb={1}/>
      }
    </>
  )
}

export default ChaptersList
