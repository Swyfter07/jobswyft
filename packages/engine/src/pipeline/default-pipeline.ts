/**
 * Default Pipeline — Assembles the standard extraction pipeline.
 *
 * Layer order: BoardDetector -> JsonLd -> Gate(0.85) -> CssSelector ->
 * Gate(0.75) -> OgMeta -> Heuristic -> Gate(0.70) -> AiFallback -> PostProcess
 *
 * Accepts optional SiteConfig to skip layers via pipelineHints.skipLayers.
 *
 * Architecture reference: ADR-REV-SE5 (Pipeline Ordering)
 */

import { compose } from "./compose";
import {
  boardDetector,
  jsonLd,
  createConfidenceGate,
  cssSelector,
  ogMeta,
  heuristic,
  aiFallback,
  postProcess,
} from "./layers/index";
import type { DetectionContext, ExtractionMiddleware, SiteConfig } from "./types";
import type { BoardRegistry } from "../registry/board-registry";

// Internal layer name for matching against skipLayers
interface NamedMiddleware {
  name: string;
  middleware: ExtractionMiddleware;
}

/**
 * Create the default extraction pipeline with all layers and confidence gates.
 *
 * When siteConfig.pipelineHints.skipLayers is set, named layers matching
 * those entries are filtered out before composition.
 */
export function createDefaultPipeline(
  siteConfig?: SiteConfig
): (ctx: DetectionContext) => Promise<DetectionContext> {
  const skipLayers = new Set<string>(siteConfig?.pipelineHints?.skipLayers ?? []);

  const namedLayers: NamedMiddleware[] = [
    { name: "board-detector", middleware: boardDetector },
    { name: "json-ld", middleware: jsonLd },
    { name: "gate-0.85", middleware: createConfidenceGate(0.85) },
    { name: "css", middleware: cssSelector },
    { name: "gate-0.75", middleware: createConfidenceGate(0.75) },
    { name: "og-meta", middleware: ogMeta },
    { name: "heuristic", middleware: heuristic },
    { name: "gate-0.70", middleware: createConfidenceGate(0.70) },
    { name: "ai-fallback", middleware: aiFallback },
    { name: "post-process", middleware: postProcess },
  ];

  const middlewares = namedLayers
    .filter((l) => !skipLayers.has(l.name))
    .map((l) => l.middleware);

  return compose(middlewares);
}

/**
 * Convenience factory: detect board from URL, get config from registry,
 * and create pipeline with that config's skipLayers applied at composition time.
 *
 * When BOTH siteConfig and boardRegistry are provided, siteConfig takes precedence
 * (explicit override).
 */
export function createPipelineForUrl(
  url: string,
  registry: BoardRegistry
): (ctx: DetectionContext) => Promise<DetectionContext> {
  const config = registry.getConfig(url);
  return createDefaultPipeline(config);
}
