# MiniSocial — Mini Social Media App

A basic social media app: profiles, posts, comments, likes, and follow/unfollow — built with
HTML/CSS/vanilla JS on the frontend and Express.js + MongoDB on the backend, per the project plan.

## Stack
- **Frontend:** HTML, CSS, vanilla JavaScript (fetch API)
- **Backend:** Node.js + Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + bcrypt password hashing

## Project structure
```
social-app/
├── backend/
│   ├── server.js
│   ├── config/db.js
│   ├── models/        User, Post, Comment, Like, Follow
│   ├── routes/         auth, users, posts, comments
│   ├── controllers/    business logic for each route group
│   ├── middleware/      auth (JWT), central error handler
│   └── .env.example
├── frontend/
│   ├── index.html        feed (global / following toggle)
│   ├── profile.html       user profile
│   ├── post.html           single post + comments
│   ├── login.html / register.html
│   ├── edit-profile.html
│   ├── css/style.css
│   └── js/  api.js, auth.js, main.js, feed.js, profile.js, post.js, login.js, register.js, edit-profile.js
└── README.md
```

## Getting started

### 1. Prerequisites
- Node.js 18+
- A MongoDB instance — either local (`mongod`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 2. Install dependencies
```bash
cd backend
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```
Edit `.env` and set:
- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string

### 4. Run the app
```bash
npm run dev     # with nodemon, auto-restarts on changes
# or
npm start
```

The Express server serves both the API (`/api/...`) and the static frontend files, so once it's
running, open **http://localhost:5000** in your browser — no separate frontend server needed.

> If you'd rather run the frontend separately (e.g. with VS Code's Live Server), that also works —
> just make sure the backend is running on port 5000, since `frontend/js/api.js` calls `/api/...`
> as relative paths that assume the frontend is served by the same Express app. If you serve the
> frontend from a different origin, update `API_BASE` in `frontend/js/api.js` to the full backend URL.

## API overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create an account |
| POST | `/api/auth/login` | – | Log in, returns a JWT |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/users/:username` | – | Public profile |
| PUT | `/api/users/me` | ✅ | Edit bio/avatar |
| POST/DELETE | `/api/users/:id/follow` | ✅ | Follow / unfollow |
| GET | `/api/users/:id/followers` | – | Follower list |
| GET | `/api/users/:id/following` | – | Following list |
| GET | `/api/posts` | – | Global feed (paginated) |
| GET | `/api/posts/feed` | ✅ | Feed from followed users |
| GET | `/api/posts/:id` | – | Single post |
| POST | `/api/posts` | ✅ | Create post |
| DELETE | `/api/posts/:id` | ✅ | Delete post (owner only) |
| GET | `/api/posts/:id/comments` | – | List comments |
| POST | `/api/posts/:id/comments` | ✅ | Add comment |
| DELETE | `/api/comments/:id` | ✅ | Delete comment (owner only) |
| POST/DELETE | `/api/posts/:id/like` | ✅ | Like / unlike |
| GET | `/api/posts/:id/likes` | – | Who liked a post |

## Notes on the current implementation

- **Like/comment counts** are stored as denormalized counters on the `Post` document
  (`likeCount`, `commentCount`) and incremented/decremented atomically, per the plan.
- **Cascade cleanup:** deleting a post also deletes its comments and likes. Deleting a user
  account is out of scope for this basic version, as noted in the plan.
- **Self-follow guard** is enforced server-side in `userController.followUser`.
- **Validation:** post content is capped at 500 characters, comments at 300 — enforced both in
  the frontend (character counters, `maxlength`) and the backend (Mongoose schema + controller checks).
- **XSS safety:** all user-generated content is inserted via `escapeHtml()` in the frontend rather
  than raw HTML interpolation.
- **Profile page posts:** for simplicity, the profile page currently filters the first page of the
  global feed by author. For a production version, add a dedicated `GET /api/users/:id/posts`
  endpoint with its own pagination.
- **Pagination:** the feed uses simple page/limit query params with a "Load more" button rather
  than infinite scroll — swap in an IntersectionObserver if you want true infinite scroll.

## Switching to Django + PostgreSQL

The plan notes this design maps cleanly onto Django + DRF + PostgreSQL if you'd rather go that
route: the five models (User, Post, Comment, Like, Follow) translate directly to Django models,
the REST endpoints above translate to DRF viewsets/routes, and Django's built-in auth can replace
the custom JWT middleware. The frontend wouldn't need to change since it only talks to `/api/...`
over `fetch()`.

## Next steps / ideas
- Image upload (instead of just image URLs) via a storage service (S3, Cloudinary)
- Infinite scroll instead of "Load more"
- Real-time updates (WebSockets) for likes/comments
- Notifications (someone followed you / liked your post)
- Search for users or posts
