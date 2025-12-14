# Club Configuration Documentation

This document provides a complete reference of all configurable values in the application and where they are used.

---

## Configuration File Location

**File:** `components/ClubConfig.js`

---

## Configuration Sections

### 1. CLUB IDENTITY

| Config Key | Type | Description | Used In |
|------------|------|-------------|---------|
| `name` | string | Full club name | Layout.js (header, footer), FinancialReports.jsx, InvoiceManager.jsx |
| `shortName` | string | Abbreviated name (e.g., "LRCC") | Reports, exports |
| `tagline` | string | Text below club name (e.g., "CRICKET CLUB") | Layout.js (header, footer) |
| `motto` | string | Club motto/slogan | Layout.js (footer) |
| `description` | string | Full club description | Layout.js (footer) |

**Example:**
```javascript
name: "Leamington Royals",
shortName: "LRCC",
tagline: "CRICKET CLUB",
motto: "2 Teams, 1 Goal: Victory 🏏",
```

---

### 2. HERO SECTION (`hero`)

| Config Key | Type | Description | Used In |
|------------|------|-------------|---------|
| `hero.badge` | string | Top badge text showing leagues | HeroSection.jsx (line 32) |
| `hero.titleLine1` | string | First line of main title | HeroSection.jsx (line 37) |
| `hero.titleLine2` | string | Second line with gradient effect | HeroSection.jsx (line 38-40) |
| `hero.subtitle` | string | Subtitle/description text | HeroSection.jsx (line 44) |
| `hero.backgroundImage` | string | Hero background image URL | HeroSection.jsx (line 23) |
| `hero.stats` | array | Array of stat objects `{value, label}` | HeroSection.jsx (line 60-68) |

**Example:**
```javascript
hero: {
  badge: "WCL Div 9 & 10 | LMS League | Eagle Premier League",
  titleLine1: "LEAMINGTON",
  titleLine2: "ROYALS CC",
  subtitle: "2 Teams, 1 Goal: Victory...",
  backgroundImage: "https://images.unsplash.com/...",
  stats: [
    { value: '2', label: 'Teams' },
    { value: '3', label: 'Leagues' },
  ],
},
```

---

### 3. PAGE CONTENT (`pages`)

Each page has its own configuration object with consistent properties:

#### 3.1 Team Page (`pages.team`)

| Config Key | Type | Description | Used In |
|------------|------|-------------|---------|
| `pages.team.subtitle` | string | Hero section subtitle | Team.js (line 44) |
| `pages.team.title` | string | Hero section title | Team.js (line 47) |
| `pages.team.description` | string | Hero section description | Team.js (line 50) |
| `pages.team.backgroundImage` | string | Hero background image URL | Team.js (line 37) |

#### 3.2 Fixtures Page (`pages.fixtures`)

| Config Key | Type | Description | Used In |
|------------|------|-------------|---------|
| `pages.fixtures.subtitle` | string | Hero section subtitle (e.g., "Season 2024") | Fixtures.js (line 39) |
| `pages.fixtures.title` | string | Hero section title | Fixtures.js (line 42) |
| `pages.fixtures.description` | string | Hero section description | Fixtures.js (line 45) |
| `pages.fixtures.backgroundImage` | string | Hero background image URL | Fixtures.js (line 33) |

#### 3.3 Contact Page (`pages.contact`)

| Config Key | Type | Description | Used In |
|------------|------|-------------|---------|
| `pages.contact.subtitle` | string | Hero section subtitle | Contact.js (line 75) |
| `pages.contact.title` | string | Hero section title | Contact.js (line 78) |
| `pages.contact.description` | string | Hero section description | Contact.js (line 81) |
| `pages.contact.backgroundImage` | string | Hero background image URL | Contact.js (line 69) |
| `pages.contact.successMessage` | string | Form submission success message | Contact.js (line 136) |

#### 3.4 Gallery Page (`pages.gallery`)

| Config Key | Type | Description | Used In |
|------------|------|-------------|---------|
| `pages.gallery.subtitle` | string | Hero section subtitle | Gallery.js |
| `pages.gallery.title` | string | Hero section title | Gallery.js |
| `pages.gallery.description` | string | Hero section description | Gallery.js |
| `pages.gallery.backgroundImage` | string | Hero background image URL | Gallery.js |

