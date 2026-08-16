import "leaflet/dist/leaflet.css";
import "./App.css";
import MapView from "./components/MapView";
import StageList from "./components/StageList";
import StatsPanel from "./components/StatsPanel";
import ElevationProfile from "./components/ElevationProfile";
import Toolbar from "./components/Toolbar";

function App() {
  return (
    <div className="app">
      <Toolbar />
      <div className="app-body">
        <aside className="sidebar">
          <StageList />
          <StatsPanel />
        </aside>
        <main className="main-area">
          <div className="map-container">
            <MapView />
          </div>
          <div className="profile-container">
            <ElevationProfile />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
