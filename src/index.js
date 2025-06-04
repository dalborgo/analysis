import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

const savedHalfTime = localStorage.getItem('halfTimeEnd')
const savedInitTime = localStorage.getItem('initTimeEnd')
const savedHomeDir = localStorage.getItem('homeDirEnd')
const halfTime = savedHalfTime ? parseInt(savedHalfTime, 10) : null
const initTime = savedInitTime ? parseInt(savedInitTime, 10) : null
const homeDir = savedHomeDir ? Boolean(parseInt(savedHomeDir, 10)) : false
const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<App halfTime={halfTime} initTime={initTime} homeDir={homeDir}/>)
