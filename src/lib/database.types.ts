export type AuctionStatus = 'draft' | 'active' | 'ended' | 'sold' | 'cancelled'

export type Profile = {
  id: string
  username: string | null
  display_name: string | null
  city: string | null
  phone: string | null
  phone_verified_at?: string | null
  avatar_url: string | null
  bio: string | null
  rating_avg: number
  rating_count: number
  is_admin?: boolean
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  name: string
  icon: string | null
  parent_id?: string | null
  sort_order?: number
  fee_percent?: number
}

export type SellerFee = {
  id: string
  auction_id: string
  seller_id: string
  sale_price: number
  fee_percent: number
  fee_amount: number
  status: 'pending' | 'paid' | 'cancelled' | 'waived'
  created_at: string
}

export type Auction = {
  id: string
  seller_id: string
  category_id: string | null
  title: string
  description: string
  image_urls: string[]
  starting_price: number
  reserve_price: number | null
  current_price: number
  bid_increment: number
  buy_now_price: number | null
  status: AuctionStatus
  starts_at: string
  ends_at: string
  winner_id: string | null
  city: string | null
  lat?: number | null
  lng?: number | null
  seller_notes?: SellerNote[] | null
  shipping_options: string[]
  watch_count: number
  bid_count: number
  /** 7 or 14 — used for auto-renew window */
  duration_days?: number | null
  /** If true and unsold at end → extend another duration_days */
  auto_renew?: boolean | null
  moderation_status?: 'approved' | 'pending_review' | 'rejected'
  moderation_reasons?: string[]
  moderation_notes?: string | null
  created_at: string
  updated_at: string
  seller?: Profile | null
  category?: Category | null
}

export type SellerNote = {
  body: string
  created_at: string
}

export type SellerRating = {
  id: string
  auction_id: string
  seller_id: string
  buyer_id: string
  score: number
  comment: string | null
  created_at: string
}

export type AuctionComment = {
  id: string
  auction_id: string
  author_id: string
  body: string
  created_at: string
  /** null = root question; set = seller reply in that thread */
  parent_id?: string | null
  author?: Profile | null
}

export type Bid = {
  id: string
  auction_id: string
  bidder_id: string
  amount: number
  max_amount: number | null
  created_at: string
  bidder?: Profile | null
}

export type Conversation = {
  id: string
  auction_id: string
  buyer_id: string
  seller_id: string
  created_at: string
  buyer_last_read_at: string | null
  seller_last_read_at: string | null
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile> }
      categories: { Row: Category; Insert: Category; Update: Partial<Category> }
      auctions: {
        Row: Auction
        Insert: Omit<Auction, 'id' | 'created_at' | 'updated_at' | 'bid_count' | 'watch_count' | 'seller' | 'category'> & {
          id?: string
          bid_count?: number
          watch_count?: number
        }
        Update: Partial<Auction>
      }
      bids: {
        Row: Bid
        Insert: Omit<Bid, 'id' | 'created_at' | 'bidder'>
        Update: Partial<Bid>
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Conversation>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Message>
      }
    }
    Functions: {
      place_bid: {
        Args: { p_auction_id: string; p_amount: number; p_max_amount?: number | null }
        Returns: Bid
      }
      append_seller_note: {
        Args: { p_auction_id: string; p_body: string }
        Returns: Auction
      }
      rate_seller: {
        Args: { p_auction_id: string; p_score: number; p_comment?: string | null }
        Returns: SellerRating
      }
      buy_now: {
        Args: { p_auction_id: string }
        Returns: Auction
      }
      close_expired_auctions: {
        Args: Record<string, never>
        Returns: number
      }
      get_or_create_conversation: {
        Args: { p_auction_id: string }
        Returns: Conversation
      }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: Conversation
      }
      unread_messages_count: {
        Args: Record<string, never>
        Returns: number
      }
      count_auctions: {
        Args: { p_query?: string | null; p_category_id?: string | null; p_status?: string | null }
        Returns: number
      }
      end_auction: {
        Args: { p_auction_id: string }
        Returns: Auction
      }
    }
  }
}
