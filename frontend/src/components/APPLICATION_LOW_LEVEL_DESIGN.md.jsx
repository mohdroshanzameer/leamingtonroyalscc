# Cricket Club Management System - Low Level Design Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Authentication System](#authentication-system)
3. [Public Pages](#public-pages)
4. [Member Pages](#member-pages)
5. [Admin Pages](#admin-pages)
6. [Finance Pages](#finance-pages)
7. [Live Scoring System](#live-scoring-system)
8. [Data Models & Entities](#data-models--entities)
9. [API Layer](#api-layer)
10. [Business Logic & Rules](#business-logic--rules)

---

## System Overview

### Architecture
- **Frontend**: React 18 with React Router DOM for navigation
- **Backend**: Express.js REST API (local deployment)
- **Database**: PostgreSQL
- **State Management**: @tanstack/react-query for server state
- **UI Library**: Radix UI + Tailwind CSS
- **Authentication**: JWT-based with bcryptjs password hashing

### User Roles
1. **Public** - Non-authenticated users
2. **User** - Authenticated members (default role)
3. **Admin** - Full access to manage teams, tournaments, scoring
4. **Treasurer** - Financial management access
5. **Super Admin** - All permissions (same as Admin in current implementation)

---

## Authentication System

### Files Involved
- `pages/SignIn.js` - Login page
- `pages/Register.js` - Registration with email verification
- `pages/ForgotPassword.js` - Password reset flow
- `pages/PlayerOnboarding.js` - First-time player profile setup
- `components/api/apiClient.js` - Auth API calls

### Sign In Flow
**Page**: `pages/SignIn.js`

**State Management**:
```javascript
- email: string
- password: string
- showPassword: boolean
- loading: boolean
- error: string
- successMessage: string (from URL params)
```

**Data Flow**:
1. User enters email and password
2. On submit → `api.auth.login({ email, password })`
3. API endpoint: `POST /api/auth/login`
4. Backend logic:
   - Query database: `SELECT * FROM users WHERE email = $1`
   - Compare password with bcrypt: `bcrypt.compare(password, user.password)`
   - Generate JWT: `jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '7d' })`
   - Return: `{ access_token, user: { id, email, full_name, role } }`
5. Frontend stores token: `localStorage.setItem('access_token', token)`
6. Sets auth header: `api.auth.setToken(token)`
7. Redirects to returnUrl or home page

**Success Messages**:
- `?verified=true` → "Email verified successfully! Please sign in."
- `?password_reset=true` → "Password reset successfully! Please sign in."

### Registration Flow
**Page**: `pages/Register.js`

**State Management**:
```javascript
- step: 'register' | 'verify'
- formData: { full_name, email, password, confirmPassword }
- verificationPin: string
- loading: boolean
- error: string
```

**Step 1: Registration**
1. User fills form (name, email, password, confirm password)
2. Validation:
   - Password length >= 6
   - Passwords match
3. On submit → `api.auth.register(formData)`
4. API endpoint: `POST /api/auth/register`
5. Backend logic:
   - Check if email exists: `SELECT * FROM users WHERE email = $1`
   - If exists, return error
   - Hash password: `bcrypt.hash(password, 10)`
   - Insert user: `INSERT INTO users (email, password, full_name, role, email_verified) VALUES (...)`
   - Set `email_verified = true` (auto-verify for local deployment)
6. Frontend moves to step 'verify'

**Step 2: Email Verification**
1. User enters 6-digit PIN (mocked for local deployment)
2. On submit → `api.auth.verifyEmail({ email, pin })`
3. API endpoint: `POST /api/auth/verify-email`
4. Backend updates: `UPDATE users SET email_verified = true WHERE email = $1`
5. Redirects to SignIn with `?verified=true`

### Password Reset Flow
**Page**: `pages/ForgotPassword.js`

**State Management**:
```javascript
- step: 'email' | 'verify' | 'reset'
- email: string
- pin: string
- newPassword: string
- confirmPassword: string
- loading: boolean
- error: string
```

**Step 1: Request PIN**
1. User enters email
2. Mocked: Auto-fills PIN as "123456" (local deployment)
3. Moves to 'verify' step

**Step 2: Verify PIN**
1. User enters PIN
2. Validates PIN (mocked validation)
3. Moves to 'reset' step

**Step 3: Reset Password**
1. User enters new password and confirmation
2. Validation: passwords match
3. On submit → `api.auth.resetPassword({ email, password })`
4. API endpoint: `POST /api/auth/reset-password`
5. Backend logic:
   - Hash password: `bcrypt.hash(password, 10)`
   - Update: `UPDATE users SET password = $1 WHERE email = $2`
6. Redirects to SignIn with `?password_reset=true`

### Player Onboarding
**Page**: `pages/PlayerOnboarding.js`

**Trigger**: After first login, if user doesn't have a TeamPlayer record

**State Management**:
```javascript
- currentStep: 1 | 2 | 3 | 4
- formData: {
    player_name, email, phone, date_of_birth, role,
    batting_style, bowling_style, jersey_number, bio
  }
```

**Multi-Step Form**:
- **Step 1**: Basic Info (name, email, phone)
- **Step 2**: Playing Role (Batsman/Bowler/All-Rounder/Wicket-Keeper)
- **Step 3**: Playing Style (batting: Left/Right, bowling style)
- **Step 4**: Additional Info (jersey number, bio)

**Data Flow**:
1. Pre-fills user's email and name from auth
2. User completes 4-step form
3. On final submit → `api.entities.TeamPlayer.create(formData)`
4. API endpoint: `POST /api/entities/TeamPlayer`
5. Backend inserts into `team_player` table
6. Redirects to MyProfile page

---

## Public Pages

### Home Page
**File**: `pages/Home.js`
**Components**: `components/home/HeroSection.js`

**Data Fetched**: None (static content from `CLUB_CONFIG`)

**Layout**:
1. Hero section with club branding
2. Latest news preview
3. Upcoming matches
4. Call-to-action buttons

**Logic**: 
- All content loaded from `components/ClubConfig.js`
- No database calls on initial load
- Purely presentational

### News Page
**File**: `pages/News.js`
**Entity**: `News`

**State Management**:
```javascript
- selectedCategory: 'All' | 'Match Report' | 'Club News' | 'Player News' | 'Announcement' | 'Event'
```

**Data Flow**:
1. On mount → `useQuery({ queryKey: ['news'], queryFn: () => api.entities.News.list('-created_date', 50) })`
2. API endpoint: `GET /api/entities/News?sort=-created_date&limit=50`
3. Backend: `SELECT * FROM news ORDER BY created_date DESC LIMIT 50`
4. Returns array of news articles

**Filtering Logic**:
```javascript
const filteredNews = news.filter(article => 
  selectedCategory === 'All' || article.category === selectedCategory
);
```

**Display**:
- Featured news (where `is_featured = true`) shown at top
- Grid layout for remaining articles
- Each card shows: image, category badge, title, excerpt, date
- Click opens full article view

**Example - User Clicks News Article**:
```javascript
// User clicks a news card
function handleNewsClick(newsId) {
  // Navigate to full article view or open modal
  navigate(`/news/${newsId}`);
  
  // OR open in modal
  setSelectedArticle(news.find(n => n.id === newsId));
  setShowModal(true);
}

// Display full article
function ArticleModal({ article }) {
  return (
    <div>
      <img src={article.image_url} />
      <h1>{article.title}</h1>
      <span>{format(article.created_date, 'dd MMM yyyy')}</span>
      <div>{article.content}</div>
    </div>
  );
}
```

**Example - Admin Adds News Article**:
```javascript
// Admin creates new article (in Admin page)
const [formData, setFormData] = useState({
  title: '',
  content: '',
  excerpt: '',
  category: 'Club News',
  is_featured: false
});

// User uploads image first
const handleImageUpload = async (file) => {
  const { file_url } = await api.integrations.Core.UploadFile({ file });
  setFormData({ ...formData, image_url: file_url });
};

// Submit article
const handleSubmit = async () => {
  await api.entities.News.create({
    ...formData,
    created_date: new Date().toISOString()
  });
  
  // Refresh news list
  queryClient.invalidateQueries(['news']);
};
```

### Fixtures Page
**File**: `pages/Fixtures.js`
**Entities**: `TournamentMatch`, `Tournament`, `Competition`

**Tabs**: Upcoming | Results | All Competitions

**Data Flow**:

**Tab 1: Upcoming Matches**
1. Fetch: `api.entities.TournamentMatch.filter({ status: 'scheduled' }, '-match_date', 20)`
2. API: `POST /api/entities/TournamentMatch/filter`
3. Backend: `SELECT * FROM tournament_match WHERE status = 'scheduled' ORDER BY match_date DESC LIMIT 20`
4. Display: List of upcoming matches with date, teams, venue

**Tab 2: Results**
1. Fetch: `api.entities.TournamentMatch.filter({ status: 'completed' }, '-match_date', 20)`
2. API: `POST /api/entities/TournamentMatch/filter`
3. Backend: `SELECT * FROM tournament_match WHERE status = 'completed' ORDER BY match_date DESC LIMIT 20`
4. Display: List of completed matches with scores, result summary, Man of the Match

**Tab 3: All Competitions**
1. Fetch: `api.entities.Competition.list()`
2. API: `GET /api/entities/Competition`
3. Backend: `SELECT * FROM competition`
4. Display: Grid of competition cards
5. Click competition → Navigate to `CompetitionFixtures` page

**Match Card Logic**:
```javascript
// For each match
- Display team names, logos, date, venue
- If completed: Show scores (team1_score, team2_score)
- If live: Show live indicator
- Click match → Open scorecard modal or navigate to match report
```

**Example - User Clicks Upcoming Match**:
```javascript
function UpcomingMatchCard({ match }) {
  const handleClick = () => {
    // Check if user is logged in
    if (!user) {
      toast.error('Please sign in to update availability');
      return;
    }
    
    // Open availability modal
    setSelectedMatch(match);
    setShowAvailabilityModal(true);
  };
  
  return (
    <div onClick={handleClick}>
      <div>{match.team1_name} vs {match.team2_name}</div>
      <div>{format(match.match_date, 'dd MMM yyyy HH:mm')}</div>
      <div>{match.venue}</div>
      {match.status === 'live' && <span className="live-indicator">LIVE</span>}
    </div>
  );
}

// Availability modal
function AvailabilityModal({ match, user }) {
  const [status, setStatus] = useState('Available');
  
  const handleSubmit = async () => {
    // Check if availability already exists
    const existing = await api.entities.MatchAvailability.filter({
      match_id: match.id,
      player_email: user.email
    });
    
    if (existing.length > 0) {
      // Update existing
      await api.entities.MatchAvailability.update(existing[0].id, { status });
    } else {
      // Create new
      await api.entities.MatchAvailability.create({
        match_id: match.id,
        match_info: `${match.team1_name} vs ${match.team2_name} - ${format(match.match_date, 'dd MMM')}`,
        player_email: user.email,
        player_name: user.full_name,
        status
      });
    }
    
    toast.success('Availability updated!');
    setShowAvailabilityModal(false);
  };
  
  return (
    <Dialog>
      <h2>Update Availability</h2>
      <p>{match.team1_name} vs {match.team2_name}</p>
      <Select value={status} onChange={setStatus}>
        <option value="Available">Available</option>
        <option value="Not Available">Not Available</option>
        <option value="Maybe">Maybe</option>
        <option value="Injured">Injured</option>
      </Select>
      <Button onClick={handleSubmit}>Submit</Button>
    </Dialog>
  );
}
```

**Example - User Clicks Completed Match**:
```javascript
function CompletedMatchCard({ match }) {
  const handleClick = () => {
    // Navigate to match report page
    navigate(`/match-report/${match.id}`);
  };
  
  return (
    <div onClick={handleClick}>
      <div>
        <span>{match.team1_name}</span>
        <span>{match.team1_score} ({match.team1_overs})</span>
      </div>
      <div>
        <span>{match.team2_name}</span>
        <span>{match.team2_score} ({match.team2_overs})</span>
      </div>
      <div className="result">{match.result_summary}</div>
      {match.man_of_match && (
        <div>Man of the Match: {match.man_of_match}</div>
      )}
    </div>
  );
}
```

### Gallery Page
**File**: `pages/Gallery.js`
**Entity**: `GalleryImage`

**State Management**:
```javascript
- selectedCategory: 'All' | 'Match' | 'Training' | 'Event' | 'Team'
- selectedImage: object | null (for lightbox)
```

**Data Flow**:
1. Fetch: `api.entities.GalleryImage.list('-created_date', 100)`
2. API: `GET /api/entities/GalleryImage?sort=-created_date&limit=100`
3. Backend: `SELECT * FROM gallery_image ORDER BY created_date DESC LIMIT 100`

**Filtering**:
```javascript
const filteredImages = images.filter(img => 
  selectedCategory === 'All' || img.category === selectedCategory
);
```

**Display**:
- Masonry grid layout
- Click image → Open lightbox with full-size view
- Lightbox shows: image, title, description, date
- Navigation: Previous/Next buttons

### Events Page
**File**: `pages/Events.js`
**Entity**: `Event`

**Tabs**: Upcoming | Past

**Data Flow**:

**Upcoming Events**:
1. Fetch: `api.entities.Event.filter({ status: 'upcoming' }, 'event_date')`
2. API: `POST /api/entities/Event/filter`
3. Backend: `SELECT * FROM event WHERE status = 'upcoming' ORDER BY event_date ASC`

**Past Events**:
1. Fetch: `api.entities.Event.filter({ status: 'completed' }, '-event_date')`
2. API: `POST /api/entities/Event/filter`
3. Backend: `SELECT * FROM event WHERE status = 'completed' ORDER BY event_date DESC`

**Event Card Logic**:
- Display: title, date, location, description preview
- Show RSVP count if applicable
- Click event → Open event details modal

**Example - User Views Event and RSVPs**:
```javascript
function EventCard({ event }) {
  const [rsvpCount, setRsvpCount] = useState(0);
  
  useEffect(() => {
    // Fetch RSVP count
    api.entities.EventRSVP.filter({ 
      event_id: event.id, 
      status: 'attending' 
    }).then(rsvps => setRsvpCount(rsvps.length));
  }, [event.id]);
  
  return (
    <div onClick={() => setSelectedEvent(event)}>
      <img src={event.banner_url} />
      <h3>{event.title}</h3>
      <div>{format(event.event_date, 'dd MMM yyyy HH:mm')}</div>
      <div>{event.location}</div>
      <div>{rsvpCount} attending</div>
    </div>
  );
}

// Event Details Modal
function EventDetailsModal({ event, user, onClose }) {
  const [userRSVP, setUserRSVP] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (user) {
      // Check if user already RSVP'd
      api.entities.EventRSVP.filter({
        event_id: event.id,
        player_email: user.email
      }).then(rsvps => {
        if (rsvps.length > 0) setUserRSVP(rsvps[0]);
      });
    }
  }, [event.id, user]);
  
  const handleRSVP = async (status) => {
    if (!user) {
      toast.error('Please sign in to RSVP');
      return;
    }
    
    setLoading(true);
    
    try {
      if (userRSVP) {
        // Update existing RSVP
        await api.entities.EventRSVP.update(userRSVP.id, { status });
        setUserRSVP({ ...userRSVP, status });
      } else {
        // Create new RSVP
        const newRSVP = await api.entities.EventRSVP.create({
          event_id: event.id,
          player_email: user.email,
          status
        });
        setUserRSVP(newRSVP);
      }
      
      toast.success(`RSVP updated: ${status}`);
    } catch (error) {
      toast.error('Failed to update RSVP');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open onClose={onClose}>
      <img src={event.banner_url} />
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <div>Date: {format(event.event_date, 'dd MMM yyyy HH:mm')}</div>
      <div>Location: {event.location}</div>
      {event.max_attendees && <div>Max Attendees: {event.max_attendees}</div>}
      {event.entry_fee > 0 && <div>Entry Fee: £{event.entry_fee}</div>}
      
      <div className="rsvp-buttons">
        <Button 
          onClick={() => handleRSVP('attending')}
          disabled={loading}
          variant={userRSVP?.status === 'attending' ? 'solid' : 'outline'}
        >
          Attending
        </Button>
        <Button 
          onClick={() => handleRSVP('maybe')}
          disabled={loading}
          variant={userRSVP?.status === 'maybe' ? 'solid' : 'outline'}
        >
          Maybe
        </Button>
        <Button 
          onClick={() => handleRSVP('not_attending')}
          disabled={loading}
          variant={userRSVP?.status === 'not_attending' ? 'solid' : 'outline'}
        >
          Can't Attend
        </Button>
      </div>
    </Dialog>
  );
}
```

### Contact Page
**File**: `pages/Contact.js`
**Entity**: `ContactMessage`

**State Management**:
```javascript
- formData: { name, email, subject, message }
- submitted: boolean
```

**Data Flow**:
1. User fills contact form
2. On submit → `api.entities.ContactMessage.create(formData)`
3. API: `POST /api/entities/ContactMessage`
4. Backend: `INSERT INTO contact_message (name, email, subject, message) VALUES (...)`
5. Show success message
6. Admin can view messages in Admin panel

---

## Member Pages

### Squad Page
**File**: `pages/Squad.js`
**Entities**: `TeamPlayer`, `Team`

**Role**: User (authenticated)

**Tabs**: All Players | Batsmen | Bowlers | All-Rounders | Wicket-Keepers

**Data Flow**:
1. Fetch teams: `api.entities.Team.list()`
2. For each team → Fetch players: `api.entities.TeamPlayer.filter({ team_id, status: 'Active' })`
3. API: `POST /api/entities/TeamPlayer/filter`
4. Backend: `SELECT * FROM team_player WHERE team_id = $1 AND status = 'Active'`

**Filtering Logic**:
```javascript
const filterByRole = (players, roleTab) => {
  if (roleTab === 'All Players') return players;
  return players.filter(p => p.role === roleTab);
};
```

**Player Card Display**:
- Photo, name, jersey number
- Role badge (Batsman/Bowler/All-Rounder/Wicket-Keeper)
- Captain/Vice-Captain indicator
- Quick stats: Matches, Runs, Wickets
- Click player → Navigate to `PlayerProfile` page

### My Profile Page
**File**: `pages/MyProfile.js`
**Entities**: `TeamPlayer`, `PlayerCharge`, `PlayerPayment`, `PaymentAllocation`, `MatchAvailability`, `Membership`

**Role**: User (authenticated, viewing own profile)

**Tabs**: Overview | Stats | Matches | Payments

**Data Fetching** (all parallel on mount):
```javascript
// 1. Current user
const user = await api.auth.me();

// 2. Player profile
const player = await api.entities.TeamPlayer.filter({ email: user.email });

// 3. Financial data
const charges = await api.entities.PlayerCharge.filter({ player_id: player.id });
const payments = await api.entities.PlayerPayment.filter({ player_id: player.id });
const allocations = await api.entities.PaymentAllocation.list();

// 4. Match availability
const availability = await api.entities.MatchAvailability.filter({ player_email: user.email });

// 5. Memberships
const memberships = await api.entities.Membership.filter({ email: user.email });

// 6. Seasons
const seasons = await api.entities.Season.list();
```

**Tab 1: Overview**
- Profile header: Photo, name, role, jersey number, status
- Edit profile button → Opens dialog to update player info
- Quick stats: Matches, Runs, Wickets, Average, Strike Rate, Economy
- Recent form chart
- Milestones achieved

**Example - User Edits Profile**:
```javascript
function OverviewTab({ player }) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();
  
  const updateMutation = useMutation({
    mutationFn: (data) => api.entities.TeamPlayer.update(player.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['player', player.id]);
      setShowEditDialog(false);
      toast.success('Profile updated!');
    }
  });
  
  const handleEditClick = () => {
    // Pre-fill form with current player data
    setFormData({
      player_name: player.player_name,
      phone: player.phone,
      date_of_birth: player.date_of_birth,
      role: player.role,
      batting_style: player.batting_style,
      bowling_style: player.bowling_style,
      jersey_number: player.jersey_number,
      bio: player.bio
    });
    setShowEditDialog(true);
  };
  
  const handleSubmit = () => {
    updateMutation.mutate(formData);
  };
  
  return (
    <div>
      {/* Profile Header */}
      <div className="profile-header">
        <img src={player.photo_url || '/default-avatar.png'} />
        <div>
          <h1>{player.player_name}</h1>
          <p>{player.role} • #{player.jersey_number}</p>
          <span className="status">{player.status}</span>
        </div>
        <Button onClick={handleEditClick}>Edit Profile</Button>
      </div>
      
      {/* Quick Stats */}
      <div className="stats-grid">
        <StatCard label="Matches" value={player.matches_played} />
        <StatCard label="Runs" value={player.runs_scored} />
        <StatCard label="Wickets" value={player.wickets_taken} />
        <StatCard 
          label="Average" 
          value={(player.runs_scored / (player.matches_played - player.not_outs)).toFixed(2)} 
        />
        <StatCard 
          label="Strike Rate" 
          value={((player.runs_scored / player.balls_faced) * 100).toFixed(2)} 
        />
        <StatCard 
          label="Economy" 
          value={(player.runs_conceded / player.overs_bowled).toFixed(2)} 
        />
      </div>
      
      {/* Edit Dialog */}
      {showEditDialog && (
        <Dialog open onClose={() => setShowEditDialog(false)}>
          <h2>Edit Profile</h2>
          <Input 
            label="Name" 
            value={formData.player_name}
            onChange={(e) => setFormData({...formData, player_name: e.target.value})}
          />
          <Input 
            label="Phone" 
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
          <Input 
            type="date"
            label="Date of Birth" 
            value={formData.date_of_birth}
            onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
          />
          <Select 
            label="Role" 
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
          >
            <option value="Batsman">Batsman</option>
            <option value="Bowler">Bowler</option>
            <option value="All-Rounder">All-Rounder</option>
            <option value="Wicket-Keeper">Wicket-Keeper</option>
          </Select>
          <Input 
            label="Jersey Number" 
            type="number"
            value={formData.jersey_number}
            onChange={(e) => setFormData({...formData, jersey_number: parseInt(e.target.value)})}
          />
          <Textarea 
            label="Bio" 
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
          />
          <Button onClick={handleSubmit} disabled={updateMutation.isLoading}>
            {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Dialog>
      )}
    </div>
  );
}
```

**Tab 2: Stats**
- Batting statistics card: Runs, Average, Strike Rate, Boundaries, Highest Score
- Bowling statistics card: Wickets, Economy, Average, Best Bowling
- Fielding statistics: Catches, Stumpings, Run Outs
- Performance graphs: Runs over time, Wickets over time
- Season breakdown table

**Tab 3: Matches**
- List of all match availability records
- For each match:
  - Match details: Teams, date, venue
  - Current availability status: Available | Not Available | Maybe | Injured
  - Update button → Change availability status

**Example - User Updates Match Availability**:
```javascript
function MatchesTab({ user, player }) {
  const [matches, setMatches] = useState([]);
  const [availability, setAvailability] = useState([]);
  
  useEffect(() => {
    // Fetch upcoming matches
    api.entities.TournamentMatch.filter({ 
      status: ['scheduled', 'live'] 
    }, 'match_date', 50).then(setMatches);
    
    // Fetch user's availability
    api.entities.MatchAvailability.filter({
      player_email: user.email
    }).then(setAvailability);
  }, [user.email]);
  
  const handleStatusChange = async (match, newStatus) => {
    // Find existing availability record
    const existing = availability.find(a => a.match_id === match.id);
    
    try {
      if (existing) {
        // Update existing record
        await api.entities.MatchAvailability.update(existing.id, { 
          status: newStatus 
        });
        
        // Update local state
        setAvailability(prev => 
          prev.map(a => a.id === existing.id ? {...a, status: newStatus} : a)
        );
      } else {
        // Create new availability record
        const newRecord = await api.entities.MatchAvailability.create({
          match_id: match.id,
          match_info: `${match.team1_name} vs ${match.team2_name} - ${format(match.match_date, 'dd MMM')}`,
          player_id: player.id,
          player_email: user.email,
          player_name: player.player_name,
          status: newStatus
        });
        
        // Add to local state
        setAvailability(prev => [...prev, newRecord]);
      }
      
      toast.success('Availability updated!');
    } catch (error) {
      toast.error('Failed to update availability');
      console.error(error);
    }
  };
  
  return (
    <div>
      <h2>Match Availability</h2>
      <div className="matches-list">
        {matches.map(match => {
          const userAvailability = availability.find(a => a.match_id === match.id);
          const currentStatus = userAvailability?.status || 'Not Set';
          
          return (
            <div key={match.id} className="match-card">
              <div className="match-details">
                <h3>{match.team1_name} vs {match.team2_name}</h3>
                <p>{format(match.match_date, 'dd MMM yyyy HH:mm')}</p>
                <p>{match.venue}</p>
              </div>
              
              <div className="availability-section">
                <span className={`status-badge status-${currentStatus.toLowerCase().replace(' ', '-')}`}>
                  {currentStatus}
                </span>
                
                <div className="status-buttons">
                  <Button 
                    size="sm"
                    variant={currentStatus === 'Available' ? 'solid' : 'outline'}
                    onClick={() => handleStatusChange(match, 'Available')}
                  >
                    Available
                  </Button>
                  <Button 
                    size="sm"
                    variant={currentStatus === 'Not Available' ? 'solid' : 'outline'}
                    onClick={() => handleStatusChange(match, 'Not Available')}
                  >
                    Not Available
                  </Button>
                  <Button 
                    size="sm"
                    variant={currentStatus === 'Maybe' ? 'solid' : 'outline'}
                    onClick={() => handleStatusChange(match, 'Maybe')}
                  >
                    Maybe
                  </Button>
                  <Button 
                    size="sm"
                    variant={currentStatus === 'Injured' ? 'solid' : 'outline'}
                    onClick={() => handleStatusChange(match, 'Injured')}
                  >
                    Injured
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Tab 4: Payments**
- Payment summary card:
  - Total charges
  - Total payments
  - Outstanding balance
- Detailed transaction list:
  - All charges with descriptions, amounts, dates
  - All payments with methods, amounts, dates
  - Allocation details (which payments cover which charges)

**Example - User Views Payment History**:
```javascript
function PaymentsTab({ player, user }) {
  const [charges, setCharges] = useState([]);
  const [payments, setPayments] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [expandedCharge, setExpandedCharge] = useState(null);
  
  useEffect(() => {
    // Fetch all financial data
    Promise.all([
      api.entities.PlayerCharge.filter({ player_id: player.id }, '-charge_date'),
      api.entities.PlayerPayment.filter({ player_id: player.id }, '-payment_date'),
      api.entities.PaymentAllocation.list()
    ]).then(([c, p, a]) => {
      setCharges(c);
      setPayments(p);
      setAllocations(a);
    });
  }, [player.id]);
  
  // Calculate totals
  const totalCharges = charges
    .filter(c => !c.voided)
    .reduce((sum, c) => sum + c.amount, 0);
  
  const totalPayments = payments
    .reduce((sum, p) => sum + p.amount, 0);
  
  const balance = totalCharges - totalPayments;
  
  // Get allocations for a specific charge
  const getChargeAllocations = (chargeId) => {
    return allocations.filter(a => a.charge_id === chargeId);
  };
  
  // Calculate charge balance
  const getChargeBalance = (charge) => {
    const chargeAllocations = getChargeAllocations(charge.id);
    const totalAllocated = chargeAllocations.reduce((sum, a) => sum + a.amount, 0);
    return charge.amount - totalAllocated;
  };
  
  return (
    <div>
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3>Total Charges</h3>
          <p className="amount">£{totalCharges.toFixed(2)}</p>
        </div>
        <div className="card">
          <h3>Total Payments</h3>
          <p className="amount">£{totalPayments.toFixed(2)}</p>
        </div>
        <div className="card">
          <h3>Balance</h3>
          <p className={`amount ${balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
            £{Math.abs(balance).toFixed(2)} {balance > 0 ? 'owed' : 'credit'}
          </p>
        </div>
      </div>
      
      {/* Charges List */}
      <div className="charges-section">
        <h2>Charges</h2>
        {charges.map(charge => {
          const chargeBalance = getChargeBalance(charge);
          const chargeAllocations = getChargeAllocations(charge.id);
          const isExpanded = expandedCharge === charge.id;
          
          return (
            <div key={charge.id} className="charge-card">
              <div 
                className="charge-header"
                onClick={() => setExpandedCharge(isExpanded ? null : charge.id)}
              >
                <div>
                  <h3>{charge.description}</h3>
                  <p className="text-sm text-gray-500">
                    {charge.charge_type} • {format(charge.charge_date, 'dd MMM yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="amount">£{charge.amount.toFixed(2)}</p>
                  <p className={`balance ${chargeBalance === 0 ? 'text-green-500' : 'text-orange-500'}`}>
                    {chargeBalance === 0 ? 'Paid' : `£${chargeBalance.toFixed(2)} outstanding`}
                  </p>
                </div>
              </div>
              
              {/* Expanded view showing allocations */}
              {isExpanded && chargeAllocations.length > 0 && (
                <div className="allocations">
                  <h4>Payments Applied:</h4>
                  {chargeAllocations.map(allocation => {
                    const payment = payments.find(p => p.id === allocation.payment_id);
                    return (
                      <div key={allocation.id} className="allocation-item">
                        <span>{format(allocation.allocation_date, 'dd MMM yyyy')}</span>
                        <span>£{allocation.amount.toFixed(2)}</span>
                        <span className="text-gray-500">
                          ({payment?.payment_method})
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {charge.voided && (
                <div className="voided-badge">
                  VOIDED: {charge.voided_reason}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Payments List */}
      <div className="payments-section">
        <h2>Payments</h2>
        {payments.map(payment => {
          const paymentAllocations = allocations.filter(a => a.payment_id === payment.id);
          const totalAllocated = paymentAllocations.reduce((sum, a) => sum + a.amount, 0);
          const unallocated = payment.amount - totalAllocated;
          
          return (
            <div key={payment.id} className="payment-card">
              <div>
                <p className="date">{format(payment.payment_date, 'dd MMM yyyy')}</p>
                <p className="method">{payment.payment_method}</p>
                {payment.reference && <p className="ref">Ref: {payment.reference}</p>}
              </div>
              <div className="text-right">
                <p className="amount">£{payment.amount.toFixed(2)}</p>
                {unallocated > 0 && (
                  <p className="text-blue-500">£{unallocated.toFixed(2)} unallocated</p>
                )}
                {payment.verified && (
                  <span className="verified-badge">Verified ✓</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Player Profile Page (View Others)
**File**: `pages/PlayerProfile.js`
**Entities**: `TeamPlayer`

**Route**: `/player/:id`

**Data Flow**:
1. Get player ID from URL params
2. Fetch: `api.entities.TeamPlayer.get(id)`
3. API: `GET /api/entities/TeamPlayer/:id`
4. Backend: `SELECT * FROM team_player WHERE id = $1`

**Display**:
- Similar to MyProfile Overview tab
- Read-only view (no edit capabilities)
- Full statistics
- Career highlights

---

## Admin Pages

### Admin Dashboard
**File**: `pages/Admin.js`
**Role**: Admin

**Components**:
- `components/admin/UserManager.js`
- `components/admin/EventManager.js`
- `components/admin/NotificationManager.js`

**Tabs**: Users | Teams | Events | News | Gallery | Notifications

**Tab 1: Users**
**Component**: `UserManager.js`
**Entity**: `User`

**Data Flow**:
1. Fetch: `api.entities.User.list()`
2. API: `GET /api/entities/User`
3. Backend: `SELECT id, email, full_name, role, email_verified FROM users`

**Operations**:

**Create User**:
```javascript
api.entities.User.create({
  email, 
  password: hashedPassword,
  full_name,
  role: 'user' | 'admin' | 'treasurer',
  email_verified: true
})
```

**Update User**:
```javascript
api.entities.User.update(userId, {
  full_name,
  role
})
```

**Delete User**:
```javascript
api.entities.User.delete(userId)
```

**Tab 2: Teams**
**Entity**: `Team`, `TeamPlayer`

**Data Flow**:
1. Fetch teams: `api.entities.Team.list()`
2. For selected team → Fetch players: `api.entities.TeamPlayer.filter({ team_id })`

**Team Operations**:

**Create Team**:
```javascript
api.entities.Team.create({
  name,
  short_name,
  logo_url,
  home_ground,
  primary_color,
  secondary_color,
  is_home_team: false
})
```

**Add Player to Team**:
```javascript
api.entities.TeamPlayer.create({
  team_id,
  player_name,
  email,
  phone,
  role: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper',
  batting_style: 'Right-handed' | 'Left-handed',
  bowling_style: 'Fast' | 'Medium' | 'Spin',
  jersey_number,
  status: 'Active'
})
```

**Update Player**:
```javascript
api.entities.TeamPlayer.update(playerId, {
  ...updateFields,
  // Stats are auto-calculated from ball-by-ball data
})
```

**Remove Player**:
```javascript
// Soft delete - change status
api.entities.TeamPlayer.update(playerId, { status: 'Inactive' })
```

**Tab 3: Events**
**Component**: `EventManager.js`
**Entity**: `Event`

**Data Flow**:
1. Fetch: `api.entities.Event.list('-event_date')`
2. API: `GET /api/entities/Event?sort=-event_date`

**Event Operations**:

**Create Event**:
```javascript
api.entities.Event.create({
  title,
  description,
  event_date,
  location,
  max_attendees,
  status: 'upcoming',
  banner_url,
  entry_fee
})
```

**Update Event**:
```javascript
api.entities.Event.update(eventId, formData)
```

**Delete Event**:
```javascript
api.entities.Event.delete(eventId)
```

**Tab 4: News**
**Entity**: `News`

**Create News Article**:
```javascript
api.entities.News.create({
  title,
  content,
  excerpt,
  category: 'Match Report' | 'Club News' | 'Player News' | 'Announcement' | 'Event',
  image_url,
  is_featured: boolean
})
```

**Tab 5: Gallery**
**Entity**: `GalleryImage`

**Upload Image**:
1. User selects file
2. Upload file: `api.integrations.Core.UploadFile({ file })`
3. Get file_url from response
4. Create gallery record:
```javascript
api.entities.GalleryImage.create({
  image_url: file_url,
  title,
  description,
  category: 'Match' | 'Training' | 'Event' | 'Team'
})
```

**Tab 6: Notifications**
**Component**: `NotificationManager.js`
**Entities**: `Notification`, `UserNotification`

**Send Notification**:
```javascript
// 1. Create notification
const notification = await api.entities.Notification.create({
  title,
  message,
  type: 'info' | 'success' | 'warning' | 'error',
  priority: 'low' | 'medium' | 'high',
  action_url
});

// 2. Get all users
const users = await api.entities.User.list();

// 3. Create UserNotification for each user
const userNotifications = users.map(user => ({
  notification_id: notification.id,
  user_email: user.email,
  read: false
}));

await api.entities.UserNotification.bulkCreate(userNotifications);
```

### Tournaments Page
**File**: `pages/Tournaments.js`
**Entities**: `Tournament`, `Season`, `Competition`
**Role**: Admin

**Data Flow**:
1. Fetch seasons: `api.entities.Season.list()`
2. Fetch competitions: `api.entities.Competition.list()`
3. Fetch tournaments: `api.entities.Tournament.list('-start_date')`

**Display**:
- List of all tournaments
- Filter by season, competition, status
- Create tournament button → Navigate to `TournamentCreate`
- Click tournament → Navigate to `TournamentView`

**Create Tournament Flow**:
**Page**: `pages/TournamentCreate.js`

**Step 1: Basic Info**
```javascript
{
  competition_id,
  sub_competition_id,
  season_id,
  format: 'league' | 'knockout' | 'group_knockout',
  overs_per_match,
  max_teams,
  start_date,
  end_date
}
```

**Step 2: Tournament Details**
```javascript
{
  description,
  rules,
  prize_money,
  entry_fee,
  logo_url,
  banner_url
}
```

**Step 3: Match Profile**
- Select or create match profile (scoring rules)
- Match profile defines:
  - Powerplay overs
  - Fielding restrictions
  - DLS parameters
  - LMS rules (if applicable)

**Auto-Generate Tournament Name**:
```javascript
// Format: Competition - SubCompetition - Season
const name = `${competition.name} - ${subCompetition.name} - ${season.name}`;
```

**Submit**:
```javascript
api.entities.Tournament.create({
  ...formData,
  name: generatedName,
  status: 'draft',
  current_stage: 'group'
})
```

### Tournament View Page
**File**: `pages/TournamentView.js`
**Entities**: `Tournament`, `TournamentTeam`, `TournamentMatch`, `TournamentPlayer`
**Role**: Admin

**Route**: `/tournament/:id`

**Tabs**: Overview | Teams | Fixtures | Points Table | Bracket | Statistics

**Data Fetching**:
```javascript
// 1. Tournament details
const tournament = await api.entities.Tournament.get(tournamentId);

// 2. Teams
const teams = await api.entities.TournamentTeam.filter({ tournament_id: tournamentId });

// 3. Matches
const matches = await api.entities.TournamentMatch.filter({ tournament_id: tournamentId });

// 4. Players
const players = await api.entities.TournamentPlayer.filter({ tournament_id: tournamentId });
```

**Tab 1: Overview**
- Tournament details
- Status, dates, format
- Edit tournament button
- Generate fixtures button

**Tab 2: Teams**
**Component**: `TournamentTeams.js`

**Add Team**:
1. Select team from Team entity
2. Assign group (for group_knockout format)
3. Set seed number
```javascript
api.entities.TournamentTeam.create({
  tournament_id,
  team_id,
  team_name: team.name,
  short_name: team.short_name,
  group: 'A' | 'B' | 'C' | 'D',
  seed: 1,
  registration_status: 'approved'
})
```

**Import Team Players**:
```javascript
// Get all players from TeamPlayer
const teamPlayers = await api.entities.TeamPlayer.filter({ team_id });

// Create TournamentPlayer records
const tournamentPlayers = teamPlayers.map(p => ({
  tournament_id,
  tournament_team_id: tournamentTeam.id,
  player_id: p.id,
  player_name: p.player_name,
  team_name: team.name
}));

await api.entities.TournamentPlayer.bulkCreate(tournamentPlayers);
```

**Tab 3: Fixtures**
**Component**: `TournamentFixtures.js`

**Generate Fixtures** (League Format):
```javascript
// Round-robin algorithm
function generateLeagueFixtures(teams, oversPerMatch) {
  const fixtures = [];
  const n = teams.length;
  
  for (let round = 0; round < n - 1; round++) {
    for (let match = 0; match < n / 2; match++) {
      const home = (round + match) % (n - 1);
      const away = (n - 1 - match + round) % (n - 1);
      
      fixtures.push({
        tournament_id,
        team1_id: teams[home].id,
        team1_name: teams[home].team_name,
        team2_id: teams[away].id,
        team2_name: teams[away].team_name,
        match_number: fixtures.length + 1,
        stage: 'league',
        round: round + 1,
        status: 'scheduled'
      });
    }
  }
  
  return fixtures;
}

// Bulk create matches
await api.entities.TournamentMatch.bulkCreate(fixtures);
```

**Generate Fixtures** (Knockout Format):
```javascript
function generateKnockoutBracket(teams) {
  const rounds = Math.ceil(Math.log2(teams.length));
  const fixtures = [];
  
  // Seed teams in bracket
  const seededTeams = seedTeams(teams);
  
  // Generate first round
  for (let i = 0; i < seededTeams.length; i += 2) {
    fixtures.push({
      tournament_id,
      team1_id: seededTeams[i].id,
      team1_name: seededTeams[i].team_name,
      team2_id: seededTeams[i + 1].id,
      team2_name: seededTeams[i + 1].team_name,
      match_number: fixtures.length + 1,
      stage: getStageFromRound(1, rounds),
      bracket_position: i / 2,
      status: 'scheduled'
    });
  }
  
  return fixtures;
}
```

**Schedule Match**:
```javascript
api.entities.TournamentMatch.update(matchId, {
  match_date: selectedDateTime,
  venue: selectedVenue
})
```

**Tab 4: Points Table**
**Component**: `TournamentPointsTable.js`

**Update Team Standings** (after match completion):
```javascript
function updatePointsTable(match, tournamentTeams) {
  const winnerTeam = tournamentTeams.find(t => t.id === match.winner_id);
  const loserTeam = tournamentTeams.find(t => t.id !== match.winner_id);
  
  // Update winner
  api.entities.TournamentTeam.update(winnerTeam.id, {
    matches_played: winnerTeam.matches_played + 1,
    matches_won: winnerTeam.matches_won + 1,
    points: winnerTeam.points + 2, // 2 points for win
    runs_scored: winnerTeam.runs_scored + match.team1_id === winnerTeam.id ? parseRuns(match.team1_score) : parseRuns(match.team2_score),
    // ... update NRR
  });
  
  // Update loser
  api.entities.TournamentTeam.update(loserTeam.id, {
    matches_played: loserTeam.matches_played + 1,
    matches_lost: loserTeam.matches_lost + 1,
    // ... update runs, overs, NRR
  });
}
```

**Net Run Rate Calculation**:
```javascript
function calculateNRR(team) {
  const runsScored = team.runs_scored;
  const oversFaced = team.overs_faced;
  const runsConceded = team.runs_conceded;
  const oversBowled = team.overs_bowled;
  
  const runRate = runsScored / oversFaced;
  const concededRate = runsConceded / oversBowled;
  
  return runRate - concededRate;
}
```

**Tab 5: Bracket**
**Component**: `TournamentBracket.js`

**Display Logic** (Knockout format):
- Tree structure showing match progression
- Each node shows: Team names, scores (if completed), winner
- Clicking match opens scorecard or scoring interface

**Advance Winner**:
```javascript
function advanceWinner(match, bracket) {
  if (!match.next_match_id) return; // Final
  
  const nextMatch = bracket.find(m => m.id === match.next_match_id);
  
  // Update next match with winner
  api.entities.TournamentMatch.update(nextMatch.id, {
    team1_id: match.bracket_position % 2 === 0 ? match.winner_id : nextMatch.team1_id,
    team2_id: match.bracket_position % 2 === 1 ? match.winner_id : nextMatch.team2_id
  });
}
```

**Tab 6: Statistics**
**Component**: `TournamentStats.js`
**Entity**: `TournamentPlayer`

**Data Aggregation**:
```javascript
// Top run scorers
const topBatsmen = players
  .sort((a, b) => b.runs_scored - a.runs_scored)
  .slice(0, 10);

// Top wicket takers
const topBowlers = players
  .sort((a, b) => b.wickets_taken - a.wickets_taken)
  .slice(0, 10);

// Best batting average
const bestAverage = players
  .filter(p => p.matches_played >= 3)
  .sort((a, b) => b.batting_avg - a.batting_avg)
  .slice(0, 10);

// Best economy rate
const bestEconomy = players
  .filter(p => p.overs_bowled >= 10)
  .sort((a, b) => a.economy - b.economy)
  .slice(0, 10);
```

**Display**:
- Leaderboards for each category
- Player cards with stats
- Click player → View detailed player statistics

### Competition Manager
**File**: `pages/CompetitionManager.js`
**Entity**: `Competition`
**Role**: Admin

**Hierarchy**:
- Parent Competition (e.g., "World Cricket League")
  - Sub-Competition 1 (e.g., "Division 9")
  - Sub-Competition 2 (e.g., "Division 10")

**Create Parent Competition**:
```javascript
api.entities.Competition.create({
  name: "World Cricket League",
  short_name: "WCL",
  format: "T20",
  status: "Active",
  logo_url,
  organizer
})
```

**Create Sub-Competition**:
```javascript
api.entities.Competition.create({
  parent_id: parentCompetition.id,
  parent_name: parentCompetition.name,
  name: "Division 9",
  short_name: "WCL Div 9",
  format: "T20",
  status: "Active"
})
```

**Display**:
- Tree view showing hierarchy
- CRUD operations for competitions
- Link to view all tournaments under a competition

---

## Finance Pages

### Finance Dashboard
**File**: `pages/Finance.js`
**Role**: Treasurer, Admin
**Entities**: `Transaction`, `FinanceCategory`, `PlayerCharge`, `PlayerPayment`

**Tabs**: Overview | Transactions | Player Payments | Reports

**Data Fetching**:
```javascript
// 1. All transactions
const transactions = await api.entities.Transaction.list('-date');

// 2. Categories
const categories = await api.entities.FinanceCategory.list();

// 3. Player charges
const charges = await api.entities.PlayerCharge.list();

// 4. Player payments
const payments = await api.entities.PlayerPayment.list();
```

**Tab 1: Overview**
**Component**: `FinanceOverview.js`

**Example - Treasurer Views Financial Overview**:
```javascript
function FinanceOverviewTab() {
  const [transactions, setTransactions] = useState([]);
  const [charges, setCharges] = useState([]);
  const [payments, setPayments] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });
  
  useEffect(() => {
    // Fetch all financial data
    Promise.all([
      api.entities.Transaction.list('-date'),
      api.entities.PlayerCharge.list(),
      api.entities.PlayerPayment.list()
    ]).then(([t, c, p]) => {
      setTransactions(t);
      setCharges(c);
      setPayments(p);
    });
  }, []);
  
  // Filter by date range
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
  });
  
  // Calculate totals
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netBalance = totalIncome - totalExpenses;
  
  // Player outstanding
  const totalCharges = charges
    .filter(c => !c.voided)
    .reduce((sum, c) => sum + c.amount, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const playerOutstanding = totalCharges - totalPayments;
  
  // Category breakdown
  const categoryData = filteredTransactions.reduce((acc, t) => {
    if (!acc[t.category_name]) {
      acc[t.category_name] = { income: 0, expense: 0 };
    }
    if (t.type === 'Income') {
      acc[t.category_name].income += t.amount;
    } else {
      acc[t.category_name].expense += t.amount;
    }
    return acc;
  }, {});
  
  // Monthly trend data
  const monthlyData = {};
  for (let i = 0; i < 6; i++) {
    const month = subMonths(new Date(), i);
    const monthKey = format(month, 'MMM yyyy');
    
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === month.getMonth() && 
             tDate.getFullYear() === month.getFullYear();
    });
    
    monthlyData[monthKey] = {
      income: monthTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0),
      expense: monthTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0)
    };
  }
  
  return (
    <div>
      {/* Date Range Selector */}
      <div className="date-range-selector">
        <DatePicker 
          selected={dateRange.start} 
          onChange={(date) => setDateRange({...dateRange, start: date})}
        />
        <span>to</span>
        <DatePicker 
          selected={dateRange.end} 
          onChange={(date) => setDateRange({...dateRange, end: date})}
        />
        <Button onClick={() => setDateRange({
          start: startOfMonth(new Date()),
          end: endOfMonth(new Date())
        })}>
          This Month
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card income">
          <h3>Total Income</h3>
          <p className="amount">£{totalIncome.toFixed(2)}</p>
          <p className="subtitle">{dateRange.start ? format(dateRange.start, 'MMM yyyy') : 'All time'}</p>
        </div>
        
        <div className="card expense">
          <h3>Total Expenses</h3>
          <p className="amount">£{totalExpenses.toFixed(2)}</p>
          <p className="subtitle">{dateRange.start ? format(dateRange.start, 'MMM yyyy') : 'All time'}</p>
        </div>
        
        <div className="card net">
          <h3>Net Balance</h3>
          <p className={`amount ${netBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            £{Math.abs(netBalance).toFixed(2)}
          </p>
          <p className="subtitle">{netBalance >= 0 ? 'Profit' : 'Loss'}</p>
        </div>
        
        <div className="card outstanding">
          <h3>Player Outstanding</h3>
          <p className="amount">£{playerOutstanding.toFixed(2)}</p>
          <p className="subtitle">To be collected</p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="charts-grid">
        {/* Income vs Expenses Line Chart */}
        <div className="chart-card">
          <h3>Income vs Expenses (6 months)</h3>
          <LineChart width={600} height={300} data={Object.entries(monthlyData).reverse().map(([month, data]) => ({
            month,
            income: data.income,
            expense: data.expense
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#00ff88" name="Income" />
            <Line type="monotone" dataKey="expense" stroke="#ff3b5c" name="Expenses" />
          </LineChart>
        </div>
        
        {/* Category Breakdown Pie Chart */}
        <div className="chart-card">
          <h3>Expenses by Category</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={Object.entries(categoryData).map(([name, data]) => ({
                name,
                value: data.expense
              }))}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {Object.keys(categoryData).map((key, index) => (
                <Cell key={key} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="recent-transactions">
        <h3>Recent Transactions</h3>
        <div className="transactions-list">
          {filteredTransactions.slice(0, 10).map(transaction => (
            <div key={transaction.id} className="transaction-item">
              <div>
                <p className="description">{transaction.description}</p>
                <p className="category">{transaction.category_name}</p>
                <p className="date">{format(transaction.date, 'dd MMM yyyy')}</p>
              </div>
              <p className={`amount ${transaction.type === 'Income' ? 'text-green-500' : 'text-red-500'}`}>
                {transaction.type === 'Income' ? '+' : '-'}£{transaction.amount.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Tab 2: Transactions**
**Component**: `TransactionList.js`

**Example - Treasurer Adds New Transaction**:
```javascript
function TransactionsTab() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    paymentMethod: 'all',
    dateRange: { start: null, end: null }
  });
  
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    paid_to: '',
    received_from: '',
    payment_method: 'Bank Transfer',
    receipt_url: ''
  });
  
  useEffect(() => {
    // Fetch transactions and categories
    Promise.all([
      api.entities.Transaction.list('-date'),
      api.entities.FinanceCategory.list()
    ]).then(([t, c]) => {
      setTransactions(t);
      setCategories(c);
    });
  }, []);
  
  // Apply filters
  const filteredTransactions = transactions.filter(t => {
    if (filters.type !== 'all' && t.type !== filters.type) return false;
    if (filters.category !== 'all' && t.category_id !== filters.category) return false;
    if (filters.paymentMethod !== 'all' && t.payment_method !== filters.paymentMethod) return false;
    if (filters.dateRange.start && new Date(t.date) < filters.dateRange.start) return false;
    if (filters.dateRange.end && new Date(t.date) > filters.dateRange.end) return false;
    return true;
  });
  
  const handleAddTransaction = async () => {
    // Get selected category to determine type
    const selectedCategory = categories.find(c => c.id === formData.category_id);
    
    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }
    
    try {
      await api.entities.Transaction.create({
        category_id: formData.category_id,
        category_name: selectedCategory.name,
        type: selectedCategory.type, // Income or Expense
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
        reference: formData.reference,
        paid_to: selectedCategory.type === 'Expense' ? formData.paid_to : null,
        received_from: selectedCategory.type === 'Income' ? formData.received_from : null,
        payment_method: formData.payment_method,
        status: 'Completed',
        receipt_url: formData.receipt_url
      });
      
      // Refresh transactions
      const updated = await api.entities.Transaction.list('-date');
      setTransactions(updated);
      
      // Close dialog and reset form
      setShowAddDialog(false);
      setFormData({
        category_id: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        paid_to: '',
        received_from: '',
        payment_method: 'Bank Transfer',
        receipt_url: ''
      });
      
      toast.success('Transaction added successfully!');
    } catch (error) {
      toast.error('Failed to add transaction');
      console.error(error);
    }
  };
  
  const handleUploadReceipt = async (file) => {
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setFormData({...formData, receipt_url: file_url});
      toast.success('Receipt uploaded!');
    } catch (error) {
      toast.error('Failed to upload receipt');
    }
  };
  
  const handleDeleteTransaction = async (transactionId) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      await api.entities.Transaction.delete(transactionId);
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      toast.success('Transaction deleted');
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };
  
  return (
    <div>
      {/* Action Bar */}
      <div className="action-bar">
        <Button onClick={() => setShowAddDialog(true)}>
          Add Transaction
        </Button>
      </div>
      
      {/* Filters */}
      <div className="filters">
        <Select 
          value={filters.type}
          onChange={(e) => setFilters({...filters, type: e.target.value})}
        >
          <option value="all">All Types</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </Select>
        
        <Select 
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value})}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </Select>
        
        <Select 
          value={filters.paymentMethod}
          onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})}
        >
          <option value="all">All Payment Methods</option>
          <option value="Cash">Cash</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Card">Card</option>
          <option value="Cheque">Cheque</option>
          <option value="Online">Online</option>
        </Select>
      </div>
      
      {/* Transactions Table */}
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Type</th>
            <th>Payment Method</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map(transaction => (
            <tr key={transaction.id}>
              <td>{format(transaction.date, 'dd MMM yyyy')}</td>
              <td>{transaction.description}</td>
              <td>{transaction.category_name}</td>
              <td>
                <span className={`badge ${transaction.type.toLowerCase()}`}>
                  {transaction.type}
                </span>
              </td>
              <td>{transaction.payment_method}</td>
              <td className={transaction.type === 'Income' ? 'text-green-500' : 'text-red-500'}>
                {transaction.type === 'Income' ? '+' : '-'}£{transaction.amount.toFixed(2)}
              </td>
              <td>
                {transaction.receipt_url && (
                  <Button size="sm" onClick={() => window.open(transaction.receipt_url)}>
                    View Receipt
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => handleDeleteTransaction(transaction.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Add Transaction Dialog */}
      {showAddDialog && (
        <Dialog open onClose={() => setShowAddDialog(false)}>
          <h2>Add Transaction</h2>
          
          <Select 
            label="Category"
            value={formData.category_id}
            onChange={(e) => setFormData({...formData, category_id: e.target.value})}
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type})
              </option>
            ))}
          </Select>
          
          <Input 
            label="Amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
          />
          
          <Input 
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
          
          <Input 
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
          />
          
          {categories.find(c => c.id === formData.category_id)?.type === 'Expense' && (
            <Input 
              label="Paid To"
              value={formData.paid_to}
              onChange={(e) => setFormData({...formData, paid_to: e.target.value})}
            />
          )}
          
          {categories.find(c => c.id === formData.category_id)?.type === 'Income' && (
            <Input 
              label="Received From"
              value={formData.received_from}
              onChange={(e) => setFormData({...formData, received_from: e.target.value})}
            />
          )}
          
          <Select 
            label="Payment Method"
            value={formData.payment_method}
            onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
          >
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
            <option value="Cheque">Cheque</option>
            <option value="Online">Online</option>
          </Select>
          
          <Input 
            label="Reference"
            value={formData.reference}
            onChange={(e) => setFormData({...formData, reference: e.target.value})}
            placeholder="Invoice/Receipt number"
          />
          
          <div>
            <label>Receipt/Invoice</label>
            <input 
              type="file" 
              accept="image/*,application/pdf"
              onChange={(e) => handleUploadReceipt(e.target.files[0])}
            />
            {formData.receipt_url && (
              <a href={formData.receipt_url} target="_blank">View Uploaded Receipt</a>
            )}
          </div>
          
          <Button onClick={handleAddTransaction}>
            Add Transaction
          </Button>
        </Dialog>
      )}
    </div>
  );
}
```

**Tab 3: Player Payments**
**Component**: `PaymentManager.js`

**Subtabs**: Charges | Payments | Allocations

**Subtab A: Charges**

**Create Charge**:
```javascript
api.entities.PlayerCharge.create({
  player_id,
  charge_type: 'match_fee' | 'membership' | 'event' | 'fine' | 'equipment' | 'training' | 'other',
  amount,
  description: "Match fee for WCL Div 9 - Round 3",
  charge_date,
  due_date,
  reference_type: 'TournamentMatch',
  reference_id: matchId
})
```

**Bulk Create Match Fees** (after match):
```javascript
// Get all players who played in the match
const matchPlayers = await api.entities.MatchAvailability.filter({
  match_id: matchId,
  status: 'Available'
});

