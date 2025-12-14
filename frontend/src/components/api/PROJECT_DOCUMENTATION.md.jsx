# Leamington Royals Cricket Club - Complete Project Documentation

## Table of Contents
1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Data Flow Diagrams](#3-data-flow-diagrams)
4. [Sequence Diagrams](#4-sequence-diagrams)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [Frontend Structure](#7-frontend-structure)
8. [Authentication Flow](#8-authentication-flow)
9. [Code Documentation](#9-code-documentation)
10. [Deployment Guide](#10-deployment-guide)

---

## 1. System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Browser   │  │   Mobile    │  │   Tablet    │  │   Desktop   │        │
│  │  (Chrome,   │  │  (Safari,   │  │             │  │   App       │        │
│  │   Firefox)  │  │   Chrome)   │  │             │  │             │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     REACT FRONTEND APPLICATION                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │  Pages: Home, Fixtures, Squad, Finance, Admin, Scoring...   │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │  Components: Cards, Forms, Modals, Charts, Tables...        │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │  State Management: React Query, useState, useEffect         │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │  API Client: apiClient.js (HTTP requests to backend)        │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    │ HTTPS (REST API)
                                    │ Port: 3001
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVER LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     NODE.JS / EXPRESS BACKEND                        │   │
│  │                                                                       │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐            │   │
│  │  │  Auth Routes  │  │ Entity CRUD   │  │ Integrations  │            │   │
│  │  │  /api/auth/*  │  │ /api/entities │  │ /api/integ/*  │            │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘            │   │
│  │                                                                       │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐            │   │
│  │  │  Middleware   │  │  JWT Auth     │  │  CORS         │            │   │
│  │  │  (validate)   │  │  (tokens)     │  │  (security)   │            │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘            │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    │ PostgreSQL Protocol
                                    │ (Supabase SDK)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         SUPABASE                                     │   │
│  │                                                                       │   │
│  │  ┌───────────────────────┐  ┌───────────────────────┐               │   │
│  │  │   PostgreSQL Database │  │    File Storage       │               │   │
│  │  │   - 30+ Tables        │  │    - Images           │               │   │
│  │  │   - Relationships     │  │    - Documents        │               │   │
│  │  │   - Indexes           │  │    - Public/Private   │               │   │
│  │  └───────────────────────┘  └───────────────────────┘               │   │
│  │                                                                       │   │
│  │  ┌───────────────────────┐  ┌───────────────────────┐               │   │
│  │  │   Authentication      │  │    Real-time          │               │   │
│  │  │   (built-in)          │  │    Subscriptions      │               │   │
│  │  └───────────────────────┘  └───────────────────────┘               │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌──────────────┐                               │
│                              │   Layout.js  │                               │
│                              │  (Wrapper)   │                               │
│                              └──────┬───────┘                               │
│                                     │                                       │
│           ┌─────────────────────────┼─────────────────────────┐            │
│           │                         │                         │            │
│           ▼                         ▼                         ▼            │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │   PUBLIC PAGES  │    │  MEMBER PAGES   │    │   ADMIN PAGES   │        │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤        │
│  │ • Home          │    │ • MyProfile     │    │ • Admin         │        │
│  │ • Fixtures      │    │ • Squad         │    │ • Finance       │        │
│  │ • News          │    │ • Events        │    │ • Tournaments   │        │
│  │ • Gallery       │    │ • MatchReport   │    │ • Scoring       │        │
│  │ • Contact       │    │                 │    │ • Teams         │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│           │                         │                         │            │
│           └─────────────────────────┴─────────────────────────┘            │
│                                     │                                       │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         SHARED COMPONENTS                            │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │   UI/       │  │  scoring/   │  │  finance/   │  │  profile/   │ │   │
│  │  │  (shadcn)   │  │             │  │             │  │             │ │   │
│  │  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤ │   │
│  │  │ • Button    │  │ • RunButtons│  │ • Charts    │  │ • StatCard  │ │   │
│  │  │ • Card      │  │ • Scorecard │  │ • Reports   │  │ • Milestones│ │   │
│  │  │ • Dialog    │  │ • WicketDlg │  │ • Payments  │  │ • QuickStats│ │   │
│  │  │ • Input     │  │ • ThisOver  │  │ • Members   │  │ • Form      │ │   │
│  │  │ • Select    │  │ • DLS Calc  │  │ • Invoices  │  │             │ │   │
│  │  │ • Table     │  │             │  │             │  │             │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │ tournament/ │  │   home/     │  │  fixtures/  │  │   teams/    │ │   │
│  │  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤ │   │
│  │  │ • Fixtures  │  │ • Hero      │  │ • MatchCard │  │ • TeamCard  │ │   │
│  │  │ • Teams     │  │ • News      │  │ • ResultCard│  │ • PlayerCard│ │   │
│  │  │ • Bracket   │  │ • Matches   │  │ • Filters   │  │ • TeamForm  │ │   │
│  │  │ • Settings  │  │ • Sponsors  │  │ • Modal     │  │ • Stats     │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         SERVICES / UTILITIES                         │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  • apiClient.js      - HTTP client for backend API                   │   │
│  │  • ClubConfig.js     - Theme, colors, branding configuration         │   │
│  │  • RoleAccess.js     - Permission checking utilities                 │   │
│  │  • AuditLogger.js    - Activity logging for security                 │   │
│  │  • utils.js          - Helper functions (createPageUrl, etc.)        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI component library |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 3.x | Utility-first CSS framework |
| shadcn/ui | Latest | Pre-built UI components |
| React Query | 5.x | Server state management |
| React Router | 6.x | Client-side routing |
| Framer Motion | 10.x | Animations |
| Recharts | 2.x | Data visualization |
| Lucide React | Latest | Icon library |
| date-fns | 2.x | Date manipulation |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | JavaScript runtime |
| Express | 4.x | Web framework |
| Supabase JS | 2.x | Database client |
| JWT | 9.x | Authentication tokens |
| Multer | 1.x | File upload handling |
| UUID | 9.x | Unique ID generation |
| CORS | 2.x | Cross-origin security |
| dotenv | 16.x | Environment variables |

### Database

| Technology | Purpose |
|------------|---------|
| PostgreSQL (via Supabase) | Primary database |
| Supabase Storage | File storage (images, documents) |
| Supabase Auth | Authentication (optional) |

---

## 3. Data Flow Diagrams

### User Authentication Flow

```
┌─────────┐          ┌──────────┐          ┌─────────┐          ┌──────────┐
│  User   │          │ Frontend │          │ Backend │          │ Database │
└────┬────┘          └────┬─────┘          └────┬────┘          └────┬─────┘
     │                    │                     │                     │
     │  1. Enter email    │                     │                     │
     │───────────────────>│                     │                     │
     │                    │                     │                     │
     │                    │  2. POST /auth/login│                     │
     │                    │────────────────────>│                     │
     │                    │                     │                     │
     │                    │                     │  3. Query user      │
     │                    │                     │────────────────────>│
     │                    │                     │                     │
     │                    │                     │  4. Return user data│
     │                    │                     │<────────────────────│
     │                    │                     │                     │
     │                    │                     │  5. Generate JWT    │
     │                    │                     │  (sign with secret) │
     │                    │                     │                     │
     │                    │  6. Return token    │                     │
     │                    │<────────────────────│                     │
     │                    │                     │                     │
     │                    │  7. Store token     │                     │
     │                    │  (localStorage)     │                     │
     │                    │                     │                     │
     │  8. Redirect to    │                     │                     │
     │     dashboard      │                     │                     │
     │<───────────────────│                     │                     │
     │                    │                     │                     │
```

### Data Fetch Flow (e.g., Loading Matches)

```
┌─────────┐          ┌──────────┐          ┌─────────┐          ┌──────────┐
│  User   │          │ Frontend │          │ Backend │          │ Database │
└────┬────┘          └────┬─────┘          └────┬────┘          └────┬─────┘
     │                    │                     │                     │
     │  1. Open Fixtures  │                     │                     │
     │───────────────────>│                     │                     │
     │                    │                     │                     │
     │                    │  2. useQuery hook   │                     │
     │                    │  triggers fetch     │                     │
     │                    │                     │                     │
     │                    │  3. GET /entities/  │                     │
     │                    │  TournamentMatch    │                     │
     │                    │  + Auth header      │                     │
     │                    │────────────────────>│                     │
     │                    │                     │                     │
     │                    │                     │  4. Verify JWT      │
     │                    │                     │                     │
     │                    │                     │  5. SELECT * FROM   │
     │                    │                     │  tournament_matches │
     │                    │                     │────────────────────>│
     │                    │                     │                     │
     │                    │                     │  6. Return rows     │
     │                    │                     │<────────────────────│
     │                    │                     │                     │
     │                    │  7. Return JSON     │                     │
     │                    │<────────────────────│                     │
     │                    │                     │                     │
     │                    │  8. Update React    │                     │
     │                    │  Query cache        │                     │
     │                    │                     │                     │
     │  9. Render matches │                     │                     │
     │<───────────────────│                     │                     │
     │                    │                     │                     │
```

### Live Scoring Flow

```
┌─────────┐          ┌──────────┐          ┌─────────┐          ┌──────────┐
│ Scorer  │          │ Frontend │          │ Backend │          │ Database │
└────┬────┘          └────┬─────┘          └────┬────┘          └────┬─────┘
     │                    │                     │                     │
     │  1. Click "4 runs" │                     │                     │
     │───────────────────>│                     │                     │
     │                    │                     │                     │
     │                    │  2. Update local    │                     │
     │                    │  state immediately  │                     │
     │                    │                     │                     │
     │  3. See UI update  │                     │                     │
     │<───────────────────│                     │                     │
     │                    │                     │                     │
     │                    │  4. POST /entities/ │                     │
     │                    │  BallByBall         │                     │
     │                    │  {runs: 4, is_four} │                     │
     │                    │────────────────────>│                     │
     │                    │                     │                     │
     │                    │                     │  5. INSERT INTO     │
     │                    │                     │  ball_by_ball       │
     │                    │                     │────────────────────>│
     │                    │                     │                     │
     │                    │                     │  6. Confirm insert  │
     │                    │                     │<────────────────────│
     │                    │                     │                     │
     │                    │  7. Return success  │                     │
     │                    │<────────────────────│                     │
     │                    │                     │                     │
     │                    │  8. Invalidate      │                     │
     │                    │  match queries      │                     │
     │                    │                     │                     │
```

---

## 4. Sequence Diagrams

### Create Tournament Sequence

```
┌────────┐     ┌─────────────────┐     ┌──────────────┐     ┌────────────┐     ┌──────────┐
│ Admin  │     │ TournamentCreate│     │   apiClient  │     │  Backend   │     │ Database │
└───┬────┘     └───────┬─────────┘     └──────┬───────┘     └─────┬──────┘     └────┬─────┘
    │                  │                      │                   │                  │
    │ Fill form        │                      │                   │                  │
    │─────────────────>│                      │                   │                  │
    │                  │                      │                   │                  │
    │                  │ Validate fields      │                   │                  │
    │                  │──────────────────────│                   │                  │
    │                  │                      │                   │                  │
    │ Click Submit     │                      │                   │                  │
    │─────────────────>│                      │                   │                  │
    │                  │                      │                   │                  │
    │                  │ api.entities         │                   │                  │
    │                  │ .Tournament.create() │                   │                  │
    │                  │─────────────────────>│                   │                  │
    │                  │                      │                   │                  │
    │                  │                      │ POST /entities/   │                  │
    │                  │                      │ Tournament        │                  │
    │                  │                      │──────────────────>│                  │
    │                  │                      │                   │                  │
    │                  │                      │                   │ INSERT INTO      │
    │                  │                      │                   │ tournaments      │
    │                  │                      │                   │─────────────────>│
    │                  │                      │                   │                  │
    │                  │                      │                   │ Return new row   │
    │                  │                      │                   │<─────────────────│
    │                  │                      │                   │                  │
    │                  │                      │ 201 Created       │                  │
    │                  │                      │<──────────────────│                  │
    │                  │                      │                   │                  │
    │                  │ Invalidate queries   │                   │                  │
    │                  │<─────────────────────│                   │                  │
    │                  │                      │                   │                  │
    │                  │ Navigate to          │                   │                  │
    │                  │ TournamentView       │                   │                  │
    │                  │──────────────────────│                   │                  │
    │                  │                      │                   │                  │
    │ See new          │                      │                   │                  │
    │ tournament       │                      │                   │                  │
    │<─────────────────│                      │                   │                  │
    │                  │                      │                   │                  │
```

### File Upload Sequence

```
┌────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌─────────────┐
│  User  │     │  Form    │     │   apiClient  │     │  Backend │     │  Supabase   │
│        │     │ Component│     │              │     │          │     │  Storage    │
└───┬────┘     └────┬─────┘     └──────┬───────┘     └────┬─────┘     └──────┬──────┘
    │               │                  │                  │                  │
    │ Select file   │                  │                  │                  │
    │──────────────>│                  │                  │                  │
    │               │                  │                  │                  │
    │               │ Create FormData  │                  │                  │
    │               │─────────────────>│                  │                  │
    │               │                  │                  │                  │
    │               │                  │ POST /upload     │                  │
    │               │                  │ (multipart)      │                  │
    │               │                  │─────────────────>│                  │
    │               │                  │                  │                  │
    │               │                  │                  │ storage.upload() │
    │               │                  │                  │─────────────────>│
    │               │                  │                  │                  │
    │               │                  │                  │ Return URL       │
    │               │                  │                  │<─────────────────│
    │               │                  │                  │                  │
    │               │                  │ {file_url: ...}  │                  │
    │               │                  │<─────────────────│                  │
    │               │                  │                  │                  │
    │               │ Update form with │                  │                  │
    │               │ image URL        │                  │                  │
    │               │<─────────────────│                  │                  │
    │               │                  │                  │                  │
    │ See preview   │                  │                  │                  │
    │<──────────────│                  │                  │                  │
    │               │                  │                  │                  │
```

---

## 5. Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ENTITY RELATIONSHIPS                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    Season    │         │  Competition │         │ MatchProfile │
├──────────────┤         ├──────────────┤         ├──────────────┤
│ id           │         │ id           │         │ id           │
│ name         │         │ name         │         │ name         │
│ start_date   │         │ parent_id ───┼────┐    │ overs        │
│ end_date     │         │ is_active    │    │    │ balls_per_ov │
│ is_current   │         └──────┬───────┘    │    └──────┬───────┘
└──────┬───────┘                │            │           │
       │                        │            │           │
       │         ┌──────────────┘            │           │
       │         │                           │           │
       ▼         ▼                           │           │
┌──────────────────────────────┐             │           │
│         Tournament           │◄────────────┘           │
├──────────────────────────────┤                         │
│ id                           │                         │
│ name                         │                         │
│ season_id ──────────────────>│                         │
│ competition_id ─────────────>│                         │
│ sub_competition_id           │                         │
│ match_profile_id ────────────┼─────────────────────────┘
│ format (knockout/league)     │
│ status                       │
│ overs_per_match              │
└──────────────┬───────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌──────────────┐  ┌──────────────────────┐
│TournamentTeam│  │   TournamentMatch    │
├──────────────┤  ├──────────────────────┤
│ id           │  │ id                   │
│ tournament_id│  │ tournament_id        │
│ team_name    │  │ team1_id             │
│ group        │  │ team2_id             │
│ points       │  │ match_date           │
│ nrr          │  │ venue                │
└──────┬───────┘  │ status               │
       │          │ team1_score          │
       │          │ team2_score          │
       │          │ winner_id            │
       │          └──────────┬───────────┘
       │                     │
       ▼                     │
┌──────────────────┐         │
│ TournamentPlayer │         │
├──────────────────┤         │
│ id               │         │
│ tournament_id    │         │
│ tournament_team  │         │
│ player_id ───────┼─────────┼──────────┐
│ player_name      │         │          │
│ runs_scored      │         │          │
│ wickets_taken    │         │          │
└──────────────────┘         │          │
                             │          │
                             ▼          │
                      ┌──────────────┐  │
                      │  BallByBall  │  │
                      ├──────────────┤  │
                      │ id           │  │
                      │ match_id     │  │
                      │ innings      │  │
                      │ over_number  │  │
                      │ ball_number  │  │
                      │ batsman_id   │  │
                      │ bowler_id    │  │
                      │ runs         │  │
                      │ is_wicket    │  │
                      │ is_four      │  │
                      │ is_six       │  │
                      └──────────────┘  │
                                        │
                                        │
┌───────────────────────────────────────┴────────────────────────────────────┐
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐              │
│  │     Team     │    │  TeamPlayer  │    │ MatchAvailability│              │
│  ├──────────────┤    ├──────────────┤    ├──────────────────┤              │
│  │ id           │◄───┤ team_id      │◄───┤ player_id        │              │
│  │ name         │    │ player_name  │    │ match_id         │              │
│  │ short_name   │    │ email        │    │ status           │              │
│  │ logo_url     │    │ role         │    │ notes            │              │
│  │ is_home_team │    │ batting_style│    └──────────────────┘              │
│  └──────────────┘    │ bowling_style│                                      │
│                      │ matches_played                                       │
│                      │ runs_scored  │                                       │
│                      │ wickets_taken│                                       │
│                      └──────────────┘                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            FINANCE ENTITIES                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ FinanceCategory  │    │   Transaction    │    │    Membership    │
├──────────────────┤    ├──────────────────┤    ├──────────────────┤
│ id               │◄───┤ category_id      │    │ id               │
│ name             │    │ type (Inc/Exp)   │    │ player_id ───────┼───┐
│ type             │    │ amount           │    │ member_name      │   │
│ is_active        │    │ date             │    │ membership_type  │   │
└──────────────────┘    │ description      │    │ status           │   │
                        └──────────────────┘    │ fee_amount       │   │
                                                └──────────────────┘   │
                                                                       │
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  PlayerCharge    │    │  PlayerPayment   │    │PaymentAllocation │   │
├──────────────────┤    ├──────────────────┤    ├──────────────────┤   │
│ id               │◄───┤ id               │◄───┤ payment_id       │   │
│ player_id ───────┼────┤ player_id ───────┼────┤ charge_id ───────┼───┤
│ charge_type      │    │ amount           │    │ amount           │   │
│ amount           │    │ payment_date     │    │ allocation_date  │   │
│ due_date         │    │ payment_method   │    └──────────────────┘   │
│ voided           │    │ verified         │                           │
└──────────────────┘    └──────────────────┘                           │
                                                                       │
                                                                       ▼
                                                              ┌──────────────┐
                                                              │  TeamPlayer  │
                                                              └──────────────┘
```

### Core Tables Summary

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | App users & authentication | email, role, club_role |
| `seasons` | Cricket seasons (e.g., 2024-2025) | name, start_date, is_current |
| `teams` | Cricket teams | name, short_name, is_home_team |
| `team_players` | Player profiles & stats | player_name, email, runs_scored, wickets_taken |
| `competitions` | Competition hierarchy | name, parent_id |
| `tournaments` | Specific tournament instances | name, season_id, format, status |
| `tournament_teams` | Teams in a tournament | tournament_id, team_name, points |
| `tournament_matches` | Match fixtures | team1_id, team2_id, match_date, status |
| `ball_by_ball` | Ball-by-ball scoring data | match_id, runs, is_wicket, is_four |
| `innings_scores` | Innings totals | match_id, innings, total_runs |
| `transactions` | Financial records | type, amount, date, category_id |
| `memberships` | Member subscriptions | player_id, membership_type, status |

---

## 6. API Reference

### Authentication Endpoints

```
POST   /api/auth/login          # Login and get JWT token
GET    /api/auth/me             # Get current user
PUT    /api/auth/me             # Update current user
GET    /api/auth/check          # Verify token validity
POST   /api/auth/logout         # Logout (client clears token)
```

### Entity CRUD Endpoints

```
GET    /api/entities/{entity}              # List all records
POST   /api/entities/{entity}/filter       # Filter records
GET    /api/entities/{entity}/{id}         # Get single record
POST   /api/entities/{entity}              # Create record
POST   /api/entities/{entity}/bulk         # Bulk create records
PUT    /api/entities/{entity}/{id}         # Update record
DELETE /api/entities/{entity}/{id}         # Delete record
GET    /api/entities/{entity}/schema       # Get entity schema
```

### Integration Endpoints

```
POST   /api/integrations/upload            # Upload public file
POST   /api/integrations/upload-private    # Upload private file
POST   /api/integrations/signed-url        # Get signed URL for private file
POST   /api/integrations/send-email        # Send email (placeholder)
POST   /api/integrations/llm               # AI/LLM integration (placeholder)
POST   /api/integrations/generate-image    # Image generation (placeholder)
```

### Request/Response Examples

#### Login
```javascript
// Request
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "admin",
    "club_role": "captain"
  }
}
```

#### List Entities with Sorting
```javascript
// Request
GET /api/entities/TournamentMatch?sort=-match_date&limit=10
Authorization: Bearer <token>

// Response
[
  {
    "id": "uuid",
    "team1_name": "Team A",
    "team2_name": "Team B",
    "match_date": "2024-12-01T14:00:00Z",
    "status": "scheduled"
  },
  ...
]
```

#### Filter Entities
```javascript
// Request
POST /api/entities/TournamentMatch/filter
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": { "tournament_id": "uuid", "status": "scheduled" },
  "sort": "-match_date",
  "limit": 20
}

// Response
[
  { ... },
  { ... }
]
```

#### Create Entity
```javascript
// Request
POST /api/entities/News
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Match Report: Team A wins!",
  "content": "Exciting match yesterday...",
  "category": "Match Report"
}

// Response (201 Created)
{
  "id": "new-uuid",
  "title": "Match Report: Team A wins!",
  "content": "Exciting match yesterday...",
  "category": "Match Report",
  "created_date": "2024-12-01T10:30:00Z",
  "created_by": "user@example.com"
}
```

---

## 7. Frontend Structure

### Directory Layout

```
src/
├── api/
│   └── base44Client.js         # Re-exports apiClient for compatibility
│
├── components/
│   ├── api/
│   │   ├── apiClient.js        # Main API client
│   │   ├── SETUP_GUIDE.md      # Setup documentation
│   │   ├── DATABASE_SCHEMA.sql # Database creation script
│   │   └── BACKEND_SERVER.js   # Backend server code
│   │
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── dialog.jsx
│   │   ├── input.jsx
│   │   ├── select.jsx
│   │   ├── table.jsx
│   │   └── ...
│   │
│   ├── scoring/                # Live scoring components
│   │   ├── RunButtons.jsx
│   │   ├── Scorecard.jsx
│   │   ├── WicketDialog.jsx
│   │   ├── BatsmanCard.jsx
│   │   ├── BowlerCard.jsx
│   │   ├── ThisOver.jsx
│   │   ├── DLSCalculator.jsx
│   │   └── ...
│   │
│   ├── finance/                # Finance management
│   │   ├── PaymentManager.jsx
│   │   ├── MembershipManager.jsx
│   │   ├── FinancialReports.jsx
│   │   ├── TransactionForm.jsx
│   │   └── ...
│   │
│   ├── tournament/             # Tournament management
│   │   ├── TournamentFixtures.jsx
│   │   ├── TournamentTeams.jsx
│   │   ├── TournamentBracket.jsx
│   │   ├── TournamentSettings.jsx
│   │   └── ...
│   │
│   ├── profile/                # User profile components
│   │   ├── ProfileHeader.jsx
│   │   ├── StatCard.jsx
│   │   ├── PaymentSummaryCard.jsx
│   │   └── ...
│   │
│   ├── home/                   # Homepage sections
│   │   ├── HeroSection.jsx
│   │   ├── UpcomingMatches.jsx
│   │   ├── LatestNews.jsx
│   │   ├── SponsorsSection.jsx
│   │   └── ...
│   │
│   ├── fixtures/               # Match fixtures
│   │   ├── MatchCard.jsx
│   │   ├── ResultCard.jsx
│   │   ├── MatchAvailabilityModal.jsx
│   │   └── ...
│   │
│   ├── teams/                  # Team management
│   │   ├── TeamCard.jsx
│   │   ├── TeamForm.jsx
│   │   ├── PlayerForm.jsx
│   │   └── ...
│   │
│   ├── admin/                  # Admin components
│   │   ├── UserManager.jsx
│   │   ├── EventManager.jsx
│   │   └── ...
│   │
│   ├── ClubConfig.js           # Theme & branding config
│   ├── RoleAccess.js           # Permission utilities
│   └── ErrorBoundary.jsx       # Error handling
│
├── pages/
│   ├── Home.js                 # Landing page
│   ├── Fixtures.js             # Match fixtures
│   ├── News.js                 # Club news
│   ├── Events.js               # Club events
│   ├── Gallery.js              # Photo gallery
│   ├── Contact.js              # Contact form
│   ├── Squad.js                # Team roster
│   ├── MyProfile.js            # User profile
│   ├── Admin.js                # Admin dashboard
│   ├── Finance.js              # Financial management
│   ├── Tournaments.js          # Tournament list
│   ├── TournamentView.js       # Single tournament view
│   ├── TournamentCreate.js     # Create tournament
│   ├── Scoring.js              # Live scoring
│   ├── MatchReport.js          # Match scorecard
│   ├── Teams.js                # Team management
│   └── ...
│
├── Layout.js                   # App layout wrapper
├── globals.css                 # Global styles
└── utils.js                    # Utility functions
```

### Key Configuration Files

#### ClubConfig.js
Central configuration for theming, branding, and club settings.

```javascript
export const CLUB_CONFIG = {
  // Club identity
  name: "Leamington Royals",
  shortName: "LRCC",
  tagline: "CRICKET CLUB",
  
  // Theme colors
  theme: {
    colors: {
      primary: "#0a0a0a",
      accent: "#00d4ff",
      success: "#00ff88",
      danger: "#ff3b5c",
      // ... more colors
    }
  },
  
  // Page-specific themes
  pages: {
    finance: { accent: "#10b981" },
    team: { accent: "#8b5cf6" },
    // ... more pages
  },
  
  // Finance settings
  finance: {
    currency: "£",
    defaultMatchFee: 10,
  }
};
```

#### RoleAccess.js
Permission-based access control.

```javascript
export const PERMISSIONS = {
  add_edit_player: ['super_admin', 'captain'],
  manage_finances: ['super_admin', 'treasurer'],
  manage_news: ['super_admin', 'social_media'],
  view_admin: ['super_admin', 'captain', 'treasurer', 'social_media'],
};

export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const clubRole = user.club_role || 'member';
  return PERMISSIONS[permission]?.includes(clubRole);
}
```

---

## 8. Authentication Flow

### Token-Based Authentication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION LIFECYCLE                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐                                     ┌─────────────────┐
│                 │                                     │                 │
│   UNAUTHENTICATED                                     │  AUTHENTICATED  │
│                 │                                     │                 │
│  • Public pages │                                     │  • All pages    │
│  • No token     │                                     │  • Has token    │
│  • Limited API  │                                     │  • Full API     │
│                 │                                     │                 │
└────────┬────────┘                                     └────────┬────────┘
         │                                                       │
         │  Login                                       Logout   │
         │  (POST /auth/login)                 (clear localStorage)
         │                                                       │
         │         ┌───────────────────────────┐                 │
         └────────>│                           │<────────────────┘
                   │    TOKEN MANAGEMENT       │
                   │                           │
                   │  1. Receive JWT from API  │
                   │  2. Store in localStorage │
                   │  3. Include in headers    │
                   │  4. Auto-refresh if needed│
                   │                           │
                   └───────────────────────────┘


JWT Token Structure:
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER           │ PAYLOAD                        │ SIGNATURE               │
│ {                │ {                              │                         │
│   "alg": "HS256",│   "id": "user-uuid",           │  HMACSHA256(            │
│   "typ": "JWT"   │   "email": "user@example.com", │    base64(header) +     │
│ }                │   "role": "admin",             │    base64(payload),     │
│                  │   "club_role": "captain",      │    secret               │
│                  │   "full_name": "John Doe",     │  )                      │
│                  │   "iat": 1701432000,           │                         │
│                  │   "exp": 1702036800            │                         │
│                  │ }                              │                         │
└──────────────────┴────────────────────────────────┴─────────────────────────┘
```

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ROLE HIERARCHY                                    │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌───────────────┐
                         │  SUPER_ADMIN  │  Full access to everything
                         │               │  Can manage all users & roles
                         └───────┬───────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
    │   CAPTAIN   │      │  TREASURER  │      │SOCIAL_MEDIA │
    │             │      │             │      │             │
    │ • Players   │      │ • Finance   │      │ • News      │
    │ • Matches   │      │ • Payments  │      │ • Gallery   │
    │ • Teams     │      │ • Members   │      │ • Events    │
    │ • Scoring   │      │ • Reports   │      │             │
    └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
           │                    │                    │
           └────────────────────┴────────────────────┘
                                │
                                ▼
                         ┌─────────────┐
                         │   MEMBER    │  Basic access
                         │             │  • View fixtures
                         │             │  • Own profile
                         │             │  • Own payments
                         │             │  • Availability
                         └─────────────┘
```

---

## 9. Code Documentation

### API Client (apiClient.js) - Fully Commented

```javascript
/**
 * API Client - Custom Backend SDK
 * 
 * This module provides a complete interface for communicating with the
 * backend API. It handles authentication, entity CRUD operations, and
 * file uploads.
 * 
 * Usage: Import { api } from '@/components/api/apiClient'
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

// Read the API URL from environment variables
// Falls back to localhost:3001 for local development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Supabase configuration (used for direct storage access if needed)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================

// Initialize access token from localStorage
// This persists the token across page refreshes
let accessToken = localStorage.getItem('access_token');

// =============================================================================
// HTTP REQUEST HELPER
// =============================================================================

/**
 * Makes an HTTP request to the API
 * 
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {object} options - Fetch options (method, body, headers)
 * @returns {Promise<object>} - Parsed JSON response
 * @throws {Error} - If request fails or returns non-2xx status
 * 
 * Features:
 * - Automatically includes Content-Type header
 * - Automatically includes Authorization header if token exists
 * - Parses JSON response
 * - Throws descriptive errors on failure
 */
const request = async (endpoint, options = {}) => {
  // Build headers object
  // Always include Content-Type for JSON APIs
  // Include Authorization if we have a token
  const headers = {
    'Content-Type': 'application/json',                              // Tell API we're sending JSON
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),  // Include token if exists
    ...options.headers,                                              // Allow override
  };

  // Make the HTTP request using fetch
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,  // Spread method, body, etc.
    headers,     // Use our constructed headers
  });

  // Check if request was successful (status 200-299)
  if (!response.ok) {
    // Try to parse error message from response body
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    // Throw error with message from API or HTTP status
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  // Parse and return JSON response
  return response.json();
};

// =============================================================================
// ENTITY CRUD FACTORY
// =============================================================================

/**
 * Creates CRUD methods for a specific entity type
 * 
 * @param {string} entityName - Name of entity (e.g., 'TournamentMatch')
 * @returns {object} - Object with list, filter, get, create, update, delete methods
 * 
 * This factory pattern allows us to create consistent API methods
 * for any entity without duplicating code.
 */
const createEntityMethods = (entityName) => ({
  
  /**
   * List all records with optional sorting and limit
   * 
   * @param {string} sort - Sort field (prefix with '-' for descending)
   * @param {number} limit - Maximum records to return
   * @returns {Promise<array>} - Array of entity records
   * 
   * Examples:
   *   api.entities.News.list()                    // All news, default order
   *   api.entities.News.list('-created_date')     // Newest first
   *   api.entities.News.list('-created_date', 10) // 10 newest
   */
  list: async (sort, limit) => {
    // Build query string from parameters
    const params = new URLSearchParams();
    if (sort) params.append('sort', sort);     // Add sort if provided
    if (limit) params.append('limit', limit);   // Add limit if provided
    const query = params.toString() ? `?${params}` : '';  // Add ? if we have params
    
    // Make GET request to list endpoint
    return request(`/entities/${entityName}${query}`);
  },

  /**
   * Filter records with query object
   * 
   * @param {object} query - Filter conditions (field: value pairs)
   * @param {string} sort - Sort field
   * @param {number} limit - Maximum records
   * @returns {Promise<array>} - Matching records
   * 
   * Examples:
   *   api.entities.TournamentMatch.filter({ status: 'scheduled' })
   *   api.entities.TournamentMatch.filter(
   *     { tournament_id: 'abc', status: 'completed' },
   *     '-match_date',
   *     20
   *   )
   */
  filter: async (query, sort, limit) => {
    // POST request with filter criteria in body
    return request(`/entities/${entityName}/filter`, {
      method: 'POST',
      body: JSON.stringify({ query, sort, limit }),  // Send as JSON
    });
  },

  /**
   * Get single record by ID
   * 
   * @param {string} id - Record UUID
   * @returns {Promise<object>} - Single entity record
   * 
   * Example:
   *   const match = await api.entities.TournamentMatch.get('uuid-here');
   */
  get: async (id) => {
    return request(`/entities/${entityName}/${id}`);
  },

  /**
   * Create new record
   * 
   * @param {object} data - Entity data (without id, created_date, etc.)
   * @returns {Promise<object>} - Created record with generated fields
   * 
   * Example:
   *   const news = await api.entities.News.create({
   *     title: 'Match Report',
   *     content: 'Great game yesterday...'
   *   });
   */
  create: async (data) => {
    return request(`/entities/${entityName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Bulk create multiple records
   * 
   * @param {array} items - Array of entity data objects
   * @returns {Promise<array>} - Array of created records
   * 
   * Example:
   *   await api.entities.BallByBall.bulkCreate([
   *     { match_id: 'x', runs: 4, is_four: true },
   *     { match_id: 'x', runs: 0, is_dot: true },
   *   ]);
   */
  bulkCreate: async (items) => {
    return request(`/entities/${entityName}/bulk`, {
      method: 'POST',
      body: JSON.stringify(items),
    });
  },

  /**
   * Update existing record
   * 
   * @param {string} id - Record UUID
   * @param {object} data - Fields to update
   * @returns {Promise<object>} - Updated record
   * 
   * Example:
   *   await api.entities.TournamentMatch.update('uuid', { status: 'completed' });
   */
  update: async (id, data) => {
    return request(`/entities/${entityName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete record
   * 
   * @param {string} id - Record UUID
   * @returns {Promise<object>} - Success confirmation
   * 
   * Example:
   *   await api.entities.News.delete('uuid');
   */
  delete: async (id) => {
    return request(`/entities/${entityName}/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get entity schema (for dynamic forms)
   * 
   * @returns {Promise<object>} - JSON schema object
   */
  schema: async () => {
    return request(`/entities/${entityName}/schema`);
  },
});

// =============================================================================
// ENTITY PROXY
// =============================================================================

/**
 * Proxy object that creates entity methods on-demand
 * 
 * This allows us to access any entity without pre-defining it:
 *   api.entities.AnyEntityName.list()
 * 
 * The proxy intercepts property access and creates methods if they don't exist
 */
const entitiesProxy = new Proxy({}, {
  /**
   * Intercept property access on entities object
   * 
   * @param {object} target - The original empty object
   * @param {string} entityName - Property name being accessed (e.g., 'News')
   * @returns {object} - Entity methods object
   */
  get: (target, entityName) => {
    // If we haven't created methods for this entity yet, create them
    if (!target[entityName]) {
      target[entityName] = createEntityMethods(entityName);
    }
    // Return the methods object
    return target[entityName];
  },
});

// =============================================================================
// AUTHENTICATION METHODS
// =============================================================================

/**
 * Authentication API methods
 */
const auth = {
  /**
   * Get current authenticated user
   * 
   * @returns {Promise<object>} - User object with id, email, role, etc.
   * @throws {Error} - If not authenticated
   * 
   * Example:
   *   const user = await api.auth.me();
   *   console.log(user.full_name);
   */
  me: async () => {
    // Check if we have a token before making request
    if (!accessToken) {
      throw new Error('Not authenticated');
    }
    return request('/auth/me');
  },

  /**
   * Check if user is authenticated
   * 
   * @returns {Promise<boolean>} - true if authenticated, false otherwise
   * 
   * Example:
   *   if (await api.auth.isAuthenticated()) {
   *     // Show protected content
   *   }
   */
  isAuthenticated: async () => {
    // No token means definitely not authenticated
    if (!accessToken) return false;
    try {
      // Try to verify token with API
      await request('/auth/check');
      return true;
    } catch {
      // Token invalid or expired
      return false;
    }
  },

  /**
   * Update current user's profile
   * 
   * @param {object} data - Fields to update
   * @returns {Promise<object>} - Updated user object
   * 
   * Example:
   *   await api.auth.updateMe({ full_name: 'New Name' });
   */
  updateMe: async (data) => {
    return request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Redirect to login page
   * 
   * @param {string} nextUrl - URL to redirect to after login
   * 
   * Example:
   *   api.auth.redirectToLogin('/dashboard');
   */
  redirectToLogin: (nextUrl) => {
    // Save current URL as return destination
    const returnUrl = nextUrl || window.location.href;
    // Redirect to login page with return URL
    window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  },

  /**
   * Logout current user
   * 
   * @param {string} redirectUrl - Optional URL to redirect after logout
   * 
   * Example:
   *   await api.auth.logout('/');
   */
  logout: async (redirectUrl) => {
    // Tell backend we're logging out (optional cleanup)
    await request('/auth/logout', { method: 'POST' }).catch(() => {});
    // Clear token from storage
    localStorage.removeItem('access_token');
    accessToken = null;
    // Redirect or reload
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      window.location.reload();
    }
  },

  /**
   * Set authentication token
   * Called after successful login
   * 
   * @param {string} token - JWT token from login response
   */
  setToken: (token) => {
    accessToken = token;
    localStorage.setItem('access_token', token);
  },

  /**
   * Get current token (for debugging)
   * 
   * @returns {string|null} - Current JWT token
   */
  getToken: () => accessToken,
};

// =============================================================================
// INTEGRATION METHODS
// =============================================================================

/**
 * External integrations (file upload, email, AI, etc.)
 */
const integrations = {
  Core: {
    /**
     * Invoke LLM (AI) with prompt
     * 
     * @param {object} params - LLM parameters
     * @param {string} params.prompt - The prompt to send
     * @param {boolean} params.add_context_from_internet - Whether to search web
     * @param {object} params.response_json_schema - Expected response format
     * @param {array} params.file_urls - Files to include for context
     * @returns {Promise<object|string>} - LLM response
     */
    InvokeLLM: async ({ prompt, add_context_from_internet, response_json_schema, file_urls }) => {
      return request('/integrations/llm', {
        method: 'POST',
        body: JSON.stringify({ prompt, add_context_from_internet, response_json_schema, file_urls }),
      });
    },

    /**
     * Send email
     * 
     * @param {object} params - Email parameters
     * @param {string} params.to - Recipient email
     * @param {string} params.subject - Email subject
     * @param {string} params.body - Email body (HTML supported)
     * @param {string} params.from_name - Sender name
     */
    SendEmail: async ({ to, subject, body, from_name }) => {
      return request('/integrations/send-email', {
        method: 'POST',
        body: JSON.stringify({ to, subject, body, from_name }),
      });
    },

    /**
     * Upload public file
     * 
     * @param {object} params - Upload parameters
     * @param {File} params.file - File object to upload
     * @returns {Promise<{file_url: string}>} - Public URL of uploaded file
     * 
     * Example:
     *   const input = document.querySelector('input[type="file"]');
     *   const { file_url } = await api.integrations.Core.UploadFile({
     *     file: input.files[0]
     *   });
     */
    UploadFile: async ({ file }) => {
      // Use FormData for file uploads (not JSON)
      const formData = new FormData();
      formData.append('file', file);

      // Make request without Content-Type header (browser sets it for FormData)
      const response = await fetch(`${API_BASE_URL}/integrations/upload`, {
        method: 'POST',
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: formData,  // Send as FormData, not JSON
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },

    /**
     * Upload private file (not publicly accessible)
     * 
     * @param {object} params - Upload parameters
     * @param {File} params.file - File to upload
     * @returns {Promise<{file_uri: string}>} - Private file URI
     */
    UploadPrivateFile: async ({ file }) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/integrations/upload-private`, {
        method: 'POST',
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },

    /**
     * Create signed URL for private file
     * Allows temporary access to private files
     * 
     * @param {object} params - Parameters
     * @param {string} params.file_uri - Private file URI
     * @param {number} params.expires_in - Expiry time in seconds (default 300)
     * @returns {Promise<{signed_url: string}>} - Temporary access URL
     */
    CreateFileSignedUrl: async ({ file_uri, expires_in = 300 }) => {
      return request('/integrations/signed-url', {
        method: 'POST',
        body: JSON.stringify({ file_uri, expires_in }),
      });
    },

    /**
     * Generate image with AI
     * 
     * @param {object} params - Parameters
     * @param {string} params.prompt - Image description
     * @returns {Promise<{url: string}>} - Generated image URL
     */
    GenerateImage: async ({ prompt }) => {
      return request('/integrations/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
    },

    /**
     * Extract structured data from uploaded file
     * 
     * @param {object} params - Parameters
     * @param {string} params.file_url - URL of uploaded file
     * @param {object} params.json_schema - Expected data structure
     * @returns {Promise<{status, output}>} - Extracted data
     */
    ExtractDataFromUploadedFile: async ({ file_url, json_schema }) => {
      return request('/integrations/extract-data', {
        method: 'POST',
        body: JSON.stringify({ file_url, json_schema }),
      });
    },
  },
};

// =============================================================================
// EXPORT API CLIENT
// =============================================================================

/**
 * Main API client object
 * 
 * Provides access to:
 * - entities: CRUD operations for all entity types
 * - auth: Authentication methods
 * - integrations: File upload, email, AI, etc.
 */
const apiClient = {
  entities: entitiesProxy,    // Dynamic entity access
  auth,                       // Authentication methods
  integrations,               // Integration methods
};

// Named export for explicit imports
export const api = apiClient;

// Default export for convenience
export default apiClient;
```

### Backend Server (server.js) - Fully Commented

```javascript
/**
 * ============================================
 * LEAMINGTON ROYALS BACKEND SERVER
 * ============================================
 * 
 * This Express.js server provides:
 * - REST API for all entity CRUD operations
 * - JWT-based authentication
 * - File upload to Supabase Storage
 * - Integration endpoints (email, AI, etc.)
 * 
 * Run with: node server.js
 */

// =============================================================================
// IMPORTS
// =============================================================================

const express = require('express');           // Web framework
const cors = require('cors');                 // Cross-origin resource sharing
const { createClient } = require('@supabase/supabase-js');  // Database client
const multer = require('multer');             // File upload handling
const { v4: uuidv4 } = require('uuid');       // UUID generation
const jwt = require('jsonwebtoken');          // JWT token handling
require('dotenv').config();                   // Load .env file

// =============================================================================
// APP INITIALIZATION
// =============================================================================

const app = express();                        // Create Express app
const PORT = process.env.PORT || 3001;        // Server port

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

// Initialize Supabase client with service key (full access)
const supabase = createClient(
  process.env.SUPABASE_URL,      // Supabase project URL
  process.env.SUPABASE_SERVICE_KEY  // Service role key (admin access)
);

// JWT secret for signing tokens
const jwtSecret = process.env.JWT_SECRET;

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Enable CORS for frontend access
// This allows the React app to make requests to this server
app.use(cors({ 
  origin: true,           // Allow any origin (configure for production)
  credentials: true       // Allow cookies/auth headers
}));

// Parse JSON request bodies up to 10MB
app.use(express.json({ limit: '10mb' }));

// Configure multer for file uploads
// Files are stored in memory (not disk) before upload to Supabase
const upload = multer({ storage: multer.memoryStorage() });

// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================

/**
 * Authentication middleware - requires valid JWT
 * 
 * Extracts token from Authorization header, verifies it,
 * and adds decoded user info to req.user
 * 
 * Returns 401 if token missing or invalid
 */
const auth = async (req, res, next) => {
  // Extract token from "Bearer <token>" header
  const token = req.headers.authorization?.split(' ')[1];
  
  // No token provided
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  
  try {
    // Verify token and decode payload
    req.user = jwt.verify(token, jwtSecret);
    // Token valid, continue to route handler
    next();
  } catch {
    // Token invalid or expired
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Optional authentication middleware
 * 
 * Same as auth, but doesn't fail if no token
 * Used for public endpoints that behave differently for logged-in users
 */
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, jwtSecret);
    } catch {
      // Invalid token, but continue anyway (no user)
    }
  }
  next();
};

// =============================================================================
// ENTITY NAME MAPPING
// =============================================================================

/**
 * Maps frontend entity names to database table names
 * 
 * Frontend uses PascalCase (e.g., TeamPlayer)
 * Database uses snake_case (e.g., team_players)
 */
const tables = {
  User: 'users',
  Season: 'seasons',
  Team: 'teams',
  TeamPlayer: 'team_players',
  Competition: 'competitions',
  Tournament: 'tournaments',
  TournamentTeam: 'tournament_teams',
  TournamentPlayer: 'tournament_players',
  TournamentMatch: 'tournament_matches',
  BallByBall: 'ball_by_ball',
  InningsScore: 'innings_scores',
  MatchState: 'match_states',
  MatchProfile: 'match_profiles',
  MatchAvailability: 'match_availability',
  News: 'news',
  Event: 'events',
  EventRSVP: 'event_rsvps',
  GalleryImage: 'gallery_images',
  ContactMessage: 'contact_messages',
  Notification: 'notifications',
  UserNotification: 'user_notifications',
  Sponsor: 'sponsors',
  SponsorPayment: 'sponsor_payments',
  FinanceCategory: 'finance_categories',
  Transaction: 'transactions',
  Membership: 'memberships',
  PlayerCharge: 'player_charges',
  PlayerPayment: 'player_payments',
  PaymentAllocation: 'payment_allocations',
  Invoice: 'invoices',
  PaymentSettings: 'payment_settings',
  ClubStats: 'club_stats',
  // ... audit logs, etc.
};

/**
 * Get database table name for entity
 * Falls back to lowercase + 's' if not mapped
 */
const getTable = (entityName) => tables[entityName] || entityName.toLowerCase() + 's';

// =============================================================================
// AUTHENTICATION ROUTES
// =============================================================================

/**
 * POST /api/auth/login
 * 
 * Login with email (simplified auth - no password in this version)
 * Returns JWT token and user data
 */
app.post('/api/auth/login', async (req, res) => {
  const { email } = req.body;
  
  // Look up user by email
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  // User not found
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate JWT token with user info
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      club_role: user.club_role,
      full_name: user.full_name
    },
    jwtSecret,
    { expiresIn: '7d' }  // Token expires in 7 days
  );
  
  // Return token and user data
  res.json({ token, user });
});

/**
 * GET /api/auth/me
 * 
 * Get current user's data
 * Requires authentication
 */
app.get('/api/auth/me', auth, async (req, res) => {
  // Fetch fresh user data from database
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();
  
  // Return user data (or token data if DB fails)
  res.json(data || req.user);
});

/**
 * PUT /api/auth/me
 * 
 * Update current user's profile
 * Cannot change: id, email, role (security)
 */
app.put('/api/auth/me', auth, async (req, res) => {
  // Build update object
  const updates = { 
    ...req.body, 
    updated_date: new Date().toISOString()  // Track modification time
  };
  
  // Remove protected fields that shouldn't be changed
  delete updates.id;
  delete updates.email;
  delete updates.role;
  
  // Update in database
  const { data } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.user.id)
    .select()
    .single();
  
  res.json(data);
});

/**
 * GET /api/auth/check
 * 
 * Verify token is valid
 * Returns 200 if authenticated, 401 if not
 */
app.get('/api/auth/check', auth, (req, res) => {
  res.json({ authenticated: true });
});

/**
 * POST /api/auth/logout
 * 
 * Logout endpoint (client handles token removal)
 * Just returns success - stateless auth doesn't need server-side logout
 */
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// =============================================================================
// ENTITY CRUD ROUTES
// =============================================================================

/**
 * GET /api/entities/:entity
 * 
 * List all records of an entity type
 * 
 * Query parameters:
 * - sort: Field to sort by (prefix with '-' for descending)
 * - limit: Maximum records to return
 */
app.get('/api/entities/:e', optionalAuth, async (req, res) => {
  const { sort, limit } = req.query;
  
  // Start building query
  let query = supabase
    .from(getTable(req.params.e))  // Get table name from entity
    .select('*');
  
  // Apply sorting
  if (sort) {
    const descending = sort.startsWith('-');        // Check for descending
    const column = descending ? sort.slice(1) : sort;  // Remove '-' prefix
    query = query.order(column, { ascending: !descending });
  } else {
    // Default: newest first
    query = query.order('created_date', { ascending: false });
  }
  
  // Apply limit
  if (limit) {
    query = query.limit(parseInt(limit));
  }
  
  // Execute query
  const { data, error } = await query;
  
  // Handle error
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  // Return results (empty array if no data)
  res.json(data || []);
});

/**
 * POST /api/entities/:entity/filter
 * 
 * Filter records with query conditions
 * 
 * Request body:
 * - query: Object with field: value pairs
 * - sort: Sort field
 * - limit: Max records
 */
app.post('/api/entities/:e/filter', optionalAuth, async (req, res) => {
  const { query: filters, sort, limit } = req.body;
  
  // Start query
  let query = supabase
    .from(getTable(req.params.e))
    .select('*');
  
  // Apply each filter condition
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) {  // Skip null/undefined values
        query = query.eq(key, value);  // Add WHERE condition
      }
    });
  }
  
  // Apply sorting
  if (sort) {
    const descending = sort.startsWith('-');
    query = query.order(
      descending ? sort.slice(1) : sort,
      { ascending: !descending }
    );
  }
  
  // Apply limit
  if (limit) {
    query = query.limit(parseInt(limit));
  }
  
  // Execute and return
  const { data, error } = await query;
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  res.json(data || []);
});