#### 3.5 News Page (`pages.news`)

| Config Key | Type | Description | Used In |
|------------|------|-------------|---------|
| `pages.news.subtitle` | string | Hero section subtitle | News.js |
| `pages.news.title` | string | Hero section title | News.js |
| `pages.news.description` | string | Hero section description | News.js |
| `pages.news.backgroundImage` | string | Hero background image URL | News.js |

---

### 4. CALL TO ACTION (`callToAction`)

| Config Key | Type | Description | Used In |
|------------|------|-------------|---------|
| `callToAction.title` | string | Main title text | CallToAction.jsx (line 37) |
| `callToAction.titleHighlight` | string | Highlighted part of title (amber color) | CallToAction.jsx (line 38) |
| `callToAction.description` | string | Description paragraph | CallToAction.jsx (line 42) |
| `callToAction.backgroundImage` | string | Section background image URL | CallToAction.jsx (line 27) |
| `callToAction.primaryButtonText` | string | Primary button label | CallToAction.jsx (line 51) |
| `callToAction.secondaryButtonText` | string | Secondary button label | CallToAction.jsx (line 60) |

---

### 5. CONTACT INFORMATION (`contact`)

| Config Key | Type | Description | Used In |
|------------|------|-------------|---------|
| `contact.address.lines` | array | Address lines | Contact.js (line 42) |
| `contact.phone.lines` | array | Phone numbers | Contact.js (line 47) |
| `contact.email.lines` | array | Email addresses | Contact.js (line 52) |
| `contact.hours.lines` | array | Office hours | Contact.js (line 57) |
| `contact.mapEmbedUrl` | string | Google Maps embed URL | Contact.js (line 113) |

**Example:**
```javascript
contact: {
  address: {
    lines: ["Leamington Royals Ground", "Warwickshire", "UK"],
  },
  phone: {
    lines: ["Contact via social media"],
  },
  email: {
    lines: ["Via Instagram DM", "@leamingtonroyals"],
  },
  hours: {
    lines: ["Match Days: As scheduled", "Training: Check social media"],
  },
  mapEmbedUrl: "https://www.google.com/maps/embed?...",
},
```

---

### 6. COLORS & THEMING (`colors`)

| Config Key | Type | Description | Used In |
|------------|------|-------------|---------|
| `colors.primary` | string | Main brand color (hex) | Layout.js, FinancialReports.jsx |
| `colors.primaryLight` | string | Lighter brand color | Various components |
| `colors.accent` | string | Accent/highlight color (gold) | Layout.js (icons, social links) |
| `colors.accentLight` | string | Lighter accent color | Various components |
| `colors.headerBg` | string | Header background (Tailwind class) | Layout.js (line 49) |
| `colors.headerText` | string | Header text color | Layout.js |
| `colors.nameColor` | string | Club name color when scrolled | Layout.js (line 56) |
| `colors.footerBg` | string | Footer background | Layout.js |

---

### 7. LOCATION

| Config Key | Type | Description | Used In |
|------------|------|-------------|---------|
| `location` | string | Club location | Layout.js (footer, line 115) |

---

### 8. SOCIAL MEDIA (`social`)

| Config Key | Type | Description | Used In |
|------------|------|-------------|---------|
| `social.instagram` | string | Instagram profile URL (empty to hide) | Layout.js (footer, line 126) |
| `social.youtube` | string | YouTube channel URL (empty to hide) | Layout.js (footer, line 135) |
| `social.twitter` | string | Twitter/X profile URL (empty to hide) | Layout.js (footer, line 144) |
| `social.facebook` | string | Facebook page URL (empty to hide) | Layout.js (footer, line 153) |

**Note:** Leave value as empty string `""` to hide that social link.

---

### 9. FINANCIAL SETTINGS (`finance`)

| Config Key | Type | Description | Used In |
|------------|------|-------------|---------|
| `finance.currency` | string | Currency symbol (e.g., "£") | All finance components |
| `finance.currencyCode` | string | ISO currency code (e.g., "GBP") | Exports, reports |
| `finance.defaultMatchFee` | number | Default match fee per player | MatchFeeManager.jsx (line 18) |
| `finance.fiscalYearStart` | string | Month fiscal year starts | getCurrentFiscalYear() helper |

