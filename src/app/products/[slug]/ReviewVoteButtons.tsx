"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewVoteButtons({
  reviewId,
  helpfulCount,
  notHelpfulCount,
  myVote,
  loggedIn,
  isOwnReview,
}: {
  reviewId: string;
  helpfulCount: number;
  notHelpfulCount: number;
  myVote: boolean | null;
  loggedIn: boolean;
  isOwnReview: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState({ helpfulCount, notHelpfulCount, myVote });
  const [loading, setLoading] = useState(false);

  async function vote(isHelpful: boolean) {
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    if (isOwnReview || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHelpful }),
      });
      const data = await res.json();
      if (res.ok) {
        setState({ helpfulCount: data.helpfulCount, notHelpfulCount: data.notHelpfulCount, myVote: data.myVote });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 flex items-center gap-3 text-xs">
      <button
        type="button"
        onClick={() => vote(true)}
        disabled={isOwnReview || loading}
        title={isOwnReview ? "Không thể tự vote cho đánh giá của mình" : undefined}
        className={`rounded-full border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50 ${
          state.myVote === true
            ? "border-green-600 bg-green-50 text-green-700"
            : "border-zinc-300 text-zinc-500 hover:border-black"
        }`}
      >
        👍 Hữu ích ({state.helpfulCount})
      </button>
      <button
        type="button"
        onClick={() => vote(false)}
        disabled={isOwnReview || loading}
        title={isOwnReview ? "Không thể tự vote cho đánh giá của mình" : undefined}
        className={`rounded-full border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50 ${
          state.myVote === false
            ? "border-red-600 bg-red-50 text-red-700"
            : "border-zinc-300 text-zinc-500 hover:border-black"
        }`}
      >
        👎 Không hữu ích ({state.notHelpfulCount})
      </button>
    </div>
  );
}
