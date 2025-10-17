# Phase 2 Development Roadmap

## Branch Strategy
- **main**: Phase 1 baseline (STABLE - DO NOT MODIFY)
- **phase-2-development**: Active Phase 2 development
- **Feature branches**: Create from phase-2-development for individual features

## Phase 2 Features

### 1. Richer Progress Dashboard
- [ ] Add charts for volume trends over time
- [ ] PR (Personal Record) tracking and display
- [ ] Weekly/monthly volume comparisons
- [ ] Exercise-specific progress graphs
- [ ] Big 3 progression visualization

### 2. Program Editing
- [ ] Load existing program into builder
- [ ] Edit program name
- [ ] Add/remove/reorder workout days
- [ ] Modify exercises in existing program
- [ ] Save changes to existing program (not create new)

### 3. Enhanced Workout History
- [ ] Detailed workout view (expandable cards)
- [ ] Filter by date range
- [ ] Filter by exercise
- [ ] Search functionality
- [ ] Delete individual workouts
- [ ] Bulk operations (delete multiple)

### 4. Previous Set Display
- [ ] Show last logged sets for each exercise during workout
- [ ] Display previous weight/reps/RPE
- [ ] Show trend (up/down/same)
- [ ] Quick copy from previous workout

## Phase 3 Preview (Future)
- Superset support
- Notes system
- Calendar & scheduling
- Plate calculator
- Data export
- Dark mode
- Auto-progression
- AI feedback

## Development Workflow
1. Create feature branch from `phase-2-development`
2. Implement and test feature
3. PR to merge into `phase-2-development`
4. When Phase 2 is complete, PR from `phase-2-development` to `main`

## Testing Checklist
- [ ] All Phase 1 features still work
- [ ] No regressions in existing functionality
- [ ] New features tested independently
- [ ] Browser compatibility checked
