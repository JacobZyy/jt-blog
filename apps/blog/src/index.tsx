/* @refresh reload */
import { render } from '@solidjs/web'
import App from './App.tsx'
import './index.css'

const root = document.getElementById('root')

render(() => <App />, root!)
