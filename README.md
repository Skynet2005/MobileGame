# Skynetic's World Game

A modern, multiplayer web-based game built with Next.js, Three.js, and WebSocket technology. This project combines real-time 3D graphics with multiplayer functionality and a chat system.

## 🚀 Features

- **3D Game Environment** - Built with Three.js
- **Real-time Multiplayer** - WebSocket-based multiplayer system
- **Chat System** - Real-time chat functionality
- **Modern UI** - Built with Tailwind CSS and Headless UI
- **Authentication** - Secure user authentication system
- **Database Integration** - Prisma ORM with SQLite database

## 🛠️ Tech Stack

- **Frontend:**
  - Next.js 15.2.2
  - React 19
  - Three.js
  - Tailwind CSS
  - Headless UI

- **Backend:**
  - Node.js
  - WebSocket (ws)
  - Prisma ORM
  - SQLite Database

- **Development Tools:**
  - TypeScript
  - ESLint
  - Prisma Studio
  - Concurrent Development Server

## 🏗️ Project Structure

```
src/
├── app/         # Next.js app router pages
├── chat/        # WebSocket chat implementation
├── components/  # Reusable React components
├── database/    # Database configurations
├── lib/         # Utility functions and helpers
├── services/    # Business logic and services
├── system/      # Core game system logic
├── types/       # TypeScript type definitions
└── ui/          # UI components and layouts
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Skynet2005/MobileGame.git
   cd MobileGame
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. Create a .env file with required environment variables (see .env.example)

### Development

Run the development server:

```bash
# Run Next.js frontend only
npm run dev

# Run chat server only
npm run dev:chat

# Run both frontend and chat server
npm run dev:all
```

### Database Management

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

## 🎮 Game Features

- 3D world exploration
- Real-time multiplayer interaction
- In-game chat system
- Character customization
- Game progression system

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Feel free to use, modify, and distribute this code as per the terms of the MIT License.

## 🙏 Acknowledgments

- Three.js community for 3D graphics support
- Next.js team for the amazing framework
- All contributors and supporters of the project
