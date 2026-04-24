import { loadStripe } from '@stripe/stripe-js';

// Singleton — loadStripe must not be called inside a render function
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);
