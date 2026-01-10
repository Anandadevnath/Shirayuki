import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Layout } from "@/components/layout";

const Home = lazy(() => import("@/pages/home"));
const LoginPage = lazy(() => import("@/pages/login"));
const RegisterPage = lazy(() => import("@/pages/register"));
const AnimeDetails = lazy(() => import("@/pages/animeDetails"));
const EpisodeList = lazy(() => import("@/pages/episode"));
const Watch = lazy(() => import("@/pages/watch"));
const AZList = lazy(() => import("@/pages/azList"));
const SearchPage = lazy(() => import("@/pages/search"));
const GenrePage = lazy(() => import("@/pages/genre"));
const CategoryPage = lazy(() => import("@/pages/category"));
const ProducerPage = lazy(() => import("@/pages/producer"));
const SchedulePage = lazy(() => import("@/pages/schedule"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const UpdatePasswordPage = lazy(() => import("@/pages/updatePassword"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgotPassword"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-950">
    <div className="relative">
      <div className="absolute inset-0 bg-cyan-500/50 blur-xl rounded-full animate-pulse"></div>
      <div className="relative animate-spin rounded-full h-16 w-16 border-t-2 border-r-2 border-cyan-400"></div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Home */}
            <Route path="/" element={<Home />} />

            {/* Anime */}
            <Route path="/anime/:animeId" element={<AnimeDetails />} />

            {/* Watch/Episodes */}
            <Route path="/watch/:animeId" element={<EpisodeList />} />
            <Route path="/watch/:animeId/:episodeId" element={<Watch />} />

            {/* Browse */}
            <Route path="/az-list" element={<AZList />} />
            <Route path="/az-list/:letter" element={<AZList />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/category" element={<Navigate to="/category/tv" replace />} />
            <Route path="/genre" element={<Navigate to="/genre/action" replace />} />
            <Route path="/genre/:genreId" element={<GenrePage />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/producer" element={<ProducerPage />} />
            <Route path="/producer/:producerId" element={<ProducerPage />} />
            <Route path="/schedule" element={<SchedulePage />} />

            {/* Auth & Profile */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/updatePassword" element={<UpdatePasswordPage />} />
            <Route path="/forgotPassword" element={<ForgotPasswordPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}

export default App