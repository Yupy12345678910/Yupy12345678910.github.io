# Blox.fun Terminal

A Pump.fun / Axiom-style meme coin launchpad **sandbox** for Roblox communities. Fake Robux only, no real money or crypto.

Features: sign up / log in, create coins on a bonding curve, TradingView-style candlestick charts (Lightweight Charts), buy/sell with slippage, portfolio with PnL, tweet-style feed with `@user` and `$TICKER` tags, profiles and follows, settings.

## Deploy on GitHub Pages
1. Create a new repository and upload `index.html`, `style.css`, `script.js` and `.nojekyll`.
2. Go to **Settings > Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
3. Your site will be live at `https://<username>.github.io/<repo>/`.

## Important limitations
- Data (accounts, coins, trades, posts) is stored in each visitor's own browser (`localStorage`). Visitors do **not** see each other's coins or posts.
- Accounts are local demo accounts. Passwords use a weak non-cryptographic hash, so never ask people to reuse real passwords.
- To make it truly multi-user (shared coins, trades and feed), replace the `DB`, `save()` and trade logic in `script.js` with a backend such as Supabase or Firebase, and run trade validation server-side so balances cannot be edited from the browser console.
- Charts load `lightweight-charts` 4.1.3 from cdnjs.

## License
MIT. Add a `LICENSE` file if you want one.