/**
 * GET /api/entities/:entity/:id
 * 
 * Get single record by ID
 */
app.get('/api/entities/:e/:id', optionalAuth, async (req, res) => {
  const { data } = await supabase
    .from(getTable(req.params.e))
    .select('*')
    .eq('id', req.params.id)
    .single();  // Expect exactly one result
  
  res.json(data);
});

/**
 * POST /api/entities/:entity
 * 
 * Create new record
 * Requires authentication
 * 
 * Automatically adds:
 * - id: New UUID
 * - created_date: Current timestamp
 * - updated_date: Current timestamp
 * - created_by: User's email
 */
app.post('/api/entities/:e', auth, async (req, res) => {
  // Build record with auto-generated fields
  const record = {
    ...req.body,                              // User-provided data
    id: uuidv4(),                             // Generate unique ID
    created_date: new Date().toISOString(),   // Creation timestamp
    updated_date: new Date().toISOString(),   // Update timestamp
    created_by: req.user.email                // Who created it
  };
  
  // Insert into database
  const { data, error } = await supabase
    .from(getTable(req.params.e))
    .insert(record)
    .select()
    .single();
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  // Return created record with 201 status
  res.status(201).json(data);
});

/**
 * POST /api/entities/:entity/bulk
 * 
 * Bulk create multiple records
 * More efficient than multiple single inserts
 */
