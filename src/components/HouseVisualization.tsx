import { House } from '@/types';
import RoomComponent from './RoomComponent';

interface HouseVisualizationProps {
  house: House;
  onLightToggle: (roomId: string) => void;
}

export default function HouseVisualization({ house, onLightToggle }: HouseVisualizationProps) {
  return (
    <div className="flex flex-col items-center p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          🏠 Smart Home Control
        </h2>
        <p className="text-gray-600 text-lg">Ihr intelligentes Zuhause wartet auf Sie</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200/50 backdrop-blur-sm">
        <svg width="420" height="420" viewBox="0 0 420 420" className="rounded-xl bg-gradient-to-b from-sky-100 to-green-100">
          {/* House Structure with modern design */}
          {/* Base/Foundation */}
          <rect
            x="25"
            y="365"
            width="350"
            height="15"
            fill="#8B7355"
            stroke="#654321"
            strokeWidth="1"
          />
          
          {/* Outer Wall with gradient effect */}
          <defs>
            <linearGradient id="wallGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#F8FAFC", stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#E2E8F0", stopOpacity:1}} />
            </linearGradient>
            <linearGradient id="roofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#DC2626", stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#7F1D1D", stopOpacity:1}} />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="3" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          <rect
            x="30"
            y="30"
            width="340"
            height="340"
            fill="url(#wallGradient)"
            stroke="#1E293B"
            strokeWidth="2"
            filter="url(#shadow)"
            rx="5"
          />
          
          {/* Modern Roof */}
          <polygon
            points="15,35 200,5 385,35 370,30 200,15 30,30"
            fill="url(#roofGradient)"
            stroke="#7F1D1D"
            strokeWidth="2"
            filter="url(#shadow)"
          />
          
          {/* Roof Details */}
          <line
            x1="30"
            y1="30"
            x2="370"
            y2="30"
            stroke="#7F1D1D"
            strokeWidth="3"
          />
          
          {/* Modern Chimney */}
          <rect
            x="320"
            y="5"
            width="25"
            height="35"
            fill="#4B5563"
            stroke="#1F2937"
            strokeWidth="1"
            rx="2"
          />
          
          {/* Chimney Top with modern cap */}
          <rect
            x="318"
            y="3"
            width="29"
            height="5"
            fill="#1F2937"
            rx="2"
          />
          
          {/* Smoke effect */}
          <circle cx="335" cy="0" r="2" fill="#9CA3AF" opacity="0.6">
            <animate attributeName="cy" values="0;-10;-20" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.6;0.3;0" dur="3s" repeatCount="indefinite"/>
          </circle>
          <circle cx="330" cy="2" r="1.5" fill="#9CA3AF" opacity="0.4">
            <animate attributeName="cy" values="2;-8;-18" dur="3.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.4;0.2;0" dur="3.5s" repeatCount="indefinite"/>
          </circle>
          
          {/* Floor Separator with modern styling */}
          <line
            x1="30"
            y1="200"
            x2="370"
            y2="200"
            stroke="#64748B"
            strokeWidth="3"
            strokeDasharray="5,5"
            opacity="0.7"
          />
          
          {/* Room Separators with modern styling */}
          {/* Floor 1 - Vertical separator */}
          <line
            x1="200"
            y1="200"
            x2="200"
            y2="370"
            stroke="#64748B"
            strokeWidth="3"
            strokeDasharray="5,5"
            opacity="0.7"
          />
          
          {/* Floor 2 - Vertical separator */}
          <line
            x1="200"
            y1="30"
            x2="200"
            y2="200"
            stroke="#64748B"
            strokeWidth="3"
            strokeDasharray="5,5"
            opacity="0.7"
          />
          
          {/* Modern Floor Labels with background */}
          <rect x="5" y="110" width="30" height="25" fill="#1E293B" rx="5" opacity="0.9"/>
          <text
            x="20"
            y="127"
            textAnchor="middle"
            className="fill-white text-lg font-bold"
            style={{ fontSize: '14px' }}
          >
            2F
          </text>
          
          <rect x="5" y="275" width="30" height="25" fill="#1E293B" rx="5" opacity="0.9"/>
          <text
            x="20"
            y="292"
            textAnchor="middle"
            className="fill-white text-lg font-bold"
            style={{ fontSize: '14px' }}
          >
            1F
          </text>
          
          {/* Render Rooms */}
          {house.floors.map((floor) =>
            floor.rooms.map((room) => (
              <RoomComponent
                key={room.id}
                room={room}
                onLightToggle={onLightToggle}
              />
            ))
          )}
          
          {/* Modern Front Door */}
          <rect
            x="185"
            y="365"
            width="30"
            height="15"
            fill="#7C3AED"
            stroke="#5B21B6"
            strokeWidth="2"
            rx="2"
          />
          
          {/* Door Window */}
          <rect
            x="190"
            y="368"
            width="20"
            height="6"
            fill="#C7D2FE"
            stroke="#5B21B6"
            strokeWidth="1"
            rx="1"
          />
          
          {/* Modern Door Handle */}
          <circle
            cx="207"
            cy="375"
            r="2"
            fill="#F59E0B"
          />
          
          {/* Welcome Mat */}
          <rect
            x="180"
            y="380"
            width="40"
            height="8"
            fill="#8B5CF6"
            stroke="#6D28D9"
            strokeWidth="1"
            rx="2"
          />
          
          {/* Front Steps */}
          <rect
            x="185"
            y="378"
            width="30"
            height="2"
            fill="#9CA3AF"
          />
          
          {/* Beautiful front windows */}
          <rect
            x="45"
            y="375"
            width="35"
            height="30"
            fill="#DBEAFE"
            stroke="#1E40AF"
            strokeWidth="2"
            rx="3"
          />
          
          {/* Window frame cross */}
          <line x1="62.5" y1="375" x2="62.5" y2="405" stroke="#1E40AF" strokeWidth="1"/>
          <line x1="45" y1="390" x2="80" y2="390" stroke="#1E40AF" strokeWidth="1"/>
          
          <rect
            x="320"
            y="375"
            width="35"
            height="30"
            fill="#DBEAFE"
            stroke="#1E40AF"
            strokeWidth="2"
            rx="3"
          />
          
          {/* Window frame cross */}
          <line x1="337.5" y1="375" x2="337.5" y2="405" stroke="#1E40AF" strokeWidth="1"/>
          <line x1="320" y1="390" x2="355" y2="390" stroke="#1E40AF" strokeWidth="1"/>
          
          {/* Beautiful Garden Path */}
          <rect
            x="190"
            y="380"
            width="20"
            height="40"
            fill="#92400E"
            stroke="#78350F"
            strokeWidth="1"
            rx="2"
          />
          
          {/* Garden path stones */}
          <circle cx="195" cy="385" r="2" fill="#A78BFA"/>
          <circle cx="205" cy="390" r="2" fill="#A78BFA"/>
          <circle cx="195" cy="395" r="2" fill="#A78BFA"/>
          <circle cx="205" cy="400" r="2" fill="#A78BFA"/>
          <circle cx="195" cy="405" r="2" fill="#A78BFA"/>
          <circle cx="205" cy="410" r="2" fill="#A78BFA"/>
          
          {/* Side garden areas */}
          <rect x="30" y="405" width="50" height="15" fill="#10B981" rx="3"/>
          <rect x="320" y="405" width="50" height="15" fill="#10B981" rx="3"/>
          
          {/* Small trees/bushes */}
          <circle cx="45" cy="412" r="6" fill="#065F46"/>
          <circle cx="65" cy="412" r="4" fill="#065F46"/>
          <circle cx="335" cy="412" r="6" fill="#065F46"/>
          <circle cx="355" cy="412" r="4" fill="#065F46"/>
        </svg>
        
        <div className="mt-6 text-center space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
            <p className="text-lg text-gray-700 font-medium mb-3">
              💡 Klicken Sie auf ein Zimmer, um das Licht zu schalten
            </p>
            <div className="flex justify-center items-center space-x-6">
              <div className="flex items-center bg-white rounded-lg px-3 py-2 shadow-sm">
                <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full mr-3 shadow-sm"></div>
                <span className="text-sm text-gray-700 font-medium">Licht an</span>
              </div>
              <div className="flex items-center bg-white rounded-lg px-3 py-2 shadow-sm">
                <div className="w-4 h-4 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mr-3 shadow-sm"></div>
                <span className="text-sm text-gray-700 font-medium">Licht aus</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">🏠 Willkommen in Ihrem intelligenten Zuhause</p>
          </div>
        </div>
      </div>
    </div>
  );
}