// Create charge for each player
const charges = matchPlayers.map(p => ({
  player_id: p.player_id,
  charge_type: 'match_fee',
  amount: 10.00, // From match profile or config
  description: `Match fee - ${match.team1_name} vs ${match.team2_name}`,
  charge_date: match.match_date,
  reference_type: 'TournamentMatch',
  reference_id: matchId
}));

await api.entities.PlayerCharge.bulkCreate(charges);
```

**Void Charge**:
```javascript
api.entities.PlayerCharge.update(chargeId, {
  voided: true,
  voided_reason: "Match cancelled"
})
```

**Subtab B: Payments**

**Record Payment**:
```javascript
api.entities.PlayerPayment.create({
  player_id,
  amount,
  payment_date,
  payment_method: 'Cash' | 'Bank Transfer' | 'Card' | 'Online' | 'Cheque',
  reference: bankTransactionId,
  recorded_by: currentUser.email,
  verified: false,
  notes
})
```

**Verify Payment**:
```javascript
api.entities.PlayerPayment.update(paymentId, {
  verified: true,
  verified_by: currentUser.email,
  verified_date: new Date().toISOString()
})
```

**Subtab C: Allocations**

**Allocate Payment to Charge**:
```javascript
// Payment allocation system tracks which payments cover which charges
api.entities.PaymentAllocation.create({
  payment_id,
  charge_id,
  amount: allocationAmount,
  allocation_date: new Date().toISOString(),
  allocated_by: currentUser.email,
  notes
})
```

**Auto-Allocation Logic** (FIFO - First In First Out):
```javascript
function autoAllocatePayment(payment, charges) {
  let remainingAmount = payment.amount;
  const allocations = [];
  
  // Sort charges by date (oldest first)
  const unpaidCharges = charges
    .filter(c => !c.voided && getChargeBalance(c) > 0)
    .sort((a, b) => new Date(a.charge_date) - new Date(b.charge_date));
  
  for (const charge of unpaidCharges) {
    if (remainingAmount <= 0) break;
    
    const chargeBalance = getChargeBalance(charge);
    const allocationAmount = Math.min(remainingAmount, chargeBalance);
    
    allocations.push({
      payment_id: payment.id,
      charge_id: charge.id,
      amount: allocationAmount,
      allocation_date: new Date().toISOString(),
      allocated_by: 'auto'
    });
    
    remainingAmount -= allocationAmount;
  }
  
  return allocations;
}

