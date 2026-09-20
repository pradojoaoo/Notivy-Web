"use client";

import { useRef } from "react";

export default function NotificationPreview({
  backgroundUrl = "/images/iphone-generic-v4.png",
  appIcon = "/images/nu-notification-icon-v1.png",
  title = "Transferência recebida",
  message = "Você recebeu uma transferência de R$427,80 de SHPAY.",
  notificationTime = "agora",
  notificationPosition = "below-clock",
  editableLockScreen = false,
  maskOriginalUi = false,
  renderControls = false,
  referenceStyle = false,
  weekday = "Thu",
  day = "17",
  month = "",
  alarmTime = "05:30",
  mainTime = "13:25",
  clockFont = "Arial Narrow",
  clockWeight = 200,
  clockColor = "#ffffff",
  clockSize = 7.5,
  clockSpacing = -0.1,
  notificationX = 50,
  notificationY = 40,
  onNotificationMove,
}) {
  const canvasRef = useRef(null);
  const isFreePosition = notificationPosition === "free";
  const canvasClassName = [
    "preview-canvas",
    "preview-canvas-photo",
    editableLockScreen ? "preview-canvas-customized" : "",
    maskOriginalUi ? "preview-mask-original" : "",
    referenceStyle ? "preview-reference-style" : "",
  ].filter(Boolean).join(" ");

  const moveNotification = (event) => {
    if (!isFreePosition || !onNotificationMove || !canvasRef.current) return;
    const bounds = canvasRef.current.getBoundingClientRect();
    const x = Math.min(88, Math.max(12, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.min(84, Math.max(22, ((event.clientY - bounds.top) / bounds.height) * 100));
    onNotificationMove({ x: Math.round(x), y: Math.round(y) });
  };

  return (
    <figure className="preview-figure">
      <div className="phone-shell-3d phone-shell-iphone16">
        <span className="dynamic-island" aria-hidden="true"><i /></span>
        <span className="phone-action-button" aria-hidden="true" />
        <span className="phone-side-button phone-side-button-top" aria-hidden="true" />
        <span className="phone-side-button phone-side-button-bottom" aria-hidden="true" />
        <span className="phone-power-button" aria-hidden="true" />
        <span className="phone-camera-control" aria-hidden="true" />

        <div
          ref={canvasRef}
          className={canvasClassName}
          style={{ backgroundImage: `url("${backgroundUrl}")` }}
          role="img"
          aria-label={`Prévia de uma tela bloqueada com horário ${mainTime}, data ${weekday} ${day} ${month}, uma notificação de ${title}, lanterna e câmera.`}
        >
          {editableLockScreen && (
            <div className="editable-lock-ui" aria-hidden="true">
              <div className="editable-status-bar">
                <span className="status-carrier">
                  NuCel
                  <svg className="status-mute" viewBox="0 0 24 24">
                    <path d="M10.3 5.2 8.5 7H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2.5l3.5 3.5V9.1l-1.7-3.9Zm5.6 4.1a5 5 0 0 1 .4 5.9l1.5 1.5a7 7 0 0 0-.4-8.9l-1.5 1.5Z" />
                    <path className="status-mute-slash" d="m3 3 18 18" />
                  </svg>
                </span>
                <span className="status-icons">
                  <svg className="status-signal" viewBox="0 0 19 12">
                    <rect x="0" y="8" width="3" height="4" rx="1" />
                    <rect x="5" y="6" width="3" height="6" rx="1" />
                    <rect x="10" y="3" width="3" height="9" rx="1" />
                    <rect x="15" y="0" width="3" height="12" rx="1" />
                  </svg>
                  <b>4G</b>
                  <svg className="status-battery" viewBox="0 0 28 13">
                    <rect className="battery-frame" x="1" y="1" width="23" height="11" rx="3" />
                    <rect className="battery-level" x="3" y="3" width="15" height="7" rx="1.5" />
                    <path className="battery-cap" d="M26 4.2v4.6" />
                  </svg>
                </span>
              </div>

              <div className="editable-date-row">
                <span>{weekday} {day}{month ? ` ${month}` : ""}</span>
                <svg viewBox="0 0 24 24"><path d="M7 3.8 4.3 6.4l1.4 1.4 2.7-2.6L7 3.8Zm10 0-1.4 1.4 2.7 2.6 1.4-1.4L17 3.8ZM12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm1 4v3.6l2.4 1.4-.8 1.3-3.1-1.8V9H13Z" /></svg>
                <span>{alarmTime}</span>
              </div>
              {referenceStyle ? (
                <time className="reference-main-time" dateTime="13:25">
                  <svg viewBox="0 0 510 320" preserveAspectRatio="none" aria-hidden="true">
                    <g fill="currentColor" stroke="#d4efff" strokeWidth=".8" strokeLinejoin="round">
                      <path d="M0 31 36 3H68Q73 3 73 8V314H34V42L0 66Z" />
                      <path d="M95 96V58Q95 0 151 0Q207 0 207 58V100Q207 140 182 151Q209 163 209 203V263Q209 320 151 320Q95 320 95 265V225H132V263Q132 285 150 285Q170 285 170 262V201Q170 173 148 173H132V137H148Q170 137 170 107V57Q170 34 151 34Q132 34 132 57V96Z" />
                      <circle cx="241" cy="91" r="20" />
                      <circle cx="241" cy="223" r="20" />
                      <path d="M275 96V59Q275 0 331 0Q389 0 389 60V87Q389 117 377 145L315 283H389V317H274V285L339 135Q351 108 351 84V59Q351 34 332 34Q313 34 313 59V96Z" />
                      <path d="M405 4H503V39H440L437 120Q448 111 465 111Q509 111 509 166V262Q509 320 454 320Q400 320 400 264V224H438V263Q438 285 455 285Q473 285 473 263V173Q473 147 455 147Q439 147 437 169H403Z" />
                    </g>
                  </svg>
                </time>
              ) : <time className="editable-main-time" style={{ fontFamily: clockFont, fontWeight: clockWeight, color: clockColor, fontSize: `${clockSize}rem`, letterSpacing: `${clockSpacing}em` }}>{mainTime}</time>}
            </div>
          )}

          <div
            className={`notification notification-private notification-readable notification-position-${notificationPosition}`}
            style={isFreePosition ? { left: `${notificationX}%`, top: `${notificationY}%` } : undefined}
            onPointerDown={(event) => {
              if (!isFreePosition) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              moveNotification(event);
            }}
            onPointerMove={(event) => {
              if (isFreePosition && event.currentTarget.hasPointerCapture(event.pointerId)) moveNotification(event);
            }}
            aria-hidden="true"
          >
            <span className="notification-icon notification-icon-exact" style={{ backgroundImage: `url("${appIcon}")` }} />
            <span className="notification-readable-copy">
              <strong>{title}</strong>
              <span>{message}</span>
            </span>
            <span className="notification-readable-time">{notificationTime}</span>
          </div>

          {renderControls && (
            <>
              <div className="lock-screen-controls" aria-hidden="true">
                <span className="lock-control">
                  <svg viewBox="0 0 24 24"><path d="M8.2 2.5h7.6l-.9 4.2-2.1 2.1v8.4a2 2 0 0 1-4 0V8.8L6.7 6.7l1.5-4.2Zm.4 1.7-.5 1.5h7.8l-.3-1.5h-7Z" /><rect x="9.5" y="9.4" width="5" height="2" rx="1" /></svg>
                </span>
                <span className="lock-control">
                  <svg viewBox="0 0 24 24"><path d="M8.2 6.5 9.7 4h4.6l1.5 2.5H19A3 3 0 0 1 22 9.5v7A3 3 0 0 1 19 19.5H5a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3h3.2ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-1.7a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z" /></svg>
                </span>
              </div>
              <span className="home-indicator" aria-hidden="true" />
            </>
          )}
        </div>
      </div>
      <figcaption>Prévia atualizada em tempo real · proporção 7:16</figcaption>
    </figure>
  );
}
