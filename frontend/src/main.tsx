import React from 'react'
import ReactDOM from 'react-dom/client'
import 'antd-mobile/es/global'
import './styles/global.css'
import App from './App'
import { initErudaDebug } from './debug/eruda'

void initErudaDebug()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
