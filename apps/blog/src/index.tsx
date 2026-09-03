/* @refresh reload */
import { render } from '@solidjs/web'
import App from './App.tsx'
import 'katex/dist/katex.min.css'
import './index.css'

const root = document.getElementById('root')

render(() => <App />, root!)
