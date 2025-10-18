# Phase 3 Development Roadmap

## Branch Strategy
- **main**: Phase 1 baseline (STABLE)
- **phase-2-development**: Phase 2 features (COMPLETE - awaiting merge)
- **phase-3-development**: Active Phase 3 development
- **Feature branches**: Create from phase-3-development for individual features

## Phase 3 Features

### 1. Superset / Linked Exercise Support
- [ ] Define supersets in program builder
- [ ] Link 2+ exercises together
- [ ] Display linked exercises during workout
- [ ] Track rest timer between superset exercises
- [ ] Visual indicators for supersets
**Status:** Deferred (complex, lower priority)

### 2. Notes System ✅ COMPLETE
- [x] Add notes to individual workouts
- [x] Add notes to exercises
- [x] Display notes during workout
- [x] Edit/delete notes (clear button)
- [x] Real-time saving to localStorage

### 3. Calendar & Scheduling
- [ ] Calendar view of planned workouts
- [ ] Schedule workouts for specific dates
- [ ] Mark rest days
- [ ] Track workout streaks
- [ ] Weekly/monthly overview
- [ ] Missed workout indicators
**Status:** Deferred (would require significant UI work)

### 4. Plate Calculator ✅ COMPLETE
- [x] Input target weight
- [x] Calculate required plates per side
- [x] Standard 45lb barbell
- [x] Quick-access buttons (135, 185, 225, 275, 315, 405)
- [x] Visual barbell diagram with color-coded plates
- [x] Shows plate breakdown with counts
- [x] Handles weights that can't be exactly matched
- [x] Accessible from workout tracking view

### 5. Data Export ✅ COMPLETE
- [x] Export workout history to JSON
- [x] Export to CSV format (Excel compatible)
- [x] Filter exports by date range
- [x] Filter by specific exercises
- [x] Download functionality
- [x] Shows filtered count before export
- [x] Beautiful modal interface

### 6. Dark Mode Toggle ✅ COMPLETE
- [x] Dark mode UI theme
- [x] Toggle switch in HomeView
- [x] Persist preference in localStorage
- [x] Smooth transitions
- [x] Tailwind dark: classes configured
- [ ] All views fully styled for dark mode (partial - foundation complete)

### 7. Auto-Progression Logic
- [ ] Suggest weight increases based on performance
- [ ] Track RPE trends
- [ ] Recommend deload weeks
- [ ] Progressive overload calculations
- [ ] User-configurable progression rules
**Status:** Not started (requires algorithm development)

### 8. AI-Driven Adjustments
- [ ] Analyze workout patterns
- [ ] Suggest program modifications
- [ ] Identify weak points
- [ ] Volume recommendations
- [ ] Recovery suggestions
- [ ] Integration with OpenAI/Claude API
**Status:** Not started (requires API integration & costs)

## Phase 3 Summary

**Status:** 4 of 8 features complete (High priority items done!)

**Completed Features:**
1. ✅ **Plate Calculator** - Visual barbell loading helper
2. ✅ **Notes System** - Add notes to workouts and exercises
3. ✅ **Dark Mode** - Theme toggle with localStorage persistence
4. ✅ **Data Export** - Export to JSON/CSV with filters

**Deferred Features:**
- Superset Support (complex, would require program builder changes)
- Calendar & Scheduling (large UI undertaking)
- Auto-Progression (needs algorithm design)
- AI Features (requires API keys & ongoing costs)

**Ready for Testing:** Phase 3 core features are complete and ready for user testing!

## Development Workflow
1. Create feature branch from `phase-3-development`
2. Implement and test feature
3. PR to merge into `phase-3-development`
4. When Phase 3 is complete, merge to `phase-2-development`, then to `main`

## Priority Order
1. **High Priority**: Plate Calculator, Notes System, Dark Mode
2. **Medium Priority**: Calendar, Data Export, Superset Support
3. **Low Priority**: Auto-Progression, AI Features (require external APIs)

## Testing Checklist
- [ ] All Phase 1 & 2 features still work
- [ ] No regressions in existing functionality
- [ ] New features tested independently
- [ ] Browser compatibility checked
- [ ] Mobile responsiveness verified
- [ ] Performance impact assessed

## Notes
- AI features may require API keys and cost considerations
- Calendar features should integrate with existing week tracking
- Data export should maintain data integrity
- Dark mode should be accessible and WCAG compliant
