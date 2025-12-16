
# [Goal Description]
User reported potential UI update issues. Verification confirms code presence but suggests logic/visibility improvements.

## Proposed Changes

### Components
#### [MODIFY] AnalyticsView.tsx
- **Enhance Sector Inference**: Update `inferSector` to re-classify if sector is 'Other' or 'General', overriding potential bad data.
- **Add Keywords**: Expand keyword list for better coverage.

#### [MODIFY] HoldingsView.tsx
- **Boost Spotlight**: Increase shadow and border contrast for the `isSpotlightEnabled` effect.
- **Sparkline Visibility**: Ensure sparkline overlay is clearly visible in light/dark modes.

## Verification
- **Manual**: Check if "Other" sector items get categorized.
- **Visual**: confirm Card hover effect is distinct.
