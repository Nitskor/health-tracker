import { SignedIn, SignedOut } from '@clerk/nextjs';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <SignedOut>
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="text-center max-w-2xl">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Health Tracker
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Monitor your health metrics like blood pressure, blood sugar, and more. 
              Get insights and track your progress over time.
            </p>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Get Started
              </h2>
              <p className="text-gray-600 mb-6">
                Sign up or sign in to start tracking your health metrics
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
                  <span className="text-gray-700">Sign up for a free account</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
                  <span className="text-gray-700">Add your health measurements</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
                  <span className="text-gray-700">View trends and insights</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome to Health Tracker
            </h1>
            <p className="text-gray-600">
              Monitor and track your health metrics in one place
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Blood Pressure</h3>
              <p className="text-gray-600 text-sm mb-4">Track systolic and diastolic readings</p>
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Add Reading
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Blood Sugar</h3>
              <p className="text-gray-600 text-sm mb-4">Monitor glucose levels</p>
              <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                Add Reading
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Weight</h3>
              <p className="text-gray-600 text-sm mb-4">Track your weight over time</p>
              <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors">
                Add Reading
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Measurements</h2>
            <p className="text-gray-500">No measurements yet. Start by adding your first health reading!</p>
          </div>
        </div>
      </SignedIn>
    </div>
  );
}
