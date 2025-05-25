import type { Floor } from '../types/building';

interface Props {
  floors: Floor[];
  selectedFloorId: number;
  onSelect: (floorId: number) => void;
}

const Footer = ({ floors, selectedFloorId, onSelect }: Props) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        background: 'black',
        display: 'flex',
        justifyContent: 'space-evenly',
        gap: '12px',
        padding: '10px',
        zIndex: 10,
      }}
    >
      <button
        onClick={() => onSelect(-1)}
        style={{
          width: '150px',
          fontSize: '20px',
          background: -1 === selectedFloorId ? '#228be6' : '#e9ecef',
          color: -1 === selectedFloorId ? 'white' : 'black',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}>
        전체
      </button>

      {floors.map((floor, idx) => (
        <button
          key={floor.id}
          onClick={() => onSelect(idx)}
          style={{
            width: '150px',
            fontSize: '20px',
            background: idx === selectedFloorId ? '#228be6' : '#e9ecef',
            color: idx === selectedFloorId ? 'white' : 'black',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {floor.name}
        </button>
      ))}
    </div>
  );
};

export default Footer;