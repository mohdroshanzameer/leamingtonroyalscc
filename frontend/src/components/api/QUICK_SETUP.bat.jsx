@echo off
REM ============================================
REM LEAMINGTON ROYALS - ONE-CLICK SETUP (WINDOWS)
REM ============================================
REM 
REM USAGE:
REM   1. Save this file to your Desktop
REM   2. Double-click to run
REM ============================================

echo.
echo ================================================================
echo   LEAMINGTON ROYALS - AUTOMATED SETUP
echo ================================================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo         Please install from: https://nodejs.org
    echo         Then run this script again.
    pause
    exit /b 1
)

echo [OK] Node.js found
node --version
echo.

REM Get Supabase credentials
echo ----------------------------------------------------------------
echo   STEP 1: Enter your Supabase credentials
echo   (Get these from: Supabase Dashboard - Settings - API)
echo ----------------------------------------------------------------
echo.

set /p SUPABASE_URL="Supabase URL (https://xxx.supabase.co): "
set /p SUPABASE_SERVICE_KEY="Supabase Service Role Key: "
set /p SUPABASE_ANON_KEY="Supabase Anon Key: "

REM Generate simple JWT secret
set JWT_SECRET=leamington-royals-jwt-secret-%RANDOM%%RANDOM%

echo.
echo ----------------------------------------------------------------
echo   STEP 2: Creating backend...
echo ----------------------------------------------------------------

cd %USERPROFILE%\Desktop
if not exist leamington-royals-backend mkdir leamington-royals-backend
cd leamington-royals-backend

REM Create package.json
echo {"name":"leamington-royals-backend","version":"1.0.0","scripts":{"start":"node server.js"}} > package.json

echo Installing backend dependencies (this may take 1-2 minutes)...
call npm install express cors dotenv @supabase/supabase-js multer uuid jsonwebtoken bcryptjs --silent

REM Create .env
(
echo SUPABASE_URL=%SUPABASE_URL%
echo SUPABASE_SERVICE_KEY=%SUPABASE_SERVICE_KEY%
echo JWT_SECRET=%JWT_SECRET%
echo PORT=3001
) > .env

