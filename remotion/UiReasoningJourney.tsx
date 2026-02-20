import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Point = {
  x: number;
  y: number;
};

const SOURCE_WIDTH = 3072;
const SOURCE_HEIGHT = 2004;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const mix = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

const trianglePulse = (frame: number, startFrame: number, duration: number) => {
  const progress = (frame - startFrame) / duration;
  if (progress < 0 || progress > 1) {
    return 0;
  }

  return 1 - Math.abs(progress * 2 - 1);
};

const CursorGlyph = ({
  point,
  opacity,
  scale,
  rotation,
}: {
  point: Point;
  opacity: number;
  scale: number;
  rotation: number;
}) => {
  if (opacity <= 0.001) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: point.x,
        top: point.y,
        opacity,
        transform: `translate(-4px, -3px) rotate(${rotation}deg) scale(${scale})`,
        transformOrigin: "4px 3px",
        filter: "drop-shadow(0 8px 12px rgba(2, 6, 23, 0.36))",
        pointerEvents: "none",
      }}
    >
      <svg width={50} height={62} viewBox="0 0 44 56" fill="none">
        <path
          d="M4 3V44L15 35L23 54L31 50L22 30H40L4 3Z"
          fill="white"
          stroke="#0F172A"
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

const Connector = ({
  from,
  to,
  progress,
  opacity,
}: {
  from: Point;
  to: Point;
  progress: number;
  opacity: number;
}) => {
  if (opacity <= 0.001) {
    return null;
  }

  const shownProgress = clamp01(progress);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const length = Math.hypot(dx, dy) * shownProgress;

  return (
    <div
      style={{
        position: "absolute",
        left: from.x,
        top: from.y,
        width: length,
        height: 2,
        borderRadius: 999,
        transform: `rotate(${angle}deg)`,
        transformOrigin: "0 50%",
        background:
          "linear-gradient(90deg, rgba(139, 92, 246, 0.78), rgba(56, 189, 248, 0.82))",
        boxShadow: "0 0 16px rgba(96, 165, 250, 0.32)",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

const ReasoningOrb = ({
  point,
  opacity,
  frame,
}: {
  point: Point;
  opacity: number;
  frame: number;
}) => {
  if (opacity <= 0.001) {
    return null;
  }

  const pulse = 0.95 + Math.sin(frame / 7) * 0.05;
  const coreSize = 44 * pulse;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: point.x - coreSize / 2,
          top: point.y - coreSize / 2,
          width: coreSize,
          height: coreSize,
          borderRadius: 999,
          opacity,
          background:
            "radial-gradient(circle at 30% 30%, #EDE9FE, #A78BFA 48%, #5B21B6 100%)",
          boxShadow:
            "0 0 0 12px rgba(139, 92, 246, 0.22), 0 0 36px rgba(99, 102, 241, 0.4)",
          pointerEvents: "none",
        }}
      />
      {Array.from({length: 5}).map((_, index) => {
        const angle = frame * 0.1 + index * ((Math.PI * 2) / 5);
        const radius = 38 + Math.sin(frame / 9 + index) * 4;

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: point.x + Math.cos(angle) * radius - 4,
              top: point.y + Math.sin(angle) * radius - 4,
              width: 8,
              height: 8,
              borderRadius: 999,
              opacity: opacity * 0.9,
              background: "rgba(196, 181, 253, 0.9)",
              boxShadow: "0 0 8px rgba(196, 181, 253, 0.75)",
              pointerEvents: "none",
            }}
          />
        );
      })}
    </>
  );
};

