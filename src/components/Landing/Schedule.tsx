"use client";

import { useState } from "react";

export function Schedule() {
  const [selectedDay, setSelectedDay] = useState("day1");

  const schedule = {
    day1: [
      { time: "9:00 AM", event: "Opening Ceremony", venue: "Main Hall" },
      { time: "10:00 AM", event: "Visual Arts Competition", venue: "Art Studio" },
      { time: "11:30 AM", event: "Basketball Tournament", venue: "Sports Complex" },
      { time: "1:00 PM", event: "Lunch Break", venue: "Cafeteria" },
      { time: "2:30 PM", event: "Poetry Competition", venue: "Auditorium" },
      { time: "4:00 PM", event: "Drama Performance", venue: "Theater" },
    ],
    day2: [
      { time: "9:00 AM", event: "Music Competition", venue: "Music Hall" },
      { time: "10:30 AM", event: "Football Tournament", venue: "Sports Field" },
      { time: "12:00 PM", event: "Art Exhibition Opening", venue: "Gallery" },
      { time: "1:30 PM", event: "Lunch Break", venue: "Cafeteria" },
      { time: "3:00 PM", event: "Dance Performance", venue: "Main Stage" },
      { time: "4:30 PM", event: "Athletic Events", venue: "Track & Field" },
    ],
    day3: [
      { time: "9:00 AM", event: "Final Competitions", venue: "Various Venues" },
      { time: "11:00 AM", event: "Team Presentations", venue: "Main Hall" },
      { time: "1:00 PM", event: "Lunch & Networking", venue: "Cafeteria" },
      { time: "2:30 PM", event: "Awards Ceremony", venue: "Main Hall" },
      { time: "4:00 PM", event: "Closing Celebration", venue: "Main Stage" },
      { time: "5:30 PM", event: "Festival Wrap-up", venue: "Main Hall" },
    ],
  };

  const days = [
    { key: "day1", label: "Day 1", date: "Arts Focus", color: "from-green-400 to-emerald-500" },
    { key: "day2", label: "Day 2", date: "Sports Focus", color: "from-blue-400 to-cyan-500" },
    { key: "day3", label: "Day 3", date: "Finals & Awards", color: "from-red-400 to-rose-500" },
  ];

  return (
    <section id="schedule" className="py-20 px-8 bg-white relative overflow-hidden"
             style={{
               backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
               backgroundSize: '40px 40px'
             }}>
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center mr-2">
              <div className="text-2xl mr-2">📅</div>
            </div>
            <div className="flex -space-x-2 mr-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full border-2 border-white"></div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full border-2 border-white"></div>
              <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-rose-400 rounded-full border-2 border-white"></div>
              <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-white text-sm font-bold">+</span>
              </div>
            </div>
            <span className="text-gray-600 text-sm">3-day festival schedule</span>
          </div>

          <div className="relative mb-8">
            <h2 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
              Festival<br />
              schedule
            </h2>
          </div>

          <p className="text-gray-500 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
            Plan your festival experience with our detailed<br />
            3-day schedule of events and competitions
          </p>
        </div>

        {/* Enhanced Day Selector with Hero Theme */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-5xl mx-auto mb-16">
          {days.map((day, index) => (
            <div
              key={day.key}
              onClick={() => setSelectedDay(day.key)}
              className={`bg-gradient-to-br ${day.color} rounded-3xl w-full md:w-80 h-32 relative overflow-hidden flex items-center justify-center cursor-pointer transform transition-all duration-500 ease-out hover:scale-105 hover:shadow-2xl animate-fade-in-up group ${
                selectedDay === day.key ? 'ring-4 ring-gray-900 ring-opacity-50' : ''
              }`}
              style={{ animationDelay: `${0.2 + index * 0.2}s` }}
            >
              
              {/* Floating animation background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 animate-pulse"></div>
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Content */}
              <div className="text-white text-center relative z-10 group-hover:text-white transition-colors duration-300">
                <h3 className="text-2xl font-bold mb-1">{day.label}</h3>
                <p className="text-sm opacity-80 group-hover:opacity-100 transition-opacity duration-300">{day.date}</p>
              </div>
              
              {/* Animated border */}
              <div className="absolute inset-0 rounded-3xl border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
              
              {/* Selection indicator */}
              {selectedDay === day.key && (
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-100 animate-shimmer"></div>
              )}
            </div>
          ))}
        </div>

        {/* Enhanced Schedule Grid */}
        <div className="grid gap-6 max-w-4xl mx-auto mb-12">
          {schedule[selectedDay as keyof typeof schedule].map((event, index) => (
            <div
              key={index}
              className="bg-white border-2 border-gray-100 rounded-3xl p-8 hover:border-gray-200 transition-all duration-500 transform hover:scale-105 hover:shadow-xl animate-fade-in-up group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-6">
                    <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white font-bold text-lg px-4 py-2 rounded-full min-w-[100px] text-center">
                      {event.time}
                    </div>
                    <div>
                      <h4 className="text-gray-900 font-bold text-xl mb-1 group-hover:text-gray-700 transition-colors duration-300">{event.event}</h4>
                      <p className="text-gray-600 flex items-center">
                        <span className="text-lg mr-2">📍</span>
                        {event.venue}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 md:mt-0">
                  <button className="bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-700 font-semibold px-6 py-3 rounded-full transition-all duration-300 border-2 border-gray-200 hover:border-gray-900 transform hover:scale-105">
                    Set Reminder
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced CTA Section */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="bg-black text-white px-8 py-4 rounded-full flex items-center gap-2 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 text-lg shadow-lg">
              <span>Download Schedule</span>
              <span className="text-yellow-400">⚡</span>
            </button>
            <button className="text-gray-500 hover:text-gray-900 transition-colors text-lg font-medium">
              Subscribe Updates
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}