import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size: sizeStr } = await params;
  const size = parseInt(sizeStr) || 192;
  const radius = Math.round(size * 0.2);
  const fontSize = Math.round(size * 0.55);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
          borderRadius: radius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize,
            fontWeight: 900,
            fontFamily: "sans-serif",
            lineHeight: 1,
          }}
        >
          A
        </span>
      </div>
    ),
    { width: size, height: size }
  );
}
