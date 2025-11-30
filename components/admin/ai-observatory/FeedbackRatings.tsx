'use client';

interface FeedbackRatingsProps {
  counts: { 1: number; 2: number; 3: number; 4: number; 5: number };
  total: number;
}

export function FeedbackRatings({ counts, total }: FeedbackRatingsProps) {
  const ratings = [5, 4, 3, 2, 1];

  return (
    <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
      <h2 className="text-xl font-bold text-text-primary mb-6">Distribuição de Ratings</h2>

      <div className="space-y-4">
        {ratings.map((rating) => {
          const count = counts[rating as keyof typeof counts];
          const percentage = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={rating} className="flex items-center gap-4">
              <div className="flex items-center gap-1 w-24">
                <span className="text-sm font-medium text-text-secondary">{rating}</span>
                <span className="text-yellow-500">⭐</span>
              </div>

              <div className="flex-1">
                <div className="h-8 bg-bg-active rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${
                      rating >= 4
                        ? 'bg-green-500'
                        : rating === 3
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="w-32 text-right">
                <p className="text-sm font-medium text-text-primary">{count} feedbacks</p>
                <p className="text-xs text-text-tertiary">{percentage.toFixed(1)}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
