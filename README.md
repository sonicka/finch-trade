# Finch Trade App

**Finch Trade** is a fan-made application designed to connect [Finch](https://finchcare.com/) users based on their tradelists and wishlists. The app matches users and suggests potential trades or gifts by analyzing their manually added items. Once a match is found, users can accept the trade and exchange friend codes to complete the transaction within the [Finch](https://finchcare.com/) app.

## Features

- **Account Creation**: Create an account by providing your username, birb name, password, and friend code.
- **Trade and Wishlist**: Add items you want to give away or receive, and the app will find matches with other users.
- **Trade Matching**: The algorithm analyzes users' lists and suggests potential trades or gifts.
- **Trade Execution**: Accept a trade and execute it within [Finch](https://finchcare.com/) app by using the friend code that's shared with you.

## Technologies Used

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: SQLite (For now, will be replaced with a more scalable option in the future)

## How to Use

1. **Create an Account**:

- Enter your **username**, **birb name**, **friend code** (make sure they match your data in [Finch](https://finchcare.com/) app) and **password**. (This data cannot be updated at the moment.)

2. **Add Items**:

- List your **trade items** (items you want to give away) and **wishlist items** (items you want to receive).

3. **Trade Matching**:

- Visit the **Trading Page**, where the app will suggest potential trades based on your items.

4. **Accept Trade**:

- If you find a trade you like, simply accept it and share your **friend code** with the other user to execute the trade.

## Local demo setup

If you are forking the project to test it locally, run the backend migrations first. The seed script creates two demo users with overlapping wishlist/tradelist items so the trading page immediately shows a potential match.

- Demo email 1: `demo1@finchtrade.local`
- Demo email 2: `demo2@finchtrade.local`
- Password for both: `demo123`
- Matching trade example: `Maya` wants `Classic Diner Roller Skates` and offers `Classic Diner Sundae`; `Noah` wants `Classic Diner Sundae` and offers `Classic Diner Roller Skates`.

This is intentionally seeded in the database so a fresh local clone can load the app and test the matching flow without manual setup.

## Frontend-only preview

You can also preview the app without running the backend or connecting a database. The frontend includes mock data for the wishlist, tradelist, trading, and gifting flows.
You can see it deployed [here]().

Demo accounts:

- `demo1@finchtrade.local` / `demo123`
- `demo2@finchtrade.local` / `demo123`

The demo data is stored in the visitor's browser, so each visitor gets an independent copy. Clearing site data restores the original sample data.

## Contributions

Currently, contributions are needed **only for testing** purposes. If you're interested in helping out with testing, please reach out!

## License

This project is licensed under the **MIT License** – see the [LICENSE](https://opensource.org/licenses/MIT) file for details.

<br />
<br />

---

<br />

# Project Roadmap

### Current State

- Basic functionalities already built
- Feedback form and Buy me coffee button implemented

### TODO General

- [ ] Thorough testing of the logic and potential optimization
- [ ] Make it work publicly

### TODO Frontend / UI / UX

- [ ] Build a component for confirmation actions (delete, etc.)
- [ ] Integrate **TanStack Query** to handle requests, caching and loading/error states
- [ ] Handle **Loading / Error / Success** states properly across all views

### TODO Backend

- [ ] Tie color options to each item separately (dynamic color sets)
