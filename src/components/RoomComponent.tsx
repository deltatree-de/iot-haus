import { Room } from '@/types';

interface RoomComponentProps {
  room: Room;
  onLightToggle: (roomId: string) => void;
}

export default function RoomComponent({ room, onLightToggle }: RoomComponentProps) {
  const lightColor = room.lightOn ? '#FFE135' : '#4A5568';
  const windowColor = room.lightOn ? '#FFF5A5' : '#2D3748';
  const roomBackgroundColor = room.lightOn ? '#FEF3C7' : '#F3F4F6';

  return (
    <g>
      {/* Room Rectangle */}
      <rect
        x={room.position === 'left' ? 50 : 200}
        y={room.floor === 2 ? 50 : 200}
        width="120"
        height="120"
        fill={roomBackgroundColor}
        stroke="#374151"
        strokeWidth="2"
        className="cursor-pointer transition-all duration-300 hover:stroke-blue-500 hover:stroke-4"
        onClick={() => onLightToggle(room.id)}
      />
      
      {/* Window */}
      <rect
        x={room.position === 'left' ? 70 : 220}
        y={room.floor === 2 ? 70 : 220}
        width="30"
        height="25"
        fill={windowColor}
        stroke="#374151"
        strokeWidth="1"
        className="transition-all duration-300"
      />
      
      {/* Light Bulb Icon */}
      <circle
        cx={room.position === 'left' ? 110 : 260}
        cy={room.floor === 2 ? 110 : 260}
        r="8"
        fill={lightColor}
        stroke="#374151"
        strokeWidth="1"
        className="transition-all duration-300"
      />
      
      {/* Light rays when on */}
      {room.lightOn && (
        <g>
          <line
            x1={room.position === 'left' ? 102 : 252}
            y1={room.floor === 2 ? 110 : 260}
            x2={room.position === 'left' ? 90 : 240}
            y2={room.floor === 2 ? 110 : 260}
            stroke="#FFE135"
            strokeWidth="2"
            opacity="0.6"
          />
          <line
            x1={room.position === 'left' ? 118 : 268}
            y1={room.floor === 2 ? 110 : 260}
            x2={room.position === 'left' ? 130 : 280}
            y2={room.floor === 2 ? 110 : 260}
            stroke="#FFE135"
            strokeWidth="2"
            opacity="0.6"
          />
          <line
            x1={room.position === 'left' ? 110 : 260}
            y1={room.floor === 2 ? 102 : 252}
            x2={room.position === 'left' ? 110 : 260}
            y2={room.floor === 2 ? 90 : 240}
            stroke="#FFE135"
            strokeWidth="2"
            opacity="0.6"
          />
          <line
            x1={room.position === 'left' ? 110 : 260}
            y1={room.floor === 2 ? 118 : 268}
            x2={room.position === 'left' ? 110 : 260}
            y2={room.floor === 2 ? 130 : 280}
            stroke="#FFE135"
            strokeWidth="2"
            opacity="0.6"
          />
        </g>
      )}
      
      {/* Room Label */}
      <text
        x={room.position === 'left' ? 110 : 260}
        y={room.floor === 2 ? 140 : 290}
        textAnchor="middle"
        className="fill-gray-700 text-sm font-medium pointer-events-none"
        style={{ fontSize: '12px' }}
      >
        {room.name}
      </text>
      
      {/* Light Status Indicator */}
      <circle
        cx={room.position === 'left' ? 135 : 285}
        cy={room.floor === 2 ? 75 : 225}
        r="4"
        fill={room.lightOn ? '#10B981' : '#EF4444'}
        className="transition-all duration-300"
      />
    </g>
  );
}
