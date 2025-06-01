# Topsky.app

Professional Pilot Dashboard & Aviation Blog - ACARS Data & Flight Tracking

[![Update ArgoCD Manifest Repo](https://github.com/laszewskimariusz/nApi/actions/workflows/deploy.yml/badge.svg)](https://github.com/laszewskimariusz/nApi/actions/workflows/deploy.yml)

## About

Topsky.app is a comprehensive aviation platform designed for professional pilots and aviation enthusiasts. It provides:

- **Real-time ACARS Data**: Live aircraft communications and flight data
- **Pilot Dashboard**: Professional tools for flight tracking and operational insights
- **Aviation Blog**: Latest industry news, trends, and pilot insights
- **Interactive Maps**: Real-time flight visualization with customizable themes
- **Flight Analytics**: Advanced reporting and performance analysis

## Features

- 🛩️ Real-time ACARS message processing
- 📊 Professional pilot dashboard
- 🗺️ Interactive flight maps
- 📰 Aviation news and insights
- 🔄 Automatic data fetching and processing
- 🌐 Global flight coverage
- 📱 Responsive design for all devices

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEWSKY_API_KEY=your_newsky_api_key_here
NEXT_PUBLIC_NEWSKY_API_KEY=your_newsky_api_key_here
MONGODB_URI=your_mongodb_connection_string_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: MongoDB
- **Data Source**: NewSky ACARS API
- **Deployment**: Docker, ArgoCD

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
