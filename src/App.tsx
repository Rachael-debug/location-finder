import Header from './components/Header'
import SearchForm from './components/SearchForm'
import './App.css'
import { ThemeProvider } from "@/components/theme-provider"

import { useState, useRef } from 'react'
import Map from './components/Map'



function App() {
  const [setLocation, location] = useState("");

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <>
        
        <Header />
        {/* <SearchForm /> */}
        <Map />
      </>
    </ThemeProvider>
    
  )
}

export default App
