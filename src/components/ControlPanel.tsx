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
        return 'bg-gradient-to-r from-green-400 to-green-500';
      case 'connecting':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500 animate-pulse';
      case 'disconnected':
        return 'bg-gradient-to-r from-red-400 to-red-500';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return '🟢';
      case 'connecting':
        return '🟡';
      case 'disconnected':
        return '🔴';
      default:
        return '⚪';
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
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-md sm:max-w-lg border border-gray-200/50 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="text-center sm:text-left">
          <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            💡 Lichtsteuerung
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Smart Home Control Panel</p>
        </div>
        <div className="flex items-center justify-center sm:justify-end bg-white rounded-xl px-3 sm:px-4 py-2 shadow-sm border border-gray-200">
          <div className={`w-3 sm:w-4 h-3 sm:h-4 rounded-full ${getStatusColor()} mr-2 sm:mr-3 shadow-sm`}></div>
          <div className="text-center sm:text-right">
            <span className="text-xs text-gray-500 block">Status</span>
            <span className="text-xs sm:text-sm font-semibold text-gray-700">{getStatusText()}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        {rooms.map((room, index) => (
          <div
            key={room.id}
            className="group relative bg-white rounded-xl p-3 sm:p-4 border border-gray-200/50 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1 min-w-0">
                <div className="mr-3 sm:mr-4 relative flex-shrink-0">
                  <div className={`w-5 sm:w-6 h-5 sm:h-6 rounded-full ${room.lightOn ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-gray-300 to-gray-400'} shadow-sm transition-all duration-300`}>
                    {room.lightOn && (
                      <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-30"></div>
                    )}
                  </div>
                  <div className="absolute -top-1 -right-1 text-xs">
                    {room.lightOn ? '💡' : '🌙'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <h4 className="font-semibold text-gray-800 text-base sm:text-lg mr-0 sm:mr-2 truncate">{room.name}</h4>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium mt-1 sm:mt-0 self-start">
                      {room.floor === 2 ? '2F' : '1F'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {room.floor === 2 ? '2. Stockwerk' : '1. Stockwerk'} • {room.position === 'left' ? 'Links' : 'Rechts'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => onLightToggle(room.id)}
                disabled={connectionStatus !== 'connected'}
                className={`
                  relative inline-flex h-7 w-12 sm:h-8 sm:w-14 items-center rounded-full transition-all duration-300 shadow-sm flex-shrink-0 ml-3
                  ${room.lightOn ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-gray-300 to-gray-400'}
                  ${connectionStatus !== 'connected' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md transform hover:scale-105'}
                  ${room.lightOn ? 'shadow-blue-200' : 'shadow-gray-200'}
                `}
              >
                <span
                  className={`
                    inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white shadow-sm transition-transform duration-300 flex items-center justify-center text-xs
                    ${room.lightOn ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'}
                  `}
                >
                  {room.lightOn ? '☀️' : '🌙'}
                </span>
              </button>
            </div>
            
            {/* Status indicator */}
            <div className="absolute top-2 right-2">
              <div className={`w-2 h-2 rounded-full ${room.lightOn ? 'bg-green-400' : 'bg-gray-300'} transition-colors duration-300`}></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50">
        <div className="flex flex-col sm:flex-row items-center justify-center text-center">
          <div className="mr-0 sm:mr-3 text-xl sm:text-2xl mb-2 sm:mb-0">📡</div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-700">
              MQTT Echtzeit-Synchronisation
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Alle Änderungen werden sofort übertragen
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
