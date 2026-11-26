# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary audience is studio recruiters and design leads evaluating Adrian Proust for a game design role. Their job is to understand his contribution, assess his design thinking through project evidence, and decide whether to contact him.

## Product Purpose

Adrian Proust's personal game design portfolio supports studio hiring. Success means visitors can understand his work, evaluate relevant case studies, access his resume, and contact him about a role.

## Positioning

Design evidence comes first. Project case studies demonstrate systems and gameplay design through explanations, iteration, and supporting artifacts. The website's mini-games provide optional exploration; they are secondary to evaluating the work.

The existing content includes game projects and live-event work. Future changes should explain Adrian's own contribution without inventing outcomes, credentials, or claims about team work.

## Operating Context

Visitors browse recent projects, explore projects by category, open individual case studies, review background information, and access a resume or contact links. The site supports desktop and mobile web browsers.

Current implementation facts, recorded from the repository:

- Home, Projects, and About me are the mounted top-level sections.
- Section links use `?Page=Home`, `?Page=Projects`, and `?Page=AboutMe`.
- Individual project details use the `Project` query parameter.
- Project categories are Professional, Student, and Personal.
- The resume is a PDF linked from navigation, rather than a currently mounted Resume section.
- Desktop mini-games include scores, discoverable upgrades, and local browser persistence. They are gated to fine-pointer, hover-capable devices wider than 860 px.

## Capabilities and Constraints

- Existing static React + TypeScript + Vite SPA with plain CSS; no backend, router library, or UI framework.
- Content belongs in `src/data/portfolio.ts`, with types in `src/data/types.ts`; components render the data rather than duplicate repeated content.
- Components have co-located styles; shared tokens and utilities live in `src/styles/global.css`.
- Preserve query-parameter URLs and the existing content architecture when refining the interface.
- Build command: `npm run build`. Development command: `npm run dev`. Build output: `dist/`.
- `vite.config.ts` currently sets the base path to `/portfolio/`. A GitHub Pages deployment workflow and a Netlify configuration exist. The user supplied the public GitHub Pages URL for review; hosting changes are outside this initialization.
- Older project documentation describes four sections and placeholder content. Use the current implementation to establish what exists, and confirm personal facts with Adrian before publishing new or revised factual claims.

## Brand Commitments

The portfolio represents Adrian Proust, Game Designer. The user confirmed that case studies should lead and mini-games should remain optional exploration. No new visual direction or voice standard was established during initialization.

## Evidence on Hand

- `src/data/portfolio.ts`: project descriptions, roles, design narratives, links, skills, background, and contact content. Existing factual claims are owner-provided content, not independently verified.
- `public/projects/`: project imagery and media.
- `public/showcase/`: design artifacts, including a Sang% resource-economy diagram and a Hansel & Gretel GO mechanic document. The data file also references a Wonky Race pitch presentation.
- `public/Adrian_Proust_CV_EN.pdf`: English resume.
- Existing project-detail components support context, contribution narratives, presentations, video, galleries, and team credits.

Do not fabricate testimonials, employment history, shipped-title counts, playtest results, metrics, or ownership of collaborative work.

## Product Principles

1. Make Adrian's role and contribution clear before asking visitors to explore a project in depth.
2. Support design claims with actual project artifacts and explanations of decisions and iteration.
3. Help reviewers browse, compare, return to projects, and reach the resume or contact information with little friction.
4. Keep mini-games optional and subordinate to assessing the work; essential content must not require playing or unlocking anything.
5. Preserve accurate attribution and distinguish individual contributions from team outcomes.

## Open Decisions

- The exact role specialization, studio types, and seniority to target have not been confirmed.
- No product-specific accessibility standard or additional user access needs were established in this interview. Existing keyboard, touch, focus, and reduced-motion support are implementation evidence, not a verified compliance claim.
- No redesign, content rewrite, or critique fix was authorized by initialization alone.
