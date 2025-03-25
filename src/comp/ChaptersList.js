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

const replaceChunks = (text, replacements, byNumber = true) => {
  if (byNumber) {return text}
  const regex = /#\d{1,2} [A-Z]{3}/g
  return text.replace(regex, match => {
    if (replacements[match]) {
      return `<span style="color: ${replacements[match].isHome ? '#90C6EA' : '#CE93C4'};">${replacements[match].lastName}</span>`
    }
    return match
  })
}

function ChaptersList ({
  chapters = [],
  goTime,
  initTimeEnd,
  halfTimeEnd,
  fullMode,
  match = {},
  hasDialer,
  lastTime = 0
}) {
  const [copied, setCopied] = useState('')
  const [byNumber, setByNumber] = useState(true)
  const [replacements] = useState(() => {
    const output = {}
    const metadata = match['metadata'] || {}
    const players = match['players'] || []
    for (let player of players) {
      const isHome = player.teamId === metadata.home
      output[`#${player.shirtNumber} ${isHome ? metadata.nameHome : metadata.nameAway}`] = {
        lastName: player['player'].lastName,
        isHome
      }
    }
    return output
  })
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('xl')) || Object.keys(match).length === 0
  return (
    <>
      <Grid item style={{ marginRight: isSmall ? '0%' : '3%' }}>
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
                  const time = convertMilli(item.time * 1000, halfTimeEnd, initTimeEnd)
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
                          <span style={{ fontSize: 'small', backgroundColor: '#2e2d2d' }}>&nbsp;⬆&nbsp;</span>
                        </ListItemIcon>
                        <ListItemText
                          id={'' + (item.time * 1000)}
                          primary={
                            <span
                              dangerouslySetInnerHTML={{
                                __html: `${fullMode ? parseInt(time.short) + (time.period === 'st' ? 45 : 0) + '′' : time.short}${time.period}: ${replaceChunks(item.text, replacements, byNumber)}${chapters.length === index + 1 ? ` [${index + 1}]` : ''}`
                              }}
                            />
                          }
                          style={{ margin: 0, textDecoration: item.time === lastTime ? 'underline' : 'none' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              <IconButton
                size="small"
                style={{ cursor: 'hand', position: 'absolute', right: 22, top: 4, padding: 0 }}
                onClick={() => setByNumber(!byNumber)}
              >
                <span style={{ fontSize: 'small' }}>📒</span>
              </IconButton>
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
              isSmall && //  && chapters.find(item => convertMilli(item.time * 1000, halfTimeEnd).period === 'st')
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
                            <span style={{ fontSize: 'small', backgroundColor: '#2e2d2d' }}>&nbsp;⬆&nbsp;</span>
                          </ListItemIcon>
                          <ListItemText
                            id={'' + (item.time * 1000)}
                            primary={
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: `${fullMode ? parseInt(time.short) + 45 + '′' : time.short}${time.period}: ${replaceChunks(item.text, replacements, byNumber)}${chapters.length === index + 1 ? ` [${index + 1}]` : ''}`
                                }}
                              />
                            }
                            style={{ margin: 0, textDecoration: item.time === lastTime ? 'underline' : 'none' }}
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
        (isSmall && !hasDialer) &&
        <Box width="100%" mb={1}/>
      }
    </>
  )
}

export default ChaptersList