app.post('/api/entities/:e/bulk', auth, async (req, res) => {
  // Add auto fields to each record
  const records = req.body.map(item => ({
    ...item,
    id: uuidv4(),
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    created_by: req.user.email
  }));
  
  // Insert all records
  const { data, error } = await supabase
    .from(getTable(req.params.e))
    .insert(records)
    .select();
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  res.status(201).json(data);
});

/**
 * PUT /api/entities/:entity/:id
 * 
 * Update existing record
 * Requires authentication
 * 
 * Cannot modify: id, created_date, created_by
 */
app.put('/api/entities/:e/:id', auth, async (req, res) => {
  // Build update object
  const updates = {
    ...req.body,
    updated_date: new Date().toISOString()  // Track modification
  };
  
  // Protect immutable fields
  delete updates.id;
  delete updates.created_date;
  delete updates.created_by;
  
  // Update in database
  const { data, error } = await supabase
    .from(getTable(req.params.e))
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  res.json(data);
});

/**
 * DELETE /api/entities/:entity/:id
 * 
 * Delete record by ID
 * Requires authentication
 */
app.delete('/api/entities/:e/:id', auth, async (req, res) => {
  await supabase
    .from(getTable(req.params.e))
    .delete()
    .eq('id', req.params.id);
  
  res.json({ success: true });
});

