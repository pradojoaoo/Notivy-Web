/* eslint-disable @next/next/no-img-element -- @vercel/og renders image data URLs directly. */
import { withSupabase } from "@supabase/server";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.4/mod.ts";
import React from "https://esm.sh/react@18.2.0";

const WIDTH = 1080;
const HEIGHT = 1920;
const RASTER_SCALE = 0.5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PREVIEW_BYTES = 15 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const ALLOWED_ORIGINS = new Set([
  "https://notivy-editor-joaov.k5yxq7p244.chatgpt.site",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

type ExportValues = {
  weekday: string;
  day: string;
  month: string;
  alarmTime: string;
  mainTime: string;
  appName: string;
  title: string;
  message: string;
  notificationTime: string;
  notificationTransparency: "less" | "more";
  notificationPosition: "below-clock" | "middle" | "lower" | "free";
  notificationX: number;
  notificationY: number;
};

type ClockValues = {
  font: string;
  weight: number;
  color: string;
  size: number;
  spacing: number;
};

type ExportPayload = {
  requestId: string;
  projectId: string | null;
  values: ExportValues;
  clock: ClockValues;
};

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Expose-Headers": "X-Notivy-Content-Width, X-Notivy-Content-Height",
    "Vary": "Origin",
  };
}

function jsonError(req: Request, status: number, code: string, message: string) {
  return Response.json({ code, message }, { status, headers: corsHeaders(req) });
}

function cleanText(value: unknown, maxLength: number, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength);
}

function clampNumber(value: unknown, minimum: number, maximum: number, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function validatePayload(input: unknown): ExportPayload | null {
  if (!input || typeof input !== "object") return null;
  const source = input as Record<string, unknown>;
  const values = source.values as Record<string, unknown> | undefined;
  const clock = source.clock as Record<string, unknown> | undefined;
  if (!values || !clock) return null;

  const requestId = cleanText(source.requestId, 36);
  const projectId = source.projectId === null ? null : cleanText(source.projectId, 36);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuid.test(requestId) || (projectId && !uuid.test(projectId))) return null;

  const transparency = values.notificationTransparency === "more" ? "more" : "less";
  const allowedPositions = new Set(["below-clock", "middle", "lower", "free"]);
  const position = allowedPositions.has(String(values.notificationPosition))
    ? String(values.notificationPosition) as ExportValues["notificationPosition"]
    : "below-clock";
  const color = cleanText(clock.color, 7, "#ffffff");
  const allowedFonts = new Set(["SF Pro Rounded", "SF Pro Display", "Segoe UI", "Arial"]);

  return {
    requestId,
    projectId,
    values: {
      weekday: cleanText(values.weekday, 12, "Thu"),
      day: cleanText(values.day, 4, "17"),
      month: cleanText(values.month, 16),
      alarmTime: cleanText(values.alarmTime, 8, "05:30"),
      mainTime: cleanText(values.mainTime, 8, "13:25"),
      appName: cleanText(values.appName, 40, "Nubank"),
      title: cleanText(values.title, 80, "Transferência recebida"),
      message: cleanText(values.message, 240, "Você recebeu uma transferência."),
      notificationTime: cleanText(values.notificationTime, 20, "agora"),
      notificationTransparency: transparency,
      notificationPosition: position,
      notificationX: clampNumber(values.notificationX, 12, 88, 50),
      notificationY: clampNumber(values.notificationY, 22, 84, 48),
    },
    clock: {
      font: allowedFonts.has(String(clock.font)) ? String(clock.font) : "SF Pro Rounded",
      weight: Math.round(clampNumber(clock.weight, 200, 900, 700)),
      color: /^#[0-9a-f]{6}$/i.test(color) ? color : "#ffffff",
      size: clampNumber(clock.size, 58, 128, 92),
      spacing: clampNumber(clock.spacing, -0.12, 0.12, -0.03),
    },
  };
}

async function readImage(value: FormDataEntryValue | null, maxBytes = MAX_IMAGE_BYTES) {
  if (!(value instanceof File)) throw new Error("missing_image");
  if (!ALLOWED_IMAGE_TYPES.has(value.type) || value.size < 24 || value.size > maxBytes) {
    throw new Error("invalid_image");
  }

  const bytes = new Uint8Array(await value.arrayBuffer());
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isWebp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!isPng && !isJpeg && !isWebp) throw new Error("invalid_image");
  return { bytes, type: value.type };
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function toDataUrl(image: { bytes: Uint8Array; type: string }) {
  return `data:${image.type};base64,${toBase64(image.bytes)}`;
}

