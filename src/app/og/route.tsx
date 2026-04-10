import { ImageResponse } from "next/og";

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

function getLabel(path: string) {
  return pageLabels[path] ?? "Custom desserts";
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path")?.trim() || "/";
  const title = searchParams.get("title")?.trim() || "The Sweet Fork";
  const label = getLabel(path);

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
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              maxWidth: "860px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Georgia, serif",
                fontSize: 76,
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
                fontSize: 28,
                lineHeight: 1.4,
                maxWidth: "760px",
              }}
            >
              Inquiry-first ordering for custom cakes, wedding work, cupcakes, macarons, cookies,
              and elevated dessert details.
            </div>
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