function getChargeBalance(charge) {
  // Get all allocations for this charge
  const chargeAllocations = allocations.filter(a => a.charge_id === charge.id);
  const totalAllocated = chargeAllocations.reduce((sum, a) => sum + a.amount, 0);
  return charge.amount - totalAllocated;
}
```

**Tab 4: Reports**
**Component**: `FinancialReports.js`

**Report Types**:
1. Income Statement (P&L)
2. Category Breakdown
3. Player Payment Report
4. Year-over-Year Comparison

**Income Statement**:
```javascript
function generateIncomeStatement(transactions, startDate, endDate) {
  const filtered = transactions.filter(t => 
    new Date(t.date) >= startDate && new Date(t.date) <= endDate
  );
  
  const income = filtered
    .filter(t => t.type === 'Income')
    .reduce((acc, t) => {
      acc[t.category_name] = (acc[t.category_name] || 0) + t.amount;
      return acc;
    }, {});
  
  const expenses = filtered
    .filter(t => t.type === 'Expense')
    .reduce((acc, t) => {
      acc[t.category_name] = (acc[t.category_name] || 0) + t.amount;
      return acc;
    }, {});
  
  const totalIncome = Object.values(income).reduce((sum, v) => sum + v, 0);
  const totalExpenses = Object.values(expenses).reduce((sum, v) => sum + v, 0);
  const netProfit = totalIncome - totalExpenses;
  
  return { income, expenses, totalIncome, totalExpenses, netProfit };
}
```

**Export to PDF**:
```javascript
import jsPDF from 'jspdf';

