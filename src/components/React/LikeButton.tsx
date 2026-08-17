import { useState, useEffect } from "react";

interface Props {
  /** Visible count suffix, e.g. "Likes" / "پسند". */
  label: string;
  /** Accessible name while the button is still actionable. */
  actionLabel: string;
  /** Accessible name once this visitor has liked. */
  likedLabel: string;
}

const LikeButton = ({ label, actionLabel, likedLabel }: Props) => {
  const [likes, setLikes] = useState(142);
  const [isLiked, setIsLiked] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedIsLiked = localStorage.getItem("websiteIsLiked");
    const storedLikes = localStorage.getItem("websiteLikesCount");
    
    if (storedIsLiked === "true") {
      setIsLiked(true);
    }
    if (storedLikes) {
      setLikes(parseInt(storedLikes, 10));
    }
  }, []);

  const handleLike = () => {
    if (isLiked) return;

    const newLikes = likes + 1;
    setLikes(newLikes);
    setIsLiked(true);
    setIsAnimating(true);
    localStorage.setItem("websiteIsLiked", "true");
    localStorage.setItem("websiteLikesCount", newLikes.toString());

    setTimeout(() => setIsAnimating(false), 600);
  };

  if (!isClient) return null;

  const borderColorClass = isLiked
    ? "border-[var(--sec)]"
    : "border-[var(--white-icon)]";

  return (
    <div className="flex items-center">
      <button
        onClick={handleLike}
        disabled={isLiked}
        aria-pressed={isLiked}
        aria-label={isLiked ? likedLabel : actionLabel}
        className={`
          group relative w-40 h-11 flex items-center justify-center p-3
          rounded-full transition-all duration-300 ease-in-out transform border-2 ${borderColorClass}
          ${!isLiked ? "hover:scale-105 hover:border-[var(--white)] cursor-pointer" : "cursor-default"}
          ${isAnimating ? "animate-heart-pulse" : ""}
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-6 h-6 transition-all duration-300 ease-in-out 
            ${isLiked ? "text-[var(--sec)] scale-110" : "text-[var(--white-icon)] group-hover:text-[var(--white)] group-hover:scale-105"}
          `}
        >
          <path d="M16.5 3C19.5376 3 22 5.5 22 9C22 16 14.5 20 12 21.5C9.5 20 2 16 2 9C2 5.5 4.5 3 7.5 3C9.35997 3 11 4 12 5C13 4 14.64 3 16.5 3ZM12.9339 18.6038C13.8155 18.0485 14.61 17.4955 15.3549 16.9029C18.3337 14.533 20 11.9435 20 9C20 6.64076 18.463 5 16.5 5C15.4241 5 14.2593 5.56911 13.4142 6.41421L12 7.82843L10.5858 6.41421C9.74068 5.56911 8.5759 5 7.5 5C5.55906 5 4 6.6565 4 9C4 11.9435 5.66627 14.533 8.64514 16.9029C9.39 17.4955 10.1845 18.0485 11.0661 18.6038C11.3646 18.7919 11.6611 18.9729 12 19.1752C12.3389 18.9729 12.6354 18.7919 12.9339 18.6038Z"></path>
        </svg>
        {/* The label used to be the hardcoded English "Likes", which rendered
            untranslated on the Persian pages. `ps-3` rather than `pl-3` so the
            gap follows the writing direction. */}
        <span className="text-sm ps-3 font-medium text-[var(--white)]">
          {likes} {label}
        </span>
      </button>
    </div>
  );
};

export default LikeButton;