export const UiReasoningJourney = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const FIRST_MOVE_START = Math.round(0.15 * fps);
  const FIRST_MOVE_END = Math.round(1.05 * fps);
  const FIRST_CLICK_START = Math.round(1.08 * fps);
  const MORPH_START = Math.round(1.2 * fps);
  const MORPH_END = Math.round(2.55 * fps);
  const SECOND_MOVE_START = Math.round(2.85 * fps);
  const SECOND_MOVE_END = Math.round(3.8 * fps);
  const SECOND_CLICK_START = Math.round(3.85 * fps);

  const panelRatio = SOURCE_WIDTH / SOURCE_HEIGHT;
  const horizontalPadding = width * 0.055;
  const verticalPadding = height * 0.09;
  const maxPanelWidth = width - horizontalPadding * 2;
  const maxPanelHeight = height - verticalPadding * 2;

  let panelWidth = maxPanelWidth;
  let panelHeight = panelWidth / panelRatio;

  if (panelHeight > maxPanelHeight) {
    panelHeight = maxPanelHeight;
    panelWidth = panelHeight * panelRatio;
  }

  const panelLeft = (width - panelWidth) / 2;
  const panelTop = (height - panelHeight) / 2;

  const toPanelPoint = (x: number, y: number): Point => ({
    x: panelLeft + x * panelWidth,
    y: panelTop + y * panelHeight,
  });

  const cursorStart = toPanelPoint(0.1, 0.84);
  const firstTarget = toPanelPoint(0.206, 0.195);
  const secondTarget = toPanelPoint(0.968, 0.058);
  const toastAnchor = toPanelPoint(0.805, 0.116);

  const firstMoveProgress = interpolate(
    frame,
    [FIRST_MOVE_START, FIRST_MOVE_END],
    [0, 1],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const firstArc = Math.sin(firstMoveProgress * Math.PI) * -42;
  const cursorA = {
    x: mix(cursorStart.x, firstTarget.x, firstMoveProgress),
    y: mix(cursorStart.y, firstTarget.y, firstMoveProgress) + firstArc,
  };

  const clickOne = trianglePulse(frame, FIRST_CLICK_START, Math.round(0.24 * fps));
  const clickTwo = trianglePulse(
    frame,
    SECOND_CLICK_START,
    Math.round(0.24 * fps)
  );

  const cursorAOpacity = interpolate(
    frame,
    [MORPH_START - Math.round(0.06 * fps), MORPH_START + Math.round(0.3 * fps)],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const reasoningPoint = firstTarget;

  const reasoningOpacity =
    interpolate(
      frame,
      [MORPH_START + Math.round(0.08 * fps), MORPH_END],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    ) *
    interpolate(
      frame,
      [SECOND_MOVE_START - Math.round(0.18 * fps), SECOND_MOVE_START + Math.round(0.22 * fps)],
      [1, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

  const secondMoveProgress = interpolate(
    frame,
    [SECOND_MOVE_START, SECOND_MOVE_END],
    [0, 1],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const secondArc = Math.sin(secondMoveProgress * Math.PI) * -24;
  const cursorB = {
    x: mix(firstTarget.x, secondTarget.x, secondMoveProgress),
    y: mix(firstTarget.y, secondTarget.y, secondMoveProgress) + secondArc,
  };

  const cursorBOpacity = interpolate(
    frame,
    [SECOND_MOVE_START - Math.round(0.12 * fps), SECOND_MOVE_START + Math.round(0.28 * fps)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const connectorProgress = interpolate(
    frame,
    [SECOND_MOVE_START - Math.round(0.16 * fps), SECOND_MOVE_START + Math.round(0.12 * fps)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const bubbleOpacity =
    reasoningOpacity *
    interpolate(
      frame,
      [MORPH_START + Math.round(0.12 * fps), MORPH_END],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

  const stepStarts = [
    MORPH_START + Math.round(0.2 * fps),
    MORPH_START + Math.round(0.62 * fps),
    MORPH_START + Math.round(1.06 * fps),
  ];
  const stepLabels = [
    "Inspect selected card metadata",
    "Generate action sequence",
    "Queue creation command",
  ];

  const toastReveal =
    interpolate(
      frame,
      [SECOND_CLICK_START + Math.round(0.12 * fps), SECOND_CLICK_START + Math.round(0.42 * fps)],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    ) *
    interpolate(frame, [Math.round(5.25 * fps), Math.round(5.85 * fps)], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const toastOpacity = clamp01(toastReveal);

  return (
    <AbsoluteFill
      style={{
        background: "#05070f",
        fontFamily: "Manrope, Avenir Next, Segoe UI, sans-serif",
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 14% 18%, rgba(45, 70, 155, 0.22), rgba(5, 7, 15, 0) 42%), radial-gradient(circle at 86% 84%, rgba(56, 189, 248, 0.18), rgba(5, 7, 15, 0) 48%), radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.32), rgba(5, 7, 15, 0.08) 70%)",
          opacity: 0.95,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: panelLeft,
          top: panelTop,
          width: panelWidth,
          height: panelHeight,
          borderRadius: 24,
          overflow: "hidden",
          border: "2px solid rgba(148, 163, 184, 0.42)",
          boxShadow:
            "0 38px 110px rgba(2, 6, 23, 0.62), 0 10px 28px rgba(2, 6, 23, 0.4)",
        }}
      >
        <Img
          src={staticFile("saas-ui-gallery-7-extracted.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(145deg, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.02) 28%, rgba(15, 23, 42, 0.18))",
            pointerEvents: "none",
          }}
        />
      </div>

      <Connector
        from={firstTarget}
        to={secondTarget}
        progress={connectorProgress}
        opacity={Math.max(reasoningOpacity * 0.72, cursorBOpacity * 0.48)}
      />

      <ReasoningOrb point={reasoningPoint} opacity={reasoningOpacity} frame={frame} />

      <div
        style={{
          position: "absolute",
          left: reasoningPoint.x + 48,
          top: reasoningPoint.y - 138,
          width: 292,
          padding: "16px 18px 14px",
          borderRadius: 18,
          background:
            "linear-gradient(160deg, rgba(15, 23, 42, 0.95), rgba(19, 28, 48, 0.9))",
          border: "1px solid rgba(129, 140, 248, 0.42)",
          boxShadow: "0 24px 60px rgba(2, 6, 23, 0.56)",
          opacity: bubbleOpacity,
          transform: `translateY(${mix(16, 0, bubbleOpacity)}px) scale(${mix(0.95, 1, bubbleOpacity)})`,
          transformOrigin: "0 0",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 11,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#E2E8F0",
              letterSpacing: "0.01em",
              fontWeight: 600,
            }}
          >
            AI reasoning
          </div>
          <div style={{display: "flex", alignItems: "center", gap: 5}}>
            {Array.from({length: 3}).map((_, index) => {
              const dotOpacity =
                0.35 + Math.sin((frame + index * 7) / 4.8) * 0.35;

              return (
                <div
                  key={index}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: "#C4B5FD",
                    opacity: dotOpacity,
                  }}
                />
              );
            })}
          </div>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: 8}}>
          {stepStarts.map((startFrame, index) => {
            const rowProgress = interpolate(
              frame,
              [startFrame, startFrame + Math.round(0.26 * fps)],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }
            );
            const rowComplete = frame >= startFrame + Math.round(0.3 * fps);
            const shimmer = 0.64 + Math.sin((frame + index * 11) / 5) * 0.18;

            return (
              <div
                key={stepLabels[index]}
                style={{
                  display: "grid",
                  gridTemplateColumns: "16px 1fr",
                  gap: 8,
                  alignItems: "center",
                  opacity: rowProgress,
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    border: `1px solid ${
                      rowComplete
                        ? "rgba(167, 139, 250, 0.95)"
                        : "rgba(148, 163, 184, 0.5)"
                    }`,
                    background: rowComplete
                      ? "rgba(139, 92, 246, 0.22)"
                      : "rgba(148, 163, 184, 0.08)",
                    color: "#DDD6FE",
                    fontSize: 10,
                    lineHeight: "14px",
                    textAlign: "center",
                    fontWeight: 700,
                  }}
                >
                  {rowComplete ? "✓" : ""}
                </div>
                <div
                  style={{
                    position: "relative",
                    height: 18,
                    borderRadius: 6,
                    border: "1px solid rgba(71, 85, 105, 0.5)",
                    overflow: "hidden",
                    padding: "0 8px",
                    display: "flex",
                    alignItems: "center",
                    fontSize: 11,
                    color: "#CBD5E1",
                    letterSpacing: "0.01em",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${Math.round(mix(0, 100, rowProgress))}%`,
                      background: `linear-gradient(90deg, rgba(139, 92, 246, ${
                        0.2 * shimmer
                      }), rgba(56, 189, 248, ${0.22 * shimmer}))`,
                    }}
                  />
                  <span style={{position: "relative", zIndex: 2}}>
                    {stepLabels[index]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CursorGlyph
        point={cursorA}
        opacity={cursorAOpacity}
        scale={1 - clickOne * 0.06}
        rotation={mix(-8, 3, firstMoveProgress)}
      />
      <CursorGlyph
        point={cursorB}
        opacity={cursorBOpacity}
        scale={1 - clickTwo * 0.06}
        rotation={mix(-4, 0, secondMoveProgress)}
      />

      <div
        style={{
          position: "absolute",
          left: toastAnchor.x,
          top: toastAnchor.y,
          padding: "9px 13px",
          borderRadius: 999,
          border: "1px solid rgba(167, 139, 250, 0.52)",
          background: "rgba(15, 23, 42, 0.9)",
          color: "#DDD6FE",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.01em",
          boxShadow: "0 16px 36px rgba(2, 6, 23, 0.48)",
          opacity: toastOpacity,
          transform: `translateY(${mix(14, 0, toastOpacity)}px)`,
          pointerEvents: "none",
        }}
      >
        Task queued
      </div>

      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 50% 50%, rgba(5, 7, 15, 0) 56%, rgba(5, 7, 15, 0.58) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
