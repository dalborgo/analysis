import { Button, createTheme } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
})
const handleZpFunc = event => {
  fetch(`http://localhost:5003/&zpfunc=${event.target.id}`, { mode: 'no-cors' }).then()
}

export default function App () {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline/>
      <main>
        <Button id="fnPlay" variant="contained" color="primary" onClick={handleZpFunc} size="small">
          PLAY
        </Button>
      </main>
    </ThemeProvider>
  )
}
