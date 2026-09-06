// Stripe rejects charges below its per-currency minimum (~$0.50 USD
// equivalent). 20 EGP stays safely above that regardless of exchange-rate
// drift between EGP and USD.
export const MIN_EGP_PRICE = 20;
