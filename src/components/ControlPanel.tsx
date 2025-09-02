import { Room } from '@/types';

interface ControlPanelProps {
  rooms: Room[];
  onLightToggle: (roomId: string) => void;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

export default function ControlPanel({ rooms, onLightToggle, connectionStatus }: ControlPanelProps) {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Verbunden';
      case 'connecting':
        return 'Verbinde...';
      case 'disconnected':
        return 'Getrennt';
      default:
        return 'Unbekannt';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">Lichtsteuerung</h3>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} mr-2`}></div>
          <span className="text-sm text-gray-600">{getStatusText()}</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="mr-3">
                <div className={`w-4 h-4 rounded-full ${room.lightOn ? 'bg-yellow-400' : 'bg-gray-400'}`}></div>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">{room.name}</h4>
                <p className="text-sm text-gray-500">
                  {room.floor === 2 ? '2. Stockwerk' : '1. Stockwerk'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => onLightToggle(room.id)}
              disabled={connectionStatus !== 'connected'}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${room.lightOn ? 'bg-blue-600' : 'bg-gray-200'}
                ${connectionStatus !== 'connected' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${room.lightOn ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          Die Änderungen werden in Echtzeit über MQTT synchronisiert
        </p>
      </div>
    </div>
  );
}