/**
 * GET /api/entities/:entity/schema
 * 
 * Get entity schema (for dynamic forms)
 * Currently returns empty - forms define their own fields
 */
app.get('/api/entities/:e/schema', (req, res) => {
  res.json({});
});

// =============================================================================
// FILE UPLOAD ROUTES
// =============================================================================

/**
 * POST /api/integrations/upload
 * 
 * Upload public file to Supabase Storage
 * Returns publicly accessible URL
 */
app.post('/api/integrations/upload', auth, upload.single('file'), async (req, res) => {
  // Generate unique filename
  const path = `public/${uuidv4()}-${req.file.originalname}`;
  
  // Upload to Supabase Storage
  await supabase.storage
    .from('uploads')
    .upload(path, req.file.buffer, { 
      contentType: req.file.mimetype 
    });
  
  // Get public URL
  const { data } = supabase.storage
    .from('uploads')
    .getPublicUrl(path);
  
  res.json({ file_url: data.publicUrl });
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * GET /api/health
 * 
 * Simple health check endpoint
 * Used to verify server is running
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log(`\n🏏 Backend running: http://localhost:${PORT}\n`);
});
```

---

## 10. Deployment Guide

### Local Development

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOCAL DEVELOPMENT SETUP                              │
└─────────────────────────────────────────────────────────────────────────────┘

Terminal 1 (Backend):
┌──────────────────────────────────────────┐
│ $ cd leamington-royals-backend           │
│ $ npm install                            │
│ $ node server.js                         │
│                                          │
│ 🏏 Backend running: http://localhost:3001│
└──────────────────────────────────────────┘

Terminal 2 (Frontend):
┌──────────────────────────────────────────┐
│ $ cd leamington-royals-frontend          │
│ $ npm install                            │
│ $ npm run dev                            │
│                                          │
│ ➜ Local: http://localhost:5173           │
└──────────────────────────────────────────┘

Browser:
┌──────────────────────────────────────────┐
│ Open: http://localhost:5173              │
└──────────────────────────────────────────┘
```

