# Skillverse

Skillverse is a community learning website where people can find others who know the skills they want to learn and start useful conversations with them. Instead of treating learning as a one-way course, the site is built around sharing knowledge between people.

Users can create a profile, add the skills they know, search for people by skill or name, and message them. Conversations can include file attachments and Google Meet invitations. The app also has a skill exchange feature that recognises when two people have successfully taught and learned from each other.

## What The Website Provides

- Account creation and direct login with username, email, and password
- Profile editing with a bio, skills, and profile image
- Search for people by name, profile description, or skill
- Chat conversations with live polling for new messages
- Message attachments
- Unread message counts and online activity indicators
- Google Meet invitations when Google Calendar is configured
- Skill exchange tracking and experience points
- Light and dark visual themes

## How It Is Useful

Skillverse is useful for people who learn best through conversation and practice. A learner can search for someone with relevant experience, ask questions, share examples, and arrange a meeting. At the same time, experienced users can discover people who want to learn from them and build a learning network.

The project is also a practical example of a full-stack application. The frontend is a React interface, while the backend provides a Django REST API, JWT authentication, profile management, conversations, file uploads, and SQLite persistence.

## Project Structure

```text
Skillverse/
├── Front-end/          React and Vite application
│   ├── src/             Pages, components, styles, and assets
│   └── package.json     Frontend scripts and dependencies
├── Back-end/            Django REST API
│   ├── accounts/        Authentication, profiles, chat, and skills
│   ├── Ssh_backend/     Django project settings and URLs
│   ├── media/           Uploaded profile images and attachments
│   ├── db.sqlite3       Local development database
│   └── requirements.txt Python dependencies
└── README.md
```

## Requirements

Install the following before running the project:

- Python 3.11 or newer
- Node.js 18 or newer
- npm

## Running The Backend

Open a terminal in the `Back-end` directory:

```powershell
cd Back-end
python -m venv .venv
\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API will be available at:

```text
http://127.0.0.1:8000/
```

The frontend expects the accounts API at `http://127.0.0.1:8000/api/accounts`.

### Backend Configuration

The app can run locally using the existing SQLite database. For services that need external configuration, copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Set `RESEND_API_KEY` only if email delivery is enabled in the future. Email verification is not part of the current login or registration flow; users go directly to the homepage after successful authentication.

Google Meet support is optional. To enable it, provide Google OAuth credentials and configure the related environment variables used by `GoogleMeetView` in `Back-end/accounts/views.py`.

## Running The Frontend

Open a second terminal in the `Front-end` directory:

```powershell
cd Front-end
npm install
npm run dev
```

Vite will print the local development URL, normally:

```text
http://localhost:5173/
```

Open that URL in a browser after the backend is running.

## Useful Commands

Run these commands from `Front-end`:

```powershell
npm run lint
npm run build
npm run preview
```

Run these commands from `Back-end`:

```powershell
python manage.py check
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

## Basic Usage

1. Open the frontend and choose to create an account.
2. Enter a username, email, password, profile description, and optional skills or image.
3. After registration, the app opens the homepage.
4. Use the search bar to find a person by name or skill.
5. Select a profile to open a conversation.
6. Send messages, attach files, or create a Google Meet invitation if that integration is configured.
7. Open Chats to return to previous conversations and view unread messages.

## Notes For Development

- The frontend currently uses `http://127.0.0.1:8000` as the backend address. Change the `API_BASE` constants if the backend runs on another host or port.
- Uploaded files are stored under `Back-end/media/` during local development.
- The default database is SQLite and is suitable for development, not production deployment.
- Run `python manage.py migrate` whenever new migrations are added or when the backend reports an unapplied migration.
- Keep API keys, OAuth credentials, and other secrets in `.env` or another secret store. Do not commit them to source control.

**BY/-
	Architects of Future.

**Beware it is made by one of the GPT**
