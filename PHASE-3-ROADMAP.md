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

### 2. Notes System
- [ ] Add notes to individual workouts
- [ ] Add notes to specific days
- [ ] Add notes to exercises
- [ ] Display notes during workout
- [ ] Edit/delete notes
- [ ] Notes history view

### 3. Calendar & Scheduling
- [ ] Calendar view of planned workouts
- [ ] Schedule workouts for specific dates
- [ ] Mark rest days
- [ ] Track workout streaks
- [ ] Weekly/monthly overview
- [ ] Missed workout indicators

### 4. Plate Calculator
- [ ] Input target weight
- [ ] Calculate required plates
- [ ] Support different bar weights (45lb, 35lb, etc.)
- [ ] Available plate inventory system
- [ ] Quick-access during workout
- [ ] Visual plate diagram

### 5. Data Export
- [ ] Export workout history to JSON
- [ ] Export to CSV format
- [ ] Filter exports by date range
- [ ] Filter by specific exercises
- [ ] Include/exclude specific fields
- [ ] Download functionality

### 6. Dark Mode Toggle
- [ ] Dark mode UI theme
- [ ] Toggle switch in settings
- [ ] Persist preference
- [ ] Smooth transitions
- [ ] All views support dark mode

### 7. Auto-Progression Logic
- [ ] Suggest weight increases based on performance
- [ ] Track RPE trends
- [ ] Recommend deload weeks
- [ ] Progressive overload calculations
- [ ] User-configurable progression rules

### 8. AI-Driven Adjustments
- [ ] Analyze workout patterns
- [ ] Suggest program modifications
- [ ] Identify weak points
- [ ] Volume recommendations
- [ ] Recovery suggestions
- [ ] Integration with OpenAI/Claude API

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
