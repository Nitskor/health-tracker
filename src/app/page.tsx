'use client';

import { useState } from 'react';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import DashboardChart from '@/components/DashboardChart';
import DashboardWeightChart from '@/components/DashboardWeightChart';
import DashboardBloodSugarChart from '@/components/DashboardBloodSugarChart';
import BloodPressureForm from '@/components/BloodPressureForm';
import BloodSugarForm from '@/components/BloodSugarForm';
import WeightForm from '@/components/WeightForm';
import Modal from '@/components/Modal';

export default function Home() {
  const [showBPForm, setShowBPForm] = useState(false);
  const [showBSForm, setShowBSForm] = useState(false);
  const [showWeightForm, setShowWeightForm] = useState(false);

  const handleFormSuccess = () => {
    // Close all forms and refresh data
    setShowBPForm(false);
    setShowBSForm(false);
    setShowWeightForm(false);
    // The charts will auto-refresh on next render
    window.location.reload();
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <SignedOut>
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
            <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-500"></div>
          </div>

          <div className="relative flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center max-w-5xl mx-auto">
              {/* Main Heading */}
              <div className="mb-8">
                <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-full mb-6">
                  <span className="text-blue-600 text-sm font-semibold px-4 py-1">Your Personal Health Dashboard</span>
                </div>
                <h1 className="text-6xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-6 leading-tight">
                  Health Tracker
                </h1>
                <p className="text-xl sm:text-2xl text-gray-700 mb-4 max-w-3xl mx-auto leading-relaxed">
                  Take control of your health journey with professional-grade tracking
                </p>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Monitor blood pressure, blood sugar, weight, and more. Get actionable insights and visualize your progress over time.
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Blood Pressure</h3>
                  <p className="text-gray-600">Track systolic and diastolic readings with detailed analytics</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Blood Sugar</h3>
                  <p className="text-gray-600">Monitor glucose levels across different reading types</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Weight Tracking</h3>
                  <p className="text-gray-600">Monitor weight trends and achieve your fitness goals</p>
                </div>
              </div>

              {/* CTA Card */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-10 max-w-2xl mx-auto border border-gray-200">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Start Your Health Journey Today
                </h2>
                <p className="text-gray-600 mb-8 text-lg">
                  Sign up for a free account and take the first step towards better health management
                </p>
                
                <div className="space-y-5 mb-8">
                  <div className="flex items-start space-x-4 text-left">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">1</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Create Your Free Account</h4>
                      <p className="text-gray-600 text-sm">Sign up in seconds with your email or social account</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 text-left">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">2</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Log Your Health Measurements</h4>
                      <p className="text-gray-600 text-sm">Quick and easy data entry with smart forms</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 text-left">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">3</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Visualize & Export Reports</h4>
                      <p className="text-gray-600 text-sm">View beautiful charts and export professional PDF reports</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-3">
              Your Health Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Monitor and track your health metrics with professional insights
            </p>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
            {/* Blood Pressure Card */}
            <div className="group bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 md:p-6 text-white">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-xl md:text-2xl font-bold opacity-90">BP</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-1">Blood Pressure</h3>
                <p className="text-blue-100 text-xs md:text-sm">Track systolic & diastolic</p>
              </div>
              <div className="p-4 md:p-6 space-y-2 md:space-y-3">
                <a 
                  href="/blood-pressure"
                  className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-center font-semibold shadow-md hover:shadow-lg text-sm md:text-base"
                >
                  Open Tracker →
                </a>
                <button 
                  onClick={() => setShowBPForm(true)}
                  className="w-full bg-blue-50 text-blue-700 px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl hover:bg-blue-100 transition-colors font-medium text-sm md:text-base"
                >
                  + Quick Add
                </button>
              </div>
            </div>

            {/* Blood Sugar Card */}
            <div className="group bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 md:p-6 text-white">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="text-xl md:text-2xl font-bold opacity-90">BS</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-1">Blood Sugar</h3>
                <p className="text-green-100 text-xs md:text-sm">Monitor glucose levels</p>
              </div>
              <div className="p-4 md:p-6 space-y-2 md:space-y-3">
                <a 
                  href="/blood-sugar"
                  className="block w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 text-center font-semibold shadow-md hover:shadow-lg text-sm md:text-base"
                >
                  Open Tracker →
                </a>
                <button 
                  onClick={() => setShowBSForm(true)}
                  className="w-full bg-green-50 text-green-700 px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl hover:bg-green-100 transition-colors font-medium text-sm md:text-base"
                >
                  + Quick Add
                </button>
              </div>
            </div>

            {/* Weight Card */}
            <div className="group bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 md:p-6 text-white">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <span className="text-xl md:text-2xl font-bold opacity-90">WT</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-1">Weight Tracker</h3>
                <p className="text-purple-100 text-xs md:text-sm">Monitor weight trends</p>
              </div>
              <div className="p-4 md:p-6 space-y-2 md:space-y-3">
                <a 
                  href="/weight"
                  className="block w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 text-center font-semibold shadow-md hover:shadow-lg text-sm md:text-base"
                >
                  Open Tracker →
                </a>
                <button 
                  onClick={() => setShowWeightForm(true)}
                  className="w-full bg-purple-50 text-purple-700 px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl hover:bg-purple-100 transition-colors font-medium text-sm md:text-base"
                >
                  + Quick Add
                </button>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Trends</h2>
              <span className="text-sm text-gray-500">Last 10 readings</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DashboardChart />
              <DashboardBloodSugarChart />
              <DashboardWeightChart />
            </div>
          </div>

          {/* Quick Stats or Recent Activity */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Getting Started</h2>
              <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="text-4xl font-bold text-blue-600 mb-2">1</div>
                <p className="text-gray-700 font-medium mb-1">Add Your First Reading</p>
                <p className="text-sm text-gray-500">Click &ldquo;Quick Add&rdquo; above</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="text-4xl font-bold text-green-600 mb-2">2</div>
                <p className="text-gray-700 font-medium mb-1">Track Your Progress</p>
                <p className="text-sm text-gray-500">View trends over time</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="text-4xl font-bold text-purple-600 mb-2">3</div>
                <p className="text-gray-700 font-medium mb-1">Export Reports</p>
                <p className="text-sm text-gray-500">Share with your doctor</p>
              </div>
            </div>
          </div>

          {/* Blood Pressure Form Modal */}
          <Modal isOpen={showBPForm} onClose={() => setShowBPForm(false)}>
            <BloodPressureForm 
              onSuccess={handleFormSuccess}
              onCancel={() => setShowBPForm(false)}
              editingReading={null}
            />
          </Modal>

          {/* Blood Sugar Form Modal */}
          <Modal isOpen={showBSForm} onClose={() => setShowBSForm(false)} title="Add Blood Sugar Reading">
            <BloodSugarForm onSuccess={handleFormSuccess} editingReading={null} />
          </Modal>

          {/* Weight Form Modal */}
          <Modal isOpen={showWeightForm} onClose={() => setShowWeightForm(false)}>
            <WeightForm 
              onSuccess={handleFormSuccess}
              onCancel={() => setShowWeightForm(false)}
              editingReading={null}
            />
          </Modal>
        </div>
      </SignedIn>
    </div>
  );
}
