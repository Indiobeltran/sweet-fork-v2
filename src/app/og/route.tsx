/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

import { getProductHeroImagesBySlug, getGalleryItemsForPlacement } from "@/lib/site/marketing";

const pageLabels: Record<string, string> = {
  "/": "Centerville, Utah",
  "/about": "About",
  "/custom-cakes": "Custom cakes",
  "/cupcakes": "Cupcakes",
  "/diy-kits": "DIY kits",
  "/faq": "Frequently asked questions",
  "/gallery": "Gallery",
  "/how-to-order": "How to order",
  "/macarons": "Macarons",
  "/pricing": "Pricing guide",
  "/privacy": "Privacy policy",
  "/start-order": "Inquiry",
  "/sugar-cookies": "Sugar cookies",
  "/terms": "Order terms",
  "/wedding-cakes": "Wedding cakes",
};

const pageImages: Record<string, string> = {
  "/": "/brand/logo-social.jpg",
  "/custom-cakes": "/placeholders/marketing/garden-cake.jpg",
  "/cupcakes": "/placeholders/marketing/cupcake-set.jpg",
  "/diy-kits": "/placeholders/marketing/diy-kit.jpg",
  "/gallery": "/placeholders/marketing/wedding-tier.jpg",
  "/macarons": "/placeholders/marketing/macaron-tower.jpg",
  "/pricing": "/placeholders/marketing/garden-cake.jpg",
  "/sugar-cookies": "/placeholders/marketing/cookie-favors.jpg",
  "/wedding-cakes": "/placeholders/marketing/wedding-tier.jpg",
};

function getLabel(path: string) {
  return pageLabels[path] ?? "Custom desserts";
}

function getImagePath(path: string) {
  return pageImages[path] ?? "/brand/logo-social.jpg";
}



export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path")?.trim() || "/";
  const title = searchParams.get("title")?.trim() || "The Sweet Fork";
  const label = getLabel(path);
  let resolvedImagePath = getImagePath(path);

  try {
    if (path.startsWith("/") && path.length > 1) {
      const slug = path.slice(1);
      
      if (["custom-cakes", "cupcakes", "diy-kits", "macarons", "sugar-cookies", "wedding-cakes"].includes(slug)) {
        const productHero = (await getProductHeroImagesBySlug([slug])).get(slug);
        if (productHero?.imageUrl) {
          resolvedImagePath = productHero.imageUrl;
        }
      } else if (slug === "gallery" || slug === "pricing") {
        const galleryItems = await getGalleryItemsForPlacement("gallery.grid", { limit: 1 });
        if (galleryItems.length > 0 && galleryItems[0].imageUrl) {
          resolvedImagePath = galleryItems[0].imageUrl;
        }
      }
    } else if (path === "/") {
      let galleryItems = await getGalleryItemsForPlacement("home.hero", { limit: 1, requireExplicit: true });
      if (galleryItems.length === 0) {
        galleryItems = await getGalleryItemsForPlacement("home.gallery", { limit: 1 });
      }
      if (galleryItems.length > 0 && galleryItems[0].imageUrl) {
        resolvedImagePath = galleryItems[0].imageUrl;
      }
    }
  } catch (error) {
    console.error("Unable to load explicitly assigned OG image. Using fallback.", error);
  }

  const imageUrl = resolvedImagePath.startsWith("http")
    ? resolvedImagePath
    : new URL(resolvedImagePath, request.url).toString();

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background:
            "radial-gradient(circle at top left, rgba(186, 154, 99, 0.28), transparent 28%), radial-gradient(circle at bottom right, rgba(177, 149, 137, 0.18), transparent 34%), linear-gradient(180deg, #fcf8f1 0%, #f6efe5 100%)",
          color: "#372b24",
          display: "flex",
          height: "100%",
          padding: "56px",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.72)",
            border: "1px solid rgba(55, 43, 36, 0.08)",
            borderRadius: "36px",
            boxShadow: "0 22px 60px rgba(53, 37, 29, 0.08)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "space-between",
            padding: "52px",
            width: "100%",
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: "0.34em",
                  textTransform: "uppercase",
                }}
              >
                The Sweet Fork
              </div>
              <div
                style={{
                  color: "rgba(55, 43, 36, 0.68)",
                  display: "flex",
                  fontSize: 24,
                }}
              >
                Boutique cakes and desserts for Northern Utah celebrations
              </div>
            </div>
            <div
              style={{
                alignItems: "center",
                background: "rgba(255, 255, 255, 0.84)",
                border: "1px solid rgba(55, 43, 36, 0.1)",
                borderRadius: "999px",
                display: "flex",
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "0.18em",
                padding: "14px 20px",
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
          </div>

          <div
            style={{
              alignItems: "stretch",
              display: "flex",
              gap: "34px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                maxWidth: "670px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontFamily: "Georgia, serif",
                  fontSize: 68,
                  letterSpacing: "-0.05em",
                  lineHeight: 0.98,
                }}
              >
                {title}
              </div>
              <div
                style={{
                  color: "rgba(55, 43, 36, 0.76)",
                  display: "flex",
                  fontSize: 26,
                  lineHeight: 1.35,
                  maxWidth: "650px",
                }}
              >
                Inquiry-first ordering for custom cakes, wedding work, cupcakes, macarons, cookies,
                and elevated dessert details.
              </div>
            </div>
            <img
              src={imageUrl}
              alt=""
              style={{
                borderRadius: "30px",
                height: "270px",
                objectFit: "cover",
                width: "300px",
              }}
            />
          </div>

          <div
            style={{
              alignItems: "center",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                alignItems: "center",
                background: "#372b24",
                borderRadius: "999px",
                color: "#f9f4ed",
                display: "flex",
                fontSize: 24,
                fontWeight: 600,
                padding: "18px 28px",
              }}
            >
              thesweetfork.com
            </div>
            <div
              style={{
                color: "rgba(55, 43, 36, 0.66)",
                display: "flex",
                fontSize: 22,
              }}
            >
              Pickup in Centerville. Local delivery across nearby Northern Utah communities.
            </div>
          </div>
        </div>
      </div>
    ),
    {
      height: 630,
      width: 1200,
    },
  );
}
