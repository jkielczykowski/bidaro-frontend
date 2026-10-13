import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RedirectAuction, RedirectAuctionEdit, RedirectMessage } from './components/LegacyRedirects'
import { Layout } from './components/Layout'
import { AuthProvider } from './lib/auth'
import { NotificationsProvider } from './lib/notifications'
import { UnreadMessagesProvider } from './lib/unreadMessages'
import { AuctionDetailPage } from './pages/AuctionDetailPage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { CreateAuctionPage } from './pages/CreateAuctionPage'
import { VerifyPhonePage } from './pages/VerifyPhonePage'
import { EditAuctionPage } from './pages/EditAuctionPage'
import { HomePage } from './pages/HomePage'
import { LandingPage } from './pages/LandingPage'
import { MessagesPage } from './pages/MessagesPage'
import { MyActivityPage } from './pages/MyActivityPage'
import { MyBiddingPage } from './pages/MyBiddingPage'
import { MyFeesPage } from './pages/MyFeesPage'
import { MyHubPage } from './pages/MyHubPage'
import { MySellingPage } from './pages/MySellingPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { AdminModerationPage } from './pages/AdminModerationPage'
import { ProfileSettingsPage } from './pages/ProfileSettingsPage'
import { PrivacyPolicyPage, TermsPage, SupportPage, AccountDeletionPage } from './pages/LegalPages'
import './index.css'

export default function App() {
  return (
    <AuthProvider>
      <UnreadMessagesProvider>
        <NotificationsProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auctions" element={<HomePage />} />
                <Route path="/auction/:id" element={<AuctionDetailPage />} />
                <Route path="/auction/:id/edit" element={<EditAuctionPage />} />
                <Route path="/sell" element={<CreateAuctionPage />} />
                <Route path="/verify-phone" element={<VerifyPhonePage />} />
                <Route path="/my" element={<MyHubPage />} />
                <Route path="/my/selling" element={<MySellingPage />} />
                <Route path="/my/bidding" element={<MyBiddingPage />} />
                <Route path="/my/fees" element={<MyFeesPage />} />
                <Route path="/my/activity" element={<MyActivityPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/admin/moderation" element={<AdminModerationPage />} />
                <Route path="/settings" element={<ProfileSettingsPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/messages/:id" element={<MessagesPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/pomoc" element={<SupportPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/usun-konto" element={<AccountDeletionPage />} />
                <Route path="/delete-account" element={<AccountDeletionPage />} />

                <Route path="/aukcje" element={<Navigate to="/auctions" replace />} />
                <Route path="/aukcja/:id" element={<RedirectAuction />} />
                <Route path="/aukcja/:id/edycja" element={<RedirectAuctionEdit />} />
                <Route path="/wystaw" element={<Navigate to="/sell" replace />} />
                <Route path="/moje" element={<Navigate to="/my" replace />} />
                <Route path="/moje/aukcje" element={<Navigate to="/my/selling" replace />} />
                <Route path="/moje/licytuje" element={<Navigate to="/my/bidding" replace />} />
                <Route path="/moje/oplaty" element={<Navigate to="/my/fees" replace />} />
                <Route path="/moje/aktywnosc" element={<Navigate to="/my/activity" replace />} />
                <Route path="/powiadomienia" element={<Navigate to="/notifications" replace />} />
                <Route path="/ustawienia" element={<Navigate to="/settings" replace />} />
                <Route path="/wiadomosci" element={<Navigate to="/messages" replace />} />
                <Route path="/wiadomosci/:id" element={<RedirectMessage />} />
                <Route path="/logowanie" element={<Navigate to="/login" replace />} />
                <Route path="/rejestracja" element={<Navigate to="/register" replace />} />
                <Route path="/prywatnosc" element={<Navigate to="/privacy" replace />} />
                <Route path="/regulamin" element={<Navigate to="/terms" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </NotificationsProvider>
      </UnreadMessagesProvider>
    </AuthProvider>
  )
}
