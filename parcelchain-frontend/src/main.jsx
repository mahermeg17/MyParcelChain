import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { WalletContextProvider } from "./WalletContextProvider";


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WalletContextProvider>
            <App />
        </WalletContextProvider>
  </StrictMode>,
)