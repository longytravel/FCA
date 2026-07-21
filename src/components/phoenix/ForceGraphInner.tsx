"use client";

import { useEffect, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { ComponentProps } from "react";

type FG2DProps = ComponentProps<typeof ForceGraph2D>;

/** Thin wrapper so the parent can grab the imperative graph instance without
 *  relying on ref-forwarding through next/dynamic (which does not forward refs).
 *  The library is only imported here, and this module is loaded with ssr:false. */
export default function ForceGraphInner({
  onReady,
  ...props
}: FG2DProps & { onReady?: (instance: unknown) => void }) {
  // ForceGraph2D types its ref as a MutableRefObject, so use one and report up.
  const ref = useRef<unknown>(null);
  useEffect(() => {
    if (ref.current && onReady) onReady(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <ForceGraph2D ref={ref as never} {...props} />;
}
