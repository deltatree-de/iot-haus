import { House } from '@/types';
import RoomComponent from './RoomComponent';

interface HouseVisualizationProps {
  house: House;
  onLightToggle: (roomId: string) => void;
}

export default function HouseVisualization({ house, onLightToggle }: HouseVisualizationProps) {
  return (
    <div className="flex flex-col items-center p-4 sm:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          🏠 Smart Home Control
        </h2>
        <p className="text-gray-600 text-sm sm:text-lg">Ihr intelligentes Zuhause wartet auf Sie</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-200/50 backdrop-blur-sm w-full max-w-lg sm:max-w-none">
        <svg 
          width="100%" 
          height="auto" 
          viewBox="0 0 500 500" 
          className="rounded-xl bg-gradient-to-b from-sky-200 via-sky-100 to-green-200 w-full h-auto max-w-md sm:max-w-lg mx-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Beautiful sky and landscape background */}
          <defs>
            <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:"#87CEEB", stopOpacity:1}} />
              <stop offset="70%" style={{stopColor:"#E0F6FF", stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#98FB98", stopOpacity:1}} />
            </linearGradient>
            
            <linearGradient id="wallGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#FFF8DC", stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#F5E6D3", stopOpacity:1}} />
            </linearGradient>
            
            <linearGradient id="roofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#CD853F", stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#8B4513", stopOpacity:1}} />
            </linearGradient>
            
            <filter id="shadow">
              <feDropShadow dx="3" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.3"/>
            </filter>
            
            <filter id="roomShadow">
              <feDropShadow dx="2" dy="2" stdDeviation="1" floodColor="#000000" floodOpacity="0.2"/>
            </filter>
          </defs>
          
          {/* Sky background */}
          <rect x="0" y="0" width="500" height="500" fill="url(#skyGradient)"/>
          
          {/* Distant hills */}
          <ellipse cx="150" cy="380" rx="100" ry="30" fill="#90EE90" opacity="0.6"/>
          <ellipse cx="350" cy="375" rx="120" ry="35" fill="#90EE90" opacity="0.5"/>
          
          {/* Clouds */}
          <ellipse cx="80" cy="50" rx="25" ry="12" fill="#FFFFFF" opacity="0.8"/>
          <ellipse cx="90" cy="45" rx="20" ry="10" fill="#FFFFFF" opacity="0.7"/>
          <ellipse cx="350" cy="40" rx="30" ry="15" fill="#FFFFFF" opacity="0.8"/>
          <ellipse cx="365" cy="35" rx="25" ry="12" fill="#FFFFFF" opacity="0.7"/>
          
          {/* Front garden area */}
          <ellipse cx="250" cy="450" rx="200" ry="40" fill="#228B22"/>
          
          {/* Garden flower beds */}
          <ellipse cx="100" cy="420" rx="40" ry="15" fill="#8B4513"/>
          <ellipse cx="400" cy="425" rx="45" ry="18" fill="#8B4513"/>
          
          {/* Beautiful flowers in flower beds */}
          <g id="flowers1">
            <circle cx="85" cy="415" r="3" fill="#FF69B4"/>
            <circle cx="95" cy="418" r="3" fill="#FF1493"/>
            <circle cx="105" cy="415" r="3" fill="#FFB6C1"/>
            <circle cx="115" cy="418" r="3" fill="#FF69B4"/>
            <circle cx="90" cy="422" r="3" fill="#FF1493"/>
            <circle cx="100" cy="425" r="3" fill="#FFB6C1"/>
            <circle cx="110" cy="422" r="3" fill="#FF69B4"/>
          </g>
          
          <g id="flowers2">
            <circle cx="380" cy="420" r="3" fill="#9932CC"/>
            <circle cx="390" cy="423" r="3" fill="#8A2BE2"/>
            <circle cx="400" cy="420" r="3" fill="#DA70D6"/>
            <circle cx="410" cy="423" r="3" fill="#9932CC"/>
            <circle cx="420" cy="420" r="3" fill="#8A2BE2"/>
            <circle cx="385" cy="427" r="3" fill="#DA70D6"/>
            <circle cx="395" cy="430" r="3" fill="#9932CC"/>
            <circle cx="405" cy="427" r="3" fill="#8A2BE2"/>
            <circle cx="415" cy="430" r="3" fill="#DA70D6"/>
          </g>
          
          {/* House Foundation with natural stone */}
          <rect
            x="75"
            y="365"
            width="350"
            height="20"
            fill="#8B7355"
            stroke="#654321"
            strokeWidth="2"
            rx="3"
          />
          
          {/* Country house main structure */}
          <rect
            x="80"
            y="180"
            width="340"
            height="190"
            fill="url(#wallGradient)"
            stroke="#D2B48C"
            strokeWidth="3"
            filter="url(#shadow)"
            rx="5"
          />
          
          {/* Rustic roof with terracotta tiles */}
          <polygon
            points="65,185 250,120 435,185 420,180 250,130 80,180"
            fill="url(#roofGradient)"
            stroke="#8B4513"
            strokeWidth="3"
            filter="url(#shadow)"
          />
          
          {/* Roof tile texture lines */}
          <line x1="80" y1="180" x2="420" y2="180" stroke="#A0522D" strokeWidth="2"/>
          <line x1="90" y1="175" x2="410" y2="175" stroke="#A0522D" strokeWidth="1"/>
          <line x1="100" y1="170" x2="400" y2="170" stroke="#A0522D" strokeWidth="1"/>
          <line x1="110" y1="165" x2="390" y2="165" stroke="#A0522D" strokeWidth="1"/>
          
          {/* Charming chimney with brick texture */}
          <rect
            x="320"
            y="110"
            width="30"
            height="50"
            fill="#B22222"
            stroke="#8B0000"
            strokeWidth="2"
            rx="2"
          />
          
          {/* Brick pattern on chimney */}
          <line x1="320" y1="125" x2="350" y2="125" stroke="#8B0000" strokeWidth="1"/>
          <line x1="320" y1="140" x2="350" y2="140" stroke="#8B0000" strokeWidth="1"/>
          <line x1="335" y1="110" x2="335" y2="160" stroke="#8B0000" strokeWidth="1"/>
          
          {/* Chimney pot */}
          <rect
            x="325"
            y="105"
            width="20"
            height="10"
            fill="#8B0000"
            rx="2"
          />
          
          {/* Cozy smoke */}
          <circle cx="335" cy="100" r="3" fill="#D3D3D3" opacity="0.7">
            <animate attributeName="cy" values="100;85;70" dur="4s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.7;0.4;0" dur="4s" repeatCount="indefinite"/>
            <animate attributeName="r" values="3;5;7" dur="4s" repeatCount="indefinite"/>
          </circle>
          <circle cx="340" cy="95" r="2" fill="#D3D3D3" opacity="0.5">
            <animate attributeName="cy" values="95;80;65" dur="4.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.5;0.3;0" dur="4.5s" repeatCount="indefinite"/>
            <animate attributeName="r" values="2;4;6" dur="4.5s" repeatCount="indefinite"/>
          </circle>
          
          {/* Floor separator */}
          <line
            x1="80"
            y1="275"
            x2="420"
            y2="275"
            stroke="#8B7355"
            strokeWidth="4"
            opacity="0.8"
          />
          
          {/* Room separators */}
          <line
            x1="250"
            y1="275"
            x2="250"
            y2="370"
            stroke="#8B7355"
            strokeWidth="4"
            opacity="0.8"
          />
          
          <line
            x1="250"
            y1="180"
            x2="250"
            y2="275"
            stroke="#8B7355"
            strokeWidth="4"
            opacity="0.8"
          />
          
          {/* Charming floor labels with country style */}
          <rect x="40" y="220" width="35" height="30" fill="#8B4513" rx="8" opacity="0.9"/>
          <text
            x="57"
            y="240"
            textAnchor="middle"
            className="fill-white text-xl font-bold"
            style={{ fontSize: '16px' }}
          >
            2F
          </text>
          
          <rect x="40" y="320" width="35" height="30" fill="#8B4513" rx="8" opacity="0.9"/>
          <text
            x="57"
            y="340"
            textAnchor="middle"
            className="fill-white text-xl font-bold"
            style={{ fontSize: '16px' }}
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
          
          {/* Charming country house front door */}
          <rect
            x="225"
            y="365"
            width="50"
            height="20"
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="2"
            rx="3"
          />
          
          {/* Door window with diamond pattern */}
          <rect
            x="235"
            y="370"
            width="30"
            height="10"
            fill="#E6F3FF"
            stroke="#654321"
            strokeWidth="1"
            rx="2"
          />
          
          {/* Diamond window pattern */}
          <line x1="235" y1="375" x2="265" y2="375" stroke="#654321" strokeWidth="1"/>
          <line x1="250" y1="370" x2="250" y2="380" stroke="#654321" strokeWidth="1"/>
          
          {/* Rustic door handle */}
          <circle
            cx="260"
            cy="377"
            r="2"
            fill="#CD853F"
          />
          
          {/* Stone steps */}
          <ellipse
            cx="250"
            cy="385"
            rx="30"
            ry="5"
            fill="#A9A9A9"
            stroke="#696969"
            strokeWidth="1"
          />
          
          <ellipse
            cx="250"
            cy="390"
            rx="35"
            ry="6"
            fill="#A9A9A9"
            stroke="#696969"
            strokeWidth="1"
          />
          
          {/* Beautiful country house windows with shutters - positioned between rooms */}
          <g id="leftWindow">
            <rect
              x="125"
              y="240"
              width="35"
              height="30"
              fill="#E6F3FF"
              stroke="#8B4513"
              strokeWidth="2"
              rx="3"
            />
            
            {/* Window cross frame */}
            <line x1="142.5" y1="240" x2="142.5" y2="270" stroke="#8B4513" strokeWidth="1"/>
            <line x1="125" y1="255" x2="160" y2="255" stroke="#8B4513" strokeWidth="1"/>
            
            {/* Left shutter */}
            <rect
              x="115"
              y="240"
              width="8"
              height="30"
              fill="#228B22"
              stroke="#006400"
              strokeWidth="1"
              rx="2"
            />
            
            {/* Right shutter */}
            <rect
              x="162"
              y="240"
              width="8"
              height="30"
              fill="#228B22"
              stroke="#006400"
              strokeWidth="1"
              rx="2"
            />
            
            {/* Window flower box */}
            <rect
              x="120"
              y="270"
              width="45"
              height="5"
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="1"
              rx="1"
            />
            
            {/* Window box flowers */}
            <circle cx="128" cy="272" r="1.5" fill="#FF69B4"/>
            <circle cx="135" cy="272" r="1.5" fill="#FFB6C1"/>
            <circle cx="142" cy="272" r="1.5" fill="#FF1493"/>
            <circle cx="149" cy="272" r="1.5" fill="#FF69B4"/>
            <circle cx="157" cy="272" r="1.5" fill="#FFB6C1"/>
          </g>
          
          <g id="rightWindow">
            <rect
              x="340"
              y="240"
              width="35"
              height="30"
              fill="#E6F3FF"
              stroke="#8B4513"
              strokeWidth="2"
              rx="3"
            />
            
            {/* Window cross frame */}
            <line x1="357.5" y1="240" x2="357.5" y2="270" stroke="#8B4513" strokeWidth="1"/>
            <line x1="340" y1="255" x2="375" y2="255" stroke="#8B4513" strokeWidth="1"/>
            
            {/* Left shutter */}
            <rect
              x="330"
              y="240"
              width="8"
              height="30"
              fill="#228B22"
              stroke="#006400"
              strokeWidth="1"
              rx="2"
            />
            
            {/* Right shutter */}
            <rect
              x="377"
              y="240"
              width="8"
              height="30"
              fill="#228B22"
              stroke="#006400"
              strokeWidth="1"
              rx="2"
            />
            
            {/* Window flower box */}
            <rect
              x="335"
              y="270"
              width="45"
              height="5"
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="1"
              rx="1"
            />
            
            {/* Window box flowers */}
            <circle cx="343" cy="272" r="1.5" fill="#9932CC"/>
            <circle cx="350" cy="272" r="1.5" fill="#8A2BE2"/>
            <circle cx="357" cy="272" r="1.5" fill="#DA70D6"/>
            <circle cx="364" cy="272" r="1.5" fill="#9932CC"/>
            <circle cx="372" cy="272" r="1.5" fill="#8A2BE2"/>
          </g>
          
          {/* Garden path with natural stones */}
          <ellipse
            cx="250"
            cy="430"
            rx="25"
            ry="15"
            fill="#D2B48C"
            stroke="#A0522D"
            strokeWidth="1"
          />
          
          {/* Stepping stones */}
          <ellipse cx="250" cy="400" rx="8" ry="5" fill="#A9A9A9"/>
          <ellipse cx="245" cy="410" rx="8" ry="5" fill="#A9A9A9"/>
          <ellipse cx="255" cy="420" rx="8" ry="5" fill="#A9A9A9"/>
          
          {/* Side garden areas with natural landscaping */}
          <ellipse cx="120" cy="430" rx="60" ry="20" fill="#228B22"/>
          <ellipse cx="380" cy="435" rx="65" ry="22" fill="#228B22"/>
          
          {/* Beautiful trees */}
          <g id="leftTree">
            <rect x="80" y="410" width="6" height="25" fill="#8B4513"/>
            <circle cx="83" cy="405" r="15" fill="#228B22"/>
            <circle cx="78" cy="400" r="12" fill="#32CD32"/>
            <circle cx="88" cy="398" r="10" fill="#228B22"/>
          </g>
          
          <g id="rightTree">
            <rect x="440" y="415" width="8" height="30" fill="#8B4513"/>
            <circle cx="444" cy="410" r="18" fill="#228B22"/>
            <circle cx="438" cy="405" r="14" fill="#32CD32"/>
            <circle cx="450" cy="403" r="12" fill="#228B22"/>
          </g>
          
          {/* Garden bushes and shrubs */}
          <ellipse cx="150" cy="440" rx="15" ry="8" fill="#006400"/>
          <ellipse cx="170" cy="445" rx="12" ry="6" fill="#228B22"/>
          <ellipse cx="130" cy="448" rx="10" ry="5" fill="#006400"/>
          
          <ellipse cx="350" cy="445" rx="18" ry="10" fill="#006400"/>
          <ellipse cx="370" cy="450" rx="14" ry="7" fill="#228B22"/>
          <ellipse cx="390" cy="447" rx="12" ry="6" fill="#006400"/>
          
          {/* Scattered wildflowers in the grass */}
          <circle cx="200" cy="440" r="1.5" fill="#FFD700"/>
          <circle cx="210" cy="445" r="1.5" fill="#FF6347"/>
          <circle cx="290" cy="442" r="1.5" fill="#FFD700"/>
          <circle cx="300" cy="447" r="1.5" fill="#FF6347"/>
          <circle cx="180" cy="448" r="1.5" fill="#32CD32"/>
          <circle cx="320" cy="449" r="1.5" fill="#32CD32"/>
        </svg>
        
        <div className="mt-4 sm:mt-6 text-center space-y-3 sm:space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 sm:p-4 border border-blue-200">
            <p className="text-sm sm:text-lg text-gray-700 font-medium mb-2 sm:mb-3">
              💡 Klicken Sie auf ein Zimmer, um das Licht zu schalten
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-6">
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
            <p className="text-xs sm:text-sm text-gray-500">🏠 Willkommen in Ihrem intelligenten Zuhause</p>
          </div>
        </div>
      </div>
    </div>
  );
}