### Production Deployment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION ARCHITECTURE                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                              CLOUD PROVIDERS                               │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────┐                    ┌─────────────────────┐      │
│  │     VERCEL          │                    │     RAILWAY         │      │
│  │  ┌───────────────┐  │                    │  ┌───────────────┐  │      │
│  │  │   Frontend    │  │  HTTPS Request     │  │   Backend     │  │      │
│  │  │   (React)     │──┼───────────────────>│  │   (Node.js)   │  │      │
│  │  │               │  │                    │  │               │  │      │
│  │  │ yourapp.vercel│  │                    │  │ api.railway.  │  │      │
│  │  │ .app          │  │                    │  │ app           │  │      │
│  │  └───────────────┘  │                    │  └───────┬───────┘  │      │
│  └─────────────────────┘                    └──────────┼──────────┘      │
│                                                        │                 │
│                                                        │ PostgreSQL      │
│                                                        │ Protocol        │
│                                                        ▼                 │
│                              ┌─────────────────────────────────────┐     │
│                              │            SUPABASE                 │     │
│                              │  ┌───────────────┐ ┌─────────────┐ │     │
│                              │  │  PostgreSQL   │ │   Storage   │ │     │
│                              │  │   Database    │ │   (Files)   │ │     │
│                              │  └───────────────┘ └─────────────┘ │     │
│                              └─────────────────────────────────────┘     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

