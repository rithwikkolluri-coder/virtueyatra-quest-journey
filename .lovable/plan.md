# Trip planner with nearby booking actions

## Goal
Place the existing bus, flight, train, hotel, and cab booking buttons beside the trip planner so users can arrange travel services from the same planning area.

## User-visible changes
- Replace the current standalone booking section with a compact booking-actions panel beside the planner on larger screens.
- Keep all existing booking destinations and open them safely in a new tab.
- Preserve the planner form, generated itinerary, history, and current language behavior.
- Stack the planner and booking actions vertically on smaller screens so the controls remain easy to use.
- Give the booking panel a clear heading and concise supporting copy, with each service retaining its recognizable icon and color treatment.

## Technical details
- Rework the existing booking-links presentation into a reusable compact panel that can sit inside the planner section without duplicating the booking links.
- Update the home page composition so the standalone booking section is removed once its actions are embedded beside the planner.
- Use the existing design tokens, Button/link conventions, icons, and responsive Tailwind layout classes; do not add new backend data or change trip-planning behavior.
- Verify the two-column desktop layout, mobile stacking, external-link behavior, and that the planner summary/itinerary states still fit cleanly beside or above the booking panel.

## Validation
- Check the planner in its initial form, after itinerary creation, and with booking history visible.
- Confirm each booking button opens its intended external service and no duplicate booking section remains.
- Check the layout at desktop and mobile widths for clipping or overlap.
