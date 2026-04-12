'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Brain, Code, Lightbulb, Activity, ArrowRight, ShieldCheck, Mail, LogIn, UserPlus } from 'lucide-react';
import { api } from '../lib/axios';

export default function Home() {
  const router = useRouter();
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  
  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/health`);
        const data = await res.json();
        if (data.success) {
          setApiStatus('connected');
        } else {
          setApiStatus('error');
        }
      } catch (error) {
        setApiStatus('error');
      }
    };
    checkApi();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden selection:bg-indigo-500/30">
      
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] mix-blend-screen opacity-70 animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen opacity-60"></div>
         <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[100px] mix-blend-screen opacity-50"></div>
      </div>

      <div className="relative z-10 font-[family-name:var(--font-geist-sans)]">
        
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 lg:px-12 py-6 max-w-7xl mx-auto">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-lg shadow-lg">C</div>
              <span className="text-xl font-extrabold tracking-tight">CloudCampus</span>
           </div>
           <div className="flex items-center gap-4">
              {apiStatus === 'connected' ? (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider rounded-full">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Live
                </div>
              ) : apiStatus === 'error' ? (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider rounded-full">
                   <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Offline
                </div>
              ) : null}
              <button onClick={() => router.push('/login')} className="text-sm font-semibold text-gray-300 hover:text-white transition flex items-center gap-2"><LogIn className="w-4 h-4"/> Sign In</button>
              <button onClick={() => router.push('/register')} className="px-5 py-2.5 text-sm font-bold bg-white text-black hover:bg-gray-100 rounded-full transition shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-2"><UserPlus className="w-4 h-4"/> Get Started</button>
           </div>
        </nav>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-20 pb-32 flex flex-col items-center text-center">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/40 border border-gray-700/50 text-indigo-300 text-sm font-medium mb-8 backdrop-blur-sm">
             <Sparkles className="w-4 h-4 text-indigo-400" />
             <span>Introducing Gemini AI 2.5 Flash Integration</span>
           </div>
           
           <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter leading-[1.1] mb-6">
             The operating system <br className="hidden md:block"/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">for student startups.</span>
           </h1>
           
           <p className="text-lg md:text-xl text-gray-400 max-w-2xl font-light mb-10 leading-relaxed">
             An intelligent ecosystem connecting visionary students, seasoned mentors, and high-growth ideas. Build your startup, generate pitch decks instantly with AI, and gamify your progress.
           </p>

           <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
             <button onClick={() => router.push('/register')} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-full transition duration-300 transform hover:scale-105 shadow-[0_0_30px_rgba(79,70,229,0.3)] flex justify-center items-center gap-2">
                Enter Ecosystem <ArrowRight className="w-5 h-5" />
             </button>
             <button onClick={() => router.push('/dashboard')} className="px-8 py-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 text-white font-bold rounded-full transition duration-300 backdrop-blur-sm flex justify-center items-center gap-2">
                Go to Dashboard
             </button>
           </div>
        </main>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 border-t border-gray-800/50 bg-black/20 backdrop-blur-3xl rounded-t-[3rem]">
           <div className="text-center mb-16">
             <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Powered by advanced intelligence</h2>
             <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to scale from an idea to a funded MVP, wrapped in a gamified, beautiful interface.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Feature 1 */}
              <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl hover:bg-gray-800/80 transition duration-300 group">
                 <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition shrink-0">
                   <Brain className="w-6 h-6 text-blue-400" />
                 </div>
                 <h3 className="text-xl font-bold mb-3 text-gray-100">AI Mentor Matching</h3>
                 <p className="text-gray-400 text-sm leading-relaxed">Our Gemini-powered engine analyzes your skills and domain interests to connect you with the perfect mentors instantly.</p>
              </div>

              {/* Feature 2 */}
              <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl hover:bg-gray-800/80 transition duration-300 group">
                 <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition shrink-0">
                   <Lightbulb className="w-6 h-6 text-purple-400" />
                 </div>
                 <h3 className="text-xl font-bold mb-3 text-gray-100">Smart Pitch Decks</h3>
                 <p className="text-gray-400 text-sm leading-relaxed">Instantly generate professional, presentation-ready pitch decks for your startups using state-of-the-art streaming AI.</p>
              </div>

              {/* Feature 3 */}
              <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl hover:bg-gray-800/80 transition duration-300 group">
                 <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition shrink-0">
                   <Activity className="w-6 h-6 text-green-400" />
                 </div>
                 <h3 className="text-xl font-bold mb-3 text-gray-100">Ecosystem Gamification</h3>
                 <p className="text-gray-400 text-sm leading-relaxed">Earn XP, build streaks, and conquer the global leaderboard. Turn your startup journey into an engaging massively multiplayer game.</p>
              </div>

              {/* Feature 4 */}
              <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl hover:bg-gray-800/80 transition duration-300 group">
                 <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition shrink-0">
                   <Code className="w-6 h-6 text-orange-400" />
                 </div>
                 <h3 className="text-xl font-bold mb-3 text-gray-100">GitHub Automation</h3>
                 <p className="text-gray-400 text-sm leading-relaxed">Link your startup repositories to automatically calculate Activity Scores. Let your code speak for your startup's momentum.</p>
              </div>

              {/* Feature 5 */}
              <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl hover:bg-gray-800/80 transition duration-300 group">
                 <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition shrink-0">
                   <ShieldCheck className="w-6 h-6 text-pink-400" />
                 </div>
                 <h3 className="text-xl font-bold mb-3 text-gray-100">Office Hours & Meetings</h3>
                 <p className="text-gray-400 text-sm leading-relaxed">Seamlessly book office hours with mentors. Manage KanBan schedules and automatically generate Jitsi Meet secure rooms.</p>
              </div>

              {/* Feature 6 */}
              <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl hover:bg-gray-800/80 transition duration-300 group md:col-span-2 lg:col-span-1">
                 <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition shrink-0">
                   <Mail className="w-6 h-6 text-cyan-400" />
                 </div>
                 <h3 className="text-xl font-bold mb-3 text-gray-100">Integrated Communications</h3>
                 <p className="text-gray-400 text-sm leading-relaxed">Built-in nodemon email parsing. Instantly receive OTPs, meeting confirmations, and schedule adjustments straight in your inbox.</p>
              </div>
           </div>
        </section>

      </div>
    </div>
  );
}
