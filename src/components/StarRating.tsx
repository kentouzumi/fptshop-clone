export default function StarRating({
  rating,
  size = "text-base",
}: {
  rating: number;
  size?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <span className={`text-amber-500 ${size}`} aria-label={`${rating} sao`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>{i <= rounded ? "★" : "☆"}</span>
      ))}
    </span>
  );
}
