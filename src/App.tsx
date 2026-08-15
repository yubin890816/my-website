import { ThemeProvider } from './features/theme/ThemeProvider'
import { Navigation } from './components/Navigation/Navigation'
import { Hero } from './components/Hero/Hero'
import { Projects } from './components/Projects/Projects'

function App() {
  return (
    <ThemeProvider>
      <Navigation />
      <Hero />
      <Projects />
      <section id="contact"></section>
    </ThemeProvider>
  )
}

export default App