function exportReport(reportData) {
  const pdf = new jsPDF();
  
  // Add club branding
  pdf.setFontSize(18);
  pdf.text('Leamington Royals CC', 105, 15, { align: 'center' });
  pdf.setFontSize(12);
  pdf.text('Financial Report', 105, 25, { align: 'center' });
  
  // Add report content
  let y = 40;
  pdf.text(`Report Period: ${startDate} to ${endDate}`, 20, y);
  y += 10;
  
  // Income section
  pdf.text('Income:', 20, y);
  y += 7;
  Object.entries(reportData.income).forEach(([category, amount]) => {
    pdf.text(`  ${category}: £${amount.toFixed(2)}`, 25, y);
    y += 6;
  });
  
  // ... expenses, totals
  
  pdf.save('financial-report.pdf');
}
```

### Sponsorships Page
**File**: `pages/Sponsorships.js`
**Role**: Treasurer, Admin
**Entities**: `Sponsor`, `SponsorPayment`

**Tabs**: Active Sponsors | Payments | Settings

**Tab 1: Active Sponsors**

**Add Sponsor**:
```javascript
api.entities.Sponsor.create({
  name: "ABC Corporation",
  contact_person,
  contact_email,
  contact_phone,
  sponsor_type: 'Title' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Kit' | 'Match',
  annual_value,
  contract_start_date,
  contract_end_date,
  logo_url,
  website_url,
  benefits: "Logo on kit, website banner, match sponsorship",
  status: 'Active'
})
```

**Display**:
- List of sponsors with logos
- Sponsor tier badges
- Contract status (active/expiring soon/expired)
- Total annual value

**Tab 2: Payments**

**Record Sponsor Payment**:
```javascript
api.entities.SponsorPayment.create({
  sponsor_id,
  amount,
  payment_date,
  period: "2024-2025 Season",
  payment_method: 'Bank Transfer',
  reference: invoiceNumber,
  notes
})
```

**Payment Summary**:
```javascript
function getSponsorPaymentSummary(sponsor, payments) {
  const sponsorPayments = payments.filter(p => p.sponsor_id === sponsor.id);
  const totalReceived = sponsorPayments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = sponsor.annual_value - totalReceived;
  
  return { totalReceived, outstanding };
}
```

### Membership Manager
**File**: `components/finance/MembershipManager.js`
**Entity**: `Membership`

**Create Membership**:
```javascript
api.entities.Membership.create({
  player_id,
  member_name: player.player_name,
  email: player.email,
  phone: player.phone,
  membership_type: 'Junior' | 'Adult' | 'Family' | 'Senior' | 'Life' | 'Corporate' | 'Social',
  status: 'Pending',
  season: "2024-2025",
  start_date,
  expiry_date,
  fee_amount
})
```

**Auto-Create Charge for Membership**:
```javascript
// When membership is approved
api.entities.PlayerCharge.create({
  player_id: membership.player_id,
  charge_type: 'membership',
  amount: membership.fee_amount,
  description: `${membership.membership_type} Membership - ${membership.season}`,
  charge_date: membership.start_date,
  due_date: membership.start_date,
  reference_type: 'Membership',
  reference_id: membership.id
});

