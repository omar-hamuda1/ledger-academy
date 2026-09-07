// A sane floor for a paid course's displayed price. (Historically this also
// had to clear Stripe's per-currency minimum; Stripe has since been removed
// in favour of code-based access, but keeping a small floor still makes
// sense.)
export const MIN_EGP_PRICE = 20;
