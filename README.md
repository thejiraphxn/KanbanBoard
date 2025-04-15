# 📌 Project Summary – Kanban Jam Board

## This project is a **web-based Kanban task management system** that allows users to:

- 🧑‍💻 Register and log in with secure authentication using **bcrypt** and **JWT**
- 🪪 Manage user sessions and roles (e.g. **admin**, **guest**)
- 🧠 Create Kanban boards and add **tasks/cards** inside columns
- 🔄 Drag and drop tasks across different columns using **real-time interaction**
- 🔔 Receive instant updates via **WebSocket (Flask-SocketIO)** when changes occur
- 👥 Invite collaborators to join boards and manage tasks together
- 📆 Track time and task progress with **timestamps and status**
- 🌐 Use **RESTful APIs** to communicate between the frontend and Flask backend
- 🔐 CORS support for cross-origin frontend/backend separation
- 🌎 Timezone-aware timestamps using **pytz**
- 🧾 Backend written in **Python** with **MySQL** for persistent storage

The system also supports **UUID/short UUID** for uniquely identifying boards and tasks, and is optimized for real-time collaboration workflows.
