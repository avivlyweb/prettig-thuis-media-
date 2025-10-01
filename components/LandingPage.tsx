/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onStart: () => void;
}

const primaryButtonClasses = "font-roboto text-2xl font-bold text-center text-white bg-blue-600 py-4 px-10 rounded-lg transform transition-transform duration-200 hover:scale-105 hover:bg-blue-700 shadow-lg";

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white/60 p-6 rounded-lg shadow-md text-center">
        <div className="flex justify-center items-center mb-4 text-blue-600">{icon}</div>
        <h3 className="text-xl font-bold font-roboto mb-2 text-gray-800">{title}</h3>
        <p className="text-gray-600">{children}</p>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <motion.div 
      key="landing" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="w-full max-w-6xl mx-auto flex flex-col items-center text-center px-4"
    >
        {/* Hero Section */}
        <section className="my-16 md:my-24">
            <h1 className="text-6xl md:text-8xl font-caveat font-bold text-gray-800">Prettig Thuis</h1>
            <p className="font-roboto text-gray-600 mt-2 mb-10 text-2xl tracking-wide">Een zachte gids voor uw dag.</p>
            <button onClick={onStart} className={primaryButtonClasses}>Begin Vandaag</button>
        </section>

        {/* How it Works Section */}
        <section className="w-full my-12">
            <h2 className="text-4xl font-bold font-caveat mb-8 text-gray-700">Hoe werkt het?</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <FeatureCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} title="1. Upload een foto">
                    Begin met een duidelijke foto van de persoon die u ondersteunt.
                </FeatureCard>
                <FeatureCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} title="2. Ontvang een activiteit">
                    De app stelt een passende activiteit voor, gebaseerd op het tijdstip van de dag.
                </FeatureCard>
                <FeatureCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.858 15.858a5 5 0 01-2.828-7.072m9.9 9.9a9 9 0 01-12.728 0" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01" /></svg>} title="3. Luister naar uw stem">
                    Neem een persoonlijke boodschap op om te motiveren en gerust te stellen.
                </FeatureCard>
                <FeatureCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} title="4. Voltooi en vier!">
                    Markeer de taak als voltooid en ga door naar het volgende rustige moment.
                </FeatureCard>
            </div>
        </section>

        {/* What it does Section */}
        <section className="w-full my-12 md:my-24">
            <h2 className="text-4xl font-bold font-caveat mb-8 text-gray-700">De kracht van Prettig Thuis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6">
                    <h3 className="text-2xl font-bold font-roboto mb-2">Visuele Gidsen</h3>
                    <p className="text-gray-600">AI-gegenereerde beelden tonen stapsgewijs taken, wat verwarring vermindert en de zelfstandigheid bevordert.</p>
                </div>
                 <div className="p-6">
                    <h3 className="text-2xl font-bold font-roboto mb-2">Vertrouwde Stemmen</h3>
                    <p className="text-gray-600">Persoonlijke audioberichten van familieleden bieden een gevoel van veiligheid, herkenning en motivatie.</p>
                </div>
                 <div className="p-6">
                    <h3 className="text-2xl font-bold font-roboto mb-2">Zinvolle Routine</h3>
                    <p className="text-gray-600">Een zachte, voorspelbare structuur voor de dag met activiteiten die zijn afgestemd op welzijn en participatie.</p>
                </div>
            </div>
        </section>

         {/* How it helps Section */}
        <section className="w-full my-12">
            <h2 className="text-4xl font-bold font-caveat mb-8 text-gray-700">Hoe kan het helpen?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="bg-white/60 p-8 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold font-roboto mb-4">Voor de gebruiker</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Verhoogt zelfstandigheid en zelfvertrouwen.</li>
                        <li>Vermindert verwarring en angst door voorspelbaarheid.</li>
                        <li>Stimuleert dagelijkse activiteit en participatie.</li>
                        <li>Biedt de geruststelling van een bekende stem.</li>
                    </ul>
                </div>
                <div className="bg-white/60 p-8 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold font-roboto mb-4">Voor de mantelzorger</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Biedt een eenvoudige tool om op afstand te ondersteunen.</li>
                        <li>Geeft rust door een gestructureerde dagindeling.</li>
                        <li>Maakt het mogelijk om op een persoonlijke manier aanwezig te zijn.</li>
                        <li>Verlaagt de drempel om tot zinvolle activiteiten aan te zetten.</li>
                    </ul>
                </div>
            </div>
        </section>

    </motion.div>
  );
};

export default LandingPage;