---

### 10. MEMBERSHIP FEES (`membershipFees`)

| Config Key | Type | Description | Used In |
|------------|------|-------------|---------|
| `membershipFees.Junior` | number | Junior membership fee | MembershipManager.jsx, InvoiceManager.jsx |
| `membershipFees.Adult` | number | Adult membership fee | MembershipManager.jsx, InvoiceManager.jsx |
| `membershipFees.Family` | number | Family membership fee | MembershipManager.jsx, InvoiceManager.jsx |
| `membershipFees.Senior` | number | Senior membership fee | MembershipManager.jsx, InvoiceManager.jsx |
| `membershipFees.Life` | number | Life membership fee | MembershipManager.jsx, InvoiceManager.jsx |
| `membershipFees.Corporate` | number | Corporate membership fee | MembershipManager.jsx, InvoiceManager.jsx |

---

### 11. REPORT BRANDING (`reports`)

| Config Key | Type | Description | Used In |
|------------|------|-------------|---------|
| `reports.title` | string | Report header title | FinancialReports.jsx (PDF export) |
| `reports.confidentialText` | string | Footer confidential text | FinancialReports.jsx (PDF export) |

---

### 12. DEFAULT STATS (`defaultStats`)

| Config Key | Type | Description | Used In |
|------------|------|-------------|---------|
| `defaultStats.matches_played` | number | Default matches played | ClubStatsSection.jsx (line 12) |
| `defaultStats.matches_won` | number | Default matches won | ClubStatsSection.jsx |
| `defaultStats.total_runs` | number | Default total runs | ClubStatsSection.jsx |
| `defaultStats.total_wickets` | number | Default total wickets | ClubStatsSection.jsx |
| `defaultStats.trophies_won` | number | Default trophies won | ClubStatsSection.jsx |

---

## Helper Functions

### `formatCurrency(amount)`
Formats a number as currency using club settings.

**Usage:**
```javascript
import { formatCurrency } from '@/components/ClubConfig';
formatCurrency(100); // Returns "£100"
```

**Used in:** FinancialReports.jsx, various finance components

---

### `getCurrentFiscalYear()`
Returns the current fiscal year based on club settings.

**Usage:**
```javascript
import { getCurrentFiscalYear } from '@/components/ClubConfig';
getCurrentFiscalYear(); // Returns "2024-2025"
```

**Used in:** BudgetManager.jsx, FinancialReports.jsx

---

### `getFullClubName()`
Returns the full club name with tagline.

**Usage:**
```javascript
import { getFullClubName } from '@/components/ClubConfig';
getFullClubName(); // Returns "Leamington Royals Cricket Club"
```

---

## File Reference Map

| File | Config Keys Used |
|------|------------------|
| **Layout.js** | `name`, `tagline`, `motto`, `description`, `location`, `colors.*`, `social.*` |
| **HeroSection.jsx** | `hero.*` |
| **CallToAction.jsx** | `callToAction.*` |
| **ClubStatsSection.jsx** | `defaultStats.*` |
| **Team.js** | `pages.team.*` |
| **Fixtures.js** | `pages.fixtures.*` |
| **Contact.js** | `pages.contact.*`, `contact.*` |
| **Gallery.js** | `pages.gallery.*` |
| **News.js** | `pages.news.*` |
| **Finance.js** | `finance.*` |
| **MembershipManager.jsx** | `membershipFees.*` |
| **MatchFeeManager.jsx** | `finance.defaultMatchFee` |
| **InvoiceManager.jsx** | `name`, `membershipFees.*`, `finance.*` |
| **FinancialReports.jsx** | `reports.*`, `colors.primary`, `finance.currency` |

---

## How to Customize

1. Open `components/ClubConfig.js`
2. Find the section you want to modify
3. Update the values
4. Save the file - changes reflect immediately across the site

**Example - Change club name:**
```javascript
// Before
name: "Leamington Royals",

// After
name: "Your Club Name",
```

**Example - Update membership fees:**
```javascript
membershipFees: {
  Junior: 30,    // Changed from 25
  Adult: 100,    // Changed from 75
  // ... other tiers
},
``