async function payloadHash(payload: ExportPayload, preview: Uint8Array) {
  const canonical = new TextEncoder().encode(JSON.stringify(payload));
  const data = await new Blob([canonical, preview]).arrayBuffer();
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function NotificationIcon({ source }: { source: string }) {
  return <img src={source} alt="" width={94} height={94} style={{
    width: 94,
    height: 94,
    borderRadius: 23,
    objectFit: "cover",
    boxShadow: "0 4px 14px rgba(41,0,80,.27)",
  }} />;
}

function renderLockScreen(payload: ExportPayload, background: string, icon: string) {
  const { values, clock } = payload;
  const isFree = values.notificationPosition === "free";
  const topByPosition = { "below-clock": 768, middle: 1133, lower: 1344, free: 0 };
  const notificationTop = isFree
    ? HEIGHT * values.notificationY / 100 - 92
    : topByPosition[values.notificationPosition];
  const notificationLeft = isFree ? WIDTH * values.notificationX / 100 - 506 : 34;
  const glass = values.notificationTransparency === "more"
    ? {
      blur: "blur(75px) saturate(145%)",
      tint: "linear-gradient(110deg,rgba(58,70,84,.22),rgba(31,43,58,.18) 55%,rgba(25,35,50,.26))",
    }
    : {
      blur: "blur(56px) saturate(125%)",
      tint: "linear-gradient(110deg,rgba(58,70,84,.78),rgba(31,43,58,.74) 55%,rgba(25,35,50,.80))",
    };

  return (
    <div style={{
      width: WIDTH * RASTER_SCALE,
      height: HEIGHT * RASTER_SCALE,
      display: "flex",
      position: "relative",
      overflow: "hidden",
    }}>
    <div style={{
      width: WIDTH,
      height: HEIGHT,
      display: "flex",
      position: "relative",
      overflow: "hidden",
      color: "#fff",
      background: "#101a32",
      fontFamily: "Arial, sans-serif",
      transform: `scale(${RASTER_SCALE})`,
      transformOrigin: "top left",
    }}>
      <img src={background} alt="" width={WIDTH} height={HEIGHT} style={{
        position: "absolute",
        inset: 0,
        width: WIDTH,
        height: HEIGHT,
        objectFit: "cover",
      }} />

      <div style={{
        position: "absolute",
        top: 22,
        left: 383,
        width: 314,
        height: 70,
        borderRadius: 999,
        background: "#020202",
        border: "2px solid #242424",
      }} />

      <div style={{
        position: "absolute",
        top: 56,
        left: 62,
        right: 62,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 30,
        fontWeight: 600,
        textShadow: "0 2px 8px rgba(0,0,0,.45)",
      }}>
        <div style={{ display: "flex", gap: 14 }}>NuCel <span>◩</span></div>
        <div style={{ display: "flex", gap: 16 }}><span>▂▄▆█</span><span>4G</span><span>▰</span></div>
      </div>

      <div style={{
        position: "absolute",
        top: 205,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
        fontSize: 69,
        fontWeight: 500,
        letterSpacing: "-.035em",
        textShadow: "0 3px 12px rgba(54,88,109,.4)",
      }}>
        <span>{values.weekday} {values.day}{values.month ? ` ${values.month}` : ""}</span>
        <span style={{ fontSize: 43 }}>◷</span>
        <span>{values.alarmTime}</span>
      </div>

      <div style={{
        position: "absolute",
        top: 286,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        fontFamily: `${clock.font}, Arial, sans-serif`,
        fontSize: clock.size * 3.12,
        fontWeight: clock.weight,
        color: clock.color,
        letterSpacing: `${clock.spacing}em`,
        lineHeight: .85,
        textShadow: "0 3px 14px rgba(54,88,109,.4)",
      }}>{values.mainTime}</div>

      <div style={{
        position: "absolute",
        left: notificationLeft,
        top: notificationTop,
        width: 1012,
        minHeight: 184,
        display: "flex",
        alignItems: "center",
        gap: 31,
        padding: "25px 34px",
        overflow: "hidden",
        borderRadius: 65,
        border: "2px solid rgba(255,255,255,.48)",
        boxShadow: "inset 0 3px rgba(255,255,255,.27),0 15px 48px rgba(0,0,0,.33)",
        backdropFilter: glass.blur,
        backgroundImage: glass.tint,
      }}>
        <NotificationIcon source={icon} />
        <div style={{
          minWidth: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          textShadow: "0 3px 7px rgba(0,0,0,.33)",
        }}>
          <div style={{
            display: "flex",
            paddingRight: 120,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            fontSize: 22,
            lineHeight: 1.1,
            fontWeight: 500,
            opacity: .82,
          }}>{values.appName}</div>
          <div style={{
            display: "flex",
            paddingRight: 120,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            fontSize: 31,
            lineHeight: 1.1,
            fontWeight: 600,
            marginTop: 3,
          }}>{values.title}</div>
          <div style={{
            display: "flex",
            overflow: "hidden",
            fontSize: 29,
            lineHeight: 1.2,
            fontWeight: 400,
            marginTop: 5,
            lineClamp: 2,
          }}>{values.message}</div>
        </div>
        <div style={{
          position: "absolute",
          top: 28,
          right: 34,
          fontSize: 28,
          lineHeight: 1.1,
          color: "#eef1f3",
          textShadow: "0 3px 12px rgba(0,0,0,.5)",
        }}>{values.notificationTime}</div>
      </div>

      <div style={{
        position: "absolute",
        left: 62,
        right: 62,
        bottom: 69,
        display: "flex",
        justifyContent: "space-between",
      }}>
        {["ϟ", "●"].map((symbol) => (
          <div key={symbol} style={{
            width: 147,
            height: 147,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            border: "2px solid rgba(255,255,255,.21)",
            background: "rgba(23,23,23,.61)",
            fontSize: 65,
            fontWeight: 700,
            boxShadow: "inset 0 3px 7px rgba(255,255,255,.24),0 15px 43px rgba(0,0,0,.5)",
          }}>{symbol}</div>
        ))}
      </div>

      <div style={{
        position: "absolute",
        left: 349,
        bottom: 25,
        width: 382,
        height: 12,
        borderRadius: 999,
        background: "#fff",
        boxShadow: "0 3px 9px rgba(0,0,0,.5)",
      }} />
    </div>
    </div>
  );
}

const securedHandler = withSupabase({ auth: "user" }, async (req, ctx) => {
  if (req.method !== "POST") return jsonError(req, 405, "method_not_allowed", "Use POST.");
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_PREVIEW_BYTES + 256_000) {
    return jsonError(req, 413, "payload_too_large", "A imagem excede o limite permitido.");
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonError(req, 400, "invalid_form", "Envie os dados como multipart/form-data.");
  }

  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return jsonError(req, 400, "invalid_payload", "Os dados da edição são inválidos.");
  }
  const payload = validatePayload(rawPayload);
  if (!payload) return jsonError(req, 400, "invalid_payload", "Os dados da edição são inválidos.");

  let preview;
  try {
    preview = await readImage(formData.get("preview"), MAX_PREVIEW_BYTES);
    const view = new DataView(preview.bytes.buffer, preview.bytes.byteOffset, preview.bytes.byteLength);
    const width = view.getUint32(16);
    const height = view.getUint32(20);
    if (preview.type !== "image/png" || preview.bytes.byteLength > MAX_PREVIEW_BYTES || width !== WIDTH || height !== HEIGHT) {
      throw new Error("invalid_preview");
    }
  } catch {
    return jsonError(req, 400, "invalid_image", "A prévia precisa ser um PNG de 1080 × 1920 px.");
  }

  const hash = await payloadHash(payload, preview.bytes);
  const admin = ctx.supabaseAdmin;
  const userId = ctx.userClaims!.id;
  const { data: begin, error: beginError } = await admin
    .rpc("begin_server_export", {
      p_user_id: userId,
      p_request_id: payload.requestId,
      p_payload_hash: hash,
      p_project_id: payload.projectId,
    })
    .single();

  if (beginError || !begin) {
    console.error("begin_server_export failed", beginError?.code);
    return jsonError(req, 500, "authorization_failed", "Não foi possível autorizar a exportação.");
  }
  if (!begin.allowed) {
    const status = begin.error_code === "rate_limited" ? 429
      : begin.error_code === "quota_exhausted" ? 403 : 409;
    return jsonError(req, status, begin.error_code, begin.error_code === "rate_limited"
      ? "Muitas tentativas. Aguarde alguns minutos."
      : "A exportação mensal gratuita já foi utilizada.");
  }

  const png = preview.bytes;

  const { data: finalized, error: finalizeError } = await admin
    .rpc("finalize_server_export", {
      p_user_id: userId,
      p_request_id: payload.requestId,
      p_payload_hash: hash,
    })
    .single();

  if (finalizeError || !finalized) {
    console.error("finalize_server_export failed", finalizeError?.code);
    return jsonError(req, 500, "finalization_failed", "Não foi possível confirmar a exportação.");
  }
  if (!finalized.allowed) {
    return jsonError(req, 403, finalized.error_code ?? "quota_exhausted", "A exportação mensal gratuita já foi utilizada.");
  }

  return new Response(png, {
    status: 200,
    headers: {
      ...corsHeaders(req),
      // functions-js only returns binary responses as Blob for octet-stream/PDF.
      // The filename still identifies the payload as PNG for downloads.
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="notivy-${Date.now()}.png"`,
      "X-Notivy-Content-Width": String(WIDTH),
      "X-Notivy-Content-Height": String(HEIGHT),
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
});

const handler = {
  fetch(req: Request) {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(req) });
    }
    const origin = req.headers.get("origin");
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return jsonError(req, 403, "origin_not_allowed", "Origem não permitida.");
    }
    return securedHandler(req);
  },
};

export default handler;
