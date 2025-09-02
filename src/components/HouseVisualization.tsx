import { House } from '@/types';
import RoomComponent from './RoomComponent';

interface HouseVisualizationProps {
  house: House;
  onLightToggle: (roomId: string) => void;
}

export default function HouseVisualization({ house, onLightToggle }: HouseVisualizationProps) {
  return (
    <div className="flex flex-col items-center p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Smart Home Control</h2>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <svg width="420" height="420" viewBox="0 0 420 420" className="border border-gray-300 rounded">
          {/* House Structure */}
          {/* Outer Wall */}
          <rect
            x="30"
            y="30"
            width="340"
            height="340"
            fill="#E5E7EB"
            stroke="#374151"
            strokeWidth="3"
          />
          
          {/* Roof */}
          <polygon
            points="20,30 200,10 380,30"
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="2"
          />
          
          {/* Roof Ridge */}
          <line
            x1="20"
            y1="30"
            x2="380"
            y2="30"
            stroke="#654321"
            strokeWidth="3"
          />
          
          {/* Chimney */}
          <rect
            x="320"
            y="5"
            width="20"
            height="35"
            fill="#8B0000"
            stroke="#654321"
            strokeWidth="1"
          />
          
          {/* Chimney Top */}
          <rect
            x="318"
            y="3"
            width="24"
            height="4"
            fill="#654321"
          />
          
          {/* Floor Separator */}
          <line
            x1="30"
            y1="200"
            x2="370"
            y2="200"
            stroke="#374151"
            strokeWidth="2"
          />
          
          {/* Room Separators */}
          {/* Floor 1 - Vertical separator */}
          <line
            x1="200"
            y1="200"
            x2="200"
            y2="370"
            stroke="#374151"
            strokeWidth="2"
          />
          
          {/* Floor 2 - Vertical separator */}
          <line
            x1="200"
            y1="30"
            x2="200"
            y2="200"
            stroke="#374151"
            strokeWidth="2"
          />
          
          {/* Floor Labels */}
          <text
            x="20"
            y="120"
            textAnchor="middle"
            className="fill-gray-600 text-lg font-semibold"
            style={{ fontSize: '16px' }}
            transform="rotate(-90, 20, 120)"
          >
            2. OG
          </text>
          
          <text
            x="20"
            y="285"
            textAnchor="middle"
            className="fill-gray-600 text-lg font-semibold"
            style={{ fontSize: '16px' }}
            transform="rotate(-90, 20, 285)"
          >
            1. OG
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
          
          {/* Door */}
          <rect
            x="185"
            y="370"
            width="30"
            height="10"
            fill="#8B4513"
            stroke="#374151"
            strokeWidth="1"
          />
          
          {/* Door Handle */}
          <circle
            cx="207"
            cy="375"
            r="2"
            fill="#FFD700"
          />
          
          {/* Windows on the front facade */}
          <rect
            x="50"
            y="380"
            width="30"
            height="25"
            fill="#87CEEB"
            stroke="#374151"
            strokeWidth="1"
          />
          
          <rect
            x="320"
            y="380"
            width="30"
            height="25"
            fill="#87CEEB"
            stroke="#374151"
            strokeWidth="1"
          />
          
          {/* Garden Path */}
          <rect
            x="190"
            y="380"
            width="20"
            height="40"
            fill="#D2B48C"
            stroke="#8B7355"
            strokeWidth="1"
          />
        </svg>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Klicken Sie auf ein Zimmer, um das Licht zu schalten
          </p>
          <div className="flex justify-center items-center mt-2 space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">Licht an</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">Licht aus</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
