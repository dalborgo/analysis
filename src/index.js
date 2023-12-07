import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
const savedTime = localStorage.getItem('halfTimeEnd')
const halfTime = savedTime ? parseInt(savedTime, 0) : null
const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<App halfTime={halfTime}/>)