Deployment Steps:

1. SUPABASE (Database) - Already configured
   ✓ Database tables created
   ✓ Storage buckets set up
   ✓ Get API keys from dashboard

2. RAILWAY (Backend)
   $ railway login
   $ railway init
   $ railway add
   $ railway variables set SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx JWT_SECRET=xxx
   $ railway up

3. VERCEL (Frontend)
   $ vercel login
   $ vercel
   $ vercel env add VITE_API_URL
   $ vercel env add VITE_SUPABASE_URL
   $ vercel env add VITE_SUPABASE_ANON_KEY
   $ vercel --prod
```

### Environment Variables Reference

| Variable | Location | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Backend | Service role key (admin) |
| `JWT_SECRET` | Backend | Secret for signing JWTs |
| `PORT` | Backend | Server port (default 3001) |
| `VITE_API_URL` | Frontend | Backend API URL |
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Anon/public key |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           QUICK REFERENCE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  START DEVELOPMENT:                                                         │
│  ─────────────────                                                          │
│  Backend:  cd backend && node server.js                                     │
│  Frontend: cd frontend && npm run dev                                       │
│  Open:     http://localhost:5173                                            │
│                                                                             │
│  API ENDPOINTS:                                                             │
│  ──────────────                                                             │
│  Auth:     POST /api/auth/login, GET /api/auth/me                          │
│  List:     GET /api/entities/{Entity}                                       │
│  Filter:   POST /api/entities/{Entity}/filter                               │
│  Create:   POST /api/entities/{Entity}                                      │
│  Update:   PUT /api/entities/{Entity}/{id}                                  │
│  Delete:   DELETE /api/entities/{Entity}/{id}                               │
│  Upload:   POST /api/integrations/upload                                    │
│                                                                             │
│  KEY FILES:                                                                 │
│  ──────────                                                                 │
│  apiClient.js     - Frontend API client                                     │
│  server.js        - Backend Express server                                  │
│  ClubConfig.js    - Theme & branding                                        │
│  RoleAccess.js    - Permission checks                                       │
│  Layout.js        - App layout wrapper                                      │
│                                                                             │
│  ENTITY ROLES:                                                              │
│  ─────────────                                                              │
│  super_admin  - Full access                                                 │
│  captain      - Players, matches, teams                                     │
│  treasurer    - Finance, payments                                           │
│  social_media - News, gallery, events                                       │
│  member       - Basic access only                                           │
│                                                                             │
│  DATABASE TABLES:                                                           │
│  ────────────────                                                           │
│  Core:    users, teams, team_players, seasons                               │
│  Matches: tournaments, tournament_matches, ball_by_ball                     │
│  Finance: transactions, memberships, player_charges, player_payments        │
│  Content: news, events, gallery_images, notifications                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*Document Version: 1.0*
*Last Updated: December 2024*
*Project: Leamington Royals Cricket Club Management System*