// Update membership status
api.entities.Membership.update(membership.id, { status: 'Active' });
```

**Renewal Logic**:
```javascript
// Check for expiring memberships (30 days before expiry)
function checkExpiringMemberships(memberships) {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  return memberships.filter(m => {
    const expiryDate = new Date(m.expiry_date);
    return expiryDate <= thirtyDaysFromNow && expiryDate > today && m.status === 'Active';
  });
}

// Send renewal notifications
expiringMemberships.forEach(async (membership) => {
  await api.integrations.Core.SendEmail({
    to: membership.email,
    subject: 'Membership Renewal Reminder',
    body: `Your ${membership.membership_type} membership expires on ${membership.expiry_date}. Please renew to continue enjoying club benefits.`
  });
});
```

---

## Live Scoring System

### Scoring Page
**File**: `pages/Scoring.js`
**Role**: Admin, Scorer
**Entities**: `Match`, `MatchState`, `InningsScore`, `BallByBall`, `TournamentMatch`, `TournamentPlayer`

**Main Components**:
- `MatchSelector.js` - Select match to score
- `TossScreen.js` - Record toss and team selection
- `ProfileSelector.js` - Select scoring profile (LMS, Standard, etc.)
- `ScoringHeader.js` - Match info and timer
- `ScoreDisplay.js` - Current score
- `BatsmanCard.js` - Striker/Non-striker stats
- `BowlerCard.js` - Current bowler stats
- `RunButtons.js` - Record runs (0-6)
- `ExtrasButtons.js` - Record wides, no-balls, byes
- `ActionButtons.js` - Wicket, undo, end over
- `WicketDialog.js` - Record wicket details
- `FullScorecard.js` - Detailed scorecard view

### Scoring Flow

**Step 1: Match Selection**
**Component**: `MatchSelector.js`

```javascript
// Fetch scheduled/live matches
const matches = await api.entities.TournamentMatch.filter({
  status: ['scheduled', 'live']
}, '-match_date');

// Display list of matches
// User selects match → Load match for scoring
```

**Step 2: Profile Selection**
**Component**: `ProfileSelector.js`

```javascript
// Profiles define scoring rules
const profiles = [
  {
    id: 'lms',
    name: 'LMS (Last Man Stands)',
    rules: {
      oversPerInnings: 20,
      ballsPerOver: 6,
      powerplayOvers: 6,
      maxWickets: 5, // LMS: Only 5 wickets allowed
      retirementRuns: null,
      pairingsSystem: true // LMS pairing system
    }
  },
  {
    id: 'standard_t20',
    name: 'Standard T20',
    rules: {
      oversPerInnings: 20,
      ballsPerOver: 6,
      powerplayOvers: 6,
      maxWickets: 10,
      retirementRuns: null,
      pairingsSystem: false
    }
  }
];

// User selects profile → Apply rules to match
```

**Step 3: Toss**
**Component**: `TossScreen.js`

```javascript
// Create/Update MatchState
const matchState = await api.entities.MatchState.create({
  match_id,
  toss_winner: 'home' | 'away',
  toss_decision: 'bat' | 'bowl',
  batting_first: tossWinner === 'home' && tossDecision === 'bat' ? 'home' : 'away',
  match_settings: JSON.stringify(selectedProfile.rules),
  innings: 1,
  striker: null,
  non_striker: null,
  bowler: null
});

// Create InningsScore for 1st innings
await api.entities.InningsScore.create({
  match_id,
  innings: 1,
  batting_team_id: battingFirstTeam.id,
  batting_team_name: battingFirstTeam.name,
  bowling_team_id: bowlingFirstTeam.id,
  bowling_team_name: bowlingFirstTeam.name,
  total_runs: 0,
  total_wickets: 0,
  total_overs: '0.0',
  is_completed: false
});

