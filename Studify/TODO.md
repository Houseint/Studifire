# Studifire Reorganization TODO

## Plan Overview
- Restructure: screens/ (main screens), components/ (reusables: common/ + screen-specific), styles/ (split screen/component).
- Start with: HomeScreen (cluttered), LoginScreen/RegisterScreen.
- Goals: Thin screens, extract sub-components, fix imports.

## Steps (to be checked off)

### Phase 1: Setup Structure & HomeScreen
- [x] Create folders: `src/screens/`, `src/components/common/`, `src/components/home/`, `src/styles/screens/`, `src/styles/components/common/`, `src/styles/components/home/`.
- [x] Move/refactor HomeScreen.js → screens/HomeScreen.js (thin: import components).
- [x] Extract components/home/Icon.js + styles/components/common/IconStyles.js.
- [x] Extract components/home/CardMateria.js + styles/components/home/CardMateriaStyles.js.
- [x] Extract components/home/Secao.js + styles/components/home/SecaoStyles.js.
- [x] Update HomeScreen.js imports/logic.
- [x] Create all HomeScreen extracted styles files.

### Phase 2: Auth Screens (Login/Register)

- [x] Move LoginScreen.js → screens/LoginScreen.js.
- [x] Move RegisterScreen.js → screens/RegisterScreen.js.
- [x] Ensure styles/ imports fixed (already good).

### Phase 2.5: Extract Common Reusables
- [x] components/common/CustomInput.js
- [x] components/common/CustomButton.js (LinearGradient)


### Phase 3: Remaining Screens
- [x] ProfileScreen.js, Historic.js, HelpScreen.js → screens/.
- [x] Extract styles if inline.
- [x] Create missing styles/ files (placeholders).

### Phase 4: Global Updates & Test
- [x] Update App.js/index.js imports to new screen paths.

- [ ] Extract global components (Modal wrapper, etc.).
- [ ] Test: Run `npx expo start`, check all screens/navigation.
- [ ] Lint/fix issues.
- [ ] Complete!

**Progress: Starting Phase 1**
