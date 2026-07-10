import type { ResolvedConfig, TransformContext, Transformer } from '../types/config.js';

export async function applyTransformer<TIn, TOut>(
  data: TIn,
  ctx: TransformContext,
  config: ResolvedConfig,
  requestTransformer?: Transformer<TIn, TOut>
): Promise<TOut> {
  const transformer = requestTransformer ?? config.transformer;
  if (!transformer) return data as unknown as TOut;
  return (await transformer(data, ctx)) as TOut;
}

export async function applyTransformerToArray<TIn, TOut>(
  items: TIn[],
  ctx: TransformContext,
  config: ResolvedConfig,
  requestTransformer?: Transformer<TIn, TOut>
): Promise<TOut[]> {
  if (!config.transformer && !requestTransformer) {
    return items as unknown as TOut[];
  }
  return Promise.all(
    items.map((item) => applyTransformer(item, ctx, config, requestTransformer))
  );
}
