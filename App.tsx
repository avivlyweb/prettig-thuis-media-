/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateActivityStrip, GeminiError } from './services/geminiService';
import PolaroidCard from './components/PolaroidCard';
import Footer from './components/Footer';
import { Quest, quests } from './lib/quests';
import LandingPage from './components/LandingPage';

type ImageStatus = 'pending' | 'done' | 'error';
type AppState = 'landing' | 'idle' | 'generating' | 'guiding';

interface CurrentActivity {
    quest: Quest;
    status: ImageStatus;
    isCompleted: boolean;
    url?: string;
    audioUrl?: string;
    error?: { title: string; message: string; };
}

const primaryButtonClasses = "font-roboto text-2xl font-bold text-center text-white bg-blue-600 py-4 px-10 rounded-lg transform transition-transform duration-200 hover:scale-105 hover:bg-blue-700 shadow-lg";

const loadingTips = [
    "Tip: Een rustige ademhaling helpt om te ontspannen.",
    "Wist u dat muziek kan helpen om herinneringen op te halen?",
    "We zoeken een leuke activiteit voor dit moment...",
    "Tip: Een glimlach is de kortste weg tussen twee mensen.",
    "Een kleine taak kan een groot gevoel van voldoening geven.",
    "Wist u dat vertrouwde taken een gevoel van zingeving kunnen geven?",
    "Een rustige omgeving met weinig afleiding helpt bij de concentratie.",
    "Tip: Voldoende water drinken is erg belangrijk voor de hersenen.",
    "Regelmatige, zachte beweging is goed voor lichaam en geest.",
    "Veiligheid voorop: zorg dat looppaden vrij zijn van obstakels.",
    "Tip: Praat in korte, eenvoudige zinnen.",
    "Oogcontact maken zorgt voor een betere verbinding.",
    "Geduld is een schone zaak. Geef rustig de tijd voor een reactie.",
    "Een dagelijkse routine kan angst en verwarring verminderen.",
    "Voorspelbaarheid gedurende de dag geeft een gevoel van veiligheid.",
    "Gestructureerde activiteiten helpen om vaardigheden te behouden."
];

