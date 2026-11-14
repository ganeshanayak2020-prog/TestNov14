# TaskFlow — Personal Task Manager

A responsive task manager built with React and Vite. It includes task creation, editing, completion, deletion, a monthly calendar, due-date status, filters, search, and a progress dashboard.

## Features

- Create, edit, complete, and delete tasks
- Set a due date (or leave it blank) and choose Low / Medium / High priority
- Monthly calendar with task markers; select a date to see its tasks
- Automatic task statuses: Overdue, Due today, Upcoming, No due date, and Completed
- Dashboard counts for total, due today, overdue, completed, pending, and upcoming tasks
- Completion percentage and progress breakdown
- Search and filter your task list
- Responsive layout for desktop, tablet, and mobile
- Data is saved in the browser using `localStorage`

## Run locally

You need Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

To test a production build:

```bash
npm run build
npm run preview
```

## Publish to GitHub

1. Create a new, empty repository on GitHub.
2. Extract this ZIP file.
3. Open a terminal in the extracted `taskflow-task-manager` folder.
4. Run:

```bash
git init
git add .
git commit -m "Initial TaskFlow app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your repository URL.

## Deploy on Vercel

1. Sign in to Vercel and choose **Add New → Project**.
2. Import the GitHub repository you created.
3. Vercel should detect Vite automatically.
4. Confirm these settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
5. Select **Deploy**.

No environment variables are required.

## Important notes about data

This starter version stores tasks in the browser where the app is opened. Your tasks are not synced between browsers or devices, and clearing the browser's site data can remove them. For multi-device access, sign-in, backups, or shared task lists, connect a database and authentication service (for example, Supabase) in a later version.

## Project structure

```text
taskflow-task-manager/
├── index.html
├── package.json
├── README.md
├── public/
└── src/
    ├── App.jsx
    ├── main.jsx
    └── styles.css
```
