# LoveyBites — Claude Guidelines

## Code Style

### React Principles
- **Single responsibility**: Each component does one thing. If a component is fetching data, transforming it, AND rendering complex UI, split it.
- **Small components**: Prefer many small, focused components over large monolithic ones. A component file that grows past ~150 lines is a sign to split.
- **Composition over configuration**: Build features by composing small components, not by adding more props and conditionals to existing ones.
- **If a bigger restructure is needed**: Do NOT silently refactor unrelated code. Flag it as a suggestion to the user and implement only what was asked.

### Food/Recipe Naming Conventions
- Use food/cooking domain language for variables, components, and files: `Recipe`, `Ingredient`, `MealPlan`, `CookMode`, `Serving`, `Portion` — not generic names like `Item`, `Entry`, or `Card`.
- Component names should read naturally in the food domain: `RecipeCard`, `IngredientList`, `MealCalendar`, `CookingStep`.

### General
- No unnecessary abstractions. Don't create helpers, hooks, or utilities until there are at least 3 real use cases.
- No comments explaining what the code does — names should do that. Comments only for non-obvious WHY.
- No dead code, unused imports, or backwards-compatibility shims.

## Project Structure

```
src/
  features/         # Feature slices (auth, calendar, cooking, recipe)
  shared/
    components/     # Truly reusable UI components
    constants/
    hooks/
```

Keep feature-specific code inside its feature folder. Move to `shared/` only when genuinely used across 2+ features.

## Testing

When the user says "add tests", evaluate which types the feature actually needs — do not add all types by default:

| Test type | Tool | When to use |
|-----------|------|-------------|
| **Unit** | Vitest | Pure logic, utilities, hooks — functionality in isolation |
| **Browser** | Vitest + browser mode | Component rendering, UI behavior, user interactions within a component |
| **E2E** | Playwright | Full user flows, Firebase integration, multi-page interactions |

- A simple utility function → unit test only.
- A new UI component → browser test (rendering + interaction).
- A new user flow (e.g., add recipe → appears in meal plan) → E2E test.
- A feature may need multiple types — state the reasoning before writing tests.

## Tech Stack
- React + TypeScript + Vite
- Firebase (Firestore, Auth, Storage) with emulators for testing
- Tailwind CSS
- Vitest (unit + browser tests), Playwright (E2E)
- PWA (Dutch-language recipe and meal planning app)
