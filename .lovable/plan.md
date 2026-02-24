

## Add Flight Booking Icon to Header

Add a flight booking icon (using Lucide's `Plane` icon) next to the existing bus booking icon in the header. Clicking it will redirect users to a popular flight booking website (MakeMyTrip) in a new tab.

### Changes

**File: `src/components/Header.tsx`**

1. Import `Plane` icon from `lucide-react` alongside existing icons
2. Add a flight booking icon button next to the bus icon in the desktop navigation area
3. Add a "Book Flight Tickets" link in the mobile menu alongside "Book Bus Tickets"

Both links will open `https://www.makemytrip.com/flights` in a new tab.

