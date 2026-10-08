# Don't Block Me

A tiny quiz game: make a quiz about yourself, send the link to friends, and see how well they actually know you. Wrong answers might get you blocked :eyes:

- **Play:** https://zunnorainkoblockkonkrega.netlify.app
- **Source code:** https://github.com/zunnorain700-beep/dontblockmezunnorain

## How it works

Static front end (index.html) plus three Netlify Functions:

| Endpoint | Purpose |
| --- | --- |
| `POST /api/quiz` | Create a quiz, returns an id and a private leaderboard token |
| `GET /api/quiz?id=` | Fetch a quiz so a friend can play |
| `POST /api/answer` | Store a friend's answers (scored on the server) |
| `GET /api/board?id=&k=` | Read the leaderboard (requires the private token) |

Data is persisted server-side, so nothing important is kept only in the browser.