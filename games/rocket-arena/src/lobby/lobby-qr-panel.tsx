/**
 * The QR / SCAN TO JOIN panel — the single most important thing on a projector.
 *
 * OWNER: the lobby worker (`src/lobby/**`).
 *
 * QR GENERATION IS THE SDK'S, NOT OURS. `RoomQrCode` is a real export of
 * `@air-jam/sdk/ui` (`packages/sdk/src/ui.ts:13` re-exports
 * `src/components/room-qr-code.tsx`), and it renders through the `qrcode`
 * package the SDK already depends on. So there is NO new dependency here, and
 * the module is never imported directly: the SDK owns the bundling of `qrcode`
 * and its own loading/unavailable states.
 */

import { RoomQrCode } from "@air-jam/sdk/ui";

/** Big enough to scan from the back of a room. */
const QR_SIZE = 420;

export interface LobbyQrPanelProps {
  /** `useAirJamHost().joinUrl`. Empty while the session is still resolving. */
  joinUrl: string;
  /** `useAirJamHost().roomId`, e.g. `"A8K2Q"`. */
  roomCode: string;
  /** `"2 / 4 PLAYERS JOINED"`. */
  joinCountLabel: string;
  /** Shown instead of the code when there is no URL to encode. */
  unavailableMessage?: string;
}

export const LobbyQrPanel = ({
  joinUrl,
  roomCode,
  joinCountLabel,
  unavailableMessage = "Room is still starting. The join link will appear in a moment.",
}: LobbyQrPanelProps) => {
  const trimmed = joinUrl.trim();

  return (
    <div className="lobby-panel lobby-panel--grow lobby-join">
      <p className="lobby-panel__label">Join this game</p>

      {trimmed.length > 0 ? (
        <div className="lobby-join__qr">
          <RoomQrCode
            value={trimmed}
            size={QR_SIZE}
            padding={2}
            errorCorrectionLevel="Q"
            foregroundColor="#000000"
            backgroundColor="#ffffff"
            alt={`Scan to join Rocket Arena room ${roomCode}`}
          />
        </div>
      ) : (
        <div className="lobby-join__fallback" role="status">
          {unavailableMessage}
        </div>
      )}

      <h2 className="lobby-join__cta">Scan to join</h2>

      <p className="lobby-join__code-label">Room code</p>
      <p className="lobby-join__code" data-testid="lobby-room-code">
        {roomCode.length > 0 ? roomCode : "·····"}
      </p>

      <p className="lobby-join__count" data-testid="lobby-join-count">
        {joinCountLabel}
      </p>
    </div>
  );
};