REM Create server.js
(
echo const express = require('express'^);
echo const cors = require('cors'^);
echo const { createClient } = require('@supabase/supabase-js'^);
echo const multer = require('multer'^);
echo const { v4: uuidv4 } = require('uuid'^);
echo const jwt = require('jsonwebtoken'^);
echo require('dotenv'^).config(^);
echo.
echo const app = express(^);
echo const PORT = process.env.PORT ^|^| 3001;
echo const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY^);
echo const jwtSecret = process.env.JWT_SECRET;
echo.
echo app.use(cors({ origin: true, credentials: true })^);
echo app.use(express.json({ limit: '10mb' })^);
echo const upload = multer({ storage: multer.memoryStorage(^) })^;
echo.
echo const auth = async (req, res, next^) =^> {
echo   const token = req.headers.authorization?.split(' '^)[1];
echo   if (!token^) return res.status(401^).json({ error: 'No token' })^;
echo   try { req.user = jwt.verify(token, jwtSecret^); next(^); }
echo   catch { res.status(401^).json({ error: 'Invalid token' })^; }
echo }^;
echo.
echo const optionalAuth = (req, res, next^) =^> {
echo   const token = req.headers.authorization?.split(' '^)[1];
echo   if (token^) try { req.user = jwt.verify(token, jwtSecret^); } catch {}
echo   next(^);
echo }^;
echo.
echo const tables = {User:'users',Season:'seasons',Team:'teams',TeamPlayer:'team_players',Competition:'competitions',Tournament:'tournaments',TournamentTeam:'tournament_teams',TournamentPlayer:'tournament_players',TournamentMatch:'tournament_matches',BallByBall:'ball_by_ball',InningsScore:'innings_scores',MatchState:'match_states',MatchProfile:'match_profiles',MatchAvailability:'match_availability',News:'news',Event:'events',EventRSVP:'event_rsvps',GalleryImage:'gallery_images',ContactMessage:'contact_messages',Notification:'notifications',UserNotification:'user_notifications',Sponsor:'sponsors',SponsorPayment:'sponsor_payments',FinanceCategory:'finance_categories',Transaction:'transactions',Membership:'memberships',PlayerCharge:'player_charges',PlayerPayment:'player_payments',PaymentAllocation:'payment_allocations',Invoice:'invoices',PaymentSettings:'payment_settings',ClubStats:'club_stats'}^;
echo const getTable = e =^> tables[e] ^|^| e.toLowerCase(^)+'s'^;
echo.
echo app.post('/api/auth/login', async (req, res^) =^> {
echo   const { email } = req.body^;
echo   const { data: user } = await supabase.from('users'^).select('*'^).eq('email', email^).single(^)^;
echo   if (!user^) return res.status(401^).json({ error: 'Invalid' })^;
echo   const token = jwt.sign({ id: user.id, email: user.email, role: user.role, club_role: user.club_role, full_name: user.full_name }, jwtSecret, { expiresIn: '7d' })^;
echo   res.json({ token, user })^;
echo })^;
echo.
echo app.get('/api/auth/me', auth, async (req, res^) =^> {
echo   const { data } = await supabase.from('users'^).select('*'^).eq('id', req.user.id^).single(^)^;
echo   res.json(data ^|^| req.user^);
echo })^;
echo.
echo app.put('/api/auth/me', auth, async (req, res^) =^> {
echo   const upd = { ...req.body, updated_date: new Date(^).toISOString(^) }^;
echo   delete upd.id^; delete upd.email^; delete upd.role^;
echo   const { data } = await supabase.from('users'^).update(upd^).eq('id', req.user.id^).select(^).single(^)^;
echo   res.json(data^);
echo })^;
echo.
echo app.get('/api/auth/check', auth, (req, res^) =^> res.json({ authenticated: true })^)^;
echo app.post('/api/auth/logout', (req, res^) =^> res.json({ success: true })^)^;
echo.
echo app.get('/api/entities/:e', optionalAuth, async (req, res^) =^> {
echo   const { sort, limit } = req.query^;
echo   let q = supabase.from(getTable(req.params.e^)^).select('*'^)^;
echo   if (sort^) { const d = sort.startsWith('-'^)^; q = q.order(d ? sort.slice(1^) : sort, { ascending: !d })^; }
echo   else q = q.order('created_date', { ascending: false })^;
echo   if (limit^) q = q.limit(+limit^)^;
echo   const { data, error } = await q^;
echo   if (error^) return res.status(400^).json({ error: error.message })^;
echo   res.json(data ^|^| [])^;
echo })^;
echo.
echo app.post('/api/entities/:e/filter', optionalAuth, async (req, res^) =^> {
echo   const { query: f, sort, limit } = req.body^;
echo   let q = supabase.from(getTable(req.params.e^)^).select('*'^)^;
echo   if (f^) Object.entries(f^).forEach(([k,v]) =^> { if (v != null^) q = q.eq(k, v^)^; })^;
echo   if (sort^) { const d = sort.startsWith('-'^)^; q = q.order(d ? sort.slice(1^) : sort, { ascending: !d })^; }
echo   if (limit^) q = q.limit(+limit^)^;
echo   const { data, error } = await q^;
echo   if (error^) return res.status(400^).json({ error: error.message })^;
echo   res.json(data ^|^| [])^;
echo })^;
echo.
echo app.get('/api/entities/:e/:id', optionalAuth, async (req, res^) =^> {
echo   const { data } = await supabase.from(getTable(req.params.e^)^).select('*'^).eq('id', req.params.id^).single(^)^;
echo   res.json(data^);
echo })^;
echo.
echo app.post('/api/entities/:e', auth, async (req, res^) =^> {
echo   const rec = { ...req.body, id: uuidv4(^), created_date: new Date(^).toISOString(^), updated_date: new Date(^).toISOString(^), created_by: req.user.email }^;
echo   const { data, error } = await supabase.from(getTable(req.params.e^)^).insert(rec^).select(^).single(^)^;
echo   if (error^) return res.status(400^).json({ error: error.message })^;
echo   res.status(201^).json(data^);
echo })^;
echo.
echo app.post('/api/entities/:e/bulk', auth, async (req, res^) =^> {
echo   const recs = req.body.map(r =^> ({ ...r, id: uuidv4(^), created_date: new Date(^).toISOString(^), updated_date: new Date(^).toISOString(^), created_by: req.user.email }))^;
echo   const { data, error } = await supabase.from(getTable(req.params.e^)^).insert(recs^).select(^)^;
echo   if (error^) return res.status(400^).json({ error: error.message })^;
echo   res.status(201^).json(data^);
echo })^;
echo.
echo app.put('/api/entities/:e/:id', auth, async (req, res^) =^> {
echo   const upd = { ...req.body, updated_date: new Date(^).toISOString(^) }^;
echo   delete upd.id^; delete upd.created_date^; delete upd.created_by^;
echo   const { data, error } = await supabase.from(getTable(req.params.e^)^).update(upd^).eq('id', req.params.id^).select(^).single(^)^;
echo   if (error^) return res.status(400^).json({ error: error.message })^;
echo   res.json(data^);
echo })^;
echo.
echo app.delete('/api/entities/:e/:id', auth, async (req, res^) =^> {
echo   await supabase.from(getTable(req.params.e^)^).delete(^).eq('id', req.params.id^)^;
echo   res.json({ success: true })^;
echo })^;
echo.
echo app.get('/api/entities/:e/schema', (req, res^) =^> res.json({})^)^;
echo.
echo app.post('/api/integrations/upload', auth, upload.single('file'^), async (req, res^) =^> {
echo   const path = 'public/'+uuidv4(^)+'-'+req.file.originalname^;
echo   await supabase.storage.from('uploads'^).upload(path, req.file.buffer, { contentType: req.file.mimetype })^;
echo   const { data } = supabase.storage.from('uploads'^).getPublicUrl(path^)^;
echo   res.json({ file_url: data.publicUrl })^;
echo })^;
echo.
echo app.post('/api/integrations/send-email', auth, (req, res^) =^> res.json({ success: true })^)^;
echo app.post('/api/integrations/llm', auth, (req, res^) =^> res.json({ response: 'Not configured' })^)^;
echo app.post('/api/integrations/generate-image', auth, (req, res^) =^> res.json({ url: 'https://via.placeholder.com/512' })^)^;
echo.
echo app.get('/api/health', (req, res^) =^> res.json({ status: 'ok' })^)^;
echo.
echo app.listen(PORT, (^) =^> console.log('Backend running on http://localhost:'+PORT^)^)^;
) > server.js

