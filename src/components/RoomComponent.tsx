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

  const roomX = room.position === 'left' ? 50 : 200;
  const roomY = room.floor === 2 ? 50 : 200;
  const centerX = roomX + 60;
  const centerY = roomY + 60;

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
          width="130"
          height="130"
          fill={lightGlow}
          opacity="0.3"
          rx="15"
          className="animate-pulse"
        />
      )}
      
      {/* Room Rectangle with modern styling and touch optimization */}
      <rect
        x={roomX}
        y={roomY}
        width="120"
        height="120"
        fill={roomBackgroundColor}
        stroke={roomBorderColor}
        strokeWidth="3"
        rx="10"
        className="cursor-pointer transition-all duration-500 hover:stroke-blue-500 hover:stroke-4 hover:shadow-lg touch-manipulation"
        onClick={() => onLightToggle(room.id)}
        onTouchStart={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
          e.currentTarget.style.filter = 'brightness(0.9)';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.filter = 'brightness(1)';
        }}
        filter="url(#roomShadow)"
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
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
        x={roomX + 2}
        y={roomY + 2}
        width="116"
        height="116"
        fill={`url(#roomGradient-${room.id})`}
        rx="8"
        className="pointer-events-none"
      />
      
      {/* Modern Window with frame */}
      <rect
        x={roomX + 20}
        y={roomY + 20}
        width="35"
        height="25"
        fill={windowColor}
        stroke="#1E293B"
        strokeWidth="2"
        rx="3"
        className="transition-all duration-500"
      />
      
      {/* Window cross frame */}
      <line 
        x1={roomX + 37.5} 
        y1={roomY + 20} 
        x2={roomX + 37.5} 
        y2={roomY + 45} 
        stroke="#1E293B" 
        strokeWidth="1"
      />
      <line 
        x1={roomX + 20} 
        y1={roomY + 32.5} 
        x2={roomX + 55} 
        y2={roomY + 32.5} 
        stroke="#1E293B" 
        strokeWidth="1"
      />
      
      {/* Modern Light Fixture */}
      <circle
        cx={centerX}
        cy={centerY}
        r="12"
        fill={lightColor}
        stroke="#374151"
        strokeWidth="2"
        className="transition-all duration-500"
        filter={room.lightOn ? "url(#lightGlow)" : "none"}
      />
      
      {/* Light bulb details */}
      <circle
        cx={centerX}
        cy={centerY}
        r="8"
        fill={room.lightOn ? "#FFFFFF" : "#9CA3AF"}
        opacity={room.lightOn ? "0.9" : "0.5"}
      />
      
      {/* Light base */}
      <rect
        x={centerX - 4}
        y={centerY + 8}
        width="8"
        height="4"
        fill="#374151"
        rx="1"
      />
      
      {/* Light rays when on - modern design */}
      {room.lightOn && (
        <g opacity="0.8">
          {/* Outer light circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r="25"
            fill="none"
            stroke="#FCD34D"
            strokeWidth="2"
            opacity="0.4"
            className="animate-pulse"
          />
          
          {/* Light rays */}
          {Array.from({length: 8}).map((_, i) => {
            const angle = (i * 45) * Math.PI / 180;
            const startX = centerX + Math.cos(angle) * 15;
            const startY = centerY + Math.sin(angle) * 15;
            const endX = centerX + Math.cos(angle) * 30;
            const endY = centerY + Math.sin(angle) * 30;
            
            return (
              <line
                key={i}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="#FCD34D"
                strokeWidth="3"
                opacity="0.6"
                strokeLinecap="round"
              />
            );
          })}
          
          {/* Central glow */}
          <circle
            cx={centerX}
            cy={centerY}
            r="20"
            fill="#FEF3C7"
            opacity="0.2"
          />
        </g>
      )}
      
      {/* Room Label with dynamic sizing */}
      <rect
        x={centerX - 35}
        y={roomY + 85}
        width="70"
        height="20"
        fill={room.lightOn ? "#1E293B" : "#64748B"}
        rx="10"
        opacity="0.9"
      />
      <text
        x={centerX}
        y={roomY + 98}
        textAnchor="middle"
        className="fill-white text-sm font-bold pointer-events-none"
        style={{ fontSize: '9px' }}
      >
        {getShortRoomName(room.name)}
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