// Update match status
await api.entities.TournamentMatch.update(matchId, {
  status: 'live',
  toss_winner: tossWinnerTeamName,
  toss_decision: tossDecision
});
```

**Step 4: Select Opening Batsmen & Bowler**
**Component**: `PlayerSelectDialog.js`

```javascript
// Fetch players for each team
const battingTeamPlayers = await api.entities.TournamentPlayer.filter({
  tournament_id,
  tournament_team_id: battingTeam.id
});

const bowlingTeamPlayers = await api.entities.TournamentPlayer.filter({
  tournament_id,
  tournament_team_id: bowlingTeam.id
});

// User selects 2 batsmen and 1 bowler
await api.entities.MatchState.update(matchState.id, {
  striker: batsman1.player_name,
  non_striker: batsman2.player_name,
  bowler: bowler.player_name
});
```

**Step 5: Ball-by-Ball Scoring**

**Record a Ball**:
```javascript
async function recordBall(ballData) {
  const {
    runs,
    extras,
    extraType,
    isWicket,
    wicketType,
    dismissedBatsman,
    fielder,
    isFour,
    isSix,
    isDot,
    wagonWheelZone,
    shotType
  } = ballData;
  
  // 1. Create BallByBall record
  const ball = await api.entities.BallByBall.create({
    match_id,
    innings: currentInnings,
    over_number: currentOver,
    ball_number: currentBall,
    batsman_id: striker.id,
    batsman_name: striker.name,
    non_striker_id: nonStriker.id,
    non_striker_name: nonStriker.name,
    bowler_id: bowler.id,
    bowler_name: bowler.name,
    runs,
    extras,
    extra_type: extraType,
    is_wicket: isWicket,
    wicket_type: wicketType,
    dismissed_batsman_id: dismissedBatsman?.id,
    dismissed_batsman_name: dismissedBatsman?.name,
    fielder_id: fielder?.id,
    fielder_name: fielder?.name,
    is_four: isFour,
    is_six: isSix,
    is_dot: isDot,
    is_free_hit: matchState.is_free_hit,
    is_powerplay: currentOver <= matchSettings.powerplayOvers,
    wagon_wheel_zone: wagonWheelZone,
    shot_type: shotType,
    commentary: generateCommentary(ballData)
  });
  
  // 2. Update InningsScore
  const newTotalRuns = inningsScore.total_runs + runs + extras;
  const newTotalWickets = inningsScore.total_wickets + (isWicket ? 1 : 0);
  
  // Calculate overs (only legal deliveries count)
  const isLegal = extraType !== 'wide' && extraType !== 'no_ball';
  const newBallCount = isLegal ? currentBall + 1 : currentBall;
  const newOverNumber = newBallCount >= 6 ? currentOver + 1 : currentOver;
  const newBallNumber = newBallCount >= 6 ? 1 : newBallCount;
  const totalOvers = `${newOverNumber - 1}.${newBallNumber - 1}`;
  
  await api.entities.InningsScore.update(inningsScore.id, {
    total_runs: newTotalRuns,
    total_wickets: newTotalWickets,
    total_overs: totalOvers,
    extras_wide: inningsScore.extras_wide + (extraType === 'wide' ? extras : 0),
    extras_no_ball: inningsScore.extras_no_ball + (extraType === 'no_ball' ? extras : 0),
    extras_bye: inningsScore.extras_bye + (extraType === 'bye' ? extras : 0),
    extras_leg_bye: inningsScore.extras_leg_bye + (extraType === 'leg_bye' ? extras : 0),
    run_rate: calculateRunRate(newTotalRuns, totalOvers)
  });
  
  // 3. Update MatchState
  const updates = {
    over_number: newOverNumber,
    ball_number: newBallNumber,
    is_free_hit: extraType === 'no_ball' // Next ball is free hit
  };
  
  // Rotate strike if runs are odd (except for wicket)
  if (!isWicket && (runs % 2 === 1)) {
    updates.striker = nonStriker.name;
    updates.non_striker = striker.name;
  }
  
  await api.entities.MatchState.update(matchState.id, updates);
  
  // 4. Check for innings completion
  const maxOvers = matchSettings.oversPerInnings;
  const maxWickets = matchSettings.maxWickets;
  
  if (newOverNumber > maxOvers || newTotalWickets >= maxWickets) {
    await completeInnings();
  }
  
  // 5. Check for over completion
  if (newBallNumber === 1 && newOverNumber > currentOver) {
    await completeOver();
  }
  
  return ball;
}
```

**Complete Over**:
```javascript
async function completeOver() {
  // Switch strike (batsmen swap ends)
  await api.entities.MatchState.update(matchState.id, {
    striker: nonStriker.name,
    non_striker: striker.name,
    bowler: null // Bowler needs to be selected for next over
  });
  
  // Prompt user to select new bowler
  // (Bowler cannot bowl consecutive overs)
}
```

**Complete Innings**:
```javascript
async function completeInnings() {
  // 1. Mark innings as completed
  await api.entities.InningsScore.update(inningsScore.id, {
    is_completed: true
  });
  
  // 2. Sync player statistics
  await syncPlayerStats(match_id, innings);
  
  // 3. Check if match is finished
  if (currentInnings === 2) {
    await completeMatch();
  } else {
    // Start 2nd innings
    await startSecondInnings();
  }
}
```

**Start Second Innings**:
```javascript
async function startSecondInnings() {
  // Get 1st innings total
  const firstInnings = await api.entities.InningsScore.filter({
    match_id,
    innings: 1
  });
  
  const target = firstInnings[0].total_runs + 1;
  
  // Create 2nd innings score
  await api.entities.InningsScore.create({
    match_id,
    innings: 2,
    batting_team_id: firstInnings[0].bowling_team_id,
    batting_team_name: firstInnings[0].bowling_team_name,
    bowling_team_id: firstInnings[0].batting_team_id,
    bowling_team_name: firstInnings[0].batting_team_name,
    total_runs: 0,
    total_wickets: 0,
    total_overs: '0.0',
    target: target,
    is_completed: false
  });
  
  // Update match state
  await api.entities.MatchState.update(matchState.id, {
    innings: 2,
    striker: null,
    non_striker: null,
    bowler: null
  });
  
  // Prompt to select opening batsmen and bowler for 2nd innings
}
```

**Complete Match**:
```javascript
async function completeMatch() {
  const firstInnings = await api.entities.InningsScore.filter({ match_id, innings: 1 });
  const secondInnings = await api.entities.InningsScore.filter({ match_id, innings: 2 });
  
  const team1Score = firstInnings[0];
  const team2Score = secondInnings[0];
  
  // Determine winner
  let winnerId, winnerName, resultSummary;
  
  if (team2Score.total_runs > team1Score.total_runs) {
    winnerId = team2Score.batting_team_id;
    winnerName = team2Score.batting_team_name;
    const wicketsRemaining = matchSettings.maxWickets - team2Score.total_wickets;
    resultSummary = `${winnerName} won by ${wicketsRemaining} wickets`;
  } else if (team1Score.total_runs > team2Score.total_runs) {
    winnerId = team1Score.batting_team_id;
    winnerName = team1Score.batting_team_name;
    const runsDifference = team1Score.total_runs - team2Score.total_runs;
    resultSummary = `${winnerName} won by ${runsDifference} runs`;
  } else {
    resultSummary = 'Match Tied';
  }
  
  // Update TournamentMatch
  await api.entities.TournamentMatch.update(matchId, {
    status: 'completed',
    team1_score: `${team1Score.total_runs}/${team1Score.total_wickets}`,
    team1_overs: team1Score.total_overs,
    team2_score: `${team2Score.total_runs}/${team2Score.total_wickets}`,
    team2_overs: team2Score.total_overs,
    winner_id: winnerId,
    winner_name: winnerName,
    result_summary: resultSummary
  });
  
  // Update tournament standings
  await updateTournamentStandings(tournament_id, winnerId, loserId);
  
  // Sync final stats
  await syncPlayerStats(match_id, 1);
  await syncPlayerStats(match_id, 2);
  
  // Show match summary screen
}
```

### Player Statistics Sync
**Component**: `components/scoring/SyncPlayerStats.js`

```javascript
async function syncPlayerStats(matchId, innings) {
  // Get all balls from the innings
  const balls = await api.entities.BallByBall.filter({ match_id: matchId, innings });
  
  // Group by batsman
  const batsmanStats = {};
  const bowlerStats = {};
  const fielderStats = {};
  
  balls.forEach(ball => {
    // Batting stats
    if (!batsmanStats[ball.batsman_id]) {
      batsmanStats[ball.batsman_id] = {
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        dots: 0
      };
    }
    
    batsmanStats[ball.batsman_id].runs += ball.runs;
    if (ball.extra_type !== 'wide' && ball.extra_type !== 'no_ball') {
      batsmanStats[ball.batsman_id].balls++;
    }
    if (ball.is_four) batsmanStats[ball.batsman_id].fours++;
    if (ball.is_six) batsmanStats[ball.batsman_id].sixes++;
    if (ball.is_dot) batsmanStats[ball.batsman_id].dots++;
    
    // Bowling stats
    if (!bowlerStats[ball.bowler_id]) {
      bowlerStats[ball.bowler_id] = {
        overs: 0,
        runs: 0,
        wickets: 0,
        maidens: 0,
        dots: 0
      };
    }
    
    bowlerStats[ball.bowler_id].runs += ball.runs + ball.extras;
    if (ball.extra_type !== 'wide' && ball.extra_type !== 'no_ball') {
      bowlerStats[ball.bowler_id].overs += 1/6;
    }
    if (ball.is_wicket && !['run_out', 'retired_hurt'].includes(ball.wicket_type)) {
      bowlerStats[ball.bowler_id].wickets++;
    }
    if (ball.is_dot) bowlerStats[ball.bowler_id].dots++;
    
    // Fielding stats
    if (ball.is_wicket && ball.fielder_id) {
      if (!fielderStats[ball.fielder_id]) {
        fielderStats[ball.fielder_id] = { catches: 0, stumpings: 0, run_outs: 0 };
      }
      
      if (ball.wicket_type === 'caught' || ball.wicket_type === 'caught_behind' || ball.wicket_type === 'caught_and_bowled') {
        fielderStats[ball.fielder_id].catches++;
      } else if (ball.wicket_type === 'stumped') {
        fielderStats[ball.fielder_id].stumpings++;
      } else if (ball.wicket_type === 'run_out') {
        fielderStats[ball.fielder_id].run_outs++;
      }
    }
  });
  
  // Update TournamentPlayer stats
  for (const [playerId, stats] of Object.entries(batsmanStats)) {
    const player = await api.entities.TournamentPlayer.filter({ player_id: playerId, tournament_id });
    
    await api.entities.TournamentPlayer.update(player[0].id, {
      matches_played: player[0].matches_played + 1,
      runs_scored: player[0].runs_scored + stats.runs,
      balls_faced: player[0].balls_faced + stats.balls,
      highest_score: Math.max(player[0].highest_score, stats.runs),
      fours: player[0].fours + stats.fours,
      sixes: player[0].sixes + stats.sixes,
      fifties: player[0].fifties + (stats.runs >= 50 && stats.runs < 100 ? 1 : 0),
      hundreds: player[0].hundreds + (stats.runs >= 100 ? 1 : 0),
      batting_avg: calculateAverage(player[0].runs_scored + stats.runs, player[0].matches_played + 1 - player[0].not_outs),
      strike_rate: calculateStrikeRate(player[0].runs_scored + stats.runs, player[0].balls_faced + stats.balls)
    });
  }
  
  // Similarly update bowling and fielding stats...
}
```

### Live Overlay
**File**: `pages/LiveOverlay.js`
**Purpose**: OBS/streaming overlay showing live scores

**Data Flow**:
1. Get match ID from URL: `/live-overlay?match_id=123`
2. Poll for updates every 2 seconds:
```javascript
useEffect(() => {
  const interval = setInterval(async () => {
    const match = await api.entities.TournamentMatch.get(matchId);
    const inningsScore = await api.entities.InningsScore.filter({ 
      match_id: matchId, 
      is_completed: false 
    });
    const matchState = await api.entities.MatchState.filter({ match_id: matchId });
    const lastBalls = await api.entities.BallByBall.filter({ match_id: matchId }, '-id', 6);
    
    setLiveData({ match, inningsScore, matchState, lastBalls });
  }, 2000);
  
  return () => clearInterval(interval);
}, [matchId]);
```

**Display**:
- Team scores
- Current batsmen and their scores
- Current bowler and figures
- Last 6 balls
- Run rate, required rate
- Custom sponsor logos

**Customization**:
- Theme colors from `CLUB_CONFIG`
- Layout type: Full | Minimal | Ticker
- Sponsor logo placement

---

## Data Models & Entities

### Core Entities

**User**
```javascript
{
  id: uuid,
  email: string (unique),
  password: string (bcrypt hashed),
  full_name: string,
  role: 'user' | 'admin' | 'treasurer' | 'super_admin',
  email_verified: boolean,
  created_date: timestamp,
  updated_date: timestamp
}
```

**Team**
```javascript
{
  id: uuid,
  name: string,
  short_name: string,
  is_home_team: boolean,
  logo_url: string,
  home_ground: string,
  captain_id: uuid (ref TeamPlayer),
  captain_name: string,
  primary_color: hex,
  secondary_color: hex,
  contact_email: string,
  contact_phone: string,
  status: 'Active' | 'Inactive' | 'Archived',
  created_date: timestamp,
  updated_date: timestamp,
  created_by: string
}
```

**TeamPlayer**
```javascript
{
  id: uuid,
  team_id: uuid (ref Team),
  team_name: string (denormalized),
  player_name: string,
  email: string (unique),
  phone: string,
  photo_url: string,
  date_of_birth: date,
  date_joined: date,
  status: 'Active' | 'Injured' | 'Unavailable' | 'Inactive' | 'Retired',
  jersey_number: number,
  is_captain: boolean,
  is_vice_captain: boolean,
  is_wicket_keeper: boolean,
  role: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper',
  batting_style: 'Right-handed' | 'Left-handed',
  bowling_style: string,
  bio: string,
  emergency_contact_name: string,
  emergency_contact_phone: string,
  medical_notes: string,
  
  // Career statistics (auto-calculated from ball-by-ball data)
  matches_played: number,
  runs_scored: number,
  balls_faced: number,
  highest_score: number,
  not_outs: number,
  fours: number,
  sixes: number,
  fifties: number,
  hundreds: number,
  ducks: number,
  wickets_taken: number,
  overs_bowled: number,
  runs_conceded: number,
  maidens: number,
  best_bowling: string,
  dot_balls: number,
  four_wickets: number,
  five_wickets: number,
  catches: number,
  stumpings: number,
  run_outs: number,
  
  created_date: timestamp,
  updated_date: timestamp,
  created_by: string
}
```

### Tournament Entities

**Season**
```javascript
{
  id: uuid,
  name: string, // "2024-2025"
  start_date: date,
  end_date: date,
  status: 'Upcoming' | 'Active' | 'Completed',
  is_current: boolean
}
```

**Competition**
```javascript
{
  id: uuid,
  name: string,
  short_name: string,
  parent_id: uuid (ref Competition, nullable),
  parent_name: string,
  description: string,
  format: 'T20' | 'T10' | 'ODI' | 'Indoor' | 'Other',
  status: 'Active' | 'Completed' | 'Upcoming',
  logo_url: string,
  website_url: string,
  organizer: string,
  notes: string
}
```

**Tournament**
```javascript
{
  id: uuid,
  name: string, // Auto: "Competition - SubCompetition - Season"
  short_name: string,
  season_id: uuid (ref Season),
  season_name: string,
  competition_id: uuid (ref Competition),
  competition_name: string,
  sub_competition_id: uuid,
  sub_competition_name: string,
  format: 'knockout' | 'league' | 'group_knockout' | 'super_league',
  status: 'draft' | 'registration' | 'ongoing' | 'completed' | 'cancelled',
  start_date: date,
  end_date: date,
  overs_per_match: number,
  balls_per_over: number,
  max_teams: number,
  num_groups: number,
  teams_qualify_per_group: number,
  banner_url: string,
  logo_url: string,
  description: string,
  rules: string,
  prize_money: string,
  entry_fee: number,
  organizer_name: string,
  organizer_contact: string,
  match_profile_id: uuid,
  match_profile_name: string,
  current_stage: 'group' | 'knockout' | 'quarterfinal' | 'semifinal' | 'final' | 'completed',
  is_public: boolean
}
```

**TournamentTeam**
```javascript
{
  id: uuid,
  tournament_id: uuid (ref Tournament),
  team_id: uuid (ref Team),
  team_name: string,
  short_name: string,
  group: string, // 'A', 'B', 'C', 'D'
  seed: number,
  registration_status: 'pending' | 'approved' | 'rejected',
  
  // Standings (auto-updated after each match)
  matches_played: number,
  matches_won: number,
  matches_lost: number,
  matches_tied: number,
  matches_nr: number,
  points: number,
  runs_scored: number,
  runs_conceded: number,
  overs_faced: number,
  overs_bowled: number,
  nrr: number, // Net Run Rate
  is_eliminated: boolean,
  final_position: number
}
```

**TournamentMatch**
```javascript
{
  id: uuid,
  tournament_id: uuid (ref Tournament),
  match_id: uuid (ref Match entity for scoring),
  match_number: number,
  stage: 'group' | 'quarterfinal' | 'semifinal' | 'third_place' | 'final' | 'league',
  group: string,
  round: number,
  team1_id: uuid,
  team1_name: string,
  team2_id: uuid,
  team2_name: string,
  match_date: datetime,
  venue: string,
  status: 'scheduled' | 'live' | 'completed' | 'cancelled' | 'postponed',
  toss_winner: string,
  toss_decision: 'bat' | 'bowl',
  team1_score: string, // "165/7"
  team1_overs: string, // "20.0"
  team2_score: string,
  team2_overs: string,
  winner_id: uuid,
  winner_name: string,
  result_summary: string, // "Team A won by 25 runs"
  man_of_match: string,
  mom_performance: string,
  is_super_over: boolean,
  bracket_position: number, // For knockout bracket
  next_match_id: uuid // Winner advances to this match
}
```

**TournamentPlayer**
```javascript
{
  id: uuid,
  tournament_id: uuid (ref Tournament),
  tournament_team_id: uuid (ref TournamentTeam),
  player_id: uuid (ref TeamPlayer, nullable for opposition),
  player_name: string,
  team_name: string,
  
  // Tournament-specific statistics
  matches_played: number,
  runs_scored: number,
  balls_faced: number,
  highest_score: number,
  fifties: number,
  hundreds: number,
  fours: number,
  sixes: number,
  not_outs: number,
  batting_avg: number,
  strike_rate: number,
  wickets_taken: number,
  overs_bowled: number,
  runs_conceded: number,
  best_bowling: string,
  economy: number,
  bowling_avg: number,
  catches: number,
  stumpings: number,
  run_outs: number,
  mom_awards: number
}
```

### Scoring Entities

**MatchState**
```javascript
{
  id: uuid,
  match_id: uuid,
  innings: 1 | 2,
  striker: string,
  non_striker: string,
  bowler: string,
  toss_winner: 'home' | 'away',
  toss_decision: 'bat' | 'bowl',
  batting_first: 'home' | 'away',
  is_free_hit: boolean,
  match_settings: json string
}
```

**InningsScore**
```javascript
{
  id: uuid,
  match_id: uuid,
  innings: 1 | 2,
  batting_team_id: uuid,
  batting_team_name: string,
  bowling_team_id: uuid,
  bowling_team_name: string,
  total_runs: number,
  total_wickets: number,
  total_overs: string, // "15.3"
  extras_wide: number,
  extras_no_ball: number,
  extras_bye: number,
  extras_leg_bye: number,
  extras_penalty: number,
  run_rate: number,
  required_run_rate: number,
  target: number, // For 2nd innings
  powerplay_runs: number,
  powerplay_wickets: number,
  is_completed: boolean,
  fall_of_wickets: json string
}
```

**BallByBall**
```javascript
{
  id: uuid,
  match_id: uuid,
  innings: 1 | 2,
  over_number: number,
  ball_number: number,
  batsman_id: uuid,
  batsman_name: string,
  non_striker_id: uuid,
  non_striker_name: string,
  bowler_id: uuid,
  bowler_name: string,
  runs: number, // Runs off bat
  extras: number, // Extra runs
  extra_type: '' | 'wide' | 'no_ball' | 'bye' | 'leg_bye' | 'penalty',
  is_wicket: boolean,
  wicket_type: '' | 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket' | etc.,
  dismissed_batsman_id: uuid,
  dismissed_batsman_name: string,
  fielder_id: uuid,
  fielder_name: string,
  is_four: boolean,
  is_six: boolean,
  is_dot: boolean,
  is_free_hit: boolean,
  is_powerplay: boolean,
  wagon_wheel_zone: number, // 1-8
  shot_type: '' | 'drive' | 'cut' | 'pull' | 'hook' | 'sweep' | etc.,
  commentary: string,
  created_date: timestamp
}
```

### Finance Entities

**FinanceCategory**
```javascript
{
  id: uuid,
  name: string,
  type: 'Income' | 'Expense',
  description: string,
  is_active: boolean,
  display_order: number
}
```

**Transaction**
```javascript
{
  id: uuid,
  category_id: uuid (ref FinanceCategory),
  category_name: string,
  type: 'Income' | 'Expense',
  amount: number,
  description: string,
  date: date,
  reference: string, // Invoice/receipt number
  paid_to: string, // For expenses
  received_from: string, // For income
  payment_method: 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque' | 'Online',
  status: 'Pending' | 'Completed' | 'Cancelled',
  receipt_url: string,
  notes: string,
  created_date: timestamp,
  created_by: string
}
```

**PlayerCharge**
```javascript
{
  id: uuid,
  player_id: uuid (ref TeamPlayer),
  charge_type: 'match_fee' | 'membership' | 'event' | 'fine' | 'equipment' | 'training' | 'other',
  amount: number,
  description: string,
  charge_date: date,
  due_date: date,
  reference_type: 'TournamentMatch' | 'Membership' | 'Event' | 'Other',
  reference_id: uuid,
  notes: string,
  voided: boolean,
  voided_reason: string,
  created_date: timestamp,
  created_by: string
}
```

**PlayerPayment**
```javascript
{
  id: uuid,
  player_id: uuid (ref TeamPlayer),
  amount: number,
  payment_date: date,
  payment_method: 'Cash' | 'Bank Transfer' | 'Card' | 'Online' | 'Cheque',
  reference: string, // Bank ref or receipt number
  recorded_by: string,
  verified: boolean,
  verified_by: string,
  verified_date: date,
  notes: string,
  created_date: timestamp
}
```

**PaymentAllocation**
```javascript
{
  id: uuid,
  payment_id: uuid (ref PlayerPayment),
  charge_id: uuid (ref PlayerCharge),
  amount: number, // Amount allocated from payment to charge
  allocation_date: date,
  allocated_by: string,
  notes: string
}
```

**Membership**
```javascript
{
  id: uuid,
  player_id: uuid (ref TeamPlayer),
  member_name: string,
  email: string,
  phone: string,
  membership_type: 'Junior' | 'Adult' | 'Family' | 'Senior' | 'Life' | 'Corporate' | 'Social',
  status: 'Active' | 'Expired' | 'Pending' | 'Cancelled' | 'Suspended',
  season: string,
  start_date: date,
  expiry_date: date,
  fee_amount: number,
  notes: string,
  created_date: timestamp
}
```

**Sponsor**
```javascript
{
  id: uuid,
  name: string,
  contact_person: string,
  contact_email: string,
  contact_phone: string,
  sponsor_type: 'Title' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Kit' | 'Match',
  annual_value: number,
  contract_start_date: date,
  contract_end_date: date,
  logo_url: string,
  website_url: string,
  benefits: string,
  status: 'Active' | 'Expired' | 'Pending'
}
```

**SponsorPayment**
```javascript
{
  id: uuid,
  sponsor_id: uuid (ref Sponsor),
  amount: number,
  payment_date: date,
  period: string, // "2024-2025 Season"
  payment_method: string,
  reference: string,
  notes: string
}
```

### Content Entities

**News**
```javascript
{
  id: uuid,
  title: string,
  content: string (rich text/markdown),
  excerpt: string,
  image_url: string,
  category: 'Match Report' | 'Club News' | 'Player News' | 'Announcement' | 'Event',
  is_featured: boolean,
  created_date: timestamp,
  created_by: string
}
```

**Event**
```javascript
{
  id: uuid,
  title: string,
  description: string,
  event_date: datetime,
  location: string,
  max_attendees: number,
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled',
  banner_url: string,
  entry_fee: number,
  created_date: timestamp,
  created_by: string
}
```

**EventRSVP**
```javascript
{
  id: uuid,
  event_id: uuid (ref Event),
  player_id: uuid (ref TeamPlayer),
  player_email: string,
  status: 'attending' | 'not_attending' | 'maybe',
  notes: string,
  created_date: timestamp
}
```

**GalleryImage**
```javascript
{
  id: uuid,
  image_url: string,
  title: string,
  description: string,
  category: 'Match' | 'Training' | 'Event' | 'Team',
  created_date: timestamp,
  created_by: string
}
```

**ContactMessage**
```javascript
{
  id: uuid,
  name: string,
  email: string,
  subject: string,
  message: string,
  status: 'unread' | 'read' | 'replied',
  created_date: timestamp
}
```

### Notification Entities

**Notification**
```javascript
{
  id: uuid,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error',
  priority: 'low' | 'medium' | 'high',
  action_url: string,
  created_date: timestamp,
  created_by: string
}
```

**UserNotification**
```javascript
{
  id: uuid,
  notification_id: uuid (ref Notification),
  user_email: string,
  read: boolean,
  read_date: timestamp
}
```

### Match Availability

**MatchAvailability**
```javascript
{
  id: uuid,
  match_id: uuid (ref TournamentMatch),
  match_info: string, // "Team A vs Team B - 28 Nov"
  player_id: uuid (ref TeamPlayer),
  player_email: string,
  player_name: string,
  status: 'Available' | 'Not Available' | 'Maybe' | 'Injured',
  notes: string,
  created_date: timestamp
}
```

---

## API Layer

### Base URL
- Local: `http://localhost:5000/api`