echo [OK] Backend created!

echo.
echo ----------------------------------------------------------------
echo   STEP 3: Setting up frontend...
echo ----------------------------------------------------------------

if exist %USERPROFILE%\Desktop\leamington-royals-frontend (
    cd %USERPROFILE%\Desktop\leamington-royals-frontend
    
    REM Create frontend .env
    (
    echo VITE_API_URL=http://localhost:3001/api
    echo VITE_SUPABASE_URL=%SUPABASE_URL%
    echo VITE_SUPABASE_ANON_KEY=%SUPABASE_ANON_KEY%
    ) > .env
    
    echo Installing frontend dependencies...
    call npm install --silent
    echo [OK] Frontend configured!
) else (
    echo [WARNING] Frontend folder not found
    echo          Please export from Base44 and extract to Desktop\leamington-royals-frontend
)

echo.
echo ================================================================
echo   SETUP COMPLETE!
echo ================================================================
echo.
echo   To start the app:
echo.
echo   1. Open Command Prompt, run:
echo      cd %USERPROFILE%\Desktop\leamington-royals-backend
echo      npm start
echo.
echo   2. Open ANOTHER Command Prompt, run:
echo      cd %USERPROFILE%\Desktop\leamington-royals-frontend
echo      npm run dev
echo.
echo   3. Open browser: http://localhost:5173
echo.
echo ================================================================

set /p START_NOW="Start the backend now? (y/n): "
if /i "%START_NOW%"=="y" (
    cd %USERPROFILE%\Desktop\leamington-royals-backend
    node server.js
)

pause