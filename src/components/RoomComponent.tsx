import { Room } from '@/types';

interface RoomComponentProps {
  room: Room;
  onLightToggle: (roomId: string) => void;
}

export default function RoomComponent({ room, onLightToggle }: RoomComponentProps) {
  const lightColor = room.lightOn ? '#F59E0B' : '#6B7280';
  const lightGlow = room.lightOn ? '#FEF3C7' : 'transparent';
  const windowColor = room.lightOn ? '#FEF3C7' : '#E5E7EB';
  const roomBackgroundColor = room.lightOn ? '#FFFBEB' : '#F8FAFC';
  const roomBorderColor = room.lightOn ? '#F59E0B' : '#CBD5E1';

  // Adjusted coordinates for the new country house layout - properly fit into floors
  const roomX = room.position === 'left' ? 100 : 270;
  const roomY = room.floor === 2 ? 200 : 295;
  const centerX = roomX + 40;
  const centerY = roomY + 40;

  // Shorten room names for better fit
  const getShortRoomName = (name: string) => {
    const shortNames: { [key: string]: string } = {
      'Schlafzimmer': 'Schlafz.',
      'Wohnzimmer': 'Wohnz.',
      'Badezimmer': 'Bad',
      'Küche': 'Küche'
    };
    return shortNames[name] || name;
  };

  return (
    <g>
      {/* Room glow effect when light is on */}
      {room.lightOn && (
        <rect
          x={roomX - 5}
          y={roomY - 5}
          width="90"
          height="70"
          fill={lightGlow}
          opacity="0.4"
          rx="12"
          className="animate-pulse"
        />
      )}
      
      {/* Large invisible touch area for better mobile interaction */}
      <rect
        x={roomX - 10}
        y={roomY - 10}
        width="100"
        height="100"
        fill="transparent"
        className="cursor-pointer"
        onClick={() => {
          console.log('Room clicked:', room.id);
          onLightToggle(room.id);
        }}
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
      />
      
      {/* Room Rectangle with modern styling */}
      <rect
        x={roomX}
        y={roomY}
        width="80"
        height="60"
        fill={roomBackgroundColor}
        stroke={roomBorderColor}
        strokeWidth="2"
        rx="6"
        className="transition-all duration-300 pointer-events-none"
        filter="url(#roomShadow)"
        data-room={room.id}
      />
      
      {/* Room gradient overlay */}
      <defs>
        <linearGradient id={`roomGradient-${room.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: room.lightOn ? "#FEF3C7" : "#F1F5F9", stopOpacity: 0.7}} />
          <stop offset="100%" style={{stopColor: room.lightOn ? "#FDE68A" : "#E2E8F0", stopOpacity: 0.3}} />
        </linearGradient>
        <filter id="roomShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.1"/>
        </filter>
        <filter id="lightGlow">
          <feGaussianBlur stdDeviation="3"/>
          <feColorMatrix values="1 0 0 0 0.96 0 1 0 0 0.62 0 0 1 0 0.04 0 0 0 1 0"/>
        </filter>
      </defs>
      
      <rect
        x={roomX + 1}
        y={roomY + 1}
        width="78"
        height="58"
        fill={`url(#roomGradient-${room.id})`}
        rx="5"
        className="pointer-events-none"
      />
      
      {/* Small Window inside room */}
      <rect
        x={roomX + 10}
        y={roomY + 10}
        width="20"
        height="15"
        fill={windowColor}
        stroke="#1E293B"
        strokeWidth="1"
        rx="2"
        className="transition-all duration-500"
      />
      
      {/* Window cross frame */}
      <line 
        x1={roomX + 20} 
        y1={roomY + 10} 
        x2={roomX + 20} 
        y2={roomY + 25} 
        stroke="#1E293B" 
        strokeWidth="0.5"
      />
      <line 
        x1={roomX + 10} 
        y1={roomY + 17.5} 
        x2={roomX + 30} 
        y2={roomY + 17.5} 
        stroke="#1E293B" 
        strokeWidth="0.5"
      />
      
      {/* Compact Light Fixture */}
      <circle
        cx={centerX}
        cy={centerY}
        r="8"
        fill={lightColor}
        stroke="#374151"
        strokeWidth="1"
        className="transition-all duration-500"
        filter={room.lightOn ? "url(#lightGlow)" : "none"}
      />
      
      {/* Light bulb details */}
      <circle
        cx={centerX}
        cy={centerY}
        r="5"
        fill={room.lightOn ? "#FFFFFF" : "#9CA3AF"}
        opacity={room.lightOn ? "0.9" : "0.5"}
      />
      
      {/* Light base */}
      <rect
        x={centerX - 2}
        y={centerY + 5}
        width="4"
        height="2"
        fill="#374151"
        rx="1"
      />
      
      {/* Light rays when on - compact design */}
      {room.lightOn && (
        <g opacity="0.8">
          {/* Outer light circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r="15"
            fill="none"
            stroke="#FCD34D"
            strokeWidth="1"
            opacity="0.4"
            className="animate-pulse"
          />
          
          {/* Light rays */}
          {Array.from({length: 6}).map((_, i) => {
            const angle = (i * 60) * Math.PI / 180;
            const startX = centerX + Math.cos(angle) * 8;
            const startY = centerY + Math.sin(angle) * 8;
            const endX = centerX + Math.cos(angle) * 18;
            const endY = centerY + Math.sin(angle) * 18;
            
            return (
              <line
                key={i}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="#FCD34D"
                strokeWidth="2"
                opacity="0.6"
                strokeLinecap="round"
              />
            );
          })}
          
          {/* Central glow */}
          <circle
            cx={centerX}
            cy={centerY}
            r="12"
            fill="#FEF3C7"
            opacity="0.2"
          />
        </g>
      )}
      
      {/* Room Label with dynamic sizing */}
      <rect
        x={centerX - 25}
        y={roomY + 45}
        width="50"
        height="12"
        fill={room.lightOn ? "#1E293B" : "#64748B"}
        rx="6"
        opacity="0.9"
      />
      <text
        x={centerX}
        y={roomY + 53}
        textAnchor="middle"
        className="fill-white text-sm font-bold pointer-events-none"
        style={{ fontSize: '7px' }}
      >
        {getShortRoomName(room.name)}
      </text>
    </g>
  );
}
