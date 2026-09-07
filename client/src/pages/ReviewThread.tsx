import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Star } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ReviewEngagement, { type ReviewEngagementPayload, type ReviewSubjectType } from "@/components/reviews/ReviewEngagement";
import UsernameLink from "@/components/UsernameLink";
import { formatDistanceToNow } from "date-fns";

export default function ReviewThread() {
  const [, params] = useRoute("/reviews/:kind/:id");
  const kind: ReviewSubjectType = params?.kind === "place" ? "place_review" : "show_review";
  const id = Number(params?.id || 0);

  const { data, isLoading } = useQuery<ReviewEngagementPayload>({
    queryKey: ["/api/reviews", kind, id],
    enabled: id > 0,
    queryFn: async () => {
      const res = await fetch(`/api/reviews/${kind}/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Review not found");
      return res.json();
    },
  });

  const review = data?.review ?? null;
  const rating = typeof review?.rating === "number" ? review.rating : null;
  const body = typeof review?.body === "string"
    ? review.body
    : typeof review?.content === "string"
      ? review.content
      : typeof review?.review === "string"
        ? review.review
        : null;
  const contextLabel = [
    typeof review?.placeName === "string" ? review.placeName : null,
    typeof review?.artistName === "string" ? review.artistName : null,
    typeof review?.venueName === "string" ? review.venueName : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {review && (
          <article className="rounded-xl bg-[#181818] p-4">
            <div className="mb-2 flex items-center gap-2">
              {data?.author?.profilePicture ? (
                <img src={data.author.profilePicture} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-[#333]" />
              )}
              <UsernameLink username={data?.author?.username} className="font-medium text-white" />
              {rating !== null && (
                <span className="ml-auto flex items-center gap-0.5 text-sm text-[#1DB954]">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {rating}
                </span>
              )}
            </div>
            {contextLabel && <p className="mb-2 text-sm text-muted-foreground">{contextLabel}</p>}
            {body && <p className="whitespace-pre-wrap text-white">{body}</p>}
            {typeof review.createdAt === "string" && (
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </p>
            )}
            <ReviewEngagement subjectType={kind} subjectId={id} />
            <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
              {(data?.replies ?? []).map(reply => (
                <div key={reply.id} className="flex gap-2">
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#333]">
                    {reply.author.profilePicture && (
                      <img src={reply.author.profilePicture} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div>
                    <UsernameLink username={reply.author.username} className="text-sm font-medium text-white" />
                    <p className="text-sm text-muted-foreground">{reply.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
