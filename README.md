# Feedants Competition Details

A functional React Native + Node.js + Express + MongoDB implementation of the Feedants Competition Details assignment.

The screen follows the supplied reference closely, but the data is loaded from the API and important actions are functional rather than hardcoded.

## What is included

- React Native mobile app using Expo
- Node.js + Express REST API
- MongoDB + Mongoose data models
- Dynamic competition details
- Registration with capacity protection
- Registration state for the current demo user
- Countdown based on the competition registration deadline
- Competition lifecycle states
- Previous winners and rewards loaded from MongoDB
- Tabs for About / Judging / Rules
- Intro video modal
- Referral link copy interaction
- Submission action with a simple demo upload flow
- Error, loading and empty states
- Atomic registration logic using a MongoDB transaction and unique registration index
- Seed script with the competition shown in the reference

## Project structure

```text
feedants-competition-app/
├── mobile/                 # Expo React Native app
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── theme/
│   │   └── utils/
│   ├── App.js
│   └── package.json
├── server/                 # Express + MongoDB API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── seed/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── assets/
    └── reference/
        └── objective-page.png
```

## Run the backend

Requirements:

- Node.js 20+
- MongoDB Atlas or a local MongoDB replica set

```bash
cd server
npm install
copy .env.example .env
```

On macOS/Linux use:

```bash
cp .env.example .env
```

Update `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/feedants
CLIENT_ORIGIN=*
```

Then seed and start:

```bash
npm run seed
npm run dev
```

The API runs on `http://localhost:5000`.

For a physical phone, use the LAN IP of the computer instead of `localhost`, for example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:5000/api
```

## Run the mobile app

```bash
cd mobile
npm install
```

Create `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

Then:

```bash
npx expo start
```

Use Expo Go or an Android/iOS simulator.

### Android emulator

If the backend is running on your computer, use:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api
```

### Physical device

Use your computer's local network IP:

```env
EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:5000/api
```

## API

### Get competition

```http
GET /api/competitions/feedants-classical-dance
```

### Get registration state

```http
GET /api/competitions/:competitionId/registration?userId=demo-user-001
```

### Register

```http
POST /api/competitions/:competitionId/register
Content-Type: application/json

{
  "userId": "demo-user-001"
}
```

### Create submission

```http
POST /api/competitions/:competitionId/submissions
Content-Type: application/json

{
  "userId": "demo-user-001",
  "videoUrl": "https://example.com/demo-video.mp4"
}
```

## Technical decisions

### Registration consistency

The registration endpoint uses a MongoDB transaction. The competition document is updated only when there is remaining capacity, while the registration collection has a unique compound index on `(competitionId, userId)`.

This prevents two registrations from consuming the same logical slot and makes duplicate registration requests idempotent.

### Dynamic UI

The mobile screen does not contain the competition's prize, fee, dates, spots, winners or rules as UI constants. Those values are returned by the API.

### Competition lifecycle

The server derives a state from the current time:

- `upcoming`
- `registration_open`
- `submission_open`
- `closed`

The client uses that state to decide which actions are available.

### Authentication assumption

The assignment focuses on the Competition Details feature. A real application would use the platform's existing authentication service. For this standalone implementation, a stable demo user (`demo-user-001`) is used so registration and submission state can be demonstrated without building an unrelated authentication system.

### Trade-offs

For the assignment, one competition endpoint keeps the mobile flow simple. In a larger product, pagination, caching, authentication middleware, rate limiting and an API gateway would be added.

### Production follow-ups

- JWT/OAuth authentication
- Object storage for video submissions
- Background video processing
- Redis caching for high-read competition pages
- Rate limiting
- Observability and structured logs
- Admin APIs for competition management
- Automated tests and CI/CD
- Push notifications for deadline and result events

## Design

The visual direction keeps the reference's clean white cards and teal information hierarchy, then adds a warmer coral accent and soft lavender surfaces so the screen feels more like a real consumer product than a pixel copy.

The supplied reference image is included at:

`assets/reference/objective-page.png`

## Submission checklist

- [x] React Native implementation
- [x] Node.js + Express backend
- [x] MongoDB models
- [x] Dynamic competition data
- [x] Registration state
- [x] Remaining spots
- [x] Time-dependent countdown
- [x] Competition lifecycle
- [x] Concurrency-safe registration
- [x] Functional interactions
- [x] Environment variable examples
- [x] Setup instructions
