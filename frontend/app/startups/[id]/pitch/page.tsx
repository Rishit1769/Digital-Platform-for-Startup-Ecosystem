'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { api } from '../../../../lib/axios';
import { useAuth } from '../../../../lib/auth';

export default function PitchDeck({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  
  const [deck, setDeck] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [streamData, setStreamData] = useState('');
  
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    fetchDeck();
  }, [id]);

  const fetchDeck = async () => {
    try {
      const res = await api.get(`/ai/pitch/${id}`);
      setDeck(res.data.data.content);
    } catch(err) {} finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setDeck(null);
    setStreamData('');
    
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/ai/pitch/${id}/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startup_id: id })
      });

      if (!response.body) throw new Error('No body');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        
        // chunk can be multiple `data: {...}\n\n`
        const lines = chunk.split('\n\n');
        for (const line of lines) {
           if (line.startsWith('data: ')) {
               const data = JSON.parse(line.slice(6));
               if (data.error) throw new Error(data.error);
               if (data.chunk) setStreamData(prev => prev + data.chunk);
               if (data.done) {
                 fetchDeck(); // Fully generated, fetch structured version from DB
               }
           }
        }
      }

    } catch (err: any) {
      alert(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Keyboard nav
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
       if (e.key === 'ArrowRight' && deck?.slides && activeSlide < deck.slides.length - 1) setActiveSlide(a => a + 1);
       if (e.key === 'ArrowLeft' && deck?.slides && activeSlide > 0) setActiveSlide(a => a - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeSlide, deck]);

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 border-t border-gray-800 flex flex-col print:bg-white print:text-black">
      
      {/* Top Bar - hidden in print */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center print:hidden">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
           <span>✨</span> AI Smart Pitch Deck
        </h1>
        <div className="flex gap-3">
          {deck ? (
            <>
              <button onClick={handleGenerate} disabled={generating} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-bold transition disabled:opacity-50">Regenerate</button>
              <button onClick={handleExportPDF} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold shadow transition">Export PDF</button>
            </>
          ) : (
            <button onClick={handleGenerate} disabled={generating} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow transition disabled:opacity-50">
               {generating ? 'Generating...' : 'Generate Pitch Deck'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {generating && !deck ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-900 text-white print:hidden">
            <div className="w-24 h-24 mb-8 relative">
               <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
               <div className="absolute inset-2 border-r-4 border-purple-500 rounded-full animate-spin direction-reverse"></div>
            </div>
            <h2 className="text-2xl font-bold mb-4 animate-pulse">Gemini is writing your presentation...</h2>
            <div className="max-w-2xl w-full bg-gray-800 p-6 rounded-xl border border-gray-700 max-h-64 overflow-y-auto font-mono text-sm text-blue-300 whitespace-pre-wrap shadow-inner">
               {streamData || 'Initializing AI model...'}
            </div>
          </div>
        ) : !deck ? (
          <div className="flex-1 flex items-center justify-center p-8 text-gray-400 print:hidden">
             Click "Generate" to build a 10-slide deck instantly using Gemini 2.5 Flash.
          </div>
        ) : (
          <>
             {/* Sidebar List - hidden in print */}
             <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto p-4 space-y-2 print:hidden">
               {deck.slides.map((s: any, idx: number) => (
                 <button 
                   key={idx} 
                   onClick={() => setActiveSlide(idx)}
                   className={`w-full text-left px-4 py-3 rounded-xl transition ${activeSlide === idx ? 'bg-blue-600 text-white font-bold shadow' : 'text-gray-300 hover:bg-gray-700'}`}
                 >
                   <div className="text-xs opacity-70 uppercase tracking-wider mb-1">Slide {s.slide_number}</div>
                   <div className="truncate">{s.title}</div>
                 </button>
               ))}
             </div>

             {/* Slide View - Print shows all sequential, screen shows one */}
             <div className="flex-1 bg-gray-900 overflow-y-auto flex justify-center items-center p-8 print:block print:p-0">
               
               {/* This is the container that maps to page size inside pdf */}
               {deck.slides.map((slide: any, idx: number) => (
                 <div key={idx} className={`w-full max-w-5xl aspect-video bg-white text-gray-900 shadow-2xl rounded-xl flex flex-col overflow-hidden relative print:shadow-none print:rounded-none print:mb-10 print:h-screen print:page-break-after-always ${idx === activeSlide ? 'flex' : 'hidden print:flex'}`}>
                   
                   <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-6 px-12 print:from-blue-600 print:to-blue-600">
                     <h2 className="text-4xl font-extrabold text-white">{slide.title}</h2>
                   </div>
                   
                   <div className="p-12 flex-1 flex flex-col justify-center">
                     <ul className="space-y-6 list-none">
                       {slide.key_points.map((pt: string, i: number) => (
                         <li key={i} className="text-2xl font-medium text-gray-800 flex items-start gap-4">
                           <span className="text-blue-500 text-3xl shrink-0 leading-none mr-2">•</span>
                           <span>{pt}</span>
                         </li>
                       ))}
                     </ul>
                   </div>

                   <div className="absolute bottom-4 right-8 font-bold text-gray-300 text-2xl">{slide.slide_number}</div>
                   <div className="absolute bottom-4 left-8 font-bold text-gray-300 text-xl tracking-wider select-none">{deck.startup_name}</div>
                 </div>
               ))}
               
             </div>
             
             {/* Speaker Notes Sidebar - hidden in print */}
             <div className="w-80 bg-gray-800 overflow-y-auto border-l border-gray-700 p-6 flex flex-col print:hidden">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Speaker Notes</h3>
               <div className="flex-1 text-gray-300 italic text-lg leading-relaxed whitespace-pre-wrap">
                 {deck.slides[activeSlide]?.speaker_notes}
               </div>
               
               <div className="mt-8 pt-4 border-t border-gray-700 flex justify-between items-center text-gray-400 font-medium">
                  <button onClick={()=>setActiveSlide(a=>Math.max(0, a-1))} disabled={activeSlide === 0} className="hover:text-white disabled:opacity-30">← Prev</button>
                  <span className="text-sm">{activeSlide + 1} / {deck.slides.length}</span>
                  <button onClick={()=>setActiveSlide(a=>Math.min(deck.slides.length-1, a+1))} disabled={activeSlide === deck.slides.length-1} className="hover:text-white disabled:opacity-30">Next →</button>
               </div>
               <p className="text-[10px] text-gray-500 mt-6 text-center">AI content may not be 100% accurate.</p>
             </div>
          </>
        )}
      </div>

    </div>
  );
}
