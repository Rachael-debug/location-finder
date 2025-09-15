import Header from './components/Header'
import './App.css'
import { ThemeProvider } from "@/components/theme-provider"
import Map from './components/Map'



function App() {

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <>
        
        <Header />
        <Map />
      </>
    </ThemeProvider>
    
  )
}

export default App
