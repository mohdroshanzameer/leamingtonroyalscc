/**
 * Application Router Configuration
 * 
 * Centralized routing with protected and public routes
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import Layout from '@/Layout';

// Public pages
import Home from '@/pages/Home';
import SignIn from '@/pages/SignIn';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Contact from '@/pages/Contact';
import News from '@/pages/News';
import Events from '@/pages/Events';
import Gallery from '@/pages/Gallery';
import Fixtures from '@/pages/Fixtures';

// Protected pages - Auth
import MyProfile from '@/pages/MyProfile';
import PlayerOnboarding from '@/pages/PlayerOnboarding';
import PlayerRegistration from '@/pages/PlayerRegistration';

// Protected pages - Teams/Players
import Squad from '@/pages/Squad';
import Teams from '@/pages/Teams';
import PlayerProfile from '@/pages/PlayerProfile';

// Protected pages - Matches
import Scoring from '@/pages/Scoring';
import LiveOverlay from '@/pages/LiveOverlay';
import MatchReport from '@/pages/MatchReport';
import CompetitionFixtures from '@/pages/CompetitionFixtures';

// Protected pages - Tournaments
import Tournaments from '@/pages/Tournaments';
import TournamentView from '@/pages/TournamentView';
import TournamentCreate from '@/pages/TournamentCreate';
import CompetitionManager from '@/pages/CompetitionManager';

// Protected pages - Finance
import Finance from '@/pages/Finance';
import ClubPayments from '@/pages/ClubPayments';
import BankAccounts from '@/pages/BankAccounts';
import Sponsorships from '@/pages/Sponsorships';

// Protected pages - Admin
import Admin from '@/pages/Admin';
import ErrorLogs from '@/pages/ErrorLogs';

export function AppRouter() {
  return (

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout currentPageName="Home"><Home /></Layout>} />
        <Route path="/signin" element={<Layout currentPageName="SignIn"><SignIn /></Layout>} />
        <Route path="/register" element={<Layout currentPageName="Register"><Register /></Layout>} />
        <Route path="/forgot-password" element={<Layout currentPageName="ForgotPassword"><ForgotPassword /></Layout>} />
        <Route path="/reset-password" element={<Layout currentPageName="ResetPassword"><ResetPassword /></Layout>} />
        <Route path="/contact" element={<Layout currentPageName="Contact"><Contact /></Layout>} />
        <Route path="/news" element={<Layout currentPageName="News"><News /></Layout>} />
        <Route path="/events" element={<Layout currentPageName="Events"><Events /></Layout>} />
        <Route path="/gallery" element={<Layout currentPageName="Gallery"><Gallery /></Layout>} />
        <Route path="/fixtures" element={<Layout currentPageName="Fixtures"><Fixtures /></Layout>} />

        {/* Protected Routes - Profile */}
        <Route path="/my-profile" element={<Layout currentPageName="MyProfile"><RequireAuth><MyProfile /></RequireAuth></Layout>} />
        <Route path="/player-onboarding" element={<Layout currentPageName="PlayerOnboarding"><RequireAuth><PlayerOnboarding /></RequireAuth></Layout>} />
        <Route path="/player-registration" element={<Layout currentPageName="PlayerRegistration"><RequireAuth><PlayerRegistration /></RequireAuth></Layout>} />

        {/* Protected Routes - Teams */}
        <Route path="/squad" element={<Layout currentPageName="Squad"><RequireAuth><Squad /></RequireAuth></Layout>} />
        <Route path="/teams" element={<Layout currentPageName="Teams"><RequireAuth><Teams /></RequireAuth></Layout>} />
        <Route path="/player-profile" element={<Layout currentPageName="PlayerProfile"><RequireAuth><PlayerProfile /></RequireAuth></Layout>} />

        {/* Protected Routes - Matches */}
        <Route path="/scoring" element={<Layout currentPageName="Scoring"><RequireAuth><Scoring /></RequireAuth></Layout>} />
        <Route path="/live-overlay" element={<Layout currentPageName="LiveOverlay"><RequireAuth><LiveOverlay /></RequireAuth></Layout>} />
        <Route path="/match-report" element={<Layout currentPageName="MatchReport"><RequireAuth><MatchReport /></RequireAuth></Layout>} />
        <Route path="/competition-fixtures" element={<Layout currentPageName="CompetitionFixtures"><RequireAuth><CompetitionFixtures /></RequireAuth></Layout>} />

        {/* Protected Routes - Tournaments */}
        <Route path="/tournaments" element={<Layout currentPageName="Tournaments"><RequireAuth><Tournaments /></RequireAuth></Layout>} />
        <Route path="/tournament-view" element={<Layout currentPageName="TournamentView"><RequireAuth><TournamentView /></RequireAuth></Layout>} />
        <Route path="/tournament-create" element={<Layout currentPageName="TournamentCreate"><RequireAuth><TournamentCreate /></RequireAuth></Layout>} />
        <Route path="/competition-manager" element={<Layout currentPageName="CompetitionManager"><RequireAuth><CompetitionManager /></RequireAuth></Layout>} />

        {/* Protected Routes - Finance */}
        <Route path="/finance" element={<Layout currentPageName="Finance"><RequireAuth><Finance /></RequireAuth></Layout>} />
        <Route path="/club-payments" element={<Layout currentPageName="ClubPayments"><RequireAuth><ClubPayments /></RequireAuth></Layout>} />
        <Route path="/bank-accounts" element={<Layout currentPageName="BankAccounts"><RequireAuth><BankAccounts /></RequireAuth></Layout>} />
        <Route path="/sponsorships" element={<Layout currentPageName="Sponsorships"><RequireAuth><Sponsorships /></RequireAuth></Layout>} />

        {/* Protected Routes - Admin */}
        <Route path="/admin" element={<Layout currentPageName="Admin"><RequireAuth><Admin /></RequireAuth></Layout>} />
        <Route path="/error-logs" element={<Layout currentPageName="ErrorLogs"><RequireAuth><ErrorLogs /></RequireAuth></Layout>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
}

export default AppRouter;