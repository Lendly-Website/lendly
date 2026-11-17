export function Avatar({
  name,
  size = "default",
}: {
  id?: string;
  name: string;
  size?: "default" | "large";
}) {
  return (
    <span className={`avatar initials ${size}`} aria-hidden="true">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
