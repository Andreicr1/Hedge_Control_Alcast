# AI_CONTEXT.md

## Purpose

This file defines the global context, rules, and non-negotiable decisions of this repository.

Any AI agent (Codex, ChatGPT, etc.) working on this codebase MUST read and follow this file before making any changes.

The repository is the source of truth. Chat history is NOT.

## Global Objective

Complete and maintain this project as designed, prioritizing:

- correctness
- consistency
- completeness
- stability

The goal is to finish the project, not to redesign or optimize it unless explicitly instructed.

## Repository Awareness

The agent must:

- maintain a global view of the entire repository
- understand existing file structure, dependencies, and relationships
- treat the project as a cohesive system, not isolated files
- avoid local decisions that break global consistency

Thinking must be global. Writing may be local.

## Architecture

Update this section only if architecture is explicitly changed by the user.

- Primary stack / technologies:
  - (describe briefly: backend, frontend, frameworks, DB, etc.)
- Folder structure is intentional and must be preserved.
- Naming conventions are deliberate and must be reused.

If something already exists, extend it instead of creating parallel patterns.

## Execution Rules

Non-negotiable rules:

- apply changes directly to the repository files
- do not generate code for copy/paste unless explicitly asked
- do not explain changes unless explicitly asked
- do not propose alternative workflows, tools, or architectures
- do not refactor existing code unless instructed
- do not rename files, folders, or symbols unless required

If unsure, prefer consistency over improvement.

## Change Discipline

- Make edits atomic and coherent.
- Avoid partial implementations.
- Ensure all references, imports, and dependencies are updated together.
- Never leave TODOs, placeholders, or implicit behavior unless explicitly requested.

Incomplete work is considered incorrect work.

## What Not To Do

The agent must not:

- re-architect the project
- simplify by removing features
- assume missing code exists elsewhere
- replace working code with abstractions
- optimize prematurely
- change formatting/style inconsistently

Silence is preferred over speculation.

## Handling Uncertainty

If the agent encounters ambiguity:

1. Re-read this file.
2. Inspect the existing repository for patterns.
3. Follow the dominant existing convention.

Only ask the user if the ambiguity cannot be resolved from the codebase.

## Chat Memory Policy

- Assume chat memory is unreliable.
- Never rely on previous conversation as the source of truth.
- All durable decisions must live in code, in this file, or in explicit documentation inside the repo.

If chat context conflicts with the repository, the repository wins.

## Completion Criteria

The project is considered complete when:

- all planned features are implemented
- the repository builds/runs as intended
- no partial implementations remain
- no architectural inconsistencies exist

When complete, the agent should output only the following sentence (no extra commentary):

Projeto concluído.

## Final Instruction

Before every action, read this file again.

Failure to follow this context is considered an error.

## Domain Model – Exposure & Hedge

## Authoritative Documentation

The ONLY authoritative documents are:
README.md
AI_CONTEXT.md
PROJECT_STATE.md
SPRINTS.md

All other .md files must be ignored unless explicitly referenced.
