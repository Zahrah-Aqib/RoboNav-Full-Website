import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Home = lazy(() => import('@/pages/Home'));
const GridSimulator = lazy(() => import('@/pages/GridSimulator'));
const AlgorithmComparison = lazy(() => import('@/pages/AlgorithmComparison'));
const ExperimentLab = lazy(() => import('@/pages/ExperimentLab'));
const HowItWorks = lazy(() => import('@/pages/HowItWorks'));
const About = lazy(() => import('@/pages/About'));
const Documentation = lazy(() => import('@/pages/Documentation'));

function PageFallback() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-navy-950 grid-bg">
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/simulator" element={<GridSimulator />} />
              <Route path="/comparison" element={<AlgorithmComparison />} />
              <Route path="/lab" element={<ExperimentLab />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/about" element={<About />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