### Authentication Endpoints

**POST /api/auth/register**
- Body: `{ email, password, full_name }`
- Returns: `{ user, message }`

**POST /api/auth/login**
- Body: `{ email, password }`
- Returns: `{ access_token, user: { id, email, full_name, role } }`

**POST /api/auth/verify-email**
- Body: `{ email }`
- Returns: `{ success: true }`

**POST /api/auth/reset-password**
- Body: `{ email, password }`
- Returns: `{ message }`

**GET /api/auth/me**
- Headers: `Authorization: Bearer <token>`
- Returns: User object

**GET /api/auth/check**
- Headers: `Authorization: Bearer <token>`
- Returns: `{ authenticated: true }`

**PUT /api/auth/me**
- Headers: `Authorization: Bearer <token>`
- Body: `{ full_name, ... }` (cannot update email, role, or id)
- Returns: Updated user

**POST /api/auth/logout**
- Returns: `{ success: true }`

### Entity CRUD Endpoints

**Pattern**: `/api/entities/:entityName`

**GET /api/entities/:entityName**
- Query params: `sort` (field name, prefix with `-` for descending), `limit`
- Example: `/api/entities/TeamPlayer?sort=-created_date&limit=20`
- Returns: Array of records

**POST /api/entities/:entityName/filter**
- Body: `{ query: { field: value, ... }, sort: 'field' | '-field', limit: number }`
- Example: `{ query: { status: 'Active', team_id: '123' }, sort: '-created_date', limit: 50 }`
- Returns: Array of filtered records

