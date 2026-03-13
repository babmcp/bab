# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-03-10

### Added

- Initial Bun and TypeScript project scaffold for the `bab` MCP server.
- Configuration bootstrap for `~/.bab/` including `env`, `plugins`, and `prompts`.
- Structured stderr logger and Bun-targeted build configuration.
- Core Zod v4 schemas for tool output, delegate events, roles, plugin manifests, and provider metadata.
- MCP server shell over stdio with explicit tool registration and request routing.
- Static provider registry using the Vercel AI SDK and provider-specific packages for Google, OpenAI, Anthropic, OpenRouter, and generic OpenAI-compatible backends.
- Token-count heuristic utility for early provider and usage accounting.
- In-memory storage adapter and conversation thread manager with continuation lookup and a 20-turn limit.
- Delegate plugin system with plugin discovery, YAML manifest loading, adapter transpilation, built-in role prompts, role resolution, and subprocess execution support.
- Built-in MCP tools: `delegate`, `listmodels`, and `version`.
- MCP stdio test harness and milestone-level integration coverage for server startup and tool listing.

### Changed

- Standardized the codebase on Zod v4 while keeping JSON schema generation working through native Zod v4 schema export.

### Security

- Reserved stdout for MCP protocol traffic and routed operational logs to stderr.