function App() {
    const [personImage, setPersonImage] = useState<string | null>(null);
    const [environmentImage, setEnvironmentImage] = useState<string | null>(null); // For custom caregiver quests
    const [appState, setAppState] = useState<AppState>('landing');
    const [currentActivity, setCurrentActivity] = useState<CurrentActivity | null>(null);
    const [completedQuests, setCompletedQuests] = useState<Record<string, number>>({}); // { quest_id: timestamp }
    const [isCaregiverMenuOpen, setIsCaregiverMenuOpen] = useState(false);
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [tipIndex, setTipIndex] = useState(0);

    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);


    useEffect(() => {
        if (appState === 'generating') {
            const intervalId = setInterval(() => {
                setTipIndex(prevIndex => (prevIndex + 1) % loadingTips.length);
            }, 4000);
            return () => clearInterval(intervalId);
        }
    }, [appState]);

    // This effect starts the first quest automatically after a person's image is uploaded.
    useEffect(() => {
        if (personImage && appState === 'idle' && !currentActivity) {
            startNextQuest();
        }
    }, [personImage, appState, currentActivity]);


    const getPartOfDay = (): ('morning' | 'midday' | 'afternoon' | 'evening') => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'midday';
        if (hour >= 17 && hour < 21) return 'afternoon';
        return 'evening'; // Covers night and early morning
    };

    const getNextQuest = (): Quest | null => {
        const partOfDay = getPartOfDay();
        const now = Date.now();
        const availableQuests = quests.filter(quest => {
            const isOnCooldown = (completedQuests[quest.quest_id] || 0) + quest.cooldown_minutes * 60000 > now;
            const isCorrectTime = quest.tags.includes(partOfDay) || quest.tags.includes('anytime');
            return isCorrectTime && !isOnCooldown;
        });

        if (availableQuests.length === 0) {
            // If no quests for this time, find any quest not on cooldown
            const anyQuest = quests.find(q => !((completedQuests[q.quest_id] || 0) + q.cooldown_minutes * 60000 > now));
            return anyQuest || null;
        }
        return availableQuests[Math.floor(Math.random() * availableQuests.length)];
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPersonImage(reader.result as string);
                setAppState('idle');
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleGenerationError = (err: unknown) => {
        let errorTitle = 'Fout';
        let errorMessage = 'Er is een onbekende fout opgetreden.';
    
        if (err instanceof GeminiError) {
            errorTitle = 'Generatie Fout';
            errorMessage = err.userFriendlyMessage;
            // Use alert to make sure the caregiver sees the message immediately
            alert(`Fout bij het maken van de activiteit:\n\n${err.userFriendlyMessage}`);
        } else if (err instanceof Error) {
            errorMessage = 'Er is een technische fout opgetreden. Probeer het later opnieuw.';
            alert(`Fout: ${errorMessage}`);
        }
        
        setCurrentActivity(prev => prev && { ...prev, status: 'error', error: { title: errorTitle, message: errorMessage } });
        console.error(err);
    }

    const startNextQuest = async (questOverride?: Quest) => {
        const quest = questOverride || getNextQuest();
        if (!quest || !personImage) {
            console.error("No more quests available for now, or person image is missing.");
            alert("Er zijn op dit moment geen nieuwe activiteiten beschikbaar. Probeer het later opnieuw.");
            return;
        }
        
        setIsCaregiverMenuOpen(false);
        setRecordedAudioUrl(null);
        setEnvironmentImage(null);

        const activity: CurrentActivity = { quest, status: 'pending', isCompleted: false };
        setCurrentActivity(activity);
        setAppState('generating');

        try {
            const resultUrl = await generateActivityStrip(personImage, activity.quest.description, null);
            setCurrentActivity(prev => prev && { ...prev, status: 'done', url: resultUrl });
        } catch (err) {
            handleGenerationError(err);
        } finally {
            setAppState('guiding');
        }
    };
    
    const handleCreateCustomActivity = async () => {
        if (!personImage || !customPrompt) return;

        const customQuest: Quest = {
            quest_id: `custom-${Date.now()}`,
            title: "Aangepaste Activiteit",
            description: customPrompt,
            icf_codes: [],
            category: "Nuttig",
            difficulty: "Low",
            cooldown_minutes: 0,
            tags: ["anytime"],
        };

        const activity: CurrentActivity = {
            quest: customQuest,
            status: 'pending',
            isCompleted: false,
            audioUrl: recordedAudioUrl ?? undefined
        };
        
        setCurrentActivity(activity);
        setAppState('generating');
        setIsCustomMode(false);
        setCustomPrompt('');
        setRecordedAudioUrl(null);

        try {
            const resultUrl = await generateActivityStrip(personImage, activity.quest.description, environmentImage);
            setCurrentActivity(prev => prev && { ...prev, status: 'done', url: resultUrl });
        } catch (err) {
            handleGenerationError(err);
        } finally {
            setAppState('guiding');
        }
    };

    const handleToggleComplete = () => {
        if (!currentActivity) return;
        setCurrentActivity(prev => prev && { ...prev, isCompleted: true });
        setCompletedQuests(prev => ({ ...prev, [currentActivity.quest.quest_id]: Date.now() }));
    };

    const handleReset = () => {
        setPersonImage(null);
        setCurrentActivity(null);
        setCompletedQuests({});
        setRecordedAudioUrl(null);
        if (isRecording) mediaRecorderRef.current?.stop();
        setAppState('idle');
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            const audioChunks: Blob[] = [];
            mediaRecorderRef.current.ondataavailable = event => audioChunks.push(event.data);
            mediaRecorderRef.current.onstop = () => {
                const audioUrl = URL.createObjectURL(new Blob(audioChunks, { type: 'audio/webm' }));
                if (isCustomMode) {
                    setRecordedAudioUrl(audioUrl);
                } else {
                    setCurrentActivity(prev => prev && { ...prev, audioUrl });
                }
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Recording error:", err);
            alert("Microphone access is needed to record a message.");
        }
    };

    const handleStopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };
    
    const handlePlayAudio = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        }
    };
    
    const renderLandingState = () => (
        <LandingPage onStart={() => setAppState('idle')} />
    );

    const renderIdleState = () => (
        <motion.div key="idle" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center text-center">
            <h1 className="text-6xl md:text-8xl font-caveat font-bold text-gray-800">Prettig Thuis</h1>
            <p className="font-roboto text-gray-600 mt-2 mb-10 text-xl tracking-wide">Een zachte gids voor uw dag.</p>
            <label htmlFor="person-upload" className="cursor-pointer group transform hover:scale-105 transition-transform duration-300">
                <PolaroidCard caption="Upload een foto om te beginnen" status="done" />
            </label>
            <input id="person-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
        </motion.div>
    );

    const renderGeneratingState = () => (
        <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center flex flex-col items-center">
            <h2 className="text-3xl font-roboto text-gray-700 mb-6">Een ogenblikje geduld...</h2>
            <svg className="animate-spin h-12 w-12 text-blue-600 mb-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="relative h-12 w-full max-w-xl">
                <AnimatePresence mode="wait">
                    <motion.p 
                        key={tipIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 font-roboto text-lg text-gray-600"
                    >
                        {loadingTips[tipIndex]}
                    </motion.p>
                </AnimatePresence>
            </div>
        </motion.div>
    );

    const renderGuidingState = () => (
        currentActivity && (
            <motion.div key={currentActivity.quest.quest_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl flex flex-col items-center text-center">
                <AnimatePresence mode="wait">
                    {isCustomMode ? (
                         <motion.div key="custom-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white/60 p-6 rounded-xl shadow-lg w-full max-w-2xl mb-12">
                            <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Beschrijf een aangepaste activiteit..." className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg mb-4" rows={2}/>
                            <div className="flex justify-center items-center gap-4 mb-4">
                                <label htmlFor="env-upload" className="font-roboto text-center text-gray-700 bg-gray-100 py-3 px-4 rounded-lg cursor-pointer border">
                                    {environmentImage ? 'Omgevingsfoto toegevoegd!' : 'Voeg omgevingsfoto toe'}
                                </label>
                                <input id="env-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => { if (e.target.files) { const r = new FileReader(); r.onloadend = () => setEnvironmentImage(r.result as string); r.readAsDataURL(e.target.files[0]); }}}/>
                                <button onClick={isRecording ? handleStopRecording : handleStartRecording} className={`font-roboto py-3 px-4 rounded-lg border ${isRecording ? 'bg-red-500 text-white' : 'bg-gray-100'}`}>
                                    {isRecording ? 'Stop' : 'Neem bericht op'}
                                </button>
                            </div>
                            <button onClick={handleCreateCustomActivity} disabled={!customPrompt} className={`${primaryButtonClasses} w-full disabled:opacity-50`}>Maak aangepast plan</button>
                            <button onClick={() => setIsCustomMode(false)} className="mt-4 text-gray-600">Annuleren</button>
                         </motion.div>
                    ) : (
                         <motion.div key="activity-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center">
                             <h2 className="text-4xl md:text-5xl font-caveat font-bold text-gray-700 mb-2">{currentActivity.quest.title}</h2>
                             <p className="text-lg text-gray-600 mb-8 max-w-xl">{currentActivity.quest.description}</p>
                            
                             <PolaroidCard
                                caption={currentActivity.quest.title}
                                status={currentActivity.status}
                                imageUrl={currentActivity.url}
                                error={currentActivity.error}
                                isActivityStrip={true}
                             />
                            
                             {currentActivity.audioUrl && (
                                <audio ref={audioRef} src={currentActivity.audioUrl} className="hidden" />
                             )}

                             <div className="mt-8 flex flex-col items-center gap-5 w-full">
                                {currentActivity.status === 'done' && (
                                    currentActivity.audioUrl ? (
                                         <button onClick={handlePlayAudio} className="font-roboto text-2xl font-bold text-center text-white bg-green-600 py-4 px-10 rounded-lg shadow-lg flex items-center gap-3 transform hover:scale-105">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                                            Speel bericht af
                                         </button>
                                    ) : (
                                        !currentActivity.isCompleted && (
                                            <button onClick={isRecording ? handleStopRecording : handleStartRecording} className={`font-roboto text-xl py-3 px-8 rounded-lg border-2 ${isRecording ? 'bg-red-500 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                                                {isRecording ? '◼️ Stop met opnemen' : '🎤 Voeg een spraakbericht toe'}
                                            </button>
                                        )
                                    )
                                )}

                                {currentActivity.isCompleted ? (
                                    <button onClick={() => startNextQuest()} className={primaryButtonClasses}>Wat is het volgende?</button>
                                ) : ( currentActivity.status !== 'error' &&
                                    <button onClick={handleToggleComplete} className={`${primaryButtonClasses} bg-yellow-500 hover:bg-yellow-600 text-black`}>Ik ben helemaal klaar!</button>
                                )}
                             </div>
                         </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        )
    );

    const mainClasses = appState === 'landing' 
        ? "bg-[#FDF5E6] text-gray-800 min-h-screen w-full flex flex-col items-center justify-start p-4 relative"
        : "bg-[#FDF5E6] text-gray-800 min-h-screen w-full flex flex-col items-center justify-center p-4 pb-20 relative";

    return (
        <main className={mainClasses}>
            <AnimatePresence mode="wait">
                {appState === 'landing' && renderLandingState()}
                {appState === 'idle' && renderIdleState()}
                {appState === 'generating' && renderGeneratingState()}
                {appState === 'guiding' && renderGuidingState()}
            </AnimatePresence>

            {appState === 'guiding' && !isCustomMode && (
                <div className="fixed top-4 right-4 z-20">
                     <button onClick={() => setIsCaregiverMenuOpen(!isCaregiverMenuOpen)} className="bg-white/80 p-3 rounded-full shadow-lg hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                     </button>
                     <AnimatePresence>
                        {isCaregiverMenuOpen && (
                             <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-14 right-0 bg-white rounded-lg shadow-xl p-4 w-64 z-10 border">
                                <ul className="space-y-3">
                                    <li><button onClick={() => startNextQuest()} className="w-full text-left p-2 hover:bg-gray-100 rounded">Stel een andere activiteit voor</button></li>
                                    <li><button onClick={() => {setIsCustomMode(true); setIsCaregiverMenuOpen(false);}} className="w-full text-left p-2 hover:bg-gray-100 rounded">Maak een aangepaste activiteit</button></li>
                                    <li><button onClick={handleReset} className="w-full text-left p-2 text-red-600 hover:bg-red-50 rounded">Reset dagplan</button></li>
                                </ul>
                             </motion.div>
                        )}
                     </AnimatePresence>
                </div>
            )}
            <Footer isLanding={appState === 'landing'} />
        </main>
    );
}

export default App;