**GET /api/entities/:entityName/:id**
- Returns: Single record

**POST /api/entities/:entityName**
- Body: Record data
- Returns: Created record

**POST /api/entities/:entityName/bulk**
- Body: Array of records
- Returns: Array of created records

**PUT /api/entities/:entityName/:id**
- Body: Updated fields
- Returns: Updated record

**DELETE /api/entities/:entityName/:id**
- Returns: `{ message: 'Deleted' }`

**GET /api/entities/:entityName/schema**
- Returns: JSON schema for the entity

### Integration Endpoints

**POST /api/integrations/llm**
- Body: `{ prompt, add_context_from_internet, response_json_schema, file_urls }`
- Returns: String or JSON object

**POST /api/integrations/send-email**
- Body: `{ to, subject, body, from_name }`
- Returns: `{ success: true }`

**POST /api/integrations/upload**
- Body: FormData with `file`
- Returns: `{ file_url }`

**POST /api/integrations/upload-private**
- Body: FormData with `file`
- Returns: `{ file_uri }`

**POST /api/integrations/signed-url**
- Body: `{ file_uri, expires_in }`
- Returns: `{ signed_url }`

**POST /api/integrations/generate-image**
- Body: `{ prompt }`
- Returns: `{ url }`

**POST /api/integrations/extract-data**
- Body: `{ file_url, json_schema }`
- Returns: `{ status, output, details }`

---

## Business Logic & Rules

### Authentication & Authorization

**Password Requirements**:
- Minimum 6 characters

**JWT Token**:
- Expires: 7 days
- Contains: `{ id, email, role }`
- Stored: localStorage as 'access_token'

**Role-Based Access**:
```javascript
// From components/RoleAccess.js

Permissions:
- view_finance: ['admin', 'treasurer', 'super_admin']
- manage_players: ['admin', 'super_admin']
- manage_teams: ['admin', 'super_admin']
- manage_tournaments: ['admin', 'super_admin']
- live_scoring: ['admin', 'super_admin']
- manage_users: ['admin', 'super_admin']
- manage_finance: ['admin', 'treasurer', 'super_admin']
- view_reports: ['admin', 'treasurer', 'super_admin']
- send_notifications: ['admin', 'super_admin']

Note: 'admin' is treated as 'super_admin' in current implementation
```

### Match Scoring Rules

**Standard T20**:
- Overs: 20
- Balls per over: 6
- Max wickets: 10
- Powerplay: First 6 overs
- Fielding restrictions during powerplay

**LMS (Last Man Stands)**:
- Overs: 20
- Balls per over: 6
- Max wickets: 5 (innings ends at 5th wicket)
- Pairing system: Batsmen bat in pairs
- Retired batsmen can return

**Ball Validation**:
- Legal delivery: Not wide, not no-ball
- Only legal deliveries count towards overs
- Wide/No-ball: Extra ball bowled
- No-ball: Next ball is free hit (cannot be out except run-out)

**Over Completion**:
- 6 legal deliveries complete an over
- Batsmen swap ends
- New bowler must be selected
- Bowler cannot bowl consecutive overs

**Innings Completion**:
- All overs bowled
- All wickets lost (subject to max wickets rule)
- Target achieved (2nd innings)
- Team declares (rare)

**Match Result**:
- Winner by wickets: 2nd batting team wins
  - "Team B won by X wickets"
  - X = maxWickets - wicketsLost
- Winner by runs: 1st batting team wins
  - "Team A won by X runs"
  - X = team1Runs - team2Runs
- Tie: Both teams score equal runs
- No result: Match abandoned

### Tournament Formats

**League/Round-Robin**:
- All teams play each other once (or twice)
- Points: Win = 2, Tie = 1, Loss/NR = 0
- Standings sorted by: Points → NRR → Head-to-head
- Top N teams qualify for playoffs (if applicable)

**Knockout**:
- Single elimination
- Seeded bracket
- Winner advances, loser eliminated
- Stages: Round of 16 → Quarterfinal → Semifinal → Final

**Group + Knockout**:
- Phase 1: Groups with round-robin
- Top N from each group qualify
- Phase 2: Knockout bracket with qualifiers

**Super League**:
- Multiple rounds of league matches
- Top teams advance to championship round
- Bottom teams play relegation round

### Net Run Rate (NRR) Calculation

```javascript
function calculateNRR(teamStats) {
  // For runs rate = total runs scored / total overs faced
  const runsPerOver = teamStats.runs_scored / convertOversToDecimal(teamStats.overs_faced);
  
  // Against runs rate = total runs conceded / total overs bowled
  const concededPerOver = teamStats.runs_conceded / convertOversToDecimal(teamStats.overs_bowled);
  
  // NRR = For rate - Against rate
  return runsPerOver - concededPerOver;
}

function convertOversToDecimal(overs) {
  // "15.3" → 15.5 (15 overs + 3/6 of an over)
  const [wholeOvers, balls] = overs.split('.').map(Number);
  return wholeOvers + (balls / 6);
}
```

### Financial Business Logic

**Match Fee Auto-Generation**:
- Triggered when match is created or players confirm availability
- Creates PlayerCharge for each available player
- Amount from club config or match profile

**Payment Allocation Strategy**:
- Default: FIFO (First In, First Out)
- Oldest unpaid charges are paid first
- Partial payments allocated proportionally
- Excess payment remains unallocated (credit balance)

**Balance Calculation**:
```javascript
function getPlayerBalance(playerId, charges, payments, allocations) {
  // Total charges (excluding voided)
  const totalCharges = charges
    .filter(c => c.player_id === playerId && !c.voided)
    .reduce((sum, c) => sum + c.amount, 0);
  
  // Total payments
  const totalPayments = payments
    .filter(p => p.player_id === playerId)
    .reduce((sum, p) => sum + p.amount, 0);
  
  // Balance = Charges - Payments
  return totalCharges - totalPayments;
}
```

**Membership Fee Handling**:
- Membership approved → Auto-create PlayerCharge
- Charge type: 'membership'
- Reference: Membership record ID
- Due date: Membership start date

### Notification System

**Trigger Events**:
- Match scheduled → Notify all team players
- Match result → Notify all participants
- Payment received → Notify player
- Membership expiring → Notify member (30 days before)
- Event created → Notify all members
- Admin announcement → Notify all users

**Delivery**:
- In-app notification bell
- Email (via SendEmail integration)
- Future: SMS, Push notifications

**Notification Priority**:
- High: Payment issues, urgent announcements
- Medium: Match reminders, event invitations
- Low: General updates, news

### Statistics Auto-Calculation

**When to Update**:
- After each ball (live updates)
- After innings completion (sync)
- After match completion (final sync)

**What Gets Updated**:
- TeamPlayer: Career statistics across all matches
- TournamentPlayer: Tournament-specific statistics
- TournamentTeam: Team standings (points, NRR)

**Calculation Sources**:
- Primary: BallByBall records (authoritative)
- Secondary: InningsScore aggregates (for validation)
- Never: Manual entry (to maintain data integrity)

---

## Error Handling & Logging

### Error Handling
**File**: `components/utils/ErrorHandler.js`

**Error Categories**:
- NETWORK: Connection issues
- AUTH: Authentication failures
- VALIDATION: Input validation errors
- DATABASE: SQL errors, constraint violations
- PERMISSION: Insufficient privileges
- BUSINESS_LOGIC: Rule violations
- UNKNOWN: Uncategorized errors

**Error Logging**:
- All errors logged to session storage
- Includes: timestamp, message, stack trace, context
- Accessible via Admin → Error Logs page

**User-Friendly Messages**:
- Network errors → "Unable to connect. Check your internet."
- Auth errors → "Session expired. Please sign in again."
- Validation errors → Specific field feedback
- Database errors → "Something went wrong. Please try again."

### Audit Logging
**File**: `components/logging/AuditLogger.js`

**Log Types**:
1. **Auth Logs**: Login, logout, role changes
2. **User Activity**: Create, update, delete operations
3. **System Events**: Errors, integrations, file uploads

**Log Storage**: `AuthLog`, `UserActivityLog`, `SystemLog` entities

**Context Captured**:
- User ID and email
- Session ID
- Device info (browser, OS)
- IP address
- Timestamp
- Page URL
- Action details

**Retention**: Configurable, default 90 days

---

## Performance Optimizations

### Data Fetching
- React Query for caching and automatic refetching
- Parallel queries on page load
- Stale-while-revalidate strategy

### Pagination
- Limit queries to reasonable amounts (20-50 records)
- Load more on scroll/pagination
- Virtual scrolling for large lists

### Image Optimization
- Compress before upload
- Use appropriate formats (WebP preferred)
- Lazy loading for gallery images

### Live Scoring
- Debounce rapid updates
- Batch ball-by-ball inserts when possible
- Only sync stats after innings/match completion

---

## Security Considerations

### Input Validation
**File**: `components/security/InputValidator.js`

- Client-side validation for UX
- Server-side validation (critical)
- SQL injection prevention via parameterized queries
- XSS prevention via sanitization

### Data Masking
**File**: `components/security/DataMasking.js`

- Hide sensitive data in logs
- Mask emails (show first 2 chars)
- Mask phone numbers

### Authentication
- JWT tokens with expiration
- Secure password hashing (bcrypt)
- HTTPS for production (optional for local)
- CORS restrictions

### Role-Based Access
- Middleware checks on sensitive routes
- Frontend route guards
- Permission checks before mutations

---

## Deployment & Configuration

### Local Development Setup
**Files**: 
- `components/api/complete-setup-windows.bat`
- `components/api/QUICK_SETUP.md`

**Steps**:
1. Install PostgreSQL
2. Run batch script to:
   - Create database and user
   - Apply schema
   - Import data (optional)
   - Set up backend Express server
   - Configure frontend
   - Build production bundle
3. Start app: `start-app.bat`
4. Access: `http://localhost:5000`

### Configuration
**File**: `components/ClubConfig.js`

**Customizable**:
- Club name, logo, colors
- Social media links
- Contact information
- Financial settings (match fees, membership fees)
- Theme colors and styling
- Page content (hero text, taglines, etc.)

### Environment Variables
**Backend** (`.env`):
```
DB_USER=cricket_admin
DB_PASSWORD=CricketClub2025!
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cricket_club_db
PORT=5000
JWT_SECRET=your_secret_key
NODE_ENV=development
```

**Frontend** (`.env`):
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=Cricket Club Management System
REACT_APP_ENV=development
```

---

## Future Enhancements

### Planned Features
1. Mobile app (React Native)
2. SMS notifications
3. Push notifications (web & mobile)
4. Stripe payment integration
5. Advanced analytics (AI-powered insights)
6. Video highlights integration
7. Social media sharing
8. Multi-language support
9. Offline mode for live scoring
10. Automated report generation

### Scalability Considerations
- Move to cloud database (AWS RDS, Azure SQL)
- CDN for static assets
- Redis caching layer
- WebSocket for real-time updates
- Microservices architecture for large-scale

---

## Support & Maintenance

### Common Issues & Solutions

**Database Connection Failed**:
- Check PostgreSQL service is running
- Verify credentials in `.env`
- Check firewall settings

**Login Not Working**:
- Clear localStorage
- Check JWT_SECRET matches on client/server
- Verify user exists in database

**Stats Not Updating**:
- Run manual sync: `SyncPlayerStats` function
- Check BallByBall records exist
- Verify player IDs match

**Payments Not Allocating**:
- Check charge not voided
- Verify allocation logic
- Ensure payment amount > 0

### Maintenance Tasks

**Daily**:
- Monitor error logs
- Check live scoring matches

**Weekly**:
- Backup database
- Review audit logs
- Clear old notifications

**Monthly**:
- Financial reconciliation
- Membership renewal checks
- Archive completed tournaments

**Seasonal**:
- Season rollover
- Database optimization
- Performance review

---

## Glossary

**LMS**: Last Man Stands - Cricket format with 5 wickets maximum  
**NRR**: Net Run Rate - Tiebreaker metric in tournaments  
**DLS**: Duckworth-Lewis-Stern - Rain-affected match calculation  
**Powerplay**: First 6 overs with fielding restrictions  
**Free Hit**: Ball after no-ball where batsman cannot be out (except run-out)  
**Wagon Wheel**: Shot direction visualization (8 zones)  
**FOW**: Fall of Wickets - Score when each wicket fell  
**MOM**: Man of the Match  
**Strike Rate**: (Runs/Balls) × 100  
**Economy**: Runs conceded per over  
**Average**: Runs/Dismissals

---

## Document Version
- Version: 1.0
- Last Updated: 2025-01-08
- Author: System Documentation
- Coverage: Complete application functionality

---

*End of Low-Level Design Documentation*