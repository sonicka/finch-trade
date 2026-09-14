import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { ScreenshotData, useUseroFeedback } from '@usero/sdk/headless/react';

const ratingOptions = [
  { value: 1 as const, emoji: '😞', label: 'Needs work' },
  { value: 2 as const, emoji: '😕', label: 'Could be better' },
  { value: 3 as const, emoji: '🙂', label: 'Pretty good' },
  { value: 4 as const, emoji: '🤩', label: 'Love it' },
];

const FeedbackButton = () => {
  const usero = useUseroFeedback({
    clientId: 'client_378a6e01af794d03',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] =
    useState<(typeof ratingOptions)[number]['value']>();
  const [comment, setComment] = useState('');
  const [shareEmail, setShareEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleScreenshotChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || screenshots.length >= 3) return;

    setIsUploading(true);
    setMessage('');
    try {
      const screenshot = await usero.uploadScreenshot(file);
      setScreenshots((current) => [...current, screenshot]);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to add screenshot.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rating && !comment.trim()) {
      setMessage('Choose a rating or add a comment before sending.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    const response = await usero.submit({
      rating,
      comment: comment.trim() || undefined,
      userEmail: shareEmail && email.trim() ? email.trim() : undefined,
      screenshots: screenshots.length ? screenshots : undefined,
    });
    setIsSubmitting(false);

    if (response.success) {
      setRating(undefined);
      setComment('');
      setShareEmail(false);
      setEmail('');
      setScreenshots([]);
      setMessage('Thanks for your feedback.');
    } else {
      setMessage(response.error ?? 'Unable to send feedback.');
    }
  };

  return (
    <div className="relative mx-2 mb-2 self-start">
      <button
        type="button"
        className="rounded-xl border-2 border-mediumBeige bg-lightBeige px-4 py-2 text-sm font-semibold text-darkBeige shadow-sm outline-none transition hover:bg-beige focus:ring-1 focus:ring-darkBeige focus:ring-offset-1"
        aria-expanded={isOpen}
        aria-controls="feedback-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        Send feedback
      </button>

      {isOpen && (
        <div
          id="feedback-panel"
          role="dialog"
          aria-labelledby="feedback-title"
          className="absolute bottom-full left-0 z-30 mb-3 w-[min(400px,calc(100vw-1rem))] rounded-2xl border-2 border-mediumBeige bg-lightBeige p-4 text-darkBeige shadow-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="feedback-title" className="text-lg font-semibold">
                  Share feedback
                </h2>
                <p className="text-sm text-mediumBeige">
                  Help us make Finch Trade better.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close feedback"
                className="rounded-full px-2 text-xl leading-none text-mediumBeige outline-none focus:ring-1 focus:ring-darkBeige"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold">
                How is it going?
              </legend>
              <div className="grid grid-cols-4 gap-2">
                {ratingOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={rating === option.value}
                    className={`flex min-h-16 flex-col items-center justify-center rounded-xl border-2 px-1 text-center text-xs outline-none transition focus:ring-1 focus:ring-darkBeige ${
                      rating === option.value
                        ? 'border-darkBeige bg-beige'
                        : 'border-mediumBeige hover:bg-beige'
                    }`}
                    onClick={() => setRating(option.value)}
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {option.emoji}
                    </span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <label
              className="block text-sm font-semibold"
              htmlFor="feedback-comment"
            >
              Tell us what you think
              <textarea
                id="feedback-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={1000}
                placeholder="What should we know?"
                className="mt-2 min-h-24 w-full resize-y rounded-xl border-2 border-mediumBeige bg-lightBeige p-2 font-normal text-darkBeige outline-none focus:border-darkBeige focus:ring-1 focus:ring-darkBeige"
              />
            </label>

            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleScreenshotChange}
              />
              <button
                type="button"
                disabled={isUploading || screenshots.length >= 3}
                className="rounded-lg border border-mediumBeige px-3 py-2 text-sm font-semibold outline-none transition hover:bg-beige focus:ring-1 focus:ring-darkBeige disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? 'Adding screenshot...' : '📷 Add screenshot'}
              </button>
              {screenshots.length > 0 && (
                <div className="space-y-1 text-xs text-mediumBeige">
                  {screenshots.map((screenshot, index) => (
                    <div
                      className="flex items-center justify-between rounded-lg bg-beige px-2 py-1"
                      key={`${screenshot.fileName}-${index}`}
                    >
                      <span className="truncate">{screenshot.fileName}</span>
                      <button
                        type="button"
                        className="ml-2 font-semibold text-darkBeige outline-none focus:ring-1 focus:ring-darkBeige"
                        aria-label={`Remove ${screenshot.fileName}`}
                        onClick={() =>
                          setScreenshots((current) =>
                            current.filter(
                              (_, currentIndex) => currentIndex !== index,
                            ),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label
              className="flex items-center gap-2 text-sm"
              htmlFor="share-feedback-email"
            >
              <input
                id="share-feedback-email"
                type="checkbox"
                checked={shareEmail}
                onChange={(event) => setShareEmail(event.target.checked)}
                className="h-4 w-4 accent-darkBeige"
              />
              Share your email with this feedback
            </label>
            {shareEmail && (
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border-2 border-mediumBeige bg-lightBeige p-2 text-sm text-darkBeige outline-none focus:border-darkBeige focus:ring-1 focus:ring-darkBeige"
              />
            )}

            {message && (
              <p className="text-sm" role="status">
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full rounded-xl border-2 border-darkBeige bg-beige px-3 py-2 font-semibold text-darkBeige outline-none transition hover:bg-lightBeige focus:ring-1 focus:ring-darkBeige disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Sending...' : 'Send feedback'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FeedbackButton;
