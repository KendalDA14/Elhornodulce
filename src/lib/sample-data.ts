import type {
  DashboardMetric,
  ProductSalesMetric,
  PublicCategory,
  PublicProduct,
  PublicReview,
} from "@/types/shop";

export const sampleProducts: PublicProduct[] = [
  {
    id: "sample-cheesecake",
    name: "Cheesecake de frutos rojos",
    slug: "cheesecake-frutos-rojos",
    description: "Base crocante, crema suave y compota casera de frutos rojos.",
    imageUrl:
      "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=80",
    images: [
      {
        id: "sample-cheesecake-main",
        url: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=80",
        alt: "Cheesecake de frutos rojos",
        isPrimary: true,
      },
    ],
    visibleIngredients: "Queso crema, galleta, mantequilla, frutos rojos, azucar.",
    estimatedDelivery: "24 a 48 horas",
    isFeatured: true,
    averageRating: 5,
    ratingCount: 0,
    productReviews: [],
    originalPrice: 14500,
    discountPercent: null,
    promotionName: null,
    promotionEndsAt: null,
    priceFinal: 14500,
    isAvailable: true,
    categoryName: "Tortas",
  },
  {
    id: "sample-brownies",
    name: "Brownies fudge",
    slug: "brownies-fudge",
    description: "Chocolate intenso, centro humedo y nueces tostadas.",
    imageUrl:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80",
    images: [
      {
        id: "sample-brownies-main",
        url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80",
        alt: "Brownies fudge",
        isPrimary: true,
      },
    ],
    visibleIngredients: "Chocolate, cacao, harina, huevos, mantequilla, nueces.",
    estimatedDelivery: "24 horas",
    isFeatured: false,
    averageRating: 5,
    ratingCount: 0,
    productReviews: [],
    originalPrice: 9500,
    discountPercent: null,
    promotionName: null,
    promotionEndsAt: null,
    priceFinal: 9500,
    isAvailable: true,
    categoryName: "Bocados",
  },
  {
    id: "sample-tres-leches",
    name: "Tres leches",
    slug: "tres-leches",
    description: "Bizcocho esponjoso con mezcla de leches y merengue tostado.",
    imageUrl:
      "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=900&q=80",
    images: [
      {
        id: "sample-tres-leches-main",
        url: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=900&q=80",
        alt: "Tres leches",
        isPrimary: true,
      },
    ],
    visibleIngredients: "Bizcocho, leche condensada, leche evaporada, crema dulce, merengue.",
    estimatedDelivery: "Bajo pedido",
    isFeatured: false,
    averageRating: 5,
    ratingCount: 0,
    productReviews: [],
    originalPrice: 12500,
    discountPercent: null,
    promotionName: null,
    promotionEndsAt: null,
    priceFinal: 12500,
    isAvailable: true,
    categoryName: "Clasicos",
  },
];

export const sampleCategories: PublicCategory[] = [
  {
    id: "sample-cakes",
    name: "Postres destacados",
    slug: "postres-destacados",
    products: sampleProducts,
  },
];

export const sampleReviews: PublicReview[] = [
  {
    id: "sample-review-1",
    customerName: "Mariana",
    rating: 5,
    comment: "El cheesecake llego perfecto y el sabor estaba muy balanceado.",
  },
  {
    id: "sample-review-2",
    customerName: "Daniel",
    rating: 5,
    comment: "Pedi brownies para una reunion y se terminaron rapidisimo.",
  },
];

export const sampleDashboardMetrics: DashboardMetric[] = [
  { label: "Ventas del mes", value: "CRC 0", helper: "Conecta MySQL/MariaDB para ver datos reales." },
  { label: "Pedidos nuevos", value: "0", helper: "Sin pedidos registrados." },
  { label: "Comprobantes pendientes", value: "0", helper: "SINPE manual." },
];

export const sampleSalesMetrics: ProductSalesMetric[] = [
  { name: "Sin datos", quantity: 0, total: 0 },
];
