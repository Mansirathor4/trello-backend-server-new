import TrelloBoard from './TrelloBoard'; // Naya component import karein
import './App.css'

function App() {
  // Aapke existing Tailwind CSS setup ko retain karte hue
  return (
    <div className="App">
      {/* TrelloBoard component ko display karein */}
      <TrelloBoard />
    </div>
  )
}

export default App