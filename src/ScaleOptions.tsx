import { scales, scaleGroups } from "./music";
export default function ScaleOptions() {
  return scaleGroups.map((group) => (
    <optgroup key={group} label={group}>
      {scales
        .filter((s) => s.group === group)
        .map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
    </optgroup>
  ));
}
