import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import App from './App'
import { initializeReservationDB } from './utils/reservationDB'
import { initializeLectureDB } from './utils/lectureDB'

(async () => {
  try {
    // DB 초기화
    await initializeReservationDB();
    await initializeLectureDB();
    console.log('Success to initialize database')
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
})();