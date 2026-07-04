import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL || "mysql://root@localhost:3306/horno_dulce"),
});

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: "postres-destacados" },
    update: {},
    create: {
      id: "sample-category",
      name: "Postres destacados",
      slug: "postres-destacados",
      description: "Postres base para iniciar el catalogo local.",
      isActive: true,
    },
  });

  const products = [
    {
      id: "sample-cheesecake",
      name: "Cheesecake de frutos rojos",
      slug: "cheesecake-frutos-rojos",
      description: "Base crocante, crema suave y compota casera de frutos rojos.",
      visibleIngredients: "Queso crema, galleta, mantequilla, frutos rojos, azucar.",
      estimatedDelivery: "24 a 48 horas",
      priceFinal: 14500,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-brownies",
      name: "Brownies fudge",
      slug: "brownies-fudge",
      description: "Chocolate intenso, centro humedo y nueces tostadas.",
      visibleIngredients: "Chocolate, cacao, harina, huevos, mantequilla, nueces.",
      estimatedDelivery: "24 horas",
      priceFinal: 9500,
      isFeatured: false,
      imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-tres-leches",
      name: "Tres leches",
      slug: "tres-leches",
      description: "Bizcocho esponjoso con mezcla de leches y merengue tostado.",
      visibleIngredients: "Bizcocho, leche condensada, leche evaporada, crema dulce, merengue.",
      estimatedDelivery: "Bajo pedido",
      priceFinal: 12500,
      isFeatured: false,
      imageUrl: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=900&q=80",
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: {
        ...product,
        categoryId: category.id,
        imageUrl: product.imageUrl,
        imagePath: product.imageUrl,
        images: {
          create: {
            url: product.imageUrl,
            path: product.imageUrl,
            alt: product.name,
            isPrimary: true,
          },
        },
      },
    });
  }

  console.log("Productos locales listos.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
