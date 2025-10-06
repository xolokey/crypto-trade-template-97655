# Indian Stock Tracker

A modern, real-time stock tracking application for Indian markets, featuring Nifty 50 and Sensex 30 stocks with advanced analytics and personalized watchlists.

## 🚀 Features

- **Real-time Stock Data**: Live tracking of Indian stock prices
- **Advanced Analytics**: Comprehensive charts and technical indicators
- **Personalized Watchlists**: Create and manage custom stock portfolios
- **Responsive Design**: Optimized for desktop and mobile devices
- **PWA Support**: Install as a native app on any device
- **Dark/Light Theme**: Customizable user interface

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Radix UI, Tailwind CSS
- **Animations**: Framer Motion, Aceternity UI
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (Database, Auth, Real-time)
- **Charts**: Recharts
- **Routing**: React Router DOM

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- Git

### Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd indian-stock-tracker

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_URL=your_supabase_url
VITE_APP_ENV=development
```

## 🚀 Deployment

### Deploy to Vercel

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure Environment Variables**:
   - Add all environment variables from `.env.production`
   - Ensure `VITE_APP_ENV=production`

3. **Deploy**:
   - Vercel will automatically build and deploy
   - Your app will be available at `https://your-app.vercel.app`

### Manual Deployment

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to Vercel CLI
npx vercel --prod
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── features/       # Feature-specific components
│   └── ErrorBoundary.tsx
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── config/             # Configuration files
├── utils/              # Helper functions
└── integrations/       # External service integrations

public/
├── manifest.json       # PWA manifest
├── sw.js              # Service worker
├── robots.txt         # SEO robots file
└── sitemap.xml        # SEO sitemap
```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # Run TypeScript checks
npm run analyze      # Analyze bundle size
```

## 🌟 Production Optimizations

### Performance
- **Code Splitting**: Lazy loading of route components
- **Bundle Optimization**: Optimized chunk splitting
- **Caching**: Service worker for offline support
- **Image Optimization**: Optimized asset loading

### SEO & Accessibility
- **Meta Tags**: Comprehensive SEO meta tags
- **Open Graph**: Social media sharing optimization
- **Sitemap**: XML sitemap for search engines
- **Robots.txt**: Search engine crawling instructions

### Security
- **Environment Variables**: Secure configuration management
- **Headers**: Security headers via Vercel configuration
- **Error Boundaries**: Graceful error handling

### Monitoring
- **Web Vitals**: Core Web Vitals tracking
- **Error Tracking**: Production error monitoring
- **Performance Metrics**: Bundle size analysis

## 🔒 Security Considerations

- Environment variables are properly configured
- Supabase RLS (Row Level Security) policies implemented
- HTTPS enforced in production
- Security headers configured via Vercel

## 📱 PWA Features

- **Offline Support**: Service worker caching
- **Install Prompt**: Add to home screen
- **App-like Experience**: Standalone display mode
- **Responsive Design**: Mobile-first approach

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@yourapp.com or create an issue in the repository.

## 🔗 Links

- **Live Demo**: [https://your-app.vercel.app](https://your-app.vercel.app)
- **Documentation**: [Link to docs]
- **API Documentation**: [Link to API docs]
