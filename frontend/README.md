# KaamGar

Trusted local work, recorded and proven. A glassmorphism web app for labour cooperatives,
customers and workers in Bhopal.

**Stack:** React 18 · Vite · Tailwind CSS v4 · Framer Motion · React Router 6 · lucide-react
**Fonts (self-hosted via Fontsource):** Newsreader (headings), DM Sans (body)

## Run
    npm install
    npm run dev        # http://localhost:5173
    npm run build      # production build in dist/
    npm run preview

## Hero photo
Add `public/images/hero.jpg` (landscape, about 1600x1100). The design uses a close-up of hands
holding a power drill ("Photo: Theme Photos / Unsplash"). Until it exists, a warm gradient shows.

## Routes
| Path | Screen |
|---|---|
| `/` | Landing page + circular role chooser |
| `/customer` | Services (What can we help with?) |
| `/customer/book` | 5-step booking flow, then review |
| `/customer/bookings` | My bookings |
| `/customer/bookings/:id` | Booking detail, history, confirm completion, review |
| `/worker`, `/owner` | "Coming next" placeholders |

## Folder map
    src/
      index.css                  design tokens (@theme) + glass utilities
      main.jsx / App.jsx         fonts, router, MotionConfig (respects reduced motion)
      data/content.js            all copy, services, FAQ and the example booking
      context/BookingsContext    bookings state, saved in localStorage (swap for API later)
      components/
        ui/                      Button, Logo, Reveal (scroll reveal), ScrollToTop
        landing/                 Navbar, Hero, HowItWorks, Benefits, Principles, Faq, ClosingCta, Footer
        RoleOverlay.jsx          the circle role chooser
      pages/
        Landing.jsx, ComingSoon.jsx
        customer/                CustomerLayout, Services, BookingWizard, MyBookings, BookingDetail, PageHeading

## Change the look
Colours and fonts: the `@theme` block in `src/index.css`.
The frosted effect: the `glass` and `glass-soft` utilities in the same file.

## Animation map (Framer Motion)
- Navbar slides in; shadow deepens on scroll
- Hero: staggered text, photo scale-in, floating booking card
- Sections: `Reveal` fade-and-rise on scroll, glass cards lift on hover
- FAQ: animated accordion height; pilot form swaps to a thank-you state
- Role chooser: blur-in, circle scales in, roles appear in sequence, hover underline and dimming
- Customer area: page transitions, sliding tab underline, gliding service selection outline,
  booking steps slide, animated progress bars, timeline stagger

## Notes
- Everything is front-end only. No requests are sent anywhere; bookings are saved in this browser.
- FAQ answers 2 to 6, the Worker and Owner areas, and the pilot form are placeholders.
