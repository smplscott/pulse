# Railway cron: monthly Ticketmaster wishlist × trip scan
#
# Radar scans every wishlisted artist against every upcoming trip
# (all artists × all trips, not one-artist-one-trip).
#
# In Railway dashboard → project pulse → create a Cron Job (or use an external cron)
# that POSTs once per month (e.g. the 1st of each month at 06:00 UTC):
#
#   POST https://pulse-production-38eb.up.railway.app/api/internal/jobs/scan-wishlist-matches
#   Header: x-cron-secret: <CRON_SECRET>
#
# Users can also trigger a personal scan from the Radar page ("Scan now"),
# which POSTs /api/users/:id/scan-wishlist (session auth, own user only).
#
# Required Railway env vars on the Pulse service:
#   TICKETMASTER_API_KEY
#   CRON_SECRET
#
# Manual run locally:
#   TICKETMASTER_API_KEY=... npm run jobs:scan-wishlist
