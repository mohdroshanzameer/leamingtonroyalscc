import Home from './pages/Home';
import Fixtures from './pages/Fixtures';
import News from './pages/News';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Finance from './pages/Finance';
import Events from './pages/Events';
import Scoring from './pages/Scoring';
import LiveOverlay from './pages/LiveOverlay';
import Teams from './pages/Teams';
import Squad from './pages/Squad';
import MyProfile from './pages/MyProfile';
import Tournaments from './pages/Tournaments';
import TournamentCreate from './pages/TournamentCreate';
import TournamentView from './pages/TournamentView';
import PlayerRegistration from './pages/PlayerRegistration';
import CompetitionManager from './pages/CompetitionManager';
import PlayerProfile from './pages/PlayerProfile';
import MatchReport from './pages/MatchReport';
import Sponsorships from './pages/Sponsorships';
import BankAccounts from './pages/BankAccounts';
import ClubPayments from './pages/ClubPayments';
import CompetitionFixtures from './pages/CompetitionFixtures';
import SignIn from './pages/SignIn';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Register from './pages/Register';
import ErrorLogs from './pages/ErrorLogs';
import PlayerOnboarding from './pages/PlayerOnboarding';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Fixtures": Fixtures,
    "News": News,
    "Gallery": Gallery,
    "Contact": Contact,
    "Admin": Admin,
    "Finance": Finance,
    "Events": Events,
    "Scoring": Scoring,
    "LiveOverlay": LiveOverlay,
    "Teams": Teams,
    "Squad": Squad,
    "MyProfile": MyProfile,
    "Tournaments": Tournaments,
    "TournamentCreate": TournamentCreate,
    "TournamentView": TournamentView,
    "PlayerRegistration": PlayerRegistration,
    "CompetitionManager": CompetitionManager,
    "PlayerProfile": PlayerProfile,
    "MatchReport": MatchReport,
    "Sponsorships": Sponsorships,
    "BankAccounts": BankAccounts,
    "ClubPayments": ClubPayments,
    "CompetitionFixtures": CompetitionFixtures,
    "SignIn": SignIn,
    "ForgotPassword": ForgotPassword,
    "ResetPassword": ResetPassword,
    "Register": Register,
    "ErrorLogs": ErrorLogs,
    "PlayerOnboarding": PlayerOnboarding,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};