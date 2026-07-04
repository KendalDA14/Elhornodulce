export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  images: ProductImageView[];
  visibleIngredients: string | null;
  estimatedDelivery: string;
  isFeatured: boolean;
  averageRating: number;
  ratingCount: number;
  productReviews: ProductReviewView[];
  originalPrice: number;
  discountPercent: number | null;
  promotionName: string | null;
  promotionEndsAt: string | null;
  priceFinal: number;
  isAvailable: boolean;
  categoryName: string;
};

export type ProductReviewView = {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
};

export type ProductImageView = {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
};

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  products: PublicProduct[];
};

export type PublicReview = {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
};

export type CartItemInput = {
  productId: string;
  quantity: number;
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  estimatedDelivery: string | null;
  originalPrice?: number | null;
  discountPercent?: number | null;
  promotionName?: string | null;
  quantity: number;
};

export type PromotionTickerItem = {
  id: string;
  name: string;
  discountPercent: number;
  scope: string;
  endsAt: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  helper: string;
};

export type ProductSalesMetric = {
  name: string;
  quantity: number;
  total: number;
};
