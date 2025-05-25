import { useState } from 'react';
import { useDeviceType } from "./hooks/useDeviceType";

import { BuildingViewer } from './components/desktop/BuildingViewer';
import FloorViewer from './components/desktop/FloorViewer';
import Footer from './components/Footer';

import ClassroomManagement from "./pages/ClassroomManagement";
import { Seong } from './data/seongData';
import AppHeader from './components/AppHeader';

const App = () => {
  const deviceType = useDeviceType();
  const [floorId, setFloorId] = useState(-1);

  if (deviceType === "mobile" || deviceType === "tablet") {
    return <ClassroomManagement />;
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <AppHeader />
      {floorId === -1 ? (
        <BuildingViewer building={Seong} onFloorSelect={setFloorId} />
      ) : (
        <FloorViewer floor={Seong.floors[floorId]} />
      )}
      <Footer
        floors={Seong.floors}
        selectedFloorId={floorId}
        onSelect={setFloorId}
      />
    </div>
  );
}

export default App;
