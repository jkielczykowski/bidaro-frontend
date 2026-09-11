import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider } from './lib/auth'
import { UnreadMessagesProvider } from './lib/unreadMessages'
import { AuctionDetailPage } from './pages/AuctionDetailPage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { CreateAuctionPage } from './pages/CreateAuctionPage'
import { EditAuctionPage } from './pages/EditAuctionPage'
import { HomePage } from './pages/HomePage'
import { LandingPage } from './pages/LandingPage'
import { MessagesPage } from './pages/MessagesPage'
import { MyAuctionsPage } from './pages/MyAuctionsPage'
import './index.css'

export default function App() {
  return (
    <AuthProvider>
      <UnreadMessagesProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/aukcje" element={<HomePage />} />
              <Route path="/aukcja/:id" element={<AuctionDetailPage />} />
              <Route path="/aukcja/:id/edycja" element={<EditAuctionPage />} />
              <Route path="/wystaw" element={<CreateAuctionPage />} />
              <Route path="/moje" element={<MyAuctionsPage />} />
              <Route path="/wiadomosci" element={<MessagesPage />} />
              <Route path="/wiadomosci/:id" element={<MessagesPage />} />
              <Route path="/logowanie" element={<LoginPage />} />
              <Route path="/rejestracja" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </UnreadMessagesProvider>
    </AuthProvider>
  )
}
