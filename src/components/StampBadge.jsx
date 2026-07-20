import { colorForStatus } from "../lib/helpers";

export default function StampBadge({ status, statuses }) {
  const s = colorForStatus(statuses, status);
  return (
    <span className="stamp" style={{ color: s.color, borderColor: s.color, background: s.bg }}>
      {status}
    </span>
  );
}
