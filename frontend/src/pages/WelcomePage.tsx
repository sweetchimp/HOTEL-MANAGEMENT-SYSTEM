import { useNavigate } from 'react-router-dom'

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-12 max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">ALTONS HOTEL</h1>
          <p className="text-gray-600">Management System</p>
        </div>

        <div className="mb-8">
          <p className="text-lg text-gray-700 mb-2">Welcome to your hotel management dashboard</p>
          <p className="text-sm text-gray-500">Manage reservations, rooms, guests, and more</p>
        </div>

        <div className="mb-8 text-left bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Features:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center">
              <span className="text-blue-600 mr-2">&#10003;</span> Room Management
            </li>
            <li className="flex items-center">
              <span className="text-blue-600 mr-2">&#10003;</span> Guest Reservations
            </li>
            <li className="flex items-center">
              <span className="text-blue-600 mr-2">&#10003;</span> Check-in / Check-out
            </li>
            <li className="flex items-center">
              <span className="text-blue-600 mr-2">&#10003;</span> Billing & Invoicing
            </li>
            <li className="flex items-center">
              <span className="text-blue-600 mr-2">&#10003;</span> Reports & Analytics
            </li>
          </ul>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors duration-